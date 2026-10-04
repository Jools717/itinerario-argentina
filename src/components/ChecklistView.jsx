import React, { useState } from 'react';
import { 
  Square, CheckCircle2, Plus, Trash2, Luggage, Sparkles, 
  Check, Filter, Tag, Info, AlertCircle 
} from 'lucide-react';

// Categorías estándar con iconos y colores para el viaje a Buenos Aires
export const CHECKLIST_CATEGORIES = [
  { id: 'equipaje', label: 'Equipaje & Ropa', emoji: '🧳', color: '#0284c7', desc: 'Ropa, calzado cómodo, abrigo, valija' },
  { id: 'documentos', label: 'Documentos', emoji: '📄', color: '#10b981', desc: 'Pasaporte, DNI, seguro médico, reservas' },
  { id: 'tecnologia', label: 'Tecnología', emoji: '📱', color: '#8b5cf6', desc: 'Celular, cargadores, powerbank, adaptador Tipo I' },
  { id: 'dinero', label: 'Dinero & Tarjetas', emoji: '💵', color: '#f59e0b', desc: 'Efectivo USD/ARS, aviso al banco, tarjetas' },
  { id: 'amiga', label: 'Casa de Amiga', emoji: '🏠', color: '#ec4899', desc: 'Conseguir SUBE, llaves, compras compartidas' },
  { id: 'app', label: 'Apps & Móvil', emoji: '📲', color: '#06b6d4', desc: 'Google Maps, Cabify, guardar app web' }
];

