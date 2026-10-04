import React from 'react';
import { CalendarDays, MapPin, Wallet, Compass, CheckSquare } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'itinerario', label: 'Itinerario', icon: CalendarDays, badge: '14 Días' },
    { id: 'mapa', label: 'Mapa & Rutas', icon: MapPin, badge: 'Pines' },
    { id: 'gastos', label: 'Billetera & Compras', icon: Wallet, badge: 'Hub $1k' },
    { id: 'tips', label: 'Tips & SUBE', icon: Compass, badge: 'Guía' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, badge: 'Equipaje' },
  ];

  return (
    <nav className="app-nav">
      <div className="nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              aria-selected={isActive}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} className="nav-icon" />
              </div>
              <span className="nav-label">{tab.label}</span>
              {isActive && <span className="nav-indicator-pill"></span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
