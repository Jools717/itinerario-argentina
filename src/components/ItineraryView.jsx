import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Navigation as NavIcon, Users, CheckCircle, 
  Circle, Plus, Edit3, Trash2, Lightbulb, Sun, Sunset, Moon, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Coffee, Filter, Kanban,
  ArrowRightLeft, GripVertical, Eye, X, Check, Sparkles, Layers
} from 'lucide-react';
import { INITIAL_DAYS } from '../data/initialData';
import { getGoogleMapsTransitUrl, formatCurrencyARS, formatCurrencyUSD, getCategoryBadge } from '../utils/helpers';

export default function ItineraryView({
  activities,
  exchangeRate = 1280,
  onToggleComplete,
  onToggleWithFriend,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteActivity,
  onSelectOnMap,
  selectedDayNumber,
  setSelectedDayNumber,
  onMoveActivityDay
}) {
  // View mode: 'kanban' (default as requested) | 'timeline'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters
  const [filterFriend, setFilterFriend] = useState('all'); // 'all', 'withFriend', 'solo'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'mañana', 'tarde', 'noche'
  const [kanbanWeek, setKanbanWeek] = useState('all'); // 'all', 'week1' (1-7), 'week2' (8-14)

  // Drag & Drop state
  const [draggedActivityId, setDraggedActivityId] = useState(null);
  const [dragOverDayNumber, setDragOverDayNumber] = useState(null);

  // Quick 1-Click Move Modal state
  const [quickMoveActivity, setQuickMoveActivity] = useState(null);

  // Detailed Activity Inspection Modal state (from Kanban)
  const [inspectingActivity, setInspectingActivity] = useState(null);

  // Success toast for instant move feedback
  const [moveToast, setMoveToast] = useState(null);

  const boardScrollRef = useRef(null);

  // Auto-scroll Kanban board horizontally during edge drag
  useEffect(() => {
    if (!draggedActivityId) return;

    const handleDragOverWindow = (e) => {
      const container = boardScrollRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const edgeThreshold = 80;
      const scrollSpeed = 16;

      if (e.clientX < rect.left + edgeThreshold) {
        container.scrollLeft -= scrollSpeed;
      } else if (e.clientX > rect.right - edgeThreshold) {
        container.scrollLeft += scrollSpeed;
      }
    };

    window.addEventListener('dragover', handleDragOverWindow);
    return () => window.removeEventListener('dragover', handleDragOverWindow);
  }, [draggedActivityId]);

  // Scroll buttons for Kanban board
  const scrollBoard = (direction) => {
    if (boardScrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      boardScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Helper for period icons
  const getPeriodIcon = (period) => {
    switch (period) {
      case 'mañana': return <Sun size={14} className="period-icon morning" />;
      case 'tarde': return <Sunset size={14} className="period-icon afternoon" />;
      case 'noche': return <Moon size={14} className="period-icon night" />;
      default: return <Clock size={14} />;
    }
  };

  // Filter activities by companion & period
  const filterActivityItem = (act) => {
    if (filterFriend === 'withFriend' && !act.withFriend) return false;
    if (filterFriend === 'solo' && act.withFriend) return false;
    if (filterPeriod !== 'all' && act.period !== filterPeriod) return false;
    return true;
  };

  // Days visible in Kanban based on week filter
  const visibleDays = INITIAL_DAYS.filter(d => {
    if (kanbanWeek === 'week1') return d.dayNumber <= 7;
    if (kanbanWeek === 'week2') return d.dayNumber >= 8;
    return true;
  });

  // Current day in Timeline
  const currentTimelineDay = INITIAL_DAYS.find(d => d.dayNumber === selectedDayNumber) || INITIAL_DAYS[0];
  const dayActivities = activities.filter(a => a.dayNumber === selectedDayNumber);
  const filteredTimelineActivities = dayActivities.filter(filterActivityItem);
  const completedInDay = dayActivities.filter(a => a.completed).length;
  const withFriendInDay = dayActivities.filter(a => a.withFriend).length;

  const goToPrevDay = () => {
    if (selectedDayNumber > 1) setSelectedDayNumber(selectedDayNumber - 1);
  };

  const goToNextDay = () => {
    if (selectedDayNumber < 14) setSelectedDayNumber(selectedDayNumber + 1);
  };

  // Handle Drag & Drop events
  const handleDragStart = (e, act) => {
    e.dataTransfer.setData('text/plain', act.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedActivityId(act.id);
  };

  const handleDragEnd = () => {
    setDraggedActivityId(null);
    setDragOverDayNumber(null);
  };

  const handleDragOverColumn = (e, dayNum) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDayNumber !== dayNum) {
      setDragOverDayNumber(dayNum);
    }
  };

  const handleDragLeaveColumn = (e, dayNum) => {
    if (dragOverDayNumber === dayNum) {
      setDragOverDayNumber(null);
    }
  };

  const handleDropOnColumn = (e, targetDayNum) => {
    e.preventDefault();
    const actId = e.dataTransfer.getData('text/plain') || draggedActivityId;
    if (actId && onMoveActivityDay) {
      const act = activities.find(a => a.id === actId);
      if (act && act.dayNumber !== targetDayNum) {
        onMoveActivityDay(actId, targetDayNum);
        showMoveFeedback(act.title, targetDayNum);
      }
    }
    setDraggedActivityId(null);
    setDragOverDayNumber(null);
  };

  // Handle 1-Click Move via Modal
  const executeQuickMove = (targetDayNum) => {
    if (!quickMoveActivity || !onMoveActivityDay) return;
    if (quickMoveActivity.dayNumber !== targetDayNum) {
      onMoveActivityDay(quickMoveActivity.id, targetDayNum);
      showMoveFeedback(quickMoveActivity.title, targetDayNum);
    }
    setQuickMoveActivity(null);
  };

  const showMoveFeedback = (title, dayNum) => {
    setMoveToast(`"${title}" movido al Día ${dayNum}`);
    setTimeout(() => setMoveToast(null), 2800);
  };

  // Jump from Kanban directly to detailed day view
  const handleJumpToDayTimeline = (dayNum) => {
    setSelectedDayNumber(dayNum);
    setViewMode('timeline');
  };

  return (
    <div className="itinerary-view">

      {/* ===================== TOAST NOTIFICATION ===================== */}
      {moveToast && (
        <div className="itinerary-move-toast animate-fade-in">
          <CheckCircle size={16} className="text-emerald" />
          <span>{moveToast}</span>
        </div>
      )}

      {/* ===================== TOP VIEW SWITCHER & CONTROLS ===================== */}
      <div className="itinerary-top-toolbar">
        
        {/* Left: View Mode Toggle */}
        <div className="view-mode-toggle-group">
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Tablero visual con columnas por día y tarjetas deslizables"
          >
            <Kanban size={16} />
            <span className="toggle-label">Tablero Kanban</span>
            <span className="toggle-pill-badge">Ágil</span>
          </button>

          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Vista cronológica día a día con mapa y detalles paso a paso"
          >
            <Calendar size={16} />
            <span className="toggle-label">Vista Día a Día</span>
            <span className="toggle-pill-badge">Detalle</span>
          </button>
        </div>

        {/* Center: Week Filter (Active in Kanban) */}
        {viewMode === 'kanban' && (
          <div className="kanban-week-filter">
            <span className="filter-label-subtle">Semana:</span>
            <button
              className={`week-chip ${kanbanWeek === 'all' ? 'active' : ''}`}
              onClick={() => setKanbanWeek('all')}
            >
              Todos (14 Días)
            </button>
            <button
              className={`week-chip ${kanbanWeek === 'week1' ? 'active' : ''}`}
              onClick={() => setKanbanWeek('week1')}
            >
              Semana 1 (Días 1-7)
            </button>
            <button
              className={`week-chip ${kanbanWeek === 'week2' ? 'active' : ''}`}
              onClick={() => setKanbanWeek('week2')}
            >
              Semana 2 (Días 8-14)
            </button>
          </div>
        )}

        {/* Right: Companion Filter & Add Button */}
        <div className="itinerary-quick-actions">
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
              title="Planes con mi amiga"
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

          <button
            className="btn-add-activity"
            onClick={() => onOpenAddModal(selectedDayNumber)}
          >
            <Plus size={16} />
            <span>Nuevo Plan</span>
          </button>
        </div>

      </div>

      {/* ===================== VIEW 1: KANBAN BOARD ===================== */}
      {viewMode === 'kanban' && (
        <div className="kanban-view-container animate-fade-in">
          
          {/* Quick instructions and scroll buttons */}
          <div className="kanban-header-info">
            <div className="kanban-legend">
              <span className="legend-hint">
                💡 <strong>Tip de organización:</strong> Arrastra cualquier plan entre días o usa el botón <strong>"Mover"</strong> en la tarjeta para trasladarlo con 1 clic.
              </span>
            </div>

            <div className="kanban-nav-scroll-btns">
              <button
                type="button"
                className="btn-scroll-col"
                onClick={() => scrollBoard('left')}
                title="Desplazar columnas a la izquierda"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn-scroll-col"
                onClick={() => scrollBoard('right')}
                title="Desplazar columnas a la derecha"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Kanban Board Horizontal Track */}
          <div className="kanban-board-track" ref={boardScrollRef}>
            {visibleDays.map((day) => {
              const dayActs = activities.filter(a => a.dayNumber === day.dayNumber);
              const filteredDayActs = dayActs.filter(filterActivityItem);
              const isOver = dragOverDayNumber === day.dayNumber;
              const isDeparture = day.isDepartureDay;

              return (
                <div 
                  key={day.dayNumber}
                  className={`kanban-column ${isOver ? 'is-drag-over' : ''} ${isDeparture ? 'is-departure' : ''}`}
                  onDragOver={(e) => handleDragOverColumn(e, day.dayNumber)}
                  onDragLeave={(e) => handleDragLeaveColumn(e, day.dayNumber)}
                  onDrop={(e) => handleDropOnColumn(e, day.dayNumber)}
                >
                  {/* Column Header */}
                  <div className="kanban-col-header">
                    <div className="col-header-top">
                      <div className="col-day-badge">
                        <span className="col-day-num">DÍA {day.dayNumber}</span>
                        {isDeparture && <span className="col-dep-tag">✈️ Salida</span>}
                      </div>
                      <span className="col-acts-count">{dayActs.length} {dayActs.length === 1 ? 'plan' : 'planes'}</span>
                    </div>

                    <div className="col-date-text">{day.dateFormatted}</div>
                    
                    <div className="col-barrio-tag" title={day.barrioPrincipal}>
                      <MapPin size={11} />
                      <span>{day.barrioPrincipal}</span>
                    </div>

                    {/* Quick Column Actions */}
                    <div className="col-header-actions">
                      <button
                        type="button"
                        className="btn-col-add"
                        onClick={() => onOpenAddModal(day.dayNumber)}
                        title={`Agregar plan al Día ${day.dayNumber}`}
                      >
                        <Plus size={13} />
                        <span>Agregar</span>
                      </button>

                      <button
                        type="button"
                        className="btn-col-timeline"
                        onClick={() => handleJumpToDayTimeline(day.dayNumber)}
                        title="Ver este día en Timeline detallado"
                      >
                        <Calendar size={13} />
                        <span>Ver Día</span>
                      </button>
                    </div>
                  </div>

                  {/* Drop zone indicator message during drag */}
                  {isOver && (
                    <div className="kanban-drop-placeholder animate-pulse">
                      <span>Soltar aquí para mover al Día {day.dayNumber}</span>
                    </div>
                  )}

                  {/* Cards List */}
                  <div className="kanban-cards-stack">
                    {filteredDayActs.length === 0 ? (
                      <div className="kanban-empty-col">
                        <Coffee size={24} className="text-muted" />
                        <p>Sin planes en este día</p>
                        <button
                          type="button"
                          className="btn-add-empty-col"
                          onClick={() => onOpenAddModal(day.dayNumber)}
                        >
                          + Agregar
                        </button>
                      </div>
                    ) : (
                      filteredDayActs.map((act) => {
                        const catBadge = getCategoryBadge(act.category);
                        const isBeingDragged = draggedActivityId === act.id;

                        return (
                          <div
                            key={act.id}
                            className={`kanban-card ${act.completed ? 'is-completed' : ''} ${isBeingDragged ? 'is-dragging' : ''}`}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, act)}
                            onDragEnd={handleDragEnd}
                          >
                            {/* Card Top Row: Grip handle, Time, Category, Check */}
                            <div className="kcard-header">
                              <div className="kcard-grip" title="Arrastra para mover a otro día">
                                <GripVertical size={14} className="text-muted" />
                              </div>

                              <div className="kcard-time">
                                {getPeriodIcon(act.period)}
                                <span>{act.time} hs</span>
                              </div>

                              <span 
                                className="kcard-category-pill"
                                style={{ backgroundColor: catBadge.bg, color: catBadge.color }}
                              >
                                {catBadge.label}
                              </span>

                              <button
                                type="button"
                                className="kcard-check-btn"
                                onClick={() => onToggleComplete(act.id)}
                                title={act.completed ? "Marcar como pendiente" : "Marcar como realizado"}
                              >
                                {act.completed ? (
                                  <CheckCircle size={17} className="text-emerald" />
                                ) : (
                                  <Circle size={17} className="text-muted" />
                                )}
                              </button>
                            </div>

                            {/* Card Title */}
                            <h4 
                              className={`kcard-title ${act.completed ? 'line-through' : ''}`}
                              onClick={() => setInspectingActivity(act)}
                              title="Haz clic para ver detalles del plan y ruta en Google Maps"
                            >
                              {act.title}
                            </h4>

                            {/* Card Barrio & Tags */}
                            <div className="kcard-meta-row">
                              <span className="kcard-barrio">
                                <MapPin size={11} />
                                {act.barrio}
                              </span>

                              <button
                                type="button"
                                className={`kcard-friend-pill ${act.withFriend ? 'with-friend' : 'solo'}`}
                                onClick={() => onToggleWithFriend(act.id)}
                                title="Alternar si va tu amiga o vas solo"
                              >
                                <Users size={11} />
                                <span>{act.withFriend ? 'Amiga' : 'Solo'}</span>
                              </button>
                            </div>

                            {/* Cost Row */}
                            <div className="kcard-cost-row">
                              {act.costEstimatedARS > 0 ? (
                                <span className="kcard-cost">
                                  {formatCurrencyARS(act.costEstimatedARS)}
                                  <small> (≈ {formatCurrencyUSD(act.costEstimatedARS, exchangeRate)} USD)</small>
                                </span>
                              ) : (
                                <span className="kcard-cost-free">Plan sin costo ($0)</span>
                              )}
                            </div>

                            {/* Action Tools Row */}
                            <div className="kcard-actions-bar">
                              {/* 1-Click Move Button */}
                              <button
                                type="button"
                                className="kcard-action-btn move-btn"
                                onClick={() => setQuickMoveActivity(act)}
                                title="Mover este plan a cualquier otro día con 1 clic"
                              >
                                <ArrowRightLeft size={13} />
                                <span>Mover</span>
                              </button>

                              {/* Details & Google Maps route button */}
                              <button
                                type="button"
                                className="kcard-action-btn detail-btn"
                                onClick={() => setInspectingActivity(act)}
                                title="Ver detalles, cómo llegar en Google Maps y tip porteño"
                              >
                                <Eye size={13} />
                                <span>Detalle</span>
                              </button>

                              {/* Edit Modal */}
                              <button
                                type="button"
                                className="kcard-icon-btn"
                                onClick={() => onOpenEditModal(act)}
                                title="Editar plan"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="kcard-icon-btn danger"
                                onClick={() => onDeleteActivity(act.id)}
                                title="Eliminar plan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ===================== VIEW 2: TIMELINE DAY-BY-DAY ===================== */}
      {viewMode === 'timeline' && (
        <div className="timeline-view-container animate-fade-in">
          
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
          <div className={`day-header-card ${currentTimelineDay.isDepartureDay ? 'departure-banner' : ''}`}>
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
                  <span className="badge-day-number">DÍA {currentTimelineDay.dayNumber} DE 14</span>
                  <span className="badge-day-barrio">{currentTimelineDay.barrioPrincipal}</span>
                  {currentTimelineDay.isDepartureDay && (
                    <span className="badge-warning">✈️ Vuelo de salida 3:30 PM</span>
                  )}
                </div>
                <h2 className="day-title-text">{currentTimelineDay.dateFormatted}</h2>
                <p className="day-summary-text">{currentTimelineDay.summary}</p>
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
                {dayActivities.reduce((s, a) => s + (Number(a.costEstimatedARS) || 0), 0) > 0 && (
                  <span className="mini-stat day-cost-mini-stat">
                    Est: <strong>{formatCurrencyARS(dayActivities.reduce((s, a) => s + (Number(a.costEstimatedARS) || 0), 0))}</strong>
                    <small className="usd-tag"> (≈ {formatCurrencyUSD(dayActivities.reduce((s, a) => s + (Number(a.costEstimatedARS) || 0), 0), exchangeRate)} USD Blue)</small>
                  </span>
                )}
              </div>

              <div className="day-filters">
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
              </div>
            </div>

          </div>

          {/* Special alert on Departure Day */}
          {currentTimelineDay.isDepartureDay && (
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
            {filteredTimelineActivities.length === 0 ? (
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
              filteredTimelineActivities.map((act, index) => {
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
                      {index < filteredTimelineActivities.length - 1 && <div className="timeline-line"></div>}
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

                      {/* Footer: Estimated Cost + Actions (Including 1-Click Move!) */}
                      <div className="act-footer">
                        <div className="act-cost">
                          {act.costEstimatedARS > 0 ? (
                            <div className="dual-currency-box">
                              <span className="cost-ars">{formatCurrencyARS(act.costEstimatedARS)}</span>
                              <span className="cost-usd-blue">≈ {formatCurrencyUSD(act.costEstimatedARS, exchangeRate)} USD Blue</span>
                            </div>
                          ) : (
                            <span className="cost-free">Plan gratuito / En casa ($0)</span>
                          )}
                        </div>

                        <div className="act-actions-group">
                          {/* 1-CLICK QUICK MOVE TO ANOTHER DAY */}
                          <button
                            type="button"
                            className="btn-quick-move"
                            onClick={() => setQuickMoveActivity(act)}
                            title="Mover este plan a otro día con 1 clic"
                          >
                            <ArrowRightLeft size={14} />
                            <span>Mover día</span>
                          </button>

                          {/* GOOGLE MAPS TRANSIT BUTTON */}
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

                          {/* VIEW ON APP MAP */}
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
      )}

      {/* ===================== MODAL: 1-CLICK QUICK MOVE DAY PICKER ===================== */}
      {quickMoveActivity && (
        <div className="modal-overlay animate-fade-in" onClick={() => setQuickMoveActivity(null)}>
          <div className="modal-container quick-move-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge text-emerald">
                  <ArrowRightLeft size={18} />
                </span>
                <div>
                  <h3>Mover Plan a Otro Día</h3>
                  <p className="quick-move-subtitle">
                    Selecciona a qué día deseas trasladar: <strong>"{quickMoveActivity.title}"</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setQuickMoveActivity(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="quick-move-body">
              <div className="quick-move-days-grid">
                {INITIAL_DAYS.map((d) => {
                  const isCurrent = d.dayNumber === quickMoveActivity.dayNumber;
                  const dayPlansCount = activities.filter(a => a.dayNumber === d.dayNumber).length;

                  return (
                    <button
                      key={d.dayNumber}
                      type="button"
                      disabled={isCurrent}
                      className={`btn-target-day-tile ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => executeQuickMove(d.dayNumber)}
                    >
                      <div className="tile-day-header">
                        <span className="tile-day-num">DÍA {d.dayNumber}</span>
                        {isCurrent ? (
                          <span className="tile-current-badge">Día actual</span>
                        ) : (
                          <span className="tile-plans-badge">{dayPlansCount} {dayPlansCount === 1 ? 'plan' : 'planes'}</span>
                        )}
                      </div>

                      <div className="tile-day-date">{d.dateFormatted}</div>

                      <div className="tile-day-barrio">
                        <MapPin size={11} />
                        <span>{d.barrioPrincipal}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setQuickMoveActivity(null)}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== MODAL: KANBAN DETAILED INSPECTION ===================== */}
      {inspectingActivity && (
        <div className="modal-overlay animate-fade-in" onClick={() => setInspectingActivity(null)}>
          <div className="modal-container activity-inspect-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge text-emerald">
                  <Eye size={18} />
                </span>
                <div>
                  <h3>Detalle del Plan</h3>
                  <p className="quick-move-subtitle">
                    Día {inspectingActivity.dayNumber} • {inspectingActivity.time} hs
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setInspectingActivity(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inspect-modal-body">
              {/* Header Badges */}
              <div className="inspect-meta-row">
                <span 
                  className="category-pill"
                  style={{ 
                    backgroundColor: getCategoryBadge(inspectingActivity.category).bg, 
                    color: getCategoryBadge(inspectingActivity.category).color 
                  }}
                >
                  {getCategoryBadge(inspectingActivity.category).label}
                </span>

                <span className="barrio-pill">
                  <MapPin size={12} />
                  {inspectingActivity.barrio}
                </span>

                <span className={`friend-toggle-chip ${inspectingActivity.withFriend ? 'with-friend' : 'solo'}`}>
                  <Users size={12} />
                  <span>{inspectingActivity.withFriend ? "Con mi amiga" : "Solo"}</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="inspect-title">{inspectingActivity.title}</h2>

              {/* Address */}
              {inspectingActivity.address && (
                <div className="act-address">
                  <MapPin size={14} className="address-icon" />
                  <span>{inspectingActivity.address}</span>
                </div>
              )}

              {/* Description */}
              {inspectingActivity.description && (
                <p className="inspect-description">{inspectingActivity.description}</p>
              )}

              {/* Tip Porteño */}
              {inspectingActivity.tip && (
                <div className="act-tip-box">
                  <Lightbulb size={16} className="tip-icon" />
                  <div className="tip-content">
                    <strong>Tip porteño:</strong> {inspectingActivity.tip}
                  </div>
                </div>
              )}

              {/* Estimated Cost */}
              <div className="inspect-cost-card">
                <span>Costo estimado:</span>
                {inspectingActivity.costEstimatedARS > 0 ? (
                  <div className="dual-currency-box">
                    <strong className="cost-ars">{formatCurrencyARS(inspectingActivity.costEstimatedARS)}</strong>
                    <span className="cost-usd-blue">≈ {formatCurrencyUSD(inspectingActivity.costEstimatedARS, exchangeRate)} USD Blue</span>
                  </div>
                ) : (
                  <strong className="text-emerald">Plan gratuito ($0)</strong>
                )}
              </div>

              {/* Primary Google Maps Route Button */}
              <a
                href={getGoogleMapsTransitUrl(inspectingActivity)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-inspect-maps"
              >
                <NavIcon size={16} />
                <span>¿Cómo llegar en Subte / Colectivo (Google Maps)?</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="modal-footer inspect-modal-footer">
              <div className="inspect-footer-left">
                <button
                  type="button"
                  className="btn-inspect-move"
                  onClick={() => {
                    const act = inspectingActivity;
                    setInspectingActivity(null);
                    setQuickMoveActivity(act);
                  }}
                  title="Mover este plan a otro día"
                >
                  <ArrowRightLeft size={14} />
                  <span>Mover a otro día</span>
                </button>

                <button
                  type="button"
                  className="btn-inspect-delete"
                  onClick={() => {
                    const id = inspectingActivity.id;
                    setInspectingActivity(null);
                    onDeleteActivity(id);
                  }}
                  title="Eliminar este plan del itinerario"
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              </div>

              <div className="inspect-footer-right">
                <button
                  type="button"
                  className="btn-inspect-close"
                  onClick={() => setInspectingActivity(null)}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="btn-inspect-edit"
                  onClick={() => {
                    const act = inspectingActivity;
                    setInspectingActivity(null);
                    onOpenEditModal(act);
                  }}
                >
                  <Edit3 size={14} />
                  <span>Editar Plan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
