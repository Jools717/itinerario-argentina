import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Tag, DollarSign, Users, AlertCircle, Sparkles } from 'lucide-react';
import { INITIAL_DAYS } from '../data/initialData';

export default function ActivityModal({ isOpen, onClose, onSave, editingActivity, currentDayNumber }) {
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
    tip: "",
    withFriend: false,
    costEstimatedARS: 0,
    completed: false
  });

  useEffect(() => {
    if (editingActivity) {
      setFormData(editingActivity);
    } else {
      setFormData(prev => ({
        ...prev,
        dayNumber: currentDayNumber || 1,
        title: "",
        address: "",
        description: "",
        tip: "",
        withFriend: false,
        costEstimatedARS: 0
      }));
    }
  }, [editingActivity, currentDayNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Por favor ingresa un título para la actividad.");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Sparkles size={18} />
            </span>
            <h3>{editingActivity ? "Editar Actividad" : "Agregar Actividad al Itinerario"}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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

          {/* Time & Period */}
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

          {/* Title */}
          <div className="form-group">
            <label>Nombre del Plan / Actividad *</label>
            <input
              type="text"
              placeholder="Ej: Visita al Teatro Colón, Almuerzo en Güerrin..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
          </div>

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
              Esta dirección se usará para abrir la ruta en Google Maps con transporte público (Subte/Colectivo).
            </small>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Descripción / Detalles</label>
            <textarea
              rows={2}
              placeholder="¿Qué vamos a hacer? Detalles de reserva, horarios de apertura, etc."
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

          {/* Companions (Friend) & Estimated Cost */}
          <div className="form-row">
            <div className="form-group">
              <label>Costo Estimado (ARS)</label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="Ej: 15000"
                value={formData.costEstimatedARS || ""}
                onChange={(e) => setFormData({ ...formData, costEstimatedARS: Number(e.target.value) })}
                className="form-input"
              />
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

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingActivity ? "Guardar Cambios" : "Crear Actividad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
