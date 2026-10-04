import React, { useState } from 'react';
import { 
  Calculator, Camera, Receipt, Plus, Trash2, Wallet, 
  CheckCircle2, Sparkles, Check, Delete, Equal, Tag, Eye, Edit3
} from 'lucide-react';
import ReceiptScanner from './ReceiptScanner';
import { formatCurrencyARS, formatCurrencyUSD, parseCurrencyNumber, cleanCalcExpression } from '../utils/helpers';

// Presets by category
const CATEGORY_PRESETS = {
  mercado: [
    { name: 'Medialunas / Facturas (docena)', defaultPrice: 4800, icon: '🥐' },
    { name: 'Leche, yogur y manteca', defaultPrice: 3600, icon: '🥛' },
    { name: 'Pan fresco / Tostadas', defaultPrice: 1800, icon: '🥖' },
    { name: 'Queso y jamón para picada', defaultPrice: 7500, icon: '🧀' },
    { name: 'Frutas y verduras frescas', defaultPrice: 5200, icon: '🍎' },
    { name: 'Carne / Milanesas / Pollo', defaultPrice: 13500, icon: '🥩' },
    { name: 'Yerba Mate y café molido', defaultPrice: 4500, icon: '🧉' },
    { name: 'Agua mineral y gaseosas', defaultPrice: 3200, icon: '💧' },
    { name: 'Vino Malbec / Cervezas', defaultPrice: 5800, icon: '🍷' },
  ],
  regalos: [
    { name: 'Caja Alfajores Havanna (x12)', defaultPrice: 16500, icon: '🍫' },
    { name: 'Mate de calabaza & Bombilla', defaultPrice: 18000, icon: '🧉' },
    { name: 'Frasco Dulce de Leche artesanal', defaultPrice: 4200, icon: '🍯' },
    { name: 'Vino Malbec de Colección', defaultPrice: 12000, icon: '🍷' },
    { name: 'Remera Argentina / AFA', defaultPrice: 22000, icon: '👕' },
    { name: 'Llaveros y recuerdos de San Telmo', defaultPrice: 5000, icon: '🎁' },
    { name: 'Chocolates Rapanui / Fra-nui', defaultPrice: 8500, icon: '🍓' },
  ]
};

