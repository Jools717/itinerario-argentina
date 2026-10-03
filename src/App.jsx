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

  // Flag to avoid loop when incoming cloud change updates state
  const isIncomingCloudChangeRef = useRef(false);

  // Sync to LocalStorage
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

  // SUPABASE: Initial Load & Realtime Sync
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudSyncStatus('offline');
      return;
    }

    let isMounted = true;

    async function loadCloudData() {
      try {
        setCloudSyncStatus('syncing');
        const { data, error } = await supabase
          .from('trip_data')
          .select('*')
          .eq('id', 'ba-2026')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("Supabase fetch note:", error.message);
        }

        if (data && isMounted) {
          isIncomingCloudChangeRef.current = true;
          if (data.activities && Array.isArray(data.activities)) setActivities(data.activities);
          if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
          if (data.checklist && Array.isArray(data.checklist)) setChecklist(data.checklist);
          if (data.exchange_rate) setExchangeRate(Number(data.exchange_rate));
          setCloudSyncStatus('connected');
          setTimeout(() => { isIncomingCloudChangeRef.current = false; }, 300);
        } else if (!data && isMounted) {
          // First time initialization in Supabase
          await supabase.from('trip_data').upsert({
            id: 'ba-2026',
            activities,
            expenses,
            checklist,
            exchange_rate: exchangeRate,
            updated_at: new Date().toISOString()
          });
          setCloudSyncStatus('connected');
        }
      } catch (err) {
        console.error("Error loading from Supabase:", err);
        if (isMounted) setCloudSyncStatus('offline');
      }
    }

    loadCloudData();

    // Realtime subscription (Listen for changes made on other devices)
    const channel = supabase
      .channel('realtime:trip_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_data', filter: 'id=eq.ba-2026' },
        (payload) => {
          if (payload.new && payload.new.id === 'ba-2026') {
            isIncomingCloudChangeRef.current = true;
            if (payload.new.activities) setActivities(payload.new.activities);
            if (payload.new.expenses) setExpenses(payload.new.expenses);
            if (payload.new.checklist) setChecklist(payload.new.checklist);
            if (payload.new.exchange_rate) setExchangeRate(Number(payload.new.exchange_rate));
            setCloudSyncStatus('connected');
            setTimeout(() => { isIncomingCloudChangeRef.current = false; }, 300);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          setCloudSyncStatus('connected');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Save changes to Supabase (debounced)
  const saveToCloud = async (newActivities, newExpenses, newChecklist, newRate) => {
    if (!isSupabaseConfigured || !supabase || isIncomingCloudChangeRef.current) return;
    
    setCloudSyncStatus('syncing');
    try {
      const { error } = await supabase.from('trip_data').upsert({
        id: 'ba-2026',
        activities: newActivities,
        expenses: newExpenses,
        checklist: newChecklist,
        exchange_rate: newRate,
        updated_at: new Date().toISOString()
      });

      if (!error) {
        setCloudSyncStatus('connected');
      } else {
        console.error("Supabase upsert error:", error);
        setCloudSyncStatus('offline');
      }
    } catch (err) {
      console.error("Cloud sync error:", err);
      setCloudSyncStatus('offline');
    }
  };

  // Handlers for Activities
  const handleToggleComplete = (id) => {
    const updated = activities.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
    setActivities(updated);
    saveToCloud(updated, expenses, checklist, exchangeRate);
  };

  const handleToggleWithFriend = (id) => {
    const updated = activities.map(a => a.id === id ? { ...a, withFriend: !a.withFriend } : a);
    setActivities(updated);
    saveToCloud(updated, expenses, checklist, exchangeRate);
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

  const handleSaveActivity = (formData) => {
    let updated;
    if (editingActivity) {
      updated = activities.map(a => a.id === editingActivity.id ? { ...formData, id: editingActivity.id } : a);
    } else {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
      };
      updated = [...activities, newActivity];
    }
    setActivities(updated);
    saveToCloud(updated, expenses, checklist, exchangeRate);
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este plan del itinerario?")) {
      const updated = activities.filter(a => a.id !== id);
      setActivities(updated);
      saveToCloud(updated, expenses, checklist, exchangeRate);
    }
  };

  const handleSelectOnMap = (activity) => {
    setSelectedMapActivity(activity);
    setActiveTab('mapa');
  };

  // Handlers for Expenses
  const handleAddExpense = (expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveToCloud(activities, updated, checklist, exchangeRate);
  };

  const handleDeleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToCloud(activities, updated, checklist, exchangeRate);
  };

  // Handlers for Checklist
  const handleToggleChecklist = (id) => {
    const updated = checklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    setChecklist(updated);
    saveToCloud(activities, expenses, updated, exchangeRate);
  };

  const handleAddChecklist = (item) => {
    const updated = [...checklist, item];
    setChecklist(updated);
    saveToCloud(activities, expenses, updated, exchangeRate);
  };

  const handleDeleteChecklist = (id) => {
    const updated = checklist.filter(c => c.id !== id);
    setChecklist(updated);
    saveToCloud(activities, expenses, updated, exchangeRate);
  };

  const handleUpdateExchangeRate = (rate) => {
    setExchangeRate(rate);
    saveToCloud(activities, expenses, checklist, rate);
  };

  // Backup: Export & Import
  const handleExportData = () => {
    const backupData = {
      version: "1.0",
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

  const handleImportData = (data) => {
    if (!data.activities || !Array.isArray(data.activities)) {
      alert("El archivo no tiene el formato de itinerario válido.");
      return;
    }
    if (window.confirm("¿Deseas restaurar este itinerario? Se actualizarán tus actividades y gastos actuales.")) {
      if (data.activities) setActivities(data.activities);
      if (data.expenses) setExpenses(data.expenses);
      if (data.checklist) setChecklist(data.checklist);
      if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      saveToCloud(
        data.activities || activities, 
        data.expenses || expenses, 
        data.checklist || checklist, 
        data.exchangeRate || exchangeRate
      );
      alert("¡Itinerario restaurado con éxito!");
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
      />

      {/* Main Tab Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="main-content-container">
        {activeTab === 'itinerario' && (
          <ItineraryView
            activities={activities}
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
      />

      {/* Subtle Mobile Status Bar Spacer */}
      <div className="mobile-bottom-spacer"></div>

    </div>
  );
}
