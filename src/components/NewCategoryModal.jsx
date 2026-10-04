import React, { useState } from 'react';
import { X, Plus, Sparkles, Tag } from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'Gift', label: 'Regalos', emoji: '🎁' },
  { id: 'Wine', label: 'Boliche / Vinos', emoji: '🍷' },
  { id: 'ShoppingBag', label: 'Compras / Outlets', emoji: '🛍️' },
  { id: 'Coffee', label: 'Cafés Notables', emoji: '☕' },
  { id: 'Car', label: 'Escapada / Viaje', emoji: '🚗' },
  { id: 'Ticket', label: 'Teatro / Show', emoji: '🎭' },
  { id: 'Music', label: 'Música / Bares', emoji: '🎵' },
  { id: 'Pizza', label: 'Comidas Rápidas', emoji: '🍕' },
  { id: 'Heart', label: 'Especial', emoji: '❤️' },
  { id: 'Sparkles', label: 'Varios', emoji: '✨' },
];

const COLOR_OPTIONS = [
  { hex: '#10b981', label: 'Verde Menta' },
  { hex: '#0284c7', label: 'Azul Cielo' },
  { hex: '#f59e0b', label: 'Dorado Sol' },
  { hex: '#ec4899', label: 'Rosa Pastel' },
  { hex: '#8b5cf6', label: 'Violeta' },
  { hex: '#ef4444', label: 'Coral' },
  { hex: '#0d9488', label: 'Verde Petróleo' },
  { hex: '#6366f1', label: 'Índigo' }
];

export default function NewCategoryModal({
  isOpen,
  onClose,
  onCreateCategory
}) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Gift');
  const [selectedColor, setSelectedColor] = useState('#ec4899');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor escribe el nombre de la sección");
      return;
    }

    const cleanId = 'cat_' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

    onCreateCategory({
      id: cleanId,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      is_default: false
    });

    setName('');
    onClose();
  };

  return (
    <div className="modal-backdrop-overlay animate-fade-in" onClick={onClose}>
      <div className="new-category-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-header-title">
            <Sparkles size={20} className="text-amber" />
            <h3>Nueva Sección de Gastos</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-modal-close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-cat-form">
          <p className="modal-hint">
            Crea una pestaña personalizada que se integrará con su propia 
            <strong> calculadora</strong>, <strong>escáner de facturas</strong> y que sumará a tu Billetera.
          </p>

          <div className="form-group">
            <label>Nombre de la Sección *</label>
            <input
              type="text"
              placeholder="Ej: Boliches & Discotecas, Escapada a Tigre, Outlets..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Ícono / Temática</label>
            <div className="icon-selector-grid">
              {ICON_OPTIONS.map((ico) => (
                <button
                  key={ico.id}
                  type="button"
                  className={`icon-choice-btn ${selectedIcon === ico.id ? 'active' : ''}`}
                  onClick={() => setSelectedIcon(ico.id)}
                >
                  <span className="choice-emoji">{ico.emoji}</span>
                  <span className="choice-label">{ico.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color Identificador</label>
            <div className="color-selector-row">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  className={`color-choice-dot ${selectedColor === col.hex ? 'active' : ''}`}
                  style={{ backgroundColor: col.hex }}
                  onClick={() => setSelectedColor(col.hex)}
                  title={col.label}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>Crear Sección</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
