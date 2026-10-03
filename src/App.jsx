import React, { useState, useEffect } from 'react';
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

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('itinerario');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedMapActivity, setSelectedMapActivity] = useState(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [modalDayNumber, setModalDayNumber] = useState(1);

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

  // Handlers for Activities
  const handleToggleComplete = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const handleToggleWithFriend = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, withFriend: !a.withFriend } : a));
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
    if (editingActivity) {
      setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...formData, id: editingActivity.id } : a));
    } else {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
      };
      setActivities(prev => [...prev, newActivity]);
    }
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este plan del itinerario?")) {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSelectOnMap = (activity) => {
    setSelectedMapActivity(activity);
    setActiveTab('mapa');
  };

  // Handlers for Expenses
  const handleAddExpense = (expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Handlers for Checklist
  const handleToggleChecklist = (id) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const handleAddChecklist = (item) => {
    setChecklist(prev => [...prev, item]);
  };

  const handleDeleteChecklist = (id) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
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
            onUpdateExchangeRate={setExchangeRate}
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
