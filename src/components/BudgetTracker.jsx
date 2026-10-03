import React, { useState } from 'react';
import { 
  Wallet, DollarSign, ShoppingCart, Utensils, Bus, Ticket, ShoppingBag, 
  Receipt, Plus, Trash2, Home, ArrowRightLeft, PieChart, TrendingUp 
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import { formatCurrencyARS, formatCurrencyUSD } from '../utils/helpers';

export default function BudgetTracker({
  expenses,
  onAddExpense,
  onDeleteExpense,
  exchangeRate,
  onUpdateExchangeRate
}) {
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState('mercado');
  const [newAmount, setNewAmount] = useState('');
  const [newPaidBy, setNewPaidBy] = useState('Yo');
  const [newNote, setNewNote] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Calculations
  const totalARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalUSD = totalARS / (exchangeRate || 1280);

  const mercadoTotalARS = expenses
    .filter(e => e.category === 'mercado')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const gastronomiaTotalARS = expenses
    .filter(e => e.category === 'gastronomia')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const transporteTotalARS = expenses
    .filter(e => e.category === 'transporte')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const planesTotalARS = expenses
    .filter(e => e.category === 'cultura' || e.category === 'compras')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newConcept.trim() || !newAmount) {
      alert('Ingresa el concepto y monto del gasto');
      return;
    }

    const expenseItem = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      concept: newConcept.trim(),
      category: newCategory,
      amountARS: Number(newAmount),
      paidBy: newPaidBy,
      note: newNote.trim()
    };

    onAddExpense(expenseItem);
    setNewConcept('');
    setNewAmount('');
    setNewNote('');
  };

  const filteredExpenses = filterCat === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCat);

  return (
    <div className="budget-tracker-view">
      
      {/* Friendly context banner */}
      <div className="budget-hero-card">
        <div className="budget-hero-icon">
          <Home size={28} className="text-emerald" />
        </div>
        <div className="budget-hero-text">
          <h3>Hospedaje: Casa de mi amiga ($0 ARS)</h3>
          <p>
            ¡Gran ventaja de ahorro! Todo el presupuesto está enfocado en el 
            <strong> mercado para la casa</strong> (abastecer desayunos y meriendas), 
            <strong> salidas a comer</strong>, <strong>transporte (SUBE/Apps)</strong> y <strong>planes</strong>.
          </p>
        </div>

        {/* Currency rate quick adjuster */}
        <div className="exchange-rate-box">
          <label>
            <ArrowRightLeft size={14} />
            <span>Tipo de Cambio Estimado</span>
          </label>
          <div className="rate-input-row">
            <span>1 USD = $</span>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => onUpdateExchangeRate(Number(e.target.value))}
              className="rate-input"
              step="10"
            />
            <span>ARS</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="budget-kpis-grid">
        <div className="kpi-card total-card">
          <div className="kpi-header">
            <span className="kpi-label">Gasto Total Acumulado</span>
            <TrendingUp size={18} className="kpi-icon" />
          </div>
          <div className="kpi-main-value">{formatCurrencyARS(totalARS)}</div>
          <div className="kpi-sub-value">≈ {formatCurrencyUSD(totalARS, exchangeRate)} USD</div>
        </div>

        <div className="kpi-card mercado-card">
          <div className="kpi-header">
            <span className="kpi-label">Mercado para Casa</span>
            <ShoppingCart size={18} className="kpi-icon" />
          </div>
          <div className="kpi-main-value">{formatCurrencyARS(mercadoTotalARS)}</div>
          <div className="kpi-sub-value">≈ {formatCurrencyUSD(mercadoTotalARS, exchangeRate)} USD</div>
        </div>

        <div className="kpi-card gastro-card">
          <div className="kpi-header">
            <span className="kpi-label">Restaurantes & Bares</span>
            <Utensils size={18} className="kpi-icon" />
          </div>
          <div className="kpi-main-value">{formatCurrencyARS(gastronomiaTotalARS)}</div>
          <div className="kpi-sub-value">≈ {formatCurrencyUSD(gastronomiaTotalARS, exchangeRate)} USD</div>
        </div>

        <div className="kpi-card transport-card">
          <div className="kpi-header">
            <span className="kpi-label">Transporte & SUBE</span>
            <Bus size={18} className="kpi-icon" />
          </div>
          <div className="kpi-main-value">{formatCurrencyARS(transporteTotalARS)}</div>
          <div className="kpi-sub-value">≈ {formatCurrencyUSD(transporteTotalARS, exchangeRate)} USD</div>
        </div>
      </div>

      <div className="budget-main-layout">
        
        {/* Left Column: Form to Add New Expense */}
        <div className="budget-form-column">
          <div className="form-card">
            <div className="form-card-title">
              <Plus size={18} />
              <h4>Registrar Nuevo Gasto</h4>
            </div>

            <form onSubmit={handleAddSubmit} className="add-expense-form">
              <div className="form-group">
                <label>Concepto del Gasto *</label>
                <input
                  type="text"
                  placeholder="Ej: Mercado Coto desayunos, Pizza Güerrin..."
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-select"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Monto en Pesos (ARS) *</label>
                  <input
                    type="number"
                    placeholder="Ej: 15000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="form-input"
                    required
                    min="1"
                    step="100"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pagado por</label>
                  <select
                    value={newPaidBy}
                    onChange={(e) => setNewPaidBy(e.target.value)}
                    className="form-select"
                  >
                    <option value="Yo">Yo</option>
                    <option value="Mi Amiga">Mi Amiga</option>
                    <option value="Mitad y Mitad">Compartido (50/50)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nota / Detalle (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Incluyó frutas y queso"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary full-width">
                <Plus size={16} />
                <span>Agregar Gasto</span>
              </button>
            </form>
          </div>

          {/* Category Visual Breakdown */}
          <div className="category-breakdown-card">
            <h4>Distribución por Categorías</h4>
            <div className="breakdown-list">
              {EXPENSE_CATEGORIES.map(cat => {
                const amount = expenses
                  .filter(e => e.category === cat.id)
                  .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
                const pct = totalARS > 0 ? Math.round((amount / totalARS) * 100) : 0;

                return (
                  <div key={cat.id} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="cat-color-dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-amount">{formatCurrencyARS(amount)}</span>
                      <span className="cat-pct">{pct}%</span>
                    </div>
                    <div className="breakdown-bar-track">
                      <div 
                        className="breakdown-bar-fill" 
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: List of Expenses */}
        <div className="budget-list-column">
          <div className="list-card-header">
            <h4>Historial de Gastos ({filteredExpenses.length})</h4>
            <div className="category-filter-chips">
              <button 
                className={`filter-chip ${filterCat === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCat('all')}
              >
                Todos
              </button>
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${filterCat === cat.id ? 'active' : ''}`}
                  onClick={() => setFilterCat(cat.id)}
                >
                  {cat.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="expenses-list">
            {filteredExpenses.length === 0 ? (
              <div className="empty-expenses">
                <Receipt size={36} className="text-muted" />
                <p>No hay gastos registrados en esta categoría.</p>
              </div>
            ) : (
              filteredExpenses.map(exp => {
                const catObj = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[0];

                return (
                  <div key={exp.id} className="expense-item-row">
                    <div className="expense-cat-badge" style={{ backgroundColor: `${catObj.color}20`, color: catObj.color }}>
                      <span className="cat-dot" style={{ backgroundColor: catObj.color }}></span>
                      <span>{catObj.name}</span>
                    </div>

                    <div className="expense-details">
                      <div className="expense-concept">{exp.concept}</div>
                      <div className="expense-meta">
                        <span>{exp.date}</span>
                        <span>• Pagó: <strong>{exp.paidBy}</strong></span>
                        {exp.note && <span>• {exp.note}</span>}
                      </div>
                    </div>

                    <div className="expense-amount-group">
                      <div className="expense-amount-ars">{formatCurrencyARS(exp.amountARS)}</div>
                      <div className="expense-amount-usd">≈ {formatCurrencyUSD(exp.amountARS, exchangeRate)} USD</div>
                    </div>

                    <button 
                      className="btn-delete-expense"
                      onClick={() => onDeleteExpense(exp.id)}
                      title="Eliminar gasto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
