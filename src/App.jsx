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
  paid_by: exp.paidBy || 'Yo',
  note: exp.note || '',
  receipt_id: exp.receipt_id || null
});

const dbToExpense = (row) => ({
  id: row.id,
  date: row.date,
  concept: row.concept,
  category: row.category,
  amountARS: Number(row.amount_ars) || 0,
  paidBy: row.paid_by || 'Yo',
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
      if (!saved) return INITIAL_ACTIVITIES;
      const parsed = JSON.parse(saved);
      let updated = parsed;
      let shouldSave = false;

      // Migration: Remove any activities from day 5 onwards
      const hasDay5Plus = updated.some(a => Number(a.dayNumber) >= 5);
      if (hasDay5Plus) {
        updated = updated.filter(a => Number(a.dayNumber) <= 4);
        shouldSave = true;
      }

      // Migration Day 1: If day 1 contains old arrival/siesta activities, update day 1
      const hasOldDay1 = updated.some(a => a.dayNumber === 1 && (a.id === 'act-1-5' || a.title?.includes('Aterrizaje') || a.title?.includes('casa de mi amiga')));
      if (hasOldDay1) {
        const withoutDay1 = updated.filter(a => a.dayNumber !== 1);
        const newDay1 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 1);
        updated = [...newDay1, ...withoutDay1].sort((a, b) => a.dayNumber - b.dayNumber);
        shouldSave = true;
      }

      // Migration Day 2: Ensure Sunday contains all 9 activities
      const day2Count = updated.filter(a => a.dayNumber === 2).length;
      const hasOldDay2 = day2Count < 9 || !updated.some(a => a.id === 'act-2-9');
      if (hasOldDay2) {
        const withoutDay2 = updated.filter(a => a.dayNumber !== 2);
        const newDay2 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 2);
        updated = [...newDay2, ...withoutDay2].sort((a, b) => a.dayNumber - b.dayNumber);
        shouldSave = true;
      }

      // Migration Day 3 (Lunes 12 - Recoleta): Ensure Day 3 contains the 6 Recoleta activities
      const hasOldDay3 = !updated.some(a => a.dayNumber === 3 && a.title?.includes('Floralis'));
      if (hasOldDay3) {
        const withoutDay3 = updated.filter(a => a.dayNumber !== 3);
        const newDay3 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 3);
        updated = [...newDay3, ...withoutDay3].sort((a, b) => a.dayNumber - b.dayNumber);
        shouldSave = true;
      }

      // Migration Day 4 (Martes 13 - Palermo): Ensure Day 4 contains the 5 Palermo activities
      const hasOldDay4 = !updated.some(a => a.dayNumber === 4 && a.title?.includes('Japonés'));
      if (hasOldDay4) {
        const withoutDay4 = updated.filter(a => a.dayNumber !== 4);
        const newDay4 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 4);
        updated = [...newDay4, ...withoutDay4].sort((a, b) => a.dayNumber - b.dayNumber);
        shouldSave = true;
      }

      if (shouldSave) {
        localStorage.setItem('ba_itinerary_activities', JSON.stringify(updated));
      }
      return updated;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_checklist');
      return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
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
      return TRIP_INFO.defaultExchangeRateUSD || 1540;
    } catch {
      return TRIP_INFO.defaultExchangeRateUSD || 1540;
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
      try {
        setCloudSyncStatus('syncing');

        // 1. Fetch Activities
        const { data: actData, error: actErr } = await supabase
          .from('activities')
          .select('*')
          .order('day_number', { ascending: true })
          .order('time', { ascending: true });

        if (!actErr && actData && actData.length > 0) {
          const hasDay5InDb = actData.some(r => Number(r.day_number) >= 5);
          if (hasDay5InDb) {
            await supabase.from('activities').delete().gte('day_number', 5);
          }
          const filteredActData = actData.filter(r => Number(r.day_number) <= 4);
          const day1InDb = filteredActData.filter(r => r.day_number === 1);
          const needsDay1Update = day1InDb.some(r => r.id === 'act-1-5');
          const day2InDb = filteredActData.filter(r => r.day_number === 2);
          const needsDay2Update = day2InDb.length < 9 || !day2InDb.some(r => r.id === 'act-2-9');
          const day3InDb = filteredActData.filter(r => r.day_number === 3);
          const needsDay3Update = !day3InDb.some(r => r.title?.includes('Floralis'));
          const day4InDb = filteredActData.filter(r => r.day_number === 4);
          const needsDay4Update = !day4InDb.some(r => r.title?.includes('Japonés'));

          if (needsDay1Update || needsDay2Update || needsDay3Update || needsDay4Update || hasDay5InDb) {
            if (needsDay1Update) {
              await supabase.from('activities').delete().eq('day_number', 1);
              const newDay1 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 1).map(activityToDb);
              await supabase.from('activities').insert(newDay1);
            }
            if (needsDay2Update) {
              await supabase.from('activities').delete().eq('day_number', 2);
              const newDay2 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 2).map(activityToDb);
              await supabase.from('activities').insert(newDay2);
            }
            if (needsDay3Update) {
              await supabase.from('activities').delete().eq('day_number', 3);
              const newDay3 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 3).map(activityToDb);
              await supabase.from('activities').insert(newDay3);
            }
            if (needsDay4Update) {
              await supabase.from('activities').delete().eq('day_number', 4);
              const newDay4 = INITIAL_ACTIVITIES.filter(a => a.dayNumber === 4).map(activityToDb);
              await supabase.from('activities').insert(newDay4);
            }
            const { data: refreshed } = await supabase.from('activities').select('*').order('day_number').order('time');
            if (isMounted && refreshed) {
              setActivities(refreshed.filter(r => Number(r.day_number) <= 4).map(dbToActivity));
              return;
            }
          }
          if (isMounted) setActivities(filteredActData.map(dbToActivity));
        } else if (!actErr && actData && actData.length === 0) {
          // Populate activities table row by row for the first time
          await supabase.from('activities').insert(INITIAL_ACTIVITIES.map(activityToDb));
        }

        // 2. Fetch Expenses
        const { data: expData, error: expErr } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });

        if (!expErr && expData && expData.length > 0) {
          if (isMounted) setExpenses(expData.map(dbToExpense));
        } else if (!expErr && expData && expData.length === 0) {
          await supabase.from('expenses').insert(INITIAL_EXPENSES.map(expenseToDb));
        }

        // 3. Fetch Checklist
        const { data: chkData, error: chkErr } = await supabase
          .from('checklist')
          .select('*')
          .order('id', { ascending: true });

        if (!chkErr && chkData && chkData.length > 0) {
          if (isMounted) setChecklist(chkData.map(dbToChecklist));
        } else if (!chkErr && chkData && chkData.length === 0) {
          await supabase.from('checklist').insert(INITIAL_CHECKLIST.map(checklistToDb));
        }

        // 4. Fetch Settings
        const { data: setData } = await supabase
          .from('trip_settings')
          .select('*')
          .eq('id', 'config')
          .single();

        if (setData && setData.exchange_rate) {
          if (isMounted) setExchangeRate(Number(setData.exchange_rate));
        } else {
          await supabase.from('trip_settings').upsert({ id: 'config', exchange_rate: exchangeRate });
        }

        // 5. Fetch Custom Categories
        try {
          const { data: catData, error: catErr } = await supabase
            .from('expense_categories')
            .select('*');

          if (!catErr && catData && catData.length > 0) {
            if (isMounted) setCategories(catData.map(dbToCategory));
          } else if (!catErr && catData && catData.length === 0) {
            await supabase.from('expense_categories').insert(DEFAULT_EXPENSE_CATEGORIES.map(categoryToDb));
          }
        } catch (catErr) {
          console.warn("Table expense_categories not yet populated:", catErr);
        }

        // 6. Fetch Receipts / Media
        try {
          const { data: recData, error: recErr } = await supabase
            .from('media_manager')
            .select('uuid, filename, description, extension, content_type, content_base64');

          if (!recErr && recData && recData.length > 0) {
            if (isMounted) setReceipts(recData);
          }
        } catch (recErr) {
          console.warn("Table media_manager not yet queried:", recErr);
        }

        if (isMounted) setCloudSyncStatus('connected');
      } catch (err) {
        console.error("Error connecting to Supabase tables:", err);
        if (isMounted) setCloudSyncStatus('offline');
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

  // Handlers for Activities (Immediate local state + individual row DB update)
  const handleToggleComplete = async (id) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newCompleted = !act.completed;

    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: newCompleted } : a));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('activities').update({ completed: newCompleted }).eq('id', id);
      setCloudSyncStatus('connected');
    }
  };

  const handleToggleWithFriend = async (id) => {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newWithFriend = !act.withFriend;

    setActivities(prev => prev.map(a => a.id === id ? { ...a, withFriend: newWithFriend } : a));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('activities').update({ with_friend: newWithFriend }).eq('id', id);
      setCloudSyncStatus('connected');
    }
  };

  const handleOpenAddModal = (dayNumber) => {
    setEditingActivity(null);
    setModalDayNumber(dayNumber || selectedDayNumber);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditModal = (activity) => {
    setEditingActivity(activity);
    setModalDayNumber(activity.dayNumber);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (formData) => {
    if (editingActivity) {
      const updated = { ...formData, id: editingActivity.id };
      setActivities(prev => prev.map(a => a.id === editingActivity.id ? updated : a));

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('syncing');
        await supabase.from('activities').update(activityToDb(updated)).eq('id', editingActivity.id);
        setCloudSyncStatus('connected');
      }
    } else {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
      };
      setActivities(prev => [...prev, newActivity]);

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('syncing');
        await supabase.from('activities').insert(activityToDb(newActivity));
        setCloudSyncStatus('connected');
      }
    }
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este plan del itinerario?")) {
      setActivities(prev => prev.filter(a => a.id !== id));

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('syncing');
        await supabase.from('activities').delete().eq('id', id);
        setCloudSyncStatus('connected');
      }
    }
  };

  const handleMoveActivityDay = async (id, targetDayNumber) => {
    const act = activities.find(a => a.id === id);
    if (!act || act.dayNumber === targetDayNumber) return;

    setActivities(prev => prev.map(a => a.id === id ? { ...a, dayNumber: targetDayNumber } : a));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('activities').update({ day_number: targetDayNumber }).eq('id', id);
      setCloudSyncStatus('connected');
    }
  };

  const handleSelectOnMap = (activity) => {
    setSelectedMapActivity(activity);
    setActiveTab('mapa');
  };

  // Handlers for Expenses & Scanned Receipts
  const handleAddExpense = async (expense, mediaItem) => {
    setExpenses(prev => [expense, ...prev]);
    if (mediaItem) {
      setReceipts(prev => [mediaItem, ...prev]);
    }

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
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
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, costEstimatedARS: cost } : a));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
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

      setActivities(prev => prev.map(a => a.id === actId ? { 
        ...a, 
        costEstimatedARS: cost,
        ...(title ? { title } : {}) 
      } : a));

      if (isSupabaseConfigured && supabase) {
        setCloudSyncStatus('syncing');
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
    setExpenses(prev => prev.map(e => e.id === finalized.id ? finalized : e));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      try {
        await supabase.from('expenses').update(expenseToDb(finalized)).eq('id', finalized.id);
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
    setExpenses(prev => prev.filter(e => e.id !== id));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      try {
        await supabase.from('expenses').delete().eq('id', id);
        if (exp && exp.receipt_id) {
          setReceipts(prev => prev.filter(r => r.uuid !== exp.receipt_id));
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
      setCloudSyncStatus('syncing');
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
      setCloudSyncStatus('syncing');
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

    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completed: newCompleted } : c));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('checklist').update({ completed: newCompleted }).eq('id', id);
      setCloudSyncStatus('connected');
    }
  };

  const handleAddChecklist = async (item) => {
    // Add immediately to top of list for instant user visibility
    setChecklist(prev => [item, ...prev]);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      try {
        await supabase.from('checklist').insert(checklistToDb(item));
      } catch (err) {
        console.error("Error al guardar checklist en Supabase:", err);
      }
      setCloudSyncStatus('connected');
    }
  };

  const handleDeleteChecklist = async (id) => {
    setChecklist(prev => prev.filter(c => c.id !== id));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('checklist').delete().eq('id', id);
      setCloudSyncStatus('connected');
    }
  };

  const handleUpdateExchangeRate = async (rate) => {
    const validRate = Number(rate);
    if (!validRate || isNaN(validRate) || validRate < 100) return;
    setExchangeRate(validRate);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
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
        setCloudSyncStatus('syncing');
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