export default function ChecklistView({ checklist = [], onToggleChecklist, onAddChecklist, onDeleteChecklist }) {
  const [newText, setNewText] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('equipaje');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [successToast, setSuccessToast] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Helper para resolver el objeto visual de categoría (estándar o personalizada)
  const getCatDetails = (catId) => {
    const found = CHECKLIST_CATEGORIES.find(c => c.id === catId);
    if (found) return found;
    return {
      id: catId,
      label: catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : 'General',
      emoji: '🏷️',
      color: '#64748b'
    };
  };

  // Obtener lista única de categorías presentes en los ítems
  const presentCategoryIds = Array.from(new Set([
    ...CHECKLIST_CATEGORIES.map(c => c.id),
    ...checklist.map(c => c.category).filter(Boolean)
  ]));

  // Filtrado de la lista
  const filteredList = checklist.filter(item => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCat(true);
    } else {
      setIsCustomCat(false);
      setSelectedCatId(val);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) {
      setInputError(true);
      return;
    }

    setInputError(false);

    // Determinar categoría final
    let finalCat = selectedCatId;
    if (isCustomCat) {
      finalCat = customCatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'general';
    }

    const newId = 'chk-' + Date.now();
    const newItem = {
      id: newId,
      text: trimmed,
      category: finalCat,
      completed: false
    };

    onAddChecklist(newItem);
    setLastAddedId(newId);
    setNewText('');
    if (isCustomCat) {
      setCustomCatName('');
      setIsCustomCat(false);
      setSelectedCatId('equipaje');
    }

    // Toast de confirmación
    setSuccessToast(`✓ ¡Agregado: "${trimmed}"!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="checklist-view">
      
      {/* Banner de Progreso */}
      <div className="checklist-progress-card">
        <div className="progress-header">
          <div className="progress-info">
            <div className="checklist-banner-icon-box">
              <Luggage size={26} className="text-sky" />
            </div>
            <div>
              <h3>Preparativos & Equipaje</h3>
              <p>Checklist para tener todo listo antes de aterrizar en Ezeiza el 10 de octubre.</p>
            </div>
          </div>
          <div className="progress-badge">
            {completedCount} de {totalCount} listos ({progressPct}%)
          </div>
        </div>

        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Notificación de Éxito al Agregar */}
      {successToast && (
        <div className="checklist-success-toast animate-scale-up">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Formulario para Agregar Ítem */}
      <div className="add-checklist-card">
        <div className="add-checklist-header">
          <div className="add-checklist-title">
            <Plus size={16} className="text-sky" />
            <span>Agregar Nuevo Preparativo / Tarea</span>
          </div>
          <span className="add-checklist-hint">
            Se sincroniza automáticamente en tu nube
          </span>
        </div>

        <form onSubmit={handleAddSubmit} className="add-checklist-form-wrapper">
          <div className="checklist-input-group">
            <input
              type="text"
              placeholder="Ej: Comprar adaptador de enchufe tipo I, tramitar seguro médico..."
              value={newText}
              onChange={(e) => {
                setNewText(e.target.value);
                if (inputError) setInputError(false);
              }}
              className={`checklist-main-input ${inputError ? 'input-error' : ''}`}
              aria-label="Texto de la tarea"
            />
            {inputError && (
              <span className="input-error-msg">
                <AlertCircle size={12} />
                Por favor escribe el nombre de la tarea o preparativo.
              </span>
            )}
          </div>

          <div className="checklist-controls-row">
            {!isCustomCat ? (
              <select
                value={selectedCatId}
                onChange={handleCategoryChange}
                className="checklist-cat-select"
                title="Selecciona la categoría temática"
              >
                {CHECKLIST_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
                <option value="__custom__">✨ + Otra categoría personalizada...</option>
              </select>
            ) : (
              <div className="custom-cat-input-box">
                <input
                  type="text"
                  placeholder="Nombre de la nueva categoría..."
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  className="checklist-custom-cat-field"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCat(false)}
                  className="btn-cancel-custom-cat"
                  title="Volver a categorías estándar"
                >
                  ✕
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary btn-add-checklist">
              <Plus size={16} />
              <span>Agregar a la lista</span>
            </button>
          </div>
        </form>
      </div>

      {/* Barra de Filtros por Categoría */}
      <div className="checklist-filters-bar">
        <span className="filters-label">
          <Filter size={13} />
          <span>Filtrar:</span>
        </span>
        <div className="checklist-filter-chips">
          <button
            type="button"
            className={`chk-filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Todos ({totalCount})
          </button>
          {presentCategoryIds.map(catId => {
            const cat = getCatDetails(catId);
            const inCat = checklist.filter(c => c.category === catId);
            if (inCat.length === 0) return null;
            const doneInCat = inCat.filter(c => c.completed).length;

            return (
              <button
                key={catId}
                type="button"
                className={`chk-filter-chip ${filterCategory === catId ? 'active' : ''}`}
                onClick={() => setFilterCategory(catId)}
              >
                <span>{cat.emoji} {cat.label}</span>
                <span className="chip-badge">{doneInCat}/{inCat.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Ítems */}
      <div className="checklist-items-grid">
        {filteredList.length === 0 ? (
          <div className="empty-checklist-state">
            <Luggage size={36} className="text-muted" />
            <h4>No hay tareas en esta categoría</h4>
            <p>Agrega un nuevo elemento con el formulario de arriba o cambia el filtro.</p>
            {filterCategory !== 'all' && (
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={() => setFilterCategory('all')}
              >
                Ver todos ({totalCount})
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const cat = getCatDetails(item.category);
            const isJustAdded = item.id === lastAddedId;

            return (
              <div 
                key={item.id} 
                className={`checklist-item-card ${item.completed ? 'completed' : ''} ${isJustAdded ? 'just-added' : ''}`}
                onClick={() => onToggleChecklist(item.id)}
                role="button"
                tabIndex={0}
              >
                <button 
                  className="checklist-checkbox-btn" 
                  aria-label={item.completed ? "Marcar pendiente" : "Marcar completado"}
                >
                  {item.completed ? (
                    <CheckCircle2 size={22} className="check-icon-done" />
                  ) : (
                    <Square size={22} className="check-icon-pending" />
                  )}
                </button>

                <div className="checklist-content">
                  <span className={`checklist-text ${item.completed ? 'strikethrough' : ''}`}>
                    {item.text}
                  </span>
                  
                  <div className="checklist-meta-row">
                    <span 
                      className="checklist-category-pill"
                      style={{ 
                        backgroundColor: `${cat.color}15`, 
                        color: cat.color,
                        borderColor: `${cat.color}35`
                      }}
                    >
                      <span className="cat-pill-emoji">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </div>
                </div>

                <button 
                  className="btn-delete-check"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar "${item.text}" del checklist?`)) {
                      onDeleteChecklist(item.id);
                    }
                  }}
                  title="Eliminar de la lista"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
