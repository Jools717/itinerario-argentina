import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ItineraryView from './components/ItineraryView';
import MapView from './components/MapView';
import BudgetTracker from './components/BudgetTracker';
import SurvivalGuide from './components/SurvivalGuide';
import ChecklistView from './components/ChecklistView';
import ActivityModal from './components/ActivityModal';

import { 
  INITIAL_ACTIVITIES, 
  INITIAL_EXPENSES, 
  INITIAL_CHECKLIST, 
  TRIP_INFO 
} from './data/initialData';

import { supabase, isSupabaseConfigured } from './utils/supabaseClient';

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
  note: exp.note || ''
});

const dbToExpense = (row) => ({
  id: row.id,
  date: row.date,
  concept: row.concept,
  category: row.category,
  amountARS: Number(row.amount_ars) || 0,
  paidBy: row.paid_by || 'Yo',
  note: row.note || ''
});

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
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
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

  const [exchangeRate, setExchangeRate] = useState(() => {
    try {
      const saved = localStorage.getItem('ba_itinerary_exchange_rate');
      return saved ? Number(saved) : TRIP_INFO.defaultExchangeRateUSD;
    } catch {
      return TRIP_INFO.defaultExchangeRateUSD;
    }
  });

  // Cloud Sync Status: 'connected' | 'syncing' | 'offline'
  const [cloudSyncStatus, setCloudSyncStatus] = useState(isSupabaseConfigured ? 'syncing' : 'offline');

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('itinerario');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedMapActivity, setSelectedMapActivity] = useState(null);

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
          if (isMounted) setActivities(actData.map(dbToActivity));
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
          setChecklist(prev => prev.some(c => c.id === newChk.id) ? prev : [...prev, newChk]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbToChecklist(payload.new);
          setChecklist(prev => prev.map(c => c.id === updated.id ? updated : c));
        } else if (payload.eventType === 'DELETE') {
          setChecklist(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_settings' }, (payload) => {
        if (payload.new && payload.new.exchange_rate) {
          setExchangeRate(Number(payload.new.exchange_rate));
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

  const handleSelectOnMap = (activity) => {
    setSelectedMapActivity(activity);
    setActiveTab('mapa');
  };

  // Handlers for Expenses
  const handleAddExpense = async (expense) => {
    setExpenses(prev => [expense, ...prev]);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('expenses').insert(expenseToDb(expense));
      setCloudSyncStatus('connected');
    }
  };

  const handleDeleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('expenses').delete().eq('id', id);
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
    setChecklist(prev => [...prev, item]);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('checklist').insert(checklistToDb(item));
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
    setExchangeRate(rate);

    if (isSupabaseConfigured && supabase) {
      setCloudSyncStatus('syncing');
      await supabase.from('trip_settings').upsert({ id: 'config', exchange_rate: rate });
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

  const totalSpentARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const completedActivitiesCount = activities.filter(a => a.completed).length;

  return (
    <div className="app-root">
      
      {/* Top Header */}
      <Header
        activitiesCount={activities.length}
        completedCount={completedActivitiesCount}
        totalSpentARS={totalSpentARS}
        exchangeRate={exchangeRate}
        cloudSyncStatus={cloudSyncStatus}
        onExportData={handleExportData}
        onImportData={handleImportData}
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
          />
        )}

        {activeTab === 'mapa' && (
          <MapView
            activities={activities}
            selectedActivity={selectedMapActivity}
            onSelectActivity={setSelectedMapActivity}
          />
        )}

        {activeTab === 'gastos' && (
          <BudgetTracker
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
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
