import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, Sparkles } from 'lucide-react';
import { formatCurrencyARS, parseCurrencyNumber } from '../utils/helpers';

export default function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  categories = [],
  exchangeRate = 1540,
  onSave
}) {
  const [concept, setConcept] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState('mercado');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [note, setNote] = useState('');

  const safeRate = (Number(exchangeRate) && Number(exchangeRate) >= 100) ? Number(exchangeRate) : 1540;

  useEffect(() => {
    if (expense) {
      setConcept(expense.concept || '');
      setAmountInput(expense.amountARS ? expense.amountARS.toString() : '0');
      setCategory(expense.category || 'mercado');
      const method = expense.paymentMethod || (
        (expense.paidBy?.toLowerCase() === 'tarjeta' || expense.note?.toLowerCase().includes('tarjeta')) ? 'tarjeta' : 'efectivo'
      );
      setPaymentMethod(method);
      setNote(expense.note || '');
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const parsedAmountARS = parseCurrencyNumber(amountInput);
  const liveUSD = parsedAmountARS / safeRate;
  const isItinerary = Boolean(expense.isFromItinerary);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!concept.trim()) {
      alert('Ingresa un concepto o título válido.');
      return;
    }

    const updated = {
      ...expense,
      concept: concept.trim(),
      amountARS: Math.max(0, parsedAmountARS),
      category: category,
      paymentMethod: paymentMethod,
      paidBy: paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
      note: note.trim()
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container edit-expense-modal-box" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <ArrowRightLeft size={18} />
            </span>
            <div>
              <span className={`modal-type-chip ${isItinerary ? 'itinerary-chip' : 'direct-chip'}`}>
                {isItinerary ? `📅 Plan Itinerario · Día ${expense.dayNumber || 1}` : '🏷️ Gasto Registrado'}
              </span>
              <h3>{isItinerary ? 'Editar Precio de Actividad' : 'Editar Gasto'}</h3>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Sincronización espejo aviso */}
          {isItinerary && (
            <div className="modal-mirror-sync-hint">
              <ArrowRightLeft size={16} className="hint-icon" />
              <div>
                <strong>Sincronización espejo con el itinerario:</strong>
                <p>
                  Al cambiar este precio, se actualizará en tiempo real en la tarjeta del <strong>Día {expense.dayNumber}</strong> de tu itinerario y en la billetera.
                </p>
              </div>
            </div>
          )}

          {/* Nombre / Concepto */}
          <div className="form-group">
            <label>{isItinerary ? 'Nombre de la Actividad' : 'Concepto del Gasto'}</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Almuerzo en San Telmo"
              className="form-input"
              required
            />
          </div>

          {/* Monto en ARS */}
          <div className="form-group">
            <div className="label-with-rate-row">
              <label>Monto a cobrar en Pesos Argentinos (ARS)</label>
              <span className="live-rate-sub-tag">1 USD = ${safeRate} ARS</span>
            </div>

            <div className="modal-currency-input-box">
              <span className="modal-currency-prefix">ARS $</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="17500"
                className="form-input modal-ars-input"
                required
                autoFocus
              />
            </div>

            <div className="modal-conversion-preview">
              <span>Descuenta de tu efectivo:</span>
              <strong className="preview-usd">≈ ${liveUSD.toFixed(1)} USD Blue</strong>
              <span className="preview-ars">({formatCurrencyARS(parsedAmountARS)})</span>
            </div>
          </div>

          {/* Categoría y Pagado por (si no es itinerario) */}
          {!isItinerary && (
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: paymentMethod === 'efectivo' ? '2px solid #10b981' : '1px solid #334155',
                      background: paymentMethod === 'efectivo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      color: paymentMethod === 'efectivo' ? '#34d399' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: paymentMethod === 'tarjeta' ? '2px solid #3b82f6' : '1px solid #334155',
                      background: paymentMethod === 'tarjeta' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      color: paymentMethod === 'tarjeta' ? '#60a5fa' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    💳 Tarjeta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nota opcional */}
          <div className="form-group">
            <label>Nota / Detalle (Opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Incluyó propina del 10%"
              className="form-input"
            />
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Guardar y Sincronizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
