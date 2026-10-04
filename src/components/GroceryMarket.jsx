import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Calculator, Plus, Trash2, CheckCircle2, Wallet, 
  Receipt, Sparkles, RefreshCw, Check, ArrowRight, Coins, 
  Coffee, Apple, Utensils, Tag, Info, ShoppingBag, Delete, Equal
} from 'lucide-react';
import { formatCurrencyARS, formatCurrencyUSD, parseCurrencyNumber, cleanCalcExpression } from '../utils/helpers';

// Supermarket & Store Presets in Buenos Aires
const STORE_PRESETS = [
  { id: 'coto', name: 'Coto', badge: '🛒 Hipermercado', color: '#dc2626' },
  { id: 'carrefour', name: 'Carrefour / Express', badge: '🏪 Súper de Barrio', color: '#2563eb' },
  { id: 'dia', name: 'Día %', badge: '🟡 Ofertas & Snacks', color: '#d97706' },
  { id: 'verduleria', name: 'Verdulería de Barrio', badge: '🥦 Frutas & Verduras', color: '#059669' },
  { id: 'carniceria', name: 'Carnicería / Fiambrería', badge: '🥩 Asado & Picadas', color: '#b91c1c' },
  { id: 'panaderia', name: 'Panadería & Facturas', badge: '🥐 Medialunas & Pan', color: '#ea580c' },
  { id: 'chino', name: 'Supermercado Chino', badge: '🏮 Almacén Rápido', color: '#7c3aed' },
  { id: 'otro', name: 'Otro Almacén / Kiosco', badge: '🛍️ Varios', color: '#475569' }
];

// Quick Item Presets commonly bought for eating at home in BA
const QUICK_ITEMS = [
  { name: 'Medialunas / Facturas (docena)', defaultPrice: 4800, icon: '🥐' },
  { name: 'Leche, yogur y manteca', defaultPrice: 3600, icon: '🥛' },
  { name: 'Pan fresco / Tostadas', defaultPrice: 1800, icon: '🥖' },
  { name: 'Queso y jamón para picada', defaultPrice: 7500, icon: '🧀' },
  { name: 'Frutas y verduras frescas', defaultPrice: 5200, icon: '🍎' },
  { name: 'Carne / Milanesas / Pollo', defaultPrice: 13500, icon: '🥩' },
  { name: 'Yerba Mate y café molido', defaultPrice: 4500, icon: '🧉' },
  { name: 'Agua mineral y gaseosas', defaultPrice: 3200, icon: '💧' },
  { name: 'Vino Malbec / Cervezas', defaultPrice: 5800, icon: '🍷' },
  { name: 'Galletitas y snacks', defaultPrice: 2800, icon: '🍪' }
];

