import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, Luggage, Sparkles } from 'lucide-react';

export default function ChecklistView({ checklist, onToggleChecklist, onAddChecklist, onDeleteChecklist }) {
  const [newText, setNewText] = useState('');
  const [newCat, setNewCat] = useState('equipaje');

  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem = {
      id: 'chk-' + Date.now(),
      text: newText.trim(),
      category: newCat,
      completed: false
    };

    onAddChecklist(newItem);
    setNewText('');
  };

  return (
    <div className="checklist-view">
      
      {/* Progress banner */}
      <div className="checklist-progress-card">
        <div className="progress-header">
          <div className="progress-info">
            <Luggage size={24} className="text-sky" />
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

      {/* Add new task/item */}
      <form onSubmit={handleAddSubmit} className="add-checklist-form">
        <input
          type="text"
          placeholder="Ej: Comprar adaptador de enchufe tipo I, tramitar seguro..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="checklist-input"
        />
        <select
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          className="checklist-select"
        >
          <option value="equipaje">Equipaje</option>
          <option value="documentos">Documentos</option>
          <option value="tecnologia">Tecnología</option>
          <option value="dinero">Dinero</option>
          <option value="amiga">Casa de Amiga</option>
          <option value="app">App / Móvil</option>
        </select>
        <button type="submit" className="btn-primary">
          <Plus size={16} />
          <span>Agregar</span>
        </button>
      </form>

      {/* Items List */}
      <div className="checklist-items-grid">
        {checklist.map((item) => (
          <div 
            key={item.id} 
            className={`checklist-item-card ${item.completed ? 'completed' : ''}`}
            onClick={() => onToggleChecklist(item.id)}
          >
            <button className="checklist-checkbox-btn">
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
              <span className="checklist-category-tag">
                {item.category}
              </span>
            </div>

            <button 
              className="btn-delete-check"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChecklist(item.id);
              }}
              title="Eliminar de la lista"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
