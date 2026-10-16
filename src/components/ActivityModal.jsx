import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Clock, Tag, DollarSign, Users, Sparkles, 
  ShoppingBag, StickyNote, Plus, Trash2, Banknote, CreditCard
} from 'lucide-react';
import { INITIAL_DAYS } from '../data/initialData';
import { parseCurrencyNumber, formatCurrencyARS, formatCurrencyUSD } from '../utils/helpers';

export default function ActivityModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingActivity, 
  currentDayNumber,
  exchangeRate = 1520 
}) {
  const [entryType, setEntryType] = useState('plan'); // 'plan' | 'compras' | 'nota'
  
  const [formData, setFormData] = useState({
    dayNumber: currentDayNumber || 1,
    time: "11:00",
    period: "mañana",
    title: "",
    barrio: "Palermo",
    category: "gastronomia",
    address: "",
    coords: [-34.5880, -58.4300],
    description: "",
    note: "",
    tip: "",
    withFriend: false,
    costEstimatedARS: 0,
    completed: false,
    items: []
  });

  // Shopping list multi-items state
  const [itemsList, setItemsList] = useState([
    { id: 'it-1', name: '', price: '' }
  ]);

  useEffect(() => {
    if (editingActivity) {
      const type = editingActivity.type || (editingActivity.category === 'compras' && editingActivity.items?.length > 0 ? 'compras' : 'plan');
      setEntryType(type);
      setFormData({
        ...editingActivity,
        dayNumber: Number(editingActivity.dayNumber || currentDayNumber || 1),
        costEstimatedARS: editingActivity.costEstimatedARS || 0,
        items: editingActivity.items || []
      });

      if (Array.isArray(editingActivity.items) && editingActivity.items.length > 0) {
        setItemsList(editingActivity.items.map((it, idx) => ({
          id: it.id || `it-${idx + 1}`,
          name: it.name || '',
          price: it.price != null ? it.price.toString() : ''
        })));
      } else {
        setItemsList([{ id: 'it-1', name: '', price: '' }]);
      }
    } else {
      setEntryType('plan');
      setFormData({
        dayNumber: currentDayNumber || 1,
        time: "11:00",
        period: "mañana",
        title: "",
        barrio: "San Telmo",
        category: "gastronomia",
        address: "",
        coords: [-34.5880, -58.4300],
        description: "",
        note: "",
        tip: "",
        withFriend: false,
        costEstimatedARS: 0,
        completed: false,
        items: []
      });
      setItemsList([{ id: 'it-1', name: '', price: '' }]);
    }
  }, [editingActivity, currentDayNumber, isOpen]);

  if (!isOpen) return null;

  // Shopping items calculations
  const totalItemsARS = itemsList.reduce((sum, item) => sum + (parseCurrencyNumber(item.price) || 0), 0);
  const totalItemsUSD = exchangeRate > 0 ? (totalItemsARS / exchangeRate) : 0;

  const handleAddItem = () => {
    setItemsList(prev => [...prev, { id: `it-${Date.now()}`, name: '', price: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (itemsList.length <= 1) {
      setItemsList([{ id: 'it-1', name: '', price: '' }]);
      return;
    }
    setItemsList(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItemsList(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Por favor ingresa un título.");
      return;
    }

    let finalCost = 0;
    let finalCategory = formData.category;
    let cleanItems = [];

    if (entryType === 'compras') {
      cleanItems = itemsList
        .filter(it => it.name.trim() || parseCurrencyNumber(it.price) > 0)
        .map(it => ({
          id: it.id,
          name: it.name.trim() || 'Artículo',
          price: parseCurrencyNumber(it.price) || 0
        }));
      finalCost = cleanItems.reduce((s, it) => s + it.price, 0);
      finalCategory = formData.category || 'compras';
    } else if (entryType === 'nota') {
      finalCost = 0;
      finalCategory = 'relax';
    } else {
      finalCost = Math.max(0, parseCurrencyNumber(formData.costEstimatedARS) || 0);
    }

    onSave({ 
      ...formData, 
      type: entryType,
      category: finalCategory,
      items: cleanItems,
      dayNumber: Number(formData.dayNumber || currentDayNumber || 1), 
      costEstimatedARS: finalCost 
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container activity-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`modal-icon-badge badge-${entryType}`}>
              {entryType === 'compras' ? <ShoppingBag size={20} /> : entryType === 'nota' ? <StickyNote size={20} /> : <Sparkles size={20} />}
            </span>
            <div>
              <span className={`modal-type-chip chip-${entryType}`}>
                Día {formData.dayNumber} · {entryType === 'compras' ? 'Lote de Compras' : entryType === 'nota' ? 'Nota / Recordatorio' : 'Plan de Itinerario'}
              </span>
              <h3>
                {editingActivity ? "Editar Elemento" : "Agregar al Itinerario"}
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Entry Type Selector Tabs */}
        {!editingActivity && (
          <div className="entry-type-selector-tabs">
            <button
              type="button"
              className={`entry-type-tab-btn tab-plan ${entryType === 'plan' ? 'active' : ''}`}
              onClick={() => {
                setEntryType('plan');
                setFormData(prev => ({ ...prev, category: 'gastronomia' }));
              }}
            >
              <MapPin size={16} />
              <span>Plan / Visita</span>
            </button>

            <button
              type="button"
              className={`entry-type-tab-btn tab-compras ${entryType === 'compras' ? 'active' : ''}`}
              onClick={() => {
                setEntryType('compras');
                setFormData(prev => ({ ...prev, category: 'compras', title: prev.title || 'Compras en San Telmo' }));
              }}
            >
              <ShoppingBag size={16} />
              <span>Compras (Multi-ítem)</span>
            </button>

            <button
              type="button"
              className={`entry-type-tab-btn tab-nota ${entryType === 'nota' ? 'active' : ''}`}
              onClick={() => {
                setEntryType('nota');
                setFormData(prev => ({ ...prev, category: 'relax', title: prev.title || 'Nota del día' }));
              }}
            >
              <StickyNote size={16} />
              <span>Nota / Aviso</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Day selection */}
          <div className="form-group">
            <label>Día del Viaje</label>
            <select
              value={formData.dayNumber}
              onChange={(e) => setFormData({ ...formData, dayNumber: Number(e.target.value) })}
              className="form-select"
            >
              {INITIAL_DAYS.map((d) => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  Día {d.dayNumber} · {d.dateFormatted} ({d.barrioPrincipal})
                </option>
              ))}
            </select>
          </div>

          {/* Time & Period (Only if not a simple nota) */}
          {entryType !== 'nota' && (
            <div className="form-row">
              <div className="form-group">
                <label>Hora Estimada</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Momento del Día</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="form-select"
                >
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label>
              {entryType === 'compras' ? 'Título del Lote de Compras *' : entryType === 'nota' ? 'Título de la Nota / Recordatorio *' : 'Nombre del Plan / Lugar *'}
            </label>
            <input
              type="text"
              placeholder={entryType === 'compras' ? 'Ej: Compras en Feria de San Telmo' : entryType === 'nota' ? 'Ej: Recordar llevar efectivo sencillo' : 'Ej: Visita al Teatro Colón, Almuerzo en Güerrin...'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
          </div>

          {/* =======================================================
              MODE 1: COMPRAS (MULTI-ITEM DYNAMIC LIST)
              ======================================================= */}
          {entryType === 'compras' && (
            <div className="compras-builder-box">
              <div className="compras-builder-header">
                <div className="compras-header-info">
                  <div className="compras-header-title">
                    <ShoppingBag size={17} className="text-purple" />
                    <span>Artículos del Lote de Compras</span>
                  </div>
                  <p className="compras-header-subtitle">
                    Detalla los productos y sus precios. Se sumarán automáticamente en 1 sola tarjeta.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-add-item-row"
                  onClick={handleAddItem}
                >
                  <Plus size={15} />
                  <span>Agregar producto</span>
                </button>
              </div>

              <div className="items-inputs-stack">
                {itemsList.map((item, index) => (
                  <div key={item.id} className="item-input-row">
                    <span className="item-row-badge">#{index + 1}</span>
                    <input
                      type="text"
                      placeholder="Producto (ej: Pezuña, Imanes, Mate)"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="form-input item-input-name"
                    />
                    <div className="item-price-wrapper">
                      <span className="item-price-symbol">ARS $</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        className="form-input item-input-price"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Eliminar este artículo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Live Sum Calculation Banner */}
              <div className="compras-total-summary-card">
                <div className="summary-col-left">
                  <span className="summary-items-count">Total ({itemsList.length} {itemsList.length === 1 ? 'artículo' : 'artículos'}):</span>
                  <span className="summary-mirror-hint">Se reflejará este total espejo en tu Billetera</span>
                </div>
                <div className="summary-col-right">
                  <span className="summary-total-ars">{formatCurrencyARS(totalItemsARS)}</span>
                  <span className="summary-total-usd">≈ {formatCurrencyUSD(totalItemsARS, exchangeRate)} USD Blue</span>
                </div>
              </div>

              {/* Category Selector for Compras (Compras vs Mercado vs Regalos) */}
              <div className="form-row compras-sub-row">
                <div className="form-group">
                  <label>Categoría en Billetera</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="compras">🛍️ Compras & Outlets</option>
                    <option value="mercado">🛒 Mercado de Alimentos</option>
                    <option value="regalos">🎁 Regalos del Viaje</option>
                    <option value="varios">🏷️ Varios & General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Barrio / Zona</label>
                  <input
                    type="text"
                    placeholder="Ej: San Telmo, Palermo..."
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              MODE 2: NOTA / RECORDATORIO
              ======================================================= */}
          {entryType === 'nota' && (
            <div className="nota-builder-box">
              <div className="nota-tip-hint">
                <StickyNote size={16} />
                <span>Las notas son recordatorios útiles para tu día ($0 de costo y sin ruta de transporte).</span>
              </div>
              <div className="form-group">
                <label>Detalle de la Nota / Aviso *</label>
                <textarea
                  rows={4}
                  placeholder="Escribe aquí recomendaciones, advertencias de seguridad, cosas pendientes por comprar o llevar..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea nota-textarea"
                  required
                />
              </div>
            </div>
          )}

          {/* =======================================================
              MODE 3: PLAN / ACTIVIDAD TRADICIONAL
              ======================================================= */}
          {entryType === 'plan' && (
            <>
              {/* Category & Barrio */}
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="gastronomia">Gastronomía & Cafés</option>
                    <option value="cultura">Cultura & Monumentos</option>
                    <option value="naturaleza">Parques & Naturaleza</option>
                    <option value="vida_nocturna">Vida Nocturna & Bares</option>
                    <option value="transporte">Transporte & Traslados</option>
                    <option value="mercado">Mercado Casa de Amiga</option>
                    <option value="compras">Compras & Alfajores</option>
                    <option value="relax">Descanso & Hogar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Barrio / Zona</label>
                  <input
                    type="text"
                    placeholder="Ej: San Telmo, Palermo, Recoleta..."
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Address (for Google Maps) */}
              <div className="form-group">
                <label>Dirección o Nombre del Lugar en Buenos Aires</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Corrientes 1368, Cerrito 628..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input"
                />
                <small className="form-hint">
                  Esta dirección se usará para abrir la ruta en Google Maps con transporte público.
                </small>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Descripción / Detalles</label>
                <textarea
                  rows={2}
                  placeholder="¿Qué vamos a hacer? Detalles de reserva, horarios, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Tip / Consejo local */}
              <div className="form-group">
                <label>Tip o Recomendación Porteña</label>
                <input
                  type="text"
                  placeholder="Ej: Pedir porción de fugazzeta de parado, llevar efectivo..."
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Cost & Companion */}
              <div className="form-row">
                <div className="form-group">
                  <label>Costo Estimado (ARS)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej: 19.741 (Dejar en $0 si es gratis)"
                    value={formData.costEstimatedARS || ""}
                    onChange={(e) => setFormData({ ...formData, costEstimatedARS: e.target.value })}
                    className="form-input"
                  />
                  {parseCurrencyNumber(formData.costEstimatedARS) > 0 && (
                    <div className="live-currency-hint">
                      ≈ <strong>${(parseCurrencyNumber(formData.costEstimatedARS) / exchangeRate).toFixed(1)} USD Blue</strong>
                    </div>
                  )}
                </div>

                <div className="form-group toggle-group-wrapper">
                  <label>¿Va mi amiga?</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.withFriend}
                      onChange={(e) => setFormData({ ...formData, withFriend: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">
                      {formData.withFriend ? "Sí, vamos juntos" : "Solo / En solitario"}
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingActivity ? "Guardar Cambios" : entryType === 'compras' ? "Guardar Lote de Compras" : entryType === 'nota' ? "Guardar Nota" : "Crear Actividad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