// Safe arithmetic evaluator with thousands separator support (e.g. 19.741 -> 19741)
function safeEvaluateExpression(rawExpr) {
  if (!rawExpr || typeof rawExpr !== 'string') return 0;
  let cleaned = cleanCalcExpression(rawExpr);

  // Strip trailing uncompleted operator if present for live calculation
  cleaned = cleaned.replace(/[+\-*/.]+$/, '').trim();
  if (!cleaned) return 0;

  // Strict regex: only allow numbers, spaces, and + - * / . ( )
  if (!/^[\d\s+\-*/.()]+$/.test(cleaned)) {
    return 0;
  }

  try {
    const result = new Function(`'use strict'; return (${cleaned})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return 0;
  } catch {
    return 0;
  }
}

export default function GroceryMarket({
  expenses = [],
  onAddExpense,
  onDeleteExpense,
  exchangeRate = 1280,
  onUpdateExchangeRate
}) {
  const BUDGET_CAP_USD = 1000;

  // Calculator State
  const [calcExpression, setCalcExpression] = useState('');
  const [cartTape, setCartTape] = useState([]); // List of line items or notes accumulated
  const [selectedStore, setSelectedStore] = useState('Coto');
  const [customStoreName, setCustomStoreName] = useState('');
  const [paidBy, setPaidBy] = useState('Yo');
  const [groceryNote, setGroceryNote] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // UI status
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastSavedExpense, setLastSavedExpense] = useState(null);
  const [activeTabMode, setActiveTabMode] = useState('calculator'); // 'calculator' | 'manual'

  // Manual Ticket State
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState('ARS');
  const [manualStore, setManualStore] = useState('Coto');
  const [manualPaidBy, setManualPaidBy] = useState('Yo');
  const [manualNote, setManualNote] = useState('');

  // Total calculated from calculator expression
  const computedLiveAmountARS = safeEvaluateExpression(calcExpression);
  const computedUSDBlue = (computedLiveAmountARS / (exchangeRate || 1280));

  // Filter grocery expenses only
  const groceryExpenses = expenses.filter(e => e.category === 'mercado');
  const totalGroceryARS = groceryExpenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalGroceryUSD = totalGroceryARS / (exchangeRate || 1280);

  // Global wallet totals
  const totalAllExpensesARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalAllExpensesUSD = totalAllExpensesARS / (exchangeRate || 1280);
  const remainingWalletUSD = Math.max(0, BUDGET_CAP_USD - totalAllExpensesUSD);

  // Calculator input handlers
  const handleKeyClick = (val) => {
    if (val === 'C') {
      setCalcExpression('');
      return;
    }
    if (val === 'DEL') {
      setCalcExpression(prev => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      const evaluated = safeEvaluateExpression(calcExpression);
      if (evaluated > 0) {
        setCalcExpression(evaluated.toString());
      }
      return;
    }

    // Don't allow multiple consecutive operators
    const isOperator = ['+', '-', '×', '÷'].includes(val);
    const lastChar = calcExpression.slice(-1);
    const lastCharIsOperator = ['+', '-', '×', '÷'].includes(lastChar);

    if (isOperator && lastCharIsOperator) {
      // Replace previous operator
      setCalcExpression(prev => prev.slice(0, -1) + val);
      return;
    }

    setCalcExpression(prev => prev + val);
  };

  // Keyboard support for typing in calculator
  const calcContainerRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If user is focused on an input text field, don't capture
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === '+') {
        e.preventDefault();
        handleKeyClick('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleKeyClick('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleKeyClick('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleKeyClick('÷');
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleKeyClick('.');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleKeyClick('=');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyClick('DEL');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleKeyClick('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calcExpression]);

  // Quick preset item click (adds to formula)
  const handleAddQuickItem = (item) => {
    const priceStr = item.defaultPrice.toString();
    setCalcExpression(prev => {
      if (!prev || prev === '0') return priceStr;
      const lastChar = prev.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        return prev + priceStr;
      }
      return `${prev} + ${priceStr}`;
    });

    // Also record in the shopping cart tape
    setCartTape(prev => [
      ...prev,
      { id: Date.now() + Math.random(), name: item.name, price: item.defaultPrice, icon: item.icon }
    ]);
  };

  const handleRemoveTapeItem = (id) => {
    setCartTape(prev => prev.filter(item => item.id !== id));
  };

  // APPROVE & INCLUDE IN WALLET
  const handleApproveAndSave = (e) => {
    if (e) e.preventDefault();

    const finalAmountARS = Math.round(computedLiveAmountARS);

    if (finalAmountARS <= 0) {
      alert('Ingresa una operación o monto válido mayor a $0');
      return;
    }

    const storeLabel = selectedStore === 'Otro' ? (customStoreName || 'Almacén de Barrio') : selectedStore;
    const itemsSummary = cartTape.length > 0 ? ` [${cartTape.map(i => i.name.split(' ')[0]).join(', ')}]` : '';
    const fullNote = groceryNote ? `${groceryNote}${itemsSummary}` : (itemsSummary ? `Items:${itemsSummary}` : 'Compra en supermercado');

    const newExpense = {
      id: 'exp-' + Date.now(),
      date: purchaseDate,
      concept: `Mercado: ${storeLabel}`,
      category: 'mercado',
      amountARS: finalAmountARS,
      paidBy: paidBy,
      note: fullNote
    };

    onAddExpense(newExpense);

    // Save for toast and reset
    setLastSavedExpense(newExpense);
    setShowSuccessToast(true);
    setCalcExpression('');
    setCartTape([]);
    setGroceryNote('');

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  // Manual ticket submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const rawVal = parseCurrencyNumber(manualAmount) || 0;
    if (rawVal <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    const amountARS = manualCurrency === 'ARS' ? rawVal : Math.round(rawVal * (exchangeRate || 1280));
    const storeLabel = manualStore;

    const newExpense = {
      id: 'exp-' + Date.now(),
      date: purchaseDate,
      concept: `Mercado: ${storeLabel}`,
      category: 'mercado',
      amountARS: amountARS,
      paidBy: manualPaidBy,
      note: manualNote.trim() || 'Ticket de supermercado'
    };

    onAddExpense(newExpense);
    setLastSavedExpense(newExpense);
    setShowSuccessToast(true);
    setManualAmount('');
    setManualNote('');

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  return (
    <div className="grocery-market-view" ref={calcContainerRef}>
      
      {/* ====================================================================
          HERO BANNER & FOOD MARKET OVERVIEW
          ==================================================================== */}
      <div className="grocery-hero-card">
        <div className="grocery-hero-content">
          <div className="grocery-avatar-badge">
            <ShoppingCart size={28} className="text-emerald" />
          </div>
          <div className="grocery-hero-titles">
            <div className="grocery-tags-row">
              <span className="grocery-section-badge">Alimentos & Casa</span>
              <span className="grocery-wallet-status-badge">
                <Wallet size={13} />
                <span>Se suma a la Billetera ($1.000 USD Blue)</span>
              </span>
            </div>
            <h2>Mercado de Alimentos & Supermercado</h2>
            <p className="grocery-subtitle">
              Calcula y registra los gastos de comida para la estadía en casa de tu amiga (Coto, Carrefour, Día, verdulerías).
              Utiliza la calculadora interactiva para sumar el changuito en el súper y apruébalo directamente.
            </p>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grocery-metrics-grid">
          <div className="grocery-metric-pill">
            <span className="metric-pill-label">Total en Mercado</span>
            <div className="metric-pill-vals">
              <span className="metric-usd">${totalGroceryUSD.toFixed(1)} <small>USD Blue</small></span>
              <span className="metric-ars">({formatCurrencyARS(totalGroceryARS)})</span>
            </div>
          </div>

          <div className="grocery-metric-pill">
            <span className="metric-pill-label">Compras Realizadas</span>
            <div className="metric-pill-vals">
              <span className="metric-count">{groceryExpenses.length} <small>tickets</small></span>
              <span className="metric-sub">en la estadía</span>
            </div>
          </div>

          <div className="grocery-metric-pill highlight-wallet">
            <span className="metric-pill-label">Disponible Billetera</span>
            <div className="metric-pill-vals">
              <span className="metric-usd text-emerald">${Math.round(remainingWalletUSD)} <small>USD Blue</small></span>
              <span className="metric-sub">de $1.000 USD tope</span>
            </div>
          </div>

          <div className="grocery-metric-pill">
            <span className="metric-pill-label">Dólar Blue Hoy</span>
            <div className="metric-pill-vals">
              <span className="metric-rate">1 USD = ${exchangeRate} ARS</span>
              <span className="metric-sub">conversión automática</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Success Toast when Expense is Approved */}
      {showSuccessToast && lastSavedExpense && (
        <div className="grocery-success-toast animate-slide-in">
          <div className="toast-icon-check">
            <Check size={20} />
          </div>
          <div className="toast-text">
            <strong>¡Gasto de mercado aprobado e ingresado a la Billetera!</strong>
            <span>
              {lastSavedExpense.concept}: <strong>{formatCurrencyARS(lastSavedExpense.amountARS)}</strong> 
              {' '}(≈ ${(lastSavedExpense.amountARS / exchangeRate).toFixed(1)} USD Blue)
            </span>
          </div>
        </div>
      )}

      {/* Mode Selector (Calculator vs Manual Ticket) */}
      <div className="grocery-mode-tabs">
        <button
          type="button"
          className={`mode-tab-btn ${activeTabMode === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTabMode('calculator')}
        >
          <Calculator size={18} />
          <span>Calculadora del Changuito / Súper</span>
        </button>

        <button
          type="button"
          className={`mode-tab-btn ${activeTabMode === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTabMode('manual')}
        >
          <Receipt size={18} />
          <span>Ingreso Directo de Ticket / Boleta</span>
        </button>
      </div>

      {/* ====================================================================
          MAIN 2-COLUMN LAYOUT: CALCULATOR / FORM & EXPENSES HISTORY
          ==================================================================== */}
      <div className="grocery-main-columns">
        
        {/* ======================= LEFT COLUMN: CALCULATOR & APPROVAL ======================= */}
        <div className="grocery-tool-column">
          
          {activeTabMode === 'calculator' ? (
            <div className="calculator-box-card">
              
              <div className="calc-card-header">
                <div className="calc-header-title">
                  <Calculator size={20} className="text-emerald" />
                  <h4>Calculadora de Compras</h4>
                </div>
                <span className="calc-helper-tag">
                  Suma precios en pesos mientras recorres el supermercado
                </span>
              </div>

              {/* Calculator Screen / Display */}
              <div className="calc-screen">
                <div className="calc-formula-line">
                  {calcExpression || '0'}
                </div>

                <div className="calc-main-result-row">
                  <div className="calc-ars-total">
                    <span className="ars-symbol">$</span>
                    <span className="ars-value">
                      {computedLiveAmountARS > 0 
                        ? Number(computedLiveAmountARS.toFixed(2)).toLocaleString('es-AR') 
                        : '0'}
                    </span>
                    <span className="ars-badge">ARS</span>
                  </div>

                  <div className="calc-usd-conversion-tag">
                    <span>≈ ${computedUSDBlue.toFixed(2)} USD Blue</span>
                  </div>
                </div>

                {computedLiveAmountARS > 0 && (
                  <div className="calc-budget-impact">
                    <Wallet size={12} />
                    <span>
                      Representa el {((computedUSDBlue / BUDGET_CAP_USD) * 100).toFixed(1)}% de tu tope total de $1.000 USD
                    </span>
                  </div>
                )}
              </div>

              {/* Keypad */}
              <div className="calc-keypad-grid">
                <button type="button" onClick={() => handleKeyClick('C')} className="calc-btn btn-clear">C</button>
                <button type="button" onClick={() => handleKeyClick('DEL')} className="calc-btn btn-del" title="Borrar último dígito">
                  <Delete size={17} />
                </button>
                <button type="button" onClick={() => handleKeyClick('(')} className="calc-btn btn-op">(</button>
                <button type="button" onClick={() => handleKeyClick(')')} className="calc-btn btn-op">)</button>

                <button type="button" onClick={() => handleKeyClick('7')} className="calc-btn btn-num">7</button>
                <button type="button" onClick={() => handleKeyClick('8')} className="calc-btn btn-num">8</button>
                <button type="button" onClick={() => handleKeyClick('9')} className="calc-btn btn-num">9</button>
                <button type="button" onClick={() => handleKeyClick('÷')} className="calc-btn btn-op">÷</button>

                <button type="button" onClick={() => handleKeyClick('4')} className="calc-btn btn-num">4</button>
                <button type="button" onClick={() => handleKeyClick('5')} className="calc-btn btn-num">5</button>
                <button type="button" onClick={() => handleKeyClick('6')} className="calc-btn btn-num">6</button>
                <button type="button" onClick={() => handleKeyClick('×')} className="calc-btn btn-op">×</button>

                <button type="button" onClick={() => handleKeyClick('1')} className="calc-btn btn-num">1</button>
                <button type="button" onClick={() => handleKeyClick('2')} className="calc-btn btn-num">2</button>
                <button type="button" onClick={() => handleKeyClick('3')} className="calc-btn btn-num">3</button>
                <button type="button" onClick={() => handleKeyClick('-')} className="calc-btn btn-op">-</button>

                <button type="button" onClick={() => handleKeyClick('0')} className="calc-btn btn-num">0</button>
                <button type="button" onClick={() => handleKeyClick('00')} className="calc-btn btn-num">00</button>
                <button type="button" onClick={() => handleKeyClick('.')} className="calc-btn btn-num">.</button>
                <button type="button" onClick={() => handleKeyClick('+')} className="calc-btn btn-op">+</button>
              </div>

              {/* Equals Button */}
              <div className="calc-equal-row">
                <button 
                  type="button" 
                  onClick={() => handleKeyClick('=')} 
                  className="calc-btn btn-equals"
                >
                  <Equal size={18} />
                  <span>Calcular Total</span>
                </button>
              </div>

              {/* Quick Presets for Argentine Food Items */}
              <div className="quick-presets-section">
                <div className="quick-presets-label">
                  <Sparkles size={14} className="text-amber" />
                  <span>Suma rápida de productos habituales en BA:</span>
                </div>
                <div className="quick-presets-chips">
                  {QUICK_ITEMS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-item-chip"
                      onClick={() => handleAddQuickItem(item)}
                      title={`Sumar ${formatCurrencyARS(item.defaultPrice)} a la cuenta`}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">+${(item.defaultPrice / 1000).toFixed(1)}k</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Tape (Running list of items accumulated) */}
              {cartTape.length > 0 && (
                <div className="cart-tape-box">
                  <div className="tape-header">
                    <span>🛒 Items añadidos al changuito ({cartTape.length}):</span>
                    <button type="button" onClick={() => setCartTape([])} className="btn-clear-tape">Limpiar lista</button>
                  </div>
                  <div className="tape-items-list">
                    {cartTape.map(it => (
                      <div key={it.id} className="tape-item-row">
                        <span>{it.icon} {it.name}</span>
                        <strong>{formatCurrencyARS(it.price)}</strong>
                        <button type="button" onClick={() => handleRemoveTapeItem(it.id)} className="btn-remove-tape">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* APPROVAL & INCLUSION IN WALLET PANEL */}
              <div className="calc-approval-panel">
                <div className="approval-title-row">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <h5>Aprobar y Sumar a la Billetera</h5>
                </div>

                <div className="approval-form-grid">
                  {/* Supermarket selector */}
                  <div className="approval-field">
                    <label>Comercio / Supermercado</label>
                    <div className="store-chips-row">
                      {STORE_PRESETS.map(st => (
                        <button
                          key={st.id}
                          type="button"
                          className={`store-chip ${selectedStore === st.name ? 'active' : ''}`}
                          onClick={() => setSelectedStore(st.name)}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                    {selectedStore === 'Otro' && (
                      <input
                        type="text"
                        placeholder="Nombre del comercio o feria..."
                        value={customStoreName}
                        onChange={(e) => setCustomStoreName(e.target.value)}
                        className="form-input custom-store-input"
                      />
                    )}
                  </div>

                  <div className="approval-row-two-col">
                    {/* Paid By */}
                    <div className="approval-field">
                      <label>¿Quién pagó?</label>
                      <select 
                        value={paidBy} 
                        onChange={(e) => setPaidBy(e.target.value)}
                        className="form-select"
                      >
                        <option value="Yo">Yo</option>
                        <option value="Mi Amiga">Mi Amiga</option>
                        <option value="Compartido">Compartido (50/50)</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div className="approval-field">
                      <label>Fecha de la compra</label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Note / Detail */}
                  <div className="approval-field">
                    <label>Nota / Detalle (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Desayunos de la semana, frutas y carne para asado..."
                      value={groceryNote}
                      onChange={(e) => setGroceryNote(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* THE MAIN ACTION BUTTON */}
                <button
                  type="button"
                  onClick={handleApproveAndSave}
                  disabled={computedLiveAmountARS <= 0}
                  className={`btn-approve-grocery ${computedLiveAmountARS > 0 ? 'ready' : 'disabled'}`}
                >
                  <Check size={20} />
                  <span>
                    Aprobar e Incluir en Billetera (
                    {computedLiveAmountARS > 0 ? formatCurrencyARS(computedLiveAmountARS) : '$0 ARS'}
                    {' '}• ${(computedUSDBlue).toFixed(1)} USD Blue)
                  </span>
                </button>
              </div>

            </div>
          ) : (
            /* MANUAL TICKET ENTRY FORM */
            <div className="calculator-box-card">
              <div className="calc-card-header">
                <div className="calc-header-title">
                  <Receipt size={20} className="text-emerald" />
                  <h4>Ingreso Directo con Ticket de Compra</h4>
                </div>
                <span className="calc-helper-tag">
                  Si ya tienes el ticket de la caja, ingresa el total directamente
                </span>
              </div>

              <form onSubmit={handleManualSubmit} className="manual-grocery-form">
                
                <div className="form-group">
                  <label>Comercio / Supermercado *</label>
                  <div className="store-chips-row">
                    {STORE_PRESETS.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        className={`store-chip ${manualStore === st.name ? 'active' : ''}`}
                        onClick={() => setManualStore(st.name)}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <div className="currency-selector-label-row">
                    <label>Monto del Ticket *</label>
                    <div className="currency-toggle-chips">
                      <button
                        type="button"
                        className={`curr-btn ${manualCurrency === 'ARS' ? 'active' : ''}`}
                        onClick={() => setManualCurrency('ARS')}
                      >
                        En Pesos (ARS)
                      </button>
                      <button
                        type="button"
                        className={`curr-btn ${manualCurrency === 'USD' ? 'active' : ''}`}
                        onClick={() => setManualCurrency('USD')}
                      >
                        En Dólares (USD Blue)
                      </button>
                    </div>
                  </div>

                  <div className="currency-input-wrapper">
                    <span className="curr-symbol">{manualCurrency === 'ARS' ? '$ ARS' : '$ USD'}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={manualCurrency === 'ARS' ? "Ej: 19.741" : "Ej: 19"}
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  {manualAmount && (
                    <div className="conversion-preview-box">
                      <span>Conversión simultánea:</span>
                      <strong>
                        {manualCurrency === 'ARS' 
                          ? `${formatCurrencyARS(parseCurrencyNumber(manualAmount))} = $${(parseCurrencyNumber(manualAmount) / exchangeRate).toFixed(1)} USD Blue`
                          : `$${manualAmount} USD = ${formatCurrencyARS(parseCurrencyNumber(manualAmount) * exchangeRate)}`}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>¿Quién pagó?</label>
                    <select
                      value={manualPaidBy}
                      onChange={(e) => setManualPaidBy(e.target.value)}
                      className="form-select"
                    >
                      <option value="Yo">Yo</option>
                      <option value="Mi Amiga">Mi Amiga</option>
                      <option value="Compartido">Compartido (50/50)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Detalle / Nota</label>
                  <input
                    type="text"
                    placeholder="Ej: Despensa inicial, carnes y bebidas"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn-approve-grocery ready">
                  <Check size={18} />
                  <span>Aprobar e Incluir en Billetera</span>
                </button>
              </form>

            </div>
          )}

          {/* Practical Supermarket Tips for Buenos Aires */}
          <div className="grocery-tips-box">
            <div className="tips-box-header">
              <Info size={16} className="text-sky" />
              <strong>Tips para hacer mercado en Buenos Aires:</strong>
            </div>
            <ul className="tips-list">
              <li><strong>Coto:</strong> El hipermercado más grande. Miércoles y jueves suelen tener 15-20% de descuento con ciertas tarjetas.</li>
              <li><strong>Verdulerías de barrio:</strong> Atienden por kilo con precios en tiza; son 30% a 40% más económicas y frescas que los hipermercados.</li>
              <li><strong>Carrefour Express:</strong> Hay uno en cada 2-3 cuadras en Palermo y Recoleta, ideal para compras rápidas de leche, agua y snacks.</li>
              <li><strong>Bolsas reutilizables:</strong> Los súper cobran cada bolsa de plástico en caja; acostumbra llevar tu propia bolsa o mochila.</li>
            </ul>
          </div>

        </div>

        {/* ======================= RIGHT COLUMN: DEDICATED GROCERY EXPENSES HISTORY ======================= */}
        <div className="grocery-history-column">
          
          <div className="grocery-history-card">
            
            <div className="history-card-header">
              <div>
                <h4>Historial de Compras de Mercado</h4>
                <p className="history-subtitle">
                  Gastos registrados exclusivamente en alimentos y supermercados ({groceryExpenses.length})
                </p>
              </div>

              <div className="history-total-badge">
                <span className="badge-usd">${totalGroceryUSD.toFixed(1)} USD Blue</span>
                <span className="badge-ars">{formatCurrencyARS(totalGroceryARS)}</span>
              </div>
            </div>

            {/* List of Grocery Expenses */}
            <div className="grocery-expenses-list">
              {groceryExpenses.length === 0 ? (
                <div className="empty-grocery-state">
                  <ShoppingCart size={40} className="text-muted" />
                  <h5>Aún no hay compras de mercado registradas</h5>
                  <p>
                    Usa la calculadora a la izquierda para sumar lo que vayas metiendo al changuito en el súper,
                    o ingresa tu primer ticket y pulsa <strong>"Aprobar e Incluir en Billetera"</strong>.
                  </p>
                </div>
              ) : (
                groceryExpenses.map(exp => {
                  const expUSD = (Number(exp.amountARS) || 0) / exchangeRate;

                  return (
                    <div key={exp.id} className="grocery-expense-item">
                      <div className="expense-cart-icon">
                        <ShoppingCart size={18} />
                      </div>

                      <div className="expense-main-info">
                        <div className="expense-concept-row">
                          <span className="concept-title">{exp.concept}</span>
                          <span className="paid-by-pill">Pagó: {exp.paidBy}</span>
                        </div>

                        <div className="expense-meta-row">
                          <span className="meta-date">{exp.date}</span>
                          {exp.note && <span className="meta-note">• {exp.note}</span>}
                        </div>
                      </div>

                      <div className="expense-amounts-box">
                        <span className="amount-usd">${expUSD.toFixed(1)} <small>USD</small></span>
                        <span className="amount-ars">{formatCurrencyARS(exp.amountARS)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar gasto "${exp.concept}" de ${formatCurrencyARS(exp.amountARS)}? Se restará de la billetera.`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="btn-trash-grocery"
                        title="Eliminar este gasto de mercado"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* History Footer Summary */}
            {groceryExpenses.length > 0 && (
              <div className="history-footer-summary">
                <span>Total acumulado en Mercado:</span>
                <div className="footer-dual-totals">
                  <strong>${totalGroceryUSD.toFixed(1)} USD Blue</strong>
                  <span>({formatCurrencyARS(totalGroceryARS)})</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