// Safe arithmetic evaluator with thousands separator support (e.g. 19.741 -> 19741)
function safeEvaluateExpression(rawExpr) {
  if (!rawExpr || typeof rawExpr !== 'string') return 0;
  let cleaned = cleanCalcExpression(rawExpr);

  cleaned = cleaned.replace(/[+\-*/.]+$/, '').trim();
  if (!cleaned) return 0;

  if (!/^[\d\s+\-*/.()]+$/.test(cleaned)) return 0;

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

export default function DynamicExpenseSection({
  category, // { id, name, icon, color, isDefault }
  expenses = [],
  onAddExpense,
  onDeleteExpense,
  onEditExpense,
  exchangeRate = 1540,
  onViewReceipt
}) {
  const BUDGET_CAP_USD = 1000;
  const safeRate = (Number(exchangeRate) && Number(exchangeRate) >= 100) ? Number(exchangeRate) : 1540;

  // Active Tool Mode inside this section: 'calculator' | 'scanner' | 'manual'
  const [activeTool, setActiveTool] = useState('calculator');

  // Calculator State
  const [calcExpression, setCalcExpression] = useState('');
  const [cartTape, setCartTape] = useState([]);
  const [storeConcept, setStoreConcept] = useState('');
  const [paidBy, setPaidBy] = useState('Yo');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Manual Form State
  const [manualConcept, setManualConcept] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState('ARS');
  const [manualPaidBy, setManualPaidBy] = useState('Yo');
  const [manualNote, setManualNote] = useState('');

  // Calculations for this category
  const categoryExpenses = expenses.filter(e => e.category === category.id);
  const totalCatARS = categoryExpenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalCatUSD = totalCatARS / safeRate;

  // Global wallet totals
  const totalAllARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalAllUSD = totalAllARS / safeRate;
  const remainingUSD = Math.max(0, BUDGET_CAP_USD - totalAllUSD);

  // Calculator live results
  const computedARS = safeEvaluateExpression(calcExpression);
  const computedUSD = computedARS / safeRate;

  // Quick presets for this category (or empty)
  const presets = CATEGORY_PRESETS[category.id] || [];

  // Keypad
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
      if (evaluated > 0) setCalcExpression(evaluated.toString());
      return;
    }

    const isOperator = ['+', '-', '×', '÷'].includes(val);
    const lastChar = calcExpression.slice(-1);
    const lastCharIsOperator = ['+', '-', '×', '÷'].includes(lastChar);

    if (isOperator && lastCharIsOperator) {
      setCalcExpression(prev => prev.slice(0, -1) + val);
      return;
    }

    setCalcExpression(prev => prev + val);
  };

  const handleAddPreset = (item) => {
    const priceStr = item.defaultPrice.toString();
    setCalcExpression(prev => {
      if (!prev || prev === '0') return priceStr;
      const lastChar = prev.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        return prev + priceStr;
      }
      return `${prev} + ${priceStr}`;
    });

    setCartTape(prev => [
      ...prev,
      { id: Date.now() + Math.random(), name: item.name, price: item.defaultPrice, icon: item.icon }
    ]);
  };

  // Approve Calculator Total
  const handleApproveCalculator = (e) => {
    if (e) e.preventDefault();
    const finalAmount = Math.round(computedARS);
    if (finalAmount <= 0) {
      alert('Ingresa una operación o monto válido mayor a $0');
      return;
    }

    const itemsSummary = cartTape.length > 0 ? ` [${cartTape.map(i => i.name.split(' ')[0]).join(', ')}]` : '';
    const fullConcept = storeConcept.trim() || `${category.name}`;
    const fullNote = note ? `${note}${itemsSummary}` : (itemsSummary ? `Items:${itemsSummary}` : 'Registro con calculadora');

    const newExpense = {
      id: 'exp-' + Date.now(),
      date: purchaseDate,
      concept: fullConcept,
      category: category.id,
      amountARS: finalAmount,
      paidBy: paidBy,
      note: fullNote
    };

    onAddExpense(newExpense);
    setLastSaved(newExpense);
    setShowToast(true);
    setCalcExpression('');
    setCartTape([]);
    setStoreConcept('');
    setNote('');

    setTimeout(() => setShowToast(false), 4500);
  };

  // Approve Manual Form
  const handleApproveManual = (e) => {
    e.preventDefault();
    const raw = parseCurrencyNumber(manualAmount) || 0;
    if (raw <= 0 || !manualConcept.trim()) {
      alert('Ingresa un concepto y un monto válido');
      return;
    }

    const finalARS = manualCurrency === 'ARS' ? raw : Math.round(raw * exchangeRate);

    const newExpense = {
      id: 'exp-' + Date.now(),
      date: purchaseDate,
      concept: manualConcept.trim(),
      category: category.id,
      amountARS: finalARS,
      paidBy: manualPaidBy,
      note: manualNote.trim() || 'Ingreso directo'
    };

    onAddExpense(newExpense);
    setLastSaved(newExpense);
    setShowToast(true);
    setManualConcept('');
    setManualAmount('');
    setManualNote('');

    setTimeout(() => setShowToast(false), 4500);
  };

  // Handle scanned receipt approved from ReceiptScanner
  const handleSaveScannedReceipt = (expenseItem, mediaItem) => {
    onAddExpense(expenseItem, mediaItem);
    setLastSaved(expenseItem);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500);
  };

  return (
    <div className="dynamic-section-view">
      
      {/* ====================================================================
          SECTION METRICS HEADER
          ==================================================================== */}
      <div className="dynamic-section-hero" style={{ borderColor: `${category.color}40` }}>
        <div className="section-hero-top">
          <div className="section-avatar" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
            <Tag size={26} />
          </div>

          <div className="section-titles">
            <div className="section-tag-pill" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
              <span>Categoría del Viaje</span>
            </div>
            <h2>{category.name}</h2>
            <p className="section-subtitle">
              Calcula, escanea tickets y registra gastos específicos de {category.name}.
              Todos los gastos se acumulan en tu <strong>Billetera de $1.000 USD Blue</strong>.
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="section-kpis-grid">
          <div className="section-kpi-pill">
            <span className="kpi-pill-title">Gasto en {category.name}</span>
            <div className="kpi-pill-dual">
              <span className="kpi-usd">${totalCatUSD.toFixed(1)} <small>USD Blue</small></span>
              <span className="kpi-ars">({formatCurrencyARS(totalCatARS)})</span>
            </div>
          </div>

          <div className="section-kpi-pill">
            <span className="kpi-pill-title">Registros</span>
            <div className="kpi-pill-dual">
              <span className="kpi-usd text-emerald">{categoryExpenses.length}</span>
              <span className="kpi-ars">comprobantes / gastos</span>
            </div>
          </div>

          <div className="section-kpi-pill highlight">
            <span className="kpi-pill-title">Disponible en Billetera</span>
            <div className="kpi-pill-dual">
              <span className="kpi-usd text-emerald">${Math.round(remainingUSD)} <small>USD</small></span>
              <span className="kpi-ars">de $1.000 USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && lastSaved && (
        <div className="grocery-success-toast animate-slide-in">
          <div className="toast-icon-check">
            <Check size={20} />
          </div>
          <div className="toast-text">
            <strong>¡Gasto aprobado e incluido en la Billetera!</strong>
            <span>
              {lastSaved.concept}: <strong>{formatCurrencyARS(lastSaved.amountARS)}</strong>
              {' '}(≈ ${(lastSaved.amountARS / exchangeRate).toFixed(1)} USD Blue)
            </span>
          </div>
        </div>
      )}

      {/* Internal Sub-Tools Bar: Calculator vs Scanner vs Manual */}
      <div className="section-tools-tab-bar">
        <button
          type="button"
          className={`tool-tab-btn ${activeTool === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTool('calculator')}
        >
          <Calculator size={17} />
          <span>Calculadora de Gastos</span>
        </button>

        <button
          type="button"
          className={`tool-tab-btn ${activeTool === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTool('scanner')}
        >
          <Camera size={17} />
          <span>Escáner de Facturas (Foto & OCR)</span>
        </button>

        <button
          type="button"
          className={`tool-tab-btn ${activeTool === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTool('manual')}
        >
          <Receipt size={17} />
          <span>Ingreso Directo de Ticket</span>
        </button>
      </div>

      {/* ====================================================================
          2-COLUMN WORKSPACE: TOOL ON LEFT, DEDICATED HISTORY ON RIGHT
          ==================================================================== */}
      <div className="dynamic-workspace-layout">
        
        {/* Left Column: Active Tool */}
        <div className="dynamic-tool-col">
          
          {/* TOOL 1: CALCULATOR */}
          {activeTool === 'calculator' && (
            <div className="calculator-box-card">
              <div className="calc-card-header">
                <div className="calc-header-title">
                  <Calculator size={20} className="text-emerald" />
                  <h4>Calculadora de {category.name}</h4>
                </div>
                <span className="calc-helper-tag">
                  Suma operaciones en pesos y visualiza en USD Blue
                </span>
              </div>

              {/* Screen */}
              <div className="calc-screen">
                <div className="calc-formula-line">
                  {calcExpression || '0'}
                </div>

                <div className="calc-main-result-row">
                  <div className="calc-ars-total">
                    <span className="ars-symbol">$</span>
                    <span className="ars-value">
                      {computedARS > 0 ? Number(computedARS.toFixed(2)).toLocaleString('es-AR') : '0'}
                    </span>
                    <span className="ars-badge">ARS</span>
                  </div>

                  <div className="calc-usd-conversion-tag">
                    <span>≈ ${computedUSD.toFixed(2)} USD Blue</span>
                  </div>
                </div>

                {computedARS > 0 && (
                  <div className="calc-budget-impact">
                    <Wallet size={12} />
                    <span>
                      Representa el {((computedUSD / BUDGET_CAP_USD) * 100).toFixed(1)}% de tu tope de $1.000 USD
                    </span>
                  </div>
                )}
              </div>

              {/* Keypad */}
              <div className="calc-keypad-grid">
                <button type="button" onClick={() => handleKeyClick('C')} className="calc-btn btn-clear">C</button>
                <button type="button" onClick={() => handleKeyClick('DEL')} className="calc-btn btn-del"><Delete size={17} /></button>
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

              <div className="calc-equal-row">
                <button type="button" onClick={() => handleKeyClick('=')} className="calc-btn btn-equals">
                  <Equal size={18} />
                  <span>Calcular Total</span>
                </button>
              </div>

              {/* Presets if available */}
              {presets.length > 0 && (
                <div className="quick-presets-section">
                  <div className="quick-presets-label">
                    <Sparkles size={14} className="text-amber" />
                    <span>Atajos rápidos habituales en BA:</span>
                  </div>
                  <div className="quick-presets-chips">
                    {presets.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="quick-item-chip"
                        onClick={() => handleAddPreset(item)}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        <span className="item-price">+${(item.defaultPrice / 1000).toFixed(1)}k</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tape */}
              {cartTape.length > 0 && (
                <div className="cart-tape-box">
                  <div className="tape-header">
                    <span>🛒 Items añadidos ({cartTape.length}):</span>
                    <button type="button" onClick={() => setCartTape([])} className="btn-clear-tape">Limpiar</button>
                  </div>
                  <div className="tape-items-list">
                    {cartTape.map(it => (
                      <div key={it.id} className="tape-item-row">
                        <span>{it.icon} {it.name}</span>
                        <strong>{formatCurrencyARS(it.price)}</strong>
                        <button 
                          type="button" 
                          onClick={() => setCartTape(prev => prev.filter(i => i.id !== it.id))} 
                          className="btn-remove-tape"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Box */}
              <div className="calc-approval-panel">
                <div className="approval-title-row">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <h5>Aprobar y Sumar a la Billetera</h5>
                </div>

                <div className="approval-form-grid">
                  <div className="approval-field">
                    <label>Lugar / Comercio / Concepto *</label>
                    <input
                      type="text"
                      placeholder={`Ej: Compra en ${category.name}...`}
                      value={storeConcept}
                      onChange={(e) => setStoreConcept(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="approval-row-two-col">
                    <div className="approval-field">
                      <label>¿Quién pagó?</label>
                      <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="form-select">
                        <option value="Yo">Yo</option>
                        <option value="Mi Amiga">Mi Amiga</option>
                        <option value="Compartido">Compartido (50/50)</option>
                      </select>
                    </div>

                    <div className="approval-field">
                      <label>Fecha</label>
                      <input 
                        type="date" 
                        value={purchaseDate} 
                        onChange={(e) => setPurchaseDate(e.target.value)} 
                        className="form-input" 
                      />
                    </div>
                  </div>

                  <div className="approval-field">
                    <label>Nota / Detalle (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Para compartir o regalo especial..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApproveCalculator}
                  disabled={computedARS <= 0}
                  className={`btn-approve-grocery ${computedARS > 0 ? 'ready' : 'disabled'}`}
                >
                  <Check size={20} />
                  <span>
                    Aprobar e Incluir en Billetera (
                    {computedARS > 0 ? formatCurrencyARS(computedARS) : '$0 ARS'}
                    {' '}• ${computedUSD.toFixed(1)} USD Blue)
                  </span>
                </button>
              </div>

            </div>
          )}

          {/* TOOL 2: RECEIPT SCANNER WITH OCR */}
          {activeTool === 'scanner' && (
            <ReceiptScanner
              defaultCategory={category.id}
              categoryName={category.name}
              exchangeRate={exchangeRate}
              onSaveExpenseWithReceipt={handleSaveScannedReceipt}
            />
          )}

          {/* TOOL 3: MANUAL TICKET ENTRY */}
          {activeTool === 'manual' && (
            <div className="calculator-box-card">
              <div className="calc-card-header">
                <div className="calc-header-title">
                  <Receipt size={20} className="text-emerald" />
                  <h4>Ingreso Directo de Ticket</h4>
                </div>
                <span className="calc-helper-tag">Ingresa la cifra final de tu ticket de compra</span>
              </div>

              <form onSubmit={handleApproveManual} className="manual-grocery-form">
                <div className="form-group">
                  <label>Comercio / Concepto *</label>
                  <input
                    type="text"
                    placeholder={`Ej: Compra ${category.name}...`}
                    value={manualConcept}
                    onChange={(e) => setManualConcept(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="currency-selector-label-row">
                    <label>Monto del Gasto *</label>
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
                      placeholder={manualCurrency === 'ARS' ? "Ej: 19.741" : "Ej: 15"}
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
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
                  <label>Nota (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Pagado en efectivo"
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

        </div>

        {/* Right Column: Dedicated Expense History for this category */}
        <div className="dynamic-history-col">
          <div className="grocery-history-card">
            
            <div className="history-card-header">
              <div>
                <h4>Historial de {category.name}</h4>
                <span className="history-subtitle">
                  {categoryExpenses.length} gastos registrados en esta categoría
                </span>
              </div>

              <div className="history-total-badge">
                <span className="badge-ars">{formatCurrencyARS(totalCatARS)}</span>
                <span className="badge-usd">≈ ${totalCatUSD.toFixed(1)} USD Blue</span>
              </div>
            </div>

            {/* List */}
            <div className="grocery-expenses-list">
              {categoryExpenses.length === 0 ? (
                <div className="empty-grocery-state">
                  <Receipt size={38} className="text-muted" />
                  <h5>No hay gastos registrados en {category.name}</h5>
                  <p>
                    Usa la calculadora o toma foto a tu primer ticket con el escáner para sumarlo a la billetera.
                  </p>
                </div>
              ) : (
                categoryExpenses.map(exp => {
                  const expUSD = (Number(exp.amountARS) || 0) / safeRate;
                  const hasReceipt = Boolean(exp.receipt_id);

                  return (
                    <div key={exp.id} className="grocery-expense-item">
                      <div className="expense-cart-icon" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                        <Tag size={16} />
                      </div>

                      <div className="expense-main-info">
                        <div className="expense-concept-row">
                          <span className="concept-title">{exp.concept}</span>
                          {exp.isFromItinerary ? (
                            <span className="itinerary-source-pill">
                              📅 Día {exp.dayNumber} · Itinerario
                            </span>
                          ) : (
                            <span className="paid-by-pill">Pagó: {exp.paidBy}</span>
                          )}
                          
                          {/* Receipt badge if photo attached */}
                          {hasReceipt && (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(exp)}
                              className="btn-view-receipt-pill"
                              title="Ver foto del ticket y transcripción"
                            >
                              <Camera size={12} />
                              <span>Foto Comprobante</span>
                            </button>
                          )}
                        </div>

                        <div className="expense-meta-row">
                          <span className="meta-date">{exp.date}</span>
                          {exp.note && <span className="meta-note">• {exp.note}</span>}
                        </div>
                      </div>

                      <div className="expense-amounts-box">
                        <span className="amount-ars">{formatCurrencyARS(exp.amountARS)}</span>
                        <span className="amount-usd">≈ ${expUSD.toFixed(1)} <small>USD Blue</small></span>
                      </div>

                      <div className="grocery-item-actions">
                        {onEditExpense && (
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            className="btn-edit-grocery"
                            title="Editar precio y sincronizar"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (exp.isFromItinerary) {
                              if (window.confirm(`¿Quitar el costo estimado de "${exp.concept}"? Se pondrá en $0 en la tarjeta del itinerario.`)) {
                                onDeleteExpense(exp.id, exp);
                              }
                            } else {
                              if (window.confirm(`¿Eliminar gasto "${exp.concept}" de ${formatCurrencyARS(exp.amountARS)}? Se restará de la billetera.`)) {
                                onDeleteExpense(exp.id, exp);
                              }
                            }
                          }}
                          className="btn-trash-grocery"
                          title={exp.isFromItinerary ? "Poner costo en $0 en la tarjeta del itinerario" : "Eliminar gasto"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {categoryExpenses.length > 0 && (
              <div className="history-footer-summary">
                <span>Total en {category.name}:</span>
                <div className="footer-dual-totals">
                  <strong>{formatCurrencyARS(totalCatARS)}</strong>
                  <span>(≈ ${totalCatUSD.toFixed(1)} USD Blue)</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
