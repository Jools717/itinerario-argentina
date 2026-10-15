import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ItineraryView from './components/ItineraryView';
import MapView from './components/MapView';
import BudgetTracker from './components/BudgetTracker';
import SurvivalGuide from './components/SurvivalGuide';
import ChecklistView from './components/ChecklistView';
import ActivityModal from './components/ActivityModal';
import GroceryMarket from './components/GroceryMarket';

import { 
  INITIAL_ACTIVITIES, 
  INITIAL_EXPENSES, 
  INITIAL_CHECKLIST, 
  TRIP_INFO 
} from './data/initialData';

import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import { parseCurrencyNumber } from './utils/helpers';

// Helper mappers between App state and Normalized Database rows
const activityToDb = (act) => ({
  id: act.id,
  day_number: act.dayNumber,
  time: act.time,
  period: act.period,
  title: act.title,
  barrio: act.barrio,
  category: act.category,
  address: act.address || '',
  lat: act.coords && act.coords.length === 2 ? act.coords[0] : null,
  lng: act.coords && act.coords.length === 2 ? act.coords[1] : null,
  description: act.description || '',
  tip: act.tip || '',
  with_friend: Boolean(act.withFriend),
  completed: Boolean(act.completed),
  cost_estimated_ars: Number(act.costEstimatedARS) || 0
});

const dbToActivity = (row) => ({
  id: row.id,
  dayNumber: Number(row.day_number),
  time: row.time || '10:00',
  period: row.period || 'mañana',
  title: row.title,
  barrio: row.barrio || '',
  category: row.category || 'cultura',
  address: row.address || '',
  coords: (row.lat != null && row.lng != null) ? [row.lat, row.lng] : null,
  description: row.description || '',
  tip: row.tip || '',
  withFriend: Boolean(row.with_friend),
  completed: Boolean(row.completed),
  costEstimatedARS: Number(row.cost_estimated_ars) || 0
});

const expenseToDb = (exp) => ({
  id: exp.id,
  date: exp.date,
  concept: exp.concept,
  category: exp.category,
  amount_ars: Number(exp.amountARS) || 0,
  paid_by: exp.paymentMethod || exp.paidBy || 'efectivo',
  note: exp.note || '',
  receipt_id: exp.receipt_id || null
});

const dbToExpense = (row) => ({
  id: row.id,
  date: row.date,
  concept: row.concept,
  category: row.category,
  amountARS: Number(row.amount_ars) || 0,
  paymentMethod: (row.paid_by?.toLowerCase() === 'tarjeta' || row.note?.toLowerCase().includes('tarjeta')) ? 'tarjeta' : 'efectivo',
  paidBy: row.paid_by || 'Efectivo',
  note: row.note || '',
  receipt_id: row.receipt_id || null
});

const categoryToDb = (cat) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon || 'Tag',
  color: cat.color || '#10b981',
  is_default: Boolean(cat.is_default)
});

const dbToCategory = (row) => ({
  id: row.id,
  name: row.name,
  icon: row.icon || 'Tag',
  color: row.color || '#10b981',
  is_default: Boolean(row.is_default)
});

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'mercado', name: 'Mercado de Alimentos', icon: 'ShoppingCart', color: '#10b981', is_default: true },
  { id: 'regalos', name: 'Regalos del Viaje', icon: 'Gift', color: '#ec4899', is_default: true },
  { id: 'gastronomia', name: 'Restaurantes & Bares', icon: 'Utensils', color: '#f59e0b', is_default: true },
  { id: 'transporte', name: 'Transporte (SUBE/Apps)', icon: 'Bus', color: '#3b82f6', is_default: true },
  { id: 'cultura', name: 'Entradas & Cultura', icon: 'Ticket', color: '#8b5cf6', is_default: true },
  { id: 'compras', name: 'Compras & Outlets', icon: 'ShoppingBag', color: '#a855f7', is_default: true },
  { id: 'varios', name: 'Varios & Emergencias', icon: 'Receipt', color: '#64748b', is_default: true }
];

const checklistToDb = (chk) => ({
  id: chk.id,
  text: chk.text,
  category: chk.category,
  completed: Boolean(chk.completed)
});

const dbToChecklist = (row) => ({
  id: row.id,
  text: row.text,
  category: row.category,
  completed: Boolean(row.completed)
});

