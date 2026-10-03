import React, { useState } from 'react';
import { 
  Wallet, DollarSign, ShoppingCart, Utensils, Bus, Ticket, ShoppingBag, 
  Receipt, Plus, Trash2, Home, ArrowRightLeft, PieChart, TrendingUp, AlertTriangle, CheckCircle2, Sparkles 
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import { formatCurrencyARS, formatCurrencyUSD, convertUsdToArs } from '../utils/helpers';

export default function BudgetTracker({
  expenses,
  onAddExpense,
  onDeleteExpense,
  exchangeRate = 1280,
  onUpdateExchangeRate
}) {
  const BUDGET_CAP_USD = 1000; // Tope máximo del usuario

  // Input states
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState('mercado');
  const [inputCurrency, setInputCurrency] = useState('ARS'); // 'ARS' or 'USD'
  const [rawAmount, setRawAmount] = useState('');
  const [newPaidBy, setNewPaidBy] = useState('Yo');
  const [newNote, setNewNote] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Calculations
  const totalARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalUSD = totalARS / (exchangeRate || 1280);
  const remainingUSD = Math.max(0, BUDGET_CAP_USD - totalUSD);
  const remainingARS = remainingUSD * (exchangeRate || 1280);
  const percentUsed = Math.min(100, Math.round((totalUSD / BUDGET_CAP_USD) * 100));

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

  // Computed values for the add expense form
  const computedARS = inputCurrency === 'ARS' 
    ? Number(rawAmount) || 0 
    : convertUsdToArs(Number(rawAmount) || 0, exchangeRate);

  const computedUSD = inputCurrency === 'USD'
    ? Number(rawAmount) || 0
    : (Number(rawAmount) || 0) / (exchangeRate || 1280);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newConcept.trim() || !rawAmount || computedARS <= 0) {
      alert('Ingresa el concepto y un monto válido');
      return;
    }

    const expenseItem = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      concept: newConcept.trim(),
      category: newCategory,
      amountARS: Math.round(computedARS),
      paidBy: newPaidBy,
      note: newNote.trim()
    };

    onAddExpense(expenseItem);
    setNewConcept('');
    setRawAmount('');
    setNewNote('');
  };

  const filteredExpenses = filterCat === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCat);

  // Status badge logic for the $1,000 USD cap
  const getStatusBadge = () => {
    if (percentUsed >= 90) {
      return {
        label: "¡Atención! Cerca del tope de $1.000 USD",
        class: "danger",
        icon: AlertTriangle
      };
    }
    if (percentUsed >= 70) {
      return {
        label: "Gastado más del 70% del presupuesto",
        class: "warning",
        icon: AlertTriangle
      };
    }
    return {
      label: "¡Ritmo excelente! Por debajo del tope",
      class: "healthy",
      icon: CheckCircle2
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className="budget-tracker-view">
      
      {/* ====================================================================
          BILLETERA HERO CARD ($1,000 USD CAP & DUAL CURRENCIES)
          ==================================================================== */}
      <div className={`budget-cap-hero-card ${status.class}`}>
        
        <div className="budget-cap-top-row">
          <div className="wallet-brand-group">
            <div className="wallet-avatar-badge">
              <Wallet size={26} className="wallet-main-icon" />
            </div>
            <div>
              <div className="wallet-title-row">
                <h3>Billetera del Viaje (Tope $1.000 USD Blue)</h3>
                <span className={`wallet-status-chip ${status.class}`}>
                  <StatusIcon size={14} />
                  <span>{status.label}</span>
                </span>
              </div>
              <p className="wallet-subtitle">
                Hospedaje en casa de tu amiga ($0). Todos los gastos se muestran simultáneamente en 
                <strong> Dólares Blue (USD)</strong> y en <strong>Pesos Argentinos (ARS)</strong>.
              </p>
            </div>
          </div>

          {/* Dólar Blue Rate Adjuster */}
          <div className="blue-rate-card">
            <div className="blue-rate-header">
              <ArrowRightLeft size={14} className="text-amber" />
              <span>Cotización Dólar Blue</span>
            </div>
            <div className="blue-rate-input-row">
              <span className="rate-prefix">1 USD = $</span>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => onUpdateExchangeRate(Number(e.target.value))}
                className="blue-rate-field"
                step="10"
              />
              <span className="rate-suffix">ARS</span>
            </div>
            <div className="rate-preset-chips">
              <button onClick={() => onUpdateExchangeRate(1250)} className="preset-btn">1250</button>
              <button onClick={() => onUpdateExchangeRate(1280)} className="preset-btn">1280</button>
              <button onClick={() => onUpdateExchangeRate(1320)} className="preset-btn">1320</button>
              <button onClick={() => onUpdateExchangeRate(1350)} className="preset-btn">1350</button>
            </div>
          </div>
        </div>

        {/* Progress Bar towards $1,000 USD */}
        <div className="budget-cap-progress-section">
          <div className="progress-labels-row">
            <div className="progress-left-label">
              <span>Gastado acumulado:</span>
              <strong className="spent-val">${Math.round(totalUSD)} USD Blue</strong>
              <span className="spent-ars-sub">({formatCurrencyARS(totalARS)})</span>
            </div>
            <div className="progress-center-pct">
              <span>{percentUsed}% del tope</span>
            </div>
            <div className="progress-right-label">
              <span>Disponible restante:</span>
              <strong className="remaining-val">${Math.round(remainingUSD)} USD Blue</strong>
              <span className="remaining-ars-sub">({formatCurrencyARS(remainingARS)})</span>
            </div>
          </div>

          <div className="wallet-progress-track">
            <div 
              className={`wallet-progress-bar ${status.class}`}
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          KPI CARDS (DUAL CURRENCY ON EACH METRIC)
          ==================================================================== */}
      <div className="budget-kpis-grid">
        
        <div className="kpi-card total-card">
          <div className="kpi-header">
            <span className="kpi-label">Gasto Total Acumulado</span>
            <TrendingUp size={18} className="kpi-icon" />
          </div>
          <div className="kpi-dual-values">
            <div className="kpi-usd-highlight">${totalUSD.toFixed(1)} <small>USD Blue</small></div>
            <div className="kpi-ars-sub">{formatCurrencyARS(totalARS)}</div>
          </div>
        </div>

        <div className="kpi-card mercado-card">
          <div className="kpi-header">
            <span className="kpi-label">Mercado para Casa</span>
            <ShoppingCart size={18} className="kpi-icon" />
          </div>
          <div className="kpi-dual-values">
            <div className="kpi-usd-highlight">${(mercadoTotalARS / exchangeRate).toFixed(1)} <small>USD Blue</small></div>
            <div className="kpi-ars-sub">{formatCurrencyARS(mercadoTotalARS)}</div>
          </div>
        </div>

        <div className="kpi-card gastro-card">
          <div className="kpi-header">
            <span className="kpi-label">Restaurantes & Bares</span>
            <Utensils size={18} className="kpi-icon" />
          </div>
          <div className="kpi-dual-values">
            <div className="kpi-usd-highlight">${(gastronomiaTotalARS / exchangeRate).toFixed(1)} <small>USD Blue</small></div>
            <div className="kpi-ars-sub">{formatCurrencyARS(gastronomiaTotalARS)}</div>
          </div>
        </div>

        <div className="kpi-card transport-card">
          <div className="kpi-header">
            <span className="kpi-label">Transporte & SUBE</span>
            <Bus size={18} className="kpi-icon" />
          </div>
          <div className="kpi-dual-values">
            <div className="kpi-usd-highlight">${(transporteTotalARS / exchangeRate).toFixed(1)} <small>USD Blue</small></div>
            <div className="kpi-ars-sub">{formatCurrencyARS(transporteTotalARS)}</div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          MAIN LAYOUT: ADD EXPENSE FORM & EXPENSES LIST
          ==================================================================== */}
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
                  placeholder="Ej: Mercado Coto desayunos, Cena Don Julio..."
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Currency Selector (ARS or USD) */}
              <div className="form-group">
                <div className="currency-selector-label-row">
                  <label>Monto a Registrar *</label>
                  <div className="currency-toggle-chips">
                    <button
                      type="button"
                      className={`curr-btn ${inputCurrency === 'ARS' ? 'active' : ''}`}
                      onClick={() => setInputCurrency('ARS')}
                    >
                      En Pesos (ARS)
                    </button>
                    <button
                      type="button"
                      className={`curr-btn ${inputCurrency === 'USD' ? 'active' : ''}`}
                      onClick={() => setInputCurrency('USD')}
                    >
                      En Dólares (USD Blue)
                    </button>
                  </div>
                </div>

                <div className="currency-input-wrapper">
                  <span className="curr-symbol">{inputCurrency === 'ARS' ? '$ ARS' : '$ USD'}</span>
                  <input
                    type="number"
                    placeholder={inputCurrency === 'ARS' ? "Ej: 15000" : "Ej: 12"}
                    value={rawAmount}
                    onChange={(e) => setRawAmount(e.target.value)}
                    className="form-input"
                    required
                    min="1"
                    step={inputCurrency === 'ARS' ? "100" : "0.5"}
                  />
                </div>

                {/* Live Simultaneous Conversion Preview */}
                {rawAmount && (
                  <div className="conversion-preview-box">
                    <span>Equivalente simultáneo:</span>
                    <strong>{formatCurrencyARS(computedARS)} ARS</strong>
                    <span>=</span>
                    <strong>${computedUSD.toFixed(1)} USD Blue</strong>
                  </div>
                )}
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
                  <label>Pagado por</label>
                  <select
                    value={newPaidBy}
                    onChange={(e) => setNewPaidBy(e.target.value)}
                    className="form-select"
                  >
                    <option value="Yo">Yo</option>
                    <option value="Mi Amiga">Mi Amiga</option>
                    <option value="Compartido">Compartido (50/50)</option>
                  </select>
                </div>
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

              <button type="submit" className="btn-primary full-width">
                <Plus size={16} />
                <span>Agregar a la Billetera</span>
              </button>
            </form>
          </div>

          {/* Category Visual Breakdown */}
          <div className="category-breakdown-card">
            <h4>Distribución de Gastos</h4>
            <div className="breakdown-list">
              {EXPENSE_CATEGORIES.map(cat => {
                const amount = expenses
                  .filter(e => e.category === cat.id)
                  .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
                const pct = totalARS > 0 ? Math.round((amount / totalARS) * 100) : 0;
                const usdCat = amount / exchangeRate;

                return (
                  <div key={cat.id} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="cat-color-dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="cat-name">{cat.name}</span>
                      <div className="cat-amounts-dual">
                        <span className="cat-amount-usd">${usdCat.toFixed(1)} USD</span>
                        <span className="cat-amount-ars">({formatCurrencyARS(amount)})</span>
                      </div>
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

        {/* Right Column: List of Expenses with Dual Currency on every item */}
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
                const expUSD = (Number(exp.amountARS) || 0) / exchangeRate;

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

                    {/* Dual Currency Amount Display */}
                    <div className="expense-amount-group">
                      <div className="expense-amount-usd-badge">
                        ${expUSD.toFixed(1)} <small>USD Blue</small>
                      </div>
                      <div className="expense-amount-ars-badge">
                        {formatCurrencyARS(exp.amountARS)}
                      </div>
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
