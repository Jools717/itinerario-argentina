import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, Navigation as NavIcon, Users, CheckCircle, 
  Circle, Plus, Edit3, Trash2, Lightbulb, Sun, Sunset, Moon, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Coffee, Filter
} from 'lucide-react';
import { INITIAL_DAYS } from '../data/initialData';
import { getGoogleMapsTransitUrl, formatCurrencyARS, getCategoryBadge } from '../utils/helpers';

export default function ItineraryView({
  activities,
  onToggleComplete,
  onToggleWithFriend,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteActivity,
  onSelectOnMap,
  selectedDayNumber,
  setSelectedDayNumber
}) {
  const [filterFriend, setFilterFriend] = useState('all'); // 'all', 'withFriend', 'solo'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'mañana', 'tarde', 'noche'

  const currentDay = INITIAL_DAYS.find(d => d.dayNumber === selectedDayNumber) || INITIAL_DAYS[0];

  const dayActivities = activities.filter(a => a.dayNumber === selectedDayNumber);

  const filteredActivities = dayActivities.filter(a => {
    if (filterFriend === 'withFriend' && !a.withFriend) return false;
    if (filterFriend === 'solo' && a.withFriend) return false;
    if (filterPeriod !== 'all' && a.period !== filterPeriod) return false;
    return true;
  });

  const completedInDay = dayActivities.filter(a => a.completed).length;
  const withFriendInDay = dayActivities.filter(a => a.withFriend).length;

  const goToPrevDay = () => {
    if (selectedDayNumber > 1) setSelectedDayNumber(selectedDayNumber - 1);
  };

  const goToNextDay = () => {
    if (selectedDayNumber < 14) setSelectedDayNumber(selectedDayNumber + 1);
  };

  const getPeriodIcon = (period) => {
    switch (period) {
      case 'mañana': return <Sun size={15} className="period-icon morning" />;
      case 'tarde': return <Sunset size={15} className="period-icon afternoon" />;
      case 'noche': return <Moon size={15} className="period-icon night" />;
      default: return <Clock size={15} />;
    }
  };

  return (
    <div className="itinerary-view">
      
      {/* Horizontal Scrollable Day Carousel */}
      <div className="day-carousel-wrapper">
        <div className="day-carousel">
          {INITIAL_DAYS.map((d) => {
            const isSelected = d.dayNumber === selectedDayNumber;
            const countForDay = activities.filter(a => a.dayNumber === d.dayNumber).length;
            const isCompletedAll = countForDay > 0 && activities.filter(a => a.dayNumber === d.dayNumber && !a.completed).length === 0;

            return (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDayNumber(d.dayNumber)}
                className={`day-pill-btn ${isSelected ? 'active' : ''} ${d.isDepartureDay ? 'departure-day' : ''}`}
              >
                <div className="day-pill-header">
                  <span className="day-number-label">Día {d.dayNumber}</span>
                  {isCompletedAll && <span className="day-check-indicator">✓</span>}
                </div>
                <div className="day-pill-date">
                  {d.dateFormatted.split(' ')[0]} {d.dateFormatted.split(' ')[1]}
                </div>
                <div className="day-pill-barrio" title={d.barrioPrincipal}>
                  {d.barrioPrincipal.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Day Banner */}
      <div className={`day-header-card ${currentDay.isDepartureDay ? 'departure-banner' : ''}`}>
        <div className="day-header-nav">
          <button 
            className="day-nav-arrow" 
            onClick={goToPrevDay} 
            disabled={selectedDayNumber <= 1}
            aria-label="Día anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="day-header-title-box">
            <div className="day-badge-row">
              <span className="badge-day-number">DÍA {currentDay.dayNumber} DE 14</span>
              <span className="badge-day-barrio">{currentDay.barrioPrincipal}</span>
              {currentDay.isDepartureDay && (
                <span className="badge-warning">✈️ Vuelo de salida 3:30 PM</span>
              )}
            </div>
            <h2 className="day-title-text">{currentDay.dateFormatted}</h2>
            <p className="day-summary-text">{currentDay.summary}</p>
          </div>

          <button 
            className="day-nav-arrow" 
            onClick={goToNextDay} 
            disabled={selectedDayNumber >= 14}
            aria-label="Día siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Stats & Filter Bar */}
        <div className="day-controls-bar">
          <div className="day-mini-stats">
            <span className="mini-stat">
              <strong>{dayActivities.length}</strong> planes
            </span>
            <span className="mini-stat">
              <strong>{withFriendInDay}</strong> con mi amiga
            </span>
            <span className="mini-stat">
              <strong>{completedInDay}</strong> listos
            </span>
          </div>

          <div className="day-filters">
            {/* Filter by companion */}
            <div className="filter-button-group">
              <button
                className={`filter-chip ${filterFriend === 'all' ? 'active' : ''}`}
                onClick={() => setFilterFriend('all')}
              >
                Todos
              </button>
              <button
                className={`filter-chip ${filterFriend === 'withFriend' ? 'active' : ''}`}
                onClick={() => setFilterFriend('withFriend')}
                title="Planes donde me acompaña mi amiga"
              >
                👫 Con Amiga
              </button>
              <button
                className={`filter-chip ${filterFriend === 'solo' ? 'active' : ''}`}
                onClick={() => setFilterFriend('solo')}
                title="Planes en solitario"
              >
                👤 Solo
              </button>
            </div>

            {/* Filter by period */}
            <div className="filter-button-group">
              <button
                className={`filter-chip ${filterPeriod === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('all')}
              >
                Todo el día
              </button>
              <button
                className={`filter-chip ${filterPeriod === 'mañana' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('mañana')}
              >
                Mañana
              </button>
              <button
                className={`filter-chip ${filterPeriod === 'tarde' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('tarde')}
              >
                Tarde
              </button>
              <button
                className={`filter-chip ${filterPeriod === 'noche' ? 'active' : ''}`}
                onClick={() => setFilterPeriod('noche')}
              >
                Noche
              </button>
            </div>

            <button
              className="btn-add-activity"
              onClick={() => onOpenAddModal(selectedDayNumber)}
            >
              <Plus size={16} />
              <span>Nuevo Plan</span>
            </button>
          </div>
        </div>

      </div>

      {/* Special alert on Departure Day (Oct 23) */}
      {currentDay.isDepartureDay && (
        <div className="departure-alert-card">
          <AlertTriangle className="alert-icon" size={24} />
          <div>
            <h4>Viernes 23 de Octubre: Día de Despedida</h4>
            <p>
              Tal como definiste, este día no tiene planes turísticos pesados: tu vuelo sale a las 3:30 PM. 
              Por el tráfico hacia Ezeiza, sal a más tardar a las 12:30 PM en Cabify/Uber. Dedica la mañana para 
              empacar con tranquilidad y despedirte de tu amiga.
            </p>
          </div>
        </div>
      )}

      {/* Timeline of Activities */}
      <div className="timeline-container">
        {filteredActivities.length === 0 ? (
          <div className="empty-day-state">
            <Coffee size={40} className="empty-icon" />
            <p className="empty-title">No hay actividades con estos filtros</p>
            <p className="empty-desc">
              Puedes agregar un nuevo plan para este día o cambiar los filtros de búsqueda.
            </p>
            <button 
              className="btn-primary-sm"
              onClick={() => onOpenAddModal(selectedDayNumber)}
            >
              <Plus size={16} />
              <span>Agregar primer plan</span>
            </button>
          </div>
        ) : (
          filteredActivities.map((act, index) => {
            const catBadge = getCategoryBadge(act.category);
            const mapsUrl = getGoogleMapsTransitUrl(act);

            return (
              <div 
                key={act.id} 
                className={`activity-card ${act.completed ? 'completed' : ''}`}
              >
                {/* Timeline connector visual line */}
                <div className="timeline-marker-col">
                  <button 
                    className="completion-toggle-btn"
                    onClick={() => onToggleComplete(act.id)}
                    title={act.completed ? "Marcar como pendiente" : "Marcar como realizado"}
                  >
                    {act.completed ? (
                      <CheckCircle className="check-icon completed" size={24} />
                    ) : (
                      <Circle className="check-icon" size={24} />
                    )}
                  </button>
                  {index < filteredActivities.length - 1 && <div className="timeline-line"></div>}
                </div>

                {/* Main Card Body */}
                <div className="activity-card-content">
                  
                  {/* Card Header: Time, Category, Barrio, Friend Toggle */}
                  <div className="act-header-row">
                    <div className="act-time-badge">
                      {getPeriodIcon(act.period)}
                      <span>{act.time} hs</span>
                    </div>

                    <span 
                      className="category-pill"
                      style={{ backgroundColor: catBadge.bg, color: catBadge.color }}
                    >
                      {catBadge.label}
                    </span>

                    <span className="barrio-pill">
                      <MapPin size={12} />
                      {act.barrio}
                    </span>

                    <button 
                      className={`friend-toggle-chip ${act.withFriend ? 'with-friend' : 'solo'}`}
                      onClick={() => onToggleWithFriend(act.id)}
                      title="Haz clic para cambiar si va tu amiga o vas solo"
                    >
                      <Users size={13} />
                      <span>{act.withFriend ? "Con mi amiga" : "Solo"}</span>
                    </button>
                  </div>

                  {/* Activity Title */}
                  <h3 className={`act-title ${act.completed ? 'line-through' : ''}`}>
                    {act.title}
                  </h3>

                  {/* Description & Address */}
                  {act.description && (
                    <p className="act-description">{act.description}</p>
                  )}

                  {act.address && (
                    <div className="act-address">
                      <MapPin size={14} className="address-icon" />
                      <span>{act.address}</span>
                    </div>
                  )}

                  {/* Local Tip Box */}
                  {act.tip && (
                    <div className="act-tip-box">
                      <Lightbulb size={16} className="tip-icon" />
                      <div className="tip-content">
                        <strong>Tip porteño:</strong> {act.tip}
                      </div>
                    </div>
                  )}

                  {/* Footer: Estimated Cost & Primary Actions */}
                  <div className="act-footer">
                    <div className="act-cost">
                      {act.costEstimatedARS > 0 ? (
                        <span>Est: {formatCurrencyARS(act.costEstimatedARS)}</span>
                      ) : (
                        <span className="cost-free">Plan gratuito / En casa</span>
                      )}
                    </div>

                    <div className="act-actions-group">
                      {/* PRIMARY: GOOGLE MAPS TRANSIT BUTTON */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-google-maps"
                        title="Abrir en Google Maps con ruta en transporte público (Subte/Colectivo)"
                      >
                        <NavIcon size={15} />
                        <span>¿Cómo llegar?</span>
                        <ExternalLink size={12} className="external-arrow" />
                      </a>

                      {/* SECONDARY: VIEW ON APP MAP */}
                      {act.coords && (
                        <button
                          className="btn-view-map"
                          onClick={() => onSelectOnMap(act)}
                          title="Ver en el mapa interactivo de la app"
                        >
                          <MapPin size={14} />
                          <span className="desktop-only">Mapa</span>
                        </button>
                      )}

                      {/* EDIT & DELETE */}
                      <button
                        className="btn-icon-subtle"
                        onClick={() => onOpenEditModal(act)}
                        title="Editar plan"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className="btn-icon-subtle danger"
                        onClick={() => onDeleteActivity(act.id)}
                        title="Eliminar plan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