export default function App() {
  // Persistence with LocalStorage
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_checklist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_CHECKLIST;
    } catch {
      return INITIAL_CHECKLIST;
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_categories');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  const [receipts, setReceipts] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [exchangeRate, setExchangeRate] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_exchange_rate');
      const parsed = Number(saved);
      if (parsed && parsed >= 100) {
        return parsed;
      }
      return TRIP_INFO.defaultExchangeRateUSD || 3040;
    } catch {
      return TRIP_INFO.defaultExchangeRateUSD || 3040;
    }
  });

  // Auto-fetch live Dólar Blue on load from DolarApi.com
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveDolar() {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (res.ok) {
          const data = await res.json();
          // Rate for spending: compra (1540) is what cuevas pay when you change USD to ARS
          const liveRate = Number(data.compra) || Number(data.venta);
          if (isMounted && liveRate && liveRate > 0) {
            setExchangeRate(liveRate);
          }
        }
      } catch (err) {
        // Fallback silently if offline
      }
    }
    fetchLiveDolar();
    return () => { isMounted = false; };
  }, []);

  // Cloud Sync Status: 'connected' | 'syncing' | 'offline'
  const [cloudSyncStatus, setCloudSyncStatus] = useState(isSupabaseConfigured ? 'syncing' : 'offline');

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('itinerario');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedMapActivity, setSelectedMapActivity] = useState(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ba_itinerary_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('ba_itinerary_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [modalDayNumber, setModalDayNumber] = useState(1);

  // Sync to LocalStorage (Instant local responsiveness)
  useEffect(() => {
    localStorage.setItem('ba_itinerary_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('ba_itinerary_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ba_itinerary_checklist', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem('ba_itinerary_exchange_rate', exchangeRate.toString());
  }, [exchangeRate]);

  // SUPABASE: Load Normalized Tables & Setup Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudSyncStatus('offline');
      return;
    }

    let isMounted = true;

    async function initSupabaseData() {
      // Safety fallback timer: guarantee sync badge transitions out of 'syncing' after 3.5s
      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          setCloudSyncStatus(prev => (prev === 'syncing' ? 'connected' : prev));
        }
      }, 3500);

      try {
        setCloudSyncStatus('syncing');

        // Parallelize all table queries to minimize network wait on initial load
        const [actRes, expRes, chkRes, setRes, catRes, recRes] = await Promise.allSettled([
          supabase.from('activities').select('*').order('day_number', { ascending: true }).order('time', { ascending: true }),
          supabase.from('expenses').select('*').order('date', { ascending: false }),
          supabase.from('checklist').select('*').order('id', { ascending: true }),
          supabase.from('trip_settings').select('*').eq('id', 'config').maybeSingle(),
          supabase.from('expense_categories').select('*'),
          supabase.from('media_manager').select('uuid, filename, description, extension, content_type, content_base64')
        ]);

        // 1. Process Activities
        if (actRes.status === 'fulfilled' && !actRes.value.error && actRes.value.data && isMounted) {
          const remoteActs = actRes.value.data.map(dbToActivity);
          if (remoteActs.length === 0) {
            await supabase.from('activities').insert(INITIAL_ACTIVITIES.map(activityToDb));
            if (isMounted) setActivities(INITIAL_ACTIVITIES);
          } else {
            setActivities(currentActs => {
              const remoteMap = new Map(remoteActs.map(r => [r.id, r]));
              const localOnly = currentActs.filter(l => !remoteMap.has(l.id));

              if (localOnly.length > 0) {
                supabase.from('activities').upsert(localOnly.map(activityToDb))
                  .then(({ error }) => {
                    if (error) console.warn("Error uploading local activities to Supabase:", error);
                  });
              }

              const merged = [...remoteActs, ...localOnly];
              try {
                localStorage.setItem('ba_itinerary_activities', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }

        // 2. Process Expenses
        if (expRes.status === 'fulfilled' && !expRes.value.error && expRes.value.data && isMounted) {
          const remoteExps = expRes.value.data.map(dbToExpense);
          if (remoteExps.length === 0) {
            await supabase.from('expenses').insert(INITIAL_EXPENSES.map(expenseToDb));
          } else {
            setExpenses(currentExps => {
              const remoteMap = new Map(remoteExps.map(r => [r.id, r]));
              const localOnly = currentExps.filter(l => !remoteMap.has(l.id));

              if (localOnly.length > 0) {
                supabase.from('expenses').upsert(localOnly.map(expenseToDb))
                  .then(({ error }) => {
                    if (error) console.warn("Error uploading local expenses to Supabase:", error);
                  });
              }

              const merged = [...remoteExps, ...localOnly];
              try {
                localStorage.setItem('ba_itinerary_expenses', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }

        // 3. Process Checklist
        if (chkRes.status === 'fulfilled' && !chkRes.value.error && chkRes.value.data && isMounted) {
          const remoteChks = chkRes.value.data.map(dbToChecklist);
          if (remoteChks.length === 0) {
            await supabase.from('checklist').insert(INITIAL_CHECKLIST.map(checklistToDb));
          } else {
            setChecklist(currentChks => {
              const remoteMap = new Map(remoteChks.map(r => [r.id, r]));
              const localOnly = currentChks.filter(l => !remoteMap.has(l.id));

              if (localOnly.length > 0) {
                supabase.from('checklist').upsert(localOnly.map(checklistToDb))
                  .then(({ error }) => {
                    if (error) console.warn("Error uploading local checklist to Supabase:", error);
                  });
              }

              const merged = [...remoteChks, ...localOnly];
              try {
                localStorage.setItem('ba_itinerary_checklist', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }

        // 4. Process Settings
        if (setRes.status === 'fulfilled' && !setRes.value.error && setRes.value.data && setRes.value.data.exchange_rate) {
          if (isMounted) setExchangeRate(Number(setRes.value.data.exchange_rate));
        }

        // 5. Process Custom Categories
        if (catRes.status === 'fulfilled' && !catRes.value.error && catRes.value.data) {
          if (catRes.value.data.length > 0 && isMounted) {
            setCategories(catRes.value.data.map(dbToCategory));
          }
        }

        // 6. Process Receipts / Media
        if (recRes.status === 'fulfilled' && !recRes.value.error && recRes.value.data && recRes.value.data.length > 0) {
          if (isMounted) setReceipts(recRes.value.data);
        }

        if (isMounted) setCloudSyncStatus('connected');
      } catch (err) {
        console.error("Error connecting to Supabase tables:", err);
        if (isMounted) setCloudSyncStatus('connected');
      } finally {
        clearTimeout(safetyTimer);
      }
    }

    initSupabaseData();

    // REALTIME: Listen to individual table row changes
    const realtimeChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAct = dbToActivity(payload.new);
          setActivities(prev => prev.some(a => a.id === newAct.id) ? prev : [...prev, newAct]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbToActivity(payload.new);
          setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
        } else if (payload.eventType === 'DELETE') {
          setActivities(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newExp = dbToExpense(payload.new);
          setExpenses(prev => prev.some(e => e.id === newExp.id) ? prev : [newExp, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbToExpense(payload.new);
          setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
        } else if (payload.eventType === 'DELETE') {
          setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newChk = dbToChecklist(payload.new);
          setChecklist(prev => prev.some(c => c.id === newChk.id) ? prev : [newChk, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbToChecklist(payload.new);
          setChecklist(prev => prev.map(c => c.id === updated.id ? updated : c));
        } else if (payload.eventType === 'DELETE') {
          setChecklist(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_settings' }, (payload) => {
        if (payload.new && payload.new.exchange_rate) {
          const r = Number(payload.new.exchange_rate);
          if (r && r >= 100) {
            setExchangeRate(r);
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_categories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCat = dbToCategory(payload.new);
          setCategories(prev => prev.some(c => c.id === newCat.id) ? prev : [...prev, newCat]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbToCategory(payload.new);
          setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_manager' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReceipts(prev => prev.some(r => r.uuid === payload.new.uuid) ? prev : [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setReceipts(prev => prev.filter(r => r.uuid !== payload.old.uuid));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          setCloudSyncStatus('connected');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Handlers for Activities (Immediate local state + synchronous localStorage + Supabase cloud sync)
  const handleToggleComplete = async (id) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newCompleted = !act.completed;

    const nextActs = activities.map(a => a.id === id ? { ...a, completed: newCompleted } : a);
    setActivities(nextActs);
    try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('activities').update({ completed: newCompleted }).eq('id', id);
      } catch (err) {
        console.error("Error updating completed in Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleToggleWithFriend = async (id) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newWithFriend = !act.withFriend;

    const nextActs = activities.map(a => a.id === id ? { ...a, withFriend: newWithFriend } : a);
    setActivities(nextActs);
    try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('activities').update({ with_friend: newWithFriend }).eq('id', id);
      } catch (err) {
        console.error("Error updating with_friend in Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleOpenAddModal = (dayNumber) => {
    setEditingActivity(null);
    setModalDayNumber(Number(dayNumber || selectedDayNumber || 1));
    setIsActivityModalOpen(true);
  };

  const handleOpenEditModal = (activity) => {
    setEditingActivity(activity);
    setModalDayNumber(Number(activity.dayNumber || 1));
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (formData) => {
    if (editingActivity) {
      const updated = { 
        ...formData, 
        id: editingActivity.id,
        dayNumber: Number(formData.dayNumber || editingActivity.dayNumber || 1)
      };
      const nextActs = activities.map(a => a.id === editingActivity.id ? updated : a);
      setActivities(nextActs);
      try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('saving');
        try {
          const dbPayload = activityToDb(updated);
          const { error } = await supabase.from('activities').upsert(dbPayload);
          if (error) console.error("Error updating activity in Supabase:", error);
        } catch (err) {
          console.error("Exception updating activity in Supabase:", err);
        }
        setCloudSyncStatus('connected');
      }
    } else {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
        dayNumber: Number(formData.dayNumber || modalDayNumber || selectedDayNumber || 1)
      };
      const nextActs = [...activities, newActivity];
      setActivities(nextActs);
      try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('saving');
        try {
          const dbPayload = activityToDb(newActivity);
          const { error } = await supabase.from('activities').insert(dbPayload);
          if (error) console.error("Error inserting activity in Supabase:", error);
        } catch (err) {
          console.error("Exception inserting activity in Supabase:", err);
        }
        setCloudSyncStatus('connected');
      }
    }
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este plan del itinerario?")) {
      const nextActs = activities.filter(a => a.id !== id);
      setActivities(nextActs);
      try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('saving');
        try {
          const { error } = await supabase.from('activities').delete().eq('id', id);
          if (error) console.error("Error deleting activity in Supabase:", error);
        } catch (err) {
          console.error("Exception deleting activity in Supabase:", err);
        }
        setCloudSyncStatus('connected');
      }
    }
  };

  const handleMoveActivityDay = async (id, targetDayNumber) => {
    const targetNum = Number(targetDayNumber);
    const act = activities.find(a => a.id === id);
    if (!act || Number(act.dayNumber) === targetNum) return;

    const nextActs = activities.map(a => a.id === id ? { ...a, dayNumber: targetNum } : a);
    setActivities(nextActs);
    try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        const { error } = await supabase.from('activities').update({ day_number: targetNum }).eq('id', id);
        if (error) console.error("Error moving activity in Supabase:", error);
      } catch (err) {
        console.error("Exception moving activity in Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleSelectOnMap = (activity) => {
    setSelectedMapActivity(activity);
    setActiveTab('mapa');
  };

  // Handlers for Expenses & Scanned Receipts
  const handleAddExpense = async (expense, mediaItem) => {
    const nextExpenses = [expense, ...expenses];
    setExpenses(nextExpenses);
    try { localStorage.setItem('ba_itinerary_expenses', JSON.stringify(nextExpenses)); } catch {}

    if (mediaItem) {
      setReceipts(prev => {
        const nextReceipts = [mediaItem, ...prev];
        try { localStorage.setItem('ba_itinerary_receipts', JSON.stringify(nextReceipts)); } catch {}
        return nextReceipts;
      });
    }

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        if (mediaItem) {
          await supabase.from('media_manager').insert(mediaItem);
        }
        await supabase.from('expenses').insert(expenseToDb(expense));
      } catch (err) {
        console.error("Error al guardar en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleUpdateActivityCost = async (activityId, newCost) => {
    const cost = Math.max(0, parseCurrencyNumber(newCost) || 0);
    const nextActs = activities.map(a => a.id === activityId ? { ...a, costEstimatedARS: cost } : a);
    setActivities(nextActs);
    try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('activities').update({ cost_estimated_ars: cost }).eq('id', activityId);
      } catch (err) {
        console.error("Error al actualizar costo en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleUpdateExpense = async (updatedExpense) => {
    // If it's an itinerary expense
    if (updatedExpense.isFromItinerary || (typeof updatedExpense.id === 'string' && updatedExpense.id.startsWith('itinerary-'))) {
      const actId = updatedExpense.activityId || updatedExpense.id.replace('itinerary-', '');
      const cost = Math.max(0, parseCurrencyNumber(updatedExpense.amountARS) || 0);
      const title = updatedExpense.concept?.trim();

      const nextActs = activities.map(a => a.id === actId ? { 
        ...a, 
        costEstimatedARS: cost,
        ...(title ? { title } : {}) 
      } : a);
      setActivities(nextActs);
      try { localStorage.setItem('ba_itinerary_activities', JSON.stringify(nextActs)); } catch {}

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('saving');
        try {
          const updates = { cost_estimated_ars: cost };
          if (title) updates.title = title;
          await supabase.from('activities').update(updates).eq('id', actId);
        } catch (err) {
          console.error("Error al actualizar actividad en Supabase:", err);
        }
        setCloudSyncStatus('connected');
      }
      return;
    }

    // Regular expense item
    const cost = Math.max(0, parseCurrencyNumber(updatedExpense.amountARS) || 0);
    const finalized = { 
      ...updatedExpense, 
      amountARS: cost,
      concept: updatedExpense.concept?.trim() || 'Gasto'
    };
    const nextExpenses = expenses.map(e => e.id === finalized.id ? finalized : e);
    setExpenses(nextExpenses);
    try { localStorage.setItem('ba_itinerary_expenses', JSON.stringify(nextExpenses)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('expenses').upsert(expenseToDb(finalized));
      } catch (err) {
        console.error("Error al actualizar gasto en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleDeleteExpense = async (id, expItem) => {
    if (expItem?.isFromItinerary || (typeof id === 'string' && id.startsWith('itinerary-'))) {
      const actId = expItem?.activityId || id.replace('itinerary-', '');
      await handleUpdateActivityCost(actId, 0);
      return;
    }

    const exp = expenses.find(e => e.id === id);
    const nextExpenses = expenses.filter(e => e.id !== id);
    setExpenses(nextExpenses);
    try { localStorage.setItem('ba_itinerary_expenses', JSON.stringify(nextExpenses)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('expenses').delete().eq('id', id);
        if (exp && exp.receipt_id) {
          setReceipts(prev => {
            const nextReceipts = prev.filter(r => r.uuid !== exp.receipt_id);
            try { localStorage.setItem('ba_itinerary_receipts', JSON.stringify(nextReceipts)); } catch {}
            return nextReceipts;
          });
          await supabase.from('media_manager').delete().eq('uuid', exp.receipt_id);
        }
      } catch (err) {
        console.error("Error al eliminar en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleAddCategory = async (newCat) => {
    setCategories(prev => [...prev, newCat]);
    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('expense_categories').insert(categoryToDb(newCat));
      } catch (err) {
        console.error("Error al crear categoría en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleDeleteCategory = async (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('expense_categories').delete().eq('id', catId);
      } catch (err) {
        console.error("Error al eliminar categoría en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  // Handlers for Checklist
  const handleToggleChecklist = async (id) => {
    const item = checklist.find(c => c.id === id);
    if (!item) return;
    const newCompleted = !item.completed;

    const nextChk = checklist.map(c => c.id === id ? { ...c, completed: newCompleted } : c);
    setChecklist(nextChk);
    try { localStorage.setItem('ba_itinerary_checklist', JSON.stringify(nextChk)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('checklist').update({ completed: newCompleted }).eq('id', id);
      } catch (err) {
        console.error("Error updating checklist in Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleAddChecklist = async (item) => {
    const nextChk = [item, ...checklist];
    setChecklist(nextChk);
    try { localStorage.setItem('ba_itinerary_checklist', JSON.stringify(nextChk)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('checklist').insert(checklistToDb(item));
      } catch (err) {
        console.error("Error al guardar checklist en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleDeleteChecklist = async (id) => {
    const nextChk = checklist.filter(c => c.id !== id);
    setChecklist(nextChk);
    try { localStorage.setItem('ba_itinerary_checklist', JSON.stringify(nextChk)); } catch {}

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      try {
        await supabase.from('checklist').delete().eq('id', id);
      } catch (err) {
        console.error("Error deleting checklist in Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleUpdateExchangeRate = async (rate) => {
    const validRate = Number(rate);
    if (!validRate || isNaN(validRate) || validRate < 100) return;
    setExchangeRate(validRate);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('saving');
      await supabase.from('trip_settings').upsert({ id: 'config', exchange_rate: validRate });
      setCloudSyncStatus('connected');
    }
  };

  // Backup: Export & Import
  const handleExportData = () => {
    const backupData = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      tripInfo: TRIP_INFO,
      exchangeRate,
      activities,
      expenses,
      checklist
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itinerario-buenos-aires-2026-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (data) => {
    if (!data.activities || !Array.isArray(data.activities)) {
      alert("El archivo no tiene el formato de itinerario válido.");
      return;
    }
    if (window.confirm("¿Deseas restaurar este itinerario? Se actualizarán tus actividades y gastos.")) {
      if (data.activities) setActivities(data.activities);
      if (data.expenses) setExpenses(data.expenses);
      if (data.checklist) setChecklist(data.checklist);
      if (data.exchangeRate) setExchangeRate(data.exchangeRate);

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('saving');
        // Bulk upsert to Supabase tables
        if (data.activities) await supabase.from('activities').upsert(data.activities.map(activityToDb));
        if (data.expenses) await supabase.from('expenses').upsert(data.expenses.map(expenseToDb));
        if (data.checklist) await supabase.from('checklist').upsert(data.checklist.map(checklistToDb));
        if (data.exchangeRate) await supabase.from('trip_settings').upsert({ id: 'config', exchange_rate: data.exchangeRate });
        setCloudSyncStatus('connected');
      }

      alert("¡Itinerario restaurado y sincronizado con éxito!");
    }
  };

  const totalItineraryARS = activities.reduce((sum, a) => sum + (parseCurrencyNumber(a.costEstimatedARS) || 0), 0);
  const totalExpensesARS = expenses.reduce((sum, e) => sum + (parseCurrencyNumber(e.amountARS) || 0), 0);
  const totalSpentARS = totalItineraryARS + totalExpensesARS;
  const completedActivitiesCount = activities.filter(a => a.completed).length;

  return (
    <div className="app-root">
      
      {/* Top Header */}
      <Header
        activitiesCount={activities.length}
        completedCount={completedActivitiesCount}
        totalSpentARS={totalSpentARS}
        exchangeRate={exchangeRate}
        onUpdateExchangeRate={handleUpdateExchangeRate}
        cloudSyncStatus={cloudSyncStatus}
        onNavigateToBudget={() => setActiveTab('gastos')}
      />

      {/* Main Tab Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="main-content-container">
        {activeTab === 'itinerario' && (
          <ItineraryView
            activities={activities}
            exchangeRate={exchangeRate}
            onToggleComplete={handleToggleComplete}
            onToggleWithFriend={handleToggleWithFriend}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteActivity={handleDeleteActivity}
            onSelectOnMap={handleSelectOnMap}
            selectedDayNumber={selectedDayNumber}
            setSelectedDayNumber={setSelectedDayNumber}
            onMoveActivityDay={handleMoveActivityDay}
          />
        )}

        {activeTab === 'mapa' && (
          <MapView
            activities={activities}
            selectedActivity={selectedMapActivity}
            onSelectActivity={setSelectedMapActivity}
          />
        )}

        {(activeTab === 'gastos' || activeTab === 'mercado') && (
          <BudgetTracker
            expenses={expenses}
            activities={activities}
            receipts={receipts}
            categories={categories}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            onUpdateActivityCost={handleUpdateActivityCost}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            exchangeRate={exchangeRate}
            onUpdateExchangeRate={handleUpdateExchangeRate}
          />
        )}

        {activeTab === 'tips' && (
          <SurvivalGuide />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView
            checklist={checklist}
            onToggleChecklist={handleToggleChecklist}
            onAddChecklist={handleAddChecklist}
            onDeleteChecklist={handleDeleteChecklist}
          />
        )}
      </main>

      {/* Activity Add/Edit Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        editingActivity={editingActivity}
        currentDayNumber={modalDayNumber}
        exchangeRate={exchangeRate}
      />

      {/* Subtle Mobile Status Bar Spacer */}
      <div className="mobile-bottom-spacer"></div>

    </div>
  );
}
