import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, ShoppingCart, Utensils, Bus, Ticket, ShoppingBag, 
  Receipt, Plus, Trash2, Home, ArrowRightLeft, TrendingUp, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, Gift, Camera, Tag, X, ChevronRight, Edit3,
  CreditCard, Banknote
} from 'lucide-react';
import { 
  formatCurrencyARS, 
  formatCurrencyUSD, 
  convertUsdToArs, 
  parseCurrencyNumber,
  getExpensePaymentMethod
} from '../utils/helpers';
import DynamicExpenseSection from './DynamicExpenseSection';
import NewCategoryModal from './NewCategoryModal';
import ReceiptViewerModal from './ReceiptViewerModal';
import EditExpenseModal from './EditExpenseModal';
import { CASH_EXCHANGE_INFO } from '../data/initialData';

export default function BudgetTracker({
  expenses = [],
  activities = [],
  receipts = [],
  categories = [],
  onAddExpense,
  onDeleteExpense,
  onUpdateActivityCost,
  onAddCategory,
  onDeleteCategory,
  exchangeRate = 1540,
  onUpdateExchangeRate,
  onUpdateExpense
}) {
  const BUDGET_CAP_USD = 1000;

  // Active item being edited in modal
  const [editingExpenseItem, setEditingExpenseItem] = useState(null);

  // Safe exchange rate threshold (never 0 or NaN)
  const safeRate = (Number(exchangeRate) && Number(exchangeRate) >= 100) ? Number(exchangeRate) : 1540;

  // Mirror text state for rate input
  const [rateInput, setRateInput] = useState(exchangeRate ? exchangeRate.toString() : '1540');

  useEffect(() => {
    if (exchangeRate && exchangeRate >= 100) {
      setRateInput(exchangeRate.toString());
    }
  }, [exchangeRate]);

  const handleRateInputChange = (e) => {
    const val = e.target.value;
    setRateInput(val);
    const parsed = parseCurrencyNumber(val);
    if (parsed >= 100 && onUpdateExchangeRate) {
      onUpdateExchangeRate(parsed);
    }
  };

  const handleRateInputBlur = () => {
    const parsed = parseCurrencyNumber(rateInput);
    if (!parsed || parsed < 100) {
      const fallback = (exchangeRate && exchangeRate >= 100) ? exchangeRate : 1540;
      setRateInput(fallback.toString());
      if (onUpdateExchangeRate) onUpdateExchangeRate(fallback);
    } else {
      if (onUpdateExchangeRate) onUpdateExchangeRate(parsed);
    }
  };

  const handleRateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  // Active Toolbar Tab: 'general' | 'mercado' | 'regalos' | custom_category_id
  const [activeSubTab, setActiveSubTab] = useState('general');

  // Modals state
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState(null); // { receipt, expense }
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // General Form state
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState('mercado');
  const [newPaymentMethod, setNewPaymentMethod] = useState('efectivo'); // 'efectivo' | 'tarjeta'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'efectivo' | 'tarjeta'
  const [inputCurrency, setInputCurrency] = useState('ARS');
  const [rawAmount, setRawAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [lastRateUpdate, setLastRateUpdate] = useState(null);

  // Fetch real-time Dólar Blue from DolarApi.com
  const fetchLiveDolarBlue = async () => {
    setIsFetchingRate(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      if (res.ok) {
        const data = await res.json();
        const live = Number(data.compra) || Number(data.venta);
        if (live && live >= 100 && onUpdateExchangeRate) {
          onUpdateExchangeRate(live);
          setRateInput(live.toString());
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastRateUpdate({ compra: data.compra, venta: data.venta, time: timeStr });
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener cotización automática:", err);
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Convert itinerary activities with an estimated cost into wallet expense items
  const itineraryExpenses = activities
    .filter(a => (parseCurrencyNumber(a.costEstimatedARS) || 0) > 0)
    .map(a => {
      const parsedCost = parseCurrencyNumber(a.costEstimatedARS);
      return {
        id: `itinerary-${a.id}`,
        activityId: a.id,
        date: `Día ${a.dayNumber} · ${a.time || '10:00'}`,
        concept: a.title,
        category: a.category || 'gastronomia',
        amountARS: parsedCost,
        paidBy: 'Itinerario',
        note: `Plan Día ${a.dayNumber}${a.barrio ? ` (${a.barrio})` : ''}`,
        isFromItinerary: true,
        dayNumber: a.dayNumber,
        completed: Boolean(a.completed)
      };
    });

  // Unified list for all wallet metrics, breakdowns and views
  const mergedExpenses = [...itineraryExpenses, ...expenses];

  const totalItineraryARS = itineraryExpenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalDirectARS = expenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  // Calculations for General Wallet
  const totalARS = mergedExpenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
  const totalUSD = totalARS / safeRate;
  const remainingUSD = Math.max(0, BUDGET_CAP_USD - totalUSD);
  const remainingARS = remainingUSD * safeRate;
  const percentUsed = Math.min(100, Math.round((totalUSD / BUDGET_CAP_USD) * 100));

  // Category totals
  const mercadoTotalARS = mergedExpenses
    .filter(e => e.category === 'mercado')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const regalosTotalARS = mergedExpenses
    .filter(e => e.category === 'regalos' || e.category === 'compras')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const gastronomiaTotalARS = mergedExpenses
    .filter(e => e.category === 'gastronomia')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const transporteTotalARS = mergedExpenses
    .filter(e => e.category === 'transporte')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  // Payment Breakdown Dinámico (Tarjeta vs Efectivo)
  const totalTarjetaARS = mergedExpenses
    .filter(e => getExpensePaymentMethod(e) === 'tarjeta')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const totalCashARS = mergedExpenses
    .filter(e => getExpensePaymentMethod(e) === 'efectivo')
    .reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);

  const cardExpensesCount = mergedExpenses.filter(e => getExpensePaymentMethod(e) === 'tarjeta').length;
  const cashExpensesCount = mergedExpenses.filter(e => getExpensePaymentMethod(e) === 'efectivo').length;

  // Seguimiento de Efectivo Físico vs Dólares Cambiados
  const cashAgreedTotal = CASH_EXCHANGE_INFO?.totalArsAgreed || 760000;
  const cashReceivedTotal = CASH_EXCHANGE_INFO?.totalCashReceived || 490000;
  const cashPendingDelivery = Math.max(0, cashAgreedTotal - cashReceivedTotal);
  const cashAvailableNow = Math.max(0, cashReceivedTotal - totalCashARS);
  const cashPercentUsed = cashReceivedTotal > 0 ? Math.min(100, Math.round((totalCashARS / cashReceivedTotal) * 100)) : 0;

  const parsedRawAmount = parseCurrencyNumber(rawAmount);

  // Computed values for general add expense form
  const computedARS = inputCurrency === 'ARS' 
    ? parsedRawAmount 
    : convertUsdToArs(parsedRawAmount, safeRate);

  const computedUSD = inputCurrency === 'USD'
    ? parsedRawAmount 
    : (parsedRawAmount) / safeRate;

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
      paymentMethod: newPaymentMethod,
      paidBy: newPaymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
      note: newNote.trim()
    };

    onAddExpense(expenseItem);
    setNewConcept('');
    setRawAmount('');
    setNewNote('');
  };

  // Open Receipt Modal
  const handleOpenReceipt = (expense) => {
    if (!expense.receipt_id) return;
    const foundReceipt = receipts.find(r => r.uuid === expense.receipt_id);
    setSelectedReceiptData({
      receipt: foundReceipt || { uuid: expense.receipt_id, filename: 'Comprobante', description: expense.note },
      expense
    });
    setIsReceiptModalOpen(true);
  };

  // Filtered expenses based on category AND paymentMethod filter
  const filteredExpenses = mergedExpenses.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    const method = getExpensePaymentMethod(e);
    if (paymentFilter === 'efectivo' && method !== 'efectivo') return false;
    if (paymentFilter === 'tarjeta' && method !== 'tarjeta') return false;
    return true;
  });

  // Status badge for the $1,000 USD cap
  const getStatusBadge = () => {
    if (percentUsed >= 90) {
      return { label: "¡Atención! Cerca del tope de $1.000 USD", class: "danger", icon: AlertTriangle };
    }
    if (percentUsed >= 70) {
      return { label: "Gastado más del 70% del presupuesto", class: "warning", icon: AlertTriangle };
    }
    return { label: "¡Ritmo excelente! Por debajo del tope", class: "healthy", icon: CheckCircle2 };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  // Active Category Object if not in 'general'
  const activeCategoryObj = categories.find(c => c.id === activeSubTab);

  return (
    <div className="budget-tracker-view">
      
      {/* ====================================================================
          TOP TOOLBAR: BILLETERA GENERAL, MERCADO, REGALOS, CUSTOM TABS, AND [+]
          ==================================================================== */}
      <div className="budget-top-toolbar">
        <div className="toolbar-tabs-scroll">
          
          {/* Tab 1: Billetera General */}
          <button
            type="button"
            className={`toolbar-tab-btn ${activeSubTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('general')}
          >
            <Wallet size={16} />
            <span>Billetera General</span>
            <span className="toolbar-tab-badge">${Math.round(totalUSD)} / $1.000 USD</span>
          </button>

          {/* Dynamic Category Tabs (Mercado, Regalos, Discotecas...) */}
          {categories.map((cat) => {
            const isActive = activeSubTab === cat.id;
            const catExpenses = mergedExpenses.filter(e => e.category === cat.id);
            const catARS = catExpenses.reduce((sum, e) => sum + (Number(e.amountARS) || 0), 0);
            const catUSD = safeRate > 0 ? (catARS / safeRate).toFixed(0) : '0';

            return (
              <div key={cat.id} className="toolbar-tab-wrapper">
                <button
                  type="button"
                  className={`toolbar-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSubTab(cat.id)}
                  style={isActive ? { borderBottomColor: cat.color, color: cat.color } : {}}
                >
                  <Tag size={15} style={{ color: cat.color }} />
                  <span>{cat.name}</span>
                  <span className="toolbar-tab-count">{catARS > 0 ? formatCurrencyARS(catARS) : '$0 ARS'}</span>
                </button>

                {/* Delete button for custom (non-default) categories */}
                {!cat.is_default && (
                  <button
                    type="button"
                    className="btn-delete-custom-cat"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`¿Eliminar la sección "${cat.name}"? Los gastos asociados seguirán en el historial general.`)) {
                        onDeleteCategory(cat.id);
                        if (activeSubTab === cat.id) setActiveSubTab('general');
                      }
                    }}
                    title="Eliminar esta sección personalizada"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* The [+] Button: Add New Custom Section */}
          <button
            type="button"
            className="toolbar-add-section-btn"
            onClick={() => setIsNewCatModalOpen(true)}
            title="Crear una nueva sección personalizada con calculadora y escáner"
          >
            <Plus size={16} />
            <span>Nueva Sección</span>
          </button>

        </div>
      </div>

      {/* ====================================================================
          SUB-TAB VIEW 1: BILLETERA GENERAL
          ==================================================================== */}
      {activeSubTab === 'general' ? (
        <>
          {/* BILLETERA HERO CARD ($1,000 USD CAP & DUAL CURRENCIES) */}
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
                    Hospedaje en casa de tu amiga ($0). Se suman automáticamente los valores de tus <strong>cards del itinerario</strong> y tus <strong>gastos/tickets registrados</strong>.
                  </p>
                </div>
              </div>

              {/* Dólar Blue Rate Adjuster */}
              <div className="blue-rate-card">
                <div className="blue-rate-header">
                  <div className="blue-rate-title">
                    <ArrowRightLeft size={14} className="text-amber" />
                    <span>Cotización Dólar Blue</span>
                  </div>
                  <button 
                    type="button"
                    className="btn-fetch-live-rate"
                    onClick={fetchLiveDolarBlue}
                    disabled={isFetchingRate}
                    title="Consultar precio real de hoy en DolarApi.com"
                  >
                    <RefreshCw size={12} className={isFetchingRate ? 'spin-icon' : ''} />
                    <span>{isFetchingRate ? 'Consultando...' : 'En vivo'}</span>
                  </button>
                </div>

                <div className="blue-rate-input-row">
                  <span className="rate-prefix">1 USD = $</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateInput}
                    onChange={handleRateInputChange}
                    onBlur={handleRateInputBlur}
                    onKeyDown={handleRateKeyDown}
                    placeholder="1540"
                    className="blue-rate-field"
                    title="Ajusta el valor en Pesos Argentinos (ARS) de 1 Dólar"
                    aria-label="Pesos Argentinos por 1 USD"
                  />
                  <span className="rate-suffix">ARS</span>
                </div>

                {lastRateUpdate && (
                  <div className="live-rate-sub-tag">
                    ✓ DolarApi ({lastRateUpdate.time}): Compra ${lastRateUpdate.compra} / Venta ${lastRateUpdate.venta}
                  </div>
                )}

                <div className="rate-preset-chips">
                  <button type="button" onClick={() => onUpdateExchangeRate(1540)} className={`preset-btn ${Number(exchangeRate) === 1540 ? 'active' : ''}`}>1540 (Compra)</button>
                  <button type="button" onClick={() => onUpdateExchangeRate(1560)} className={`preset-btn ${Number(exchangeRate) === 1560 ? 'active' : ''}`}>1560 (Venta)</button>
                  <button type="button" onClick={() => onUpdateExchangeRate(1500)} className={`preset-btn ${Number(exchangeRate) === 1500 ? 'active' : ''}`}>1500</button>
                  <button type="button" onClick={() => onUpdateExchangeRate(1600)} className={`preset-btn ${Number(exchangeRate) === 1600 ? 'active' : ''}`}>1600</button>
                </div>
              </div>
            </div>

            {/* Progress Bar towards $1,000 USD */}
            <div className="budget-cap-progress-section">
              <div className="progress-labels-row">
                <div className="progress-left-label">
                  <span>Total facturado en planes/gastos:</span>
                  <strong className="spent-val">{formatCurrencyARS(totalARS)}</strong>
                  <span className="spent-ars-sub">(Descuenta ≈ ${Math.round(totalUSD)} USD Blue)</span>
                  <div className="spent-split-hint">
                    <span>Itinerario: {formatCurrencyARS(totalItineraryARS)} (≈ ${Math.round(totalItineraryARS / safeRate)} USD)</span>
                    <span>• Compras/Tickets: {formatCurrencyARS(totalDirectARS)} (≈ ${Math.round(totalDirectARS / safeRate)} USD)</span>
                  </div>
                </div>
                <div className="progress-center-pct">
                  <span>{percentUsed}% del tope</span>
                </div>
                <div className="progress-right-label">
                  <span>Efectivo disponible restante:</span>
                  <strong className="remaining-val">${Math.round(remainingUSD)} USD Blue</strong>
                  <span className="remaining-ars-sub">(Equivale a {formatCurrencyARS(remainingARS)})</span>
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

          {/* CONTROL DE LIQUIDEZ Y SEGUIMIENTO: EFECTIVO EN MANO VS TARJETA */}
          <div className="liquidity-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Card 1: Efectivo Físico en Mano */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.25))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '18px 20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Banknote size={16} /> Efectivo en Mano (Bolsillo)
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {cashPercentUsed}% del efectivo gastado
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc' }}>
                  {formatCurrencyARS(cashAvailableNow)}
                </h3>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                  ≈ ${Math.round(cashAvailableNow / safeRate)} USD Blue
                </span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                Saldo real disponible para gastar de los <strong>{formatCurrencyARS(cashReceivedTotal)}</strong> entregados en mano.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total pactado (USD 500 cambiados):</span>
                  <strong style={{ color: '#e2e8f0' }}>{formatCurrencyARS(cashAgreedTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gastado en efectivo ({cashExpensesCount} compras):</span>
                  <strong style={{ color: '#f87171' }}>-{formatCurrencyARS(totalCashARS)}</strong>
                </div>
                {cashPendingDelivery > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Remanente por recibir:</span>
                    <strong style={{ color: '#fbbf24' }}>{formatCurrencyARS(cashPendingDelivery)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Pagos con Tarjeta */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(49, 46, 129, 0.25))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '16px',
              padding: '18px 20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={16} /> Pagos con Tarjeta
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {cardExpensesCount} transacciones
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc' }}>
                  {formatCurrencyARS(totalTarjetaARS)}
                </h3>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                  ≈ ${Math.round(totalTarjetaARS / safeRate)} USD
                </span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                Total facturado en tu tarjeta de crédito/débito durante el viaje.
              </p>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ecoparque, Bellgamba, salidas:</span>
                  <strong style={{ color: '#e2e8f0' }}>{formatCurrencyARS(totalTarjetaARS)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Impacto en tope global de $1.000 USD:</span>
                  <strong style={{ color: '#818cf8' }}>{((totalTarjetaARS / (safeRate * BUDGET_CAP_USD)) * 100).toFixed(1)}% del presupuesto</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SWITCH DE CONTROL DE PAGO: GENERAL / EFECTIVO / TARJETA */}
          <div className="payment-filter-banner" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
                  Filtro de Gastos por Medio de Pago
                </span>
                <h4 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  {paymentFilter === 'all' && `Vista General: ${formatCurrencyARS(totalARS)} (Todos los gastos)`}
                  {paymentFilter === 'efectivo' && `Solo Pagos en Efectivo: ${formatCurrencyARS(totalCashARS)} (${cashExpensesCount} gastos)`}
                  {paymentFilter === 'tarjeta' && `Solo Pagos con Tarjeta: ${formatCurrencyARS(totalTarjetaARS)} (${cardExpensesCount} gastos)`}
                </h4>
              </div>

              {/* Segmented Switch */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(15, 23, 42, 0.9)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: paymentFilter === 'all' ? '#3b82f6' : 'transparent',
                    color: paymentFilter === 'all' ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: paymentFilter === 'all' ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'none'
                  }}
                >
                  🌐 General ({mergedExpenses.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilter('efectivo')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: paymentFilter === 'efectivo' ? '#10b981' : 'transparent',
                    color: paymentFilter === 'efectivo' ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: paymentFilter === 'efectivo' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  💵 Efectivo ({formatCurrencyARS(totalCashARS)})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilter('tarjeta')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: paymentFilter === 'tarjeta' ? '#6366f1' : 'transparent',
                    color: paymentFilter === 'tarjeta' ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: paymentFilter === 'tarjeta' ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  💳 Tarjeta ({formatCurrencyARS(totalTarjetaARS)})
                </button>
              </div>
            </div>
          </div>

          {/* KPI CARDS WITH SHORTCUTS TO SECTIONS */}
          <div className="budget-kpis-grid">
            <div className="kpi-card total-card">
              <div className="kpi-header">
                <span className="kpi-label">Gasto Total Facturado</span>
                <TrendingUp size={18} className="kpi-icon" />
              </div>
              <div className="kpi-dual-values">
                <div className="kpi-ars-highlight">{formatCurrencyARS(totalARS)}</div>
                <div className="kpi-usd-sub">≈ ${totalUSD.toFixed(1)} USD Blue</div>
              </div>
            </div>

            <div 
              className="kpi-card mercado-card interactive-link"
              onClick={() => setActiveSubTab('mercado')}
              role="button"
              tabIndex={0}
              title="Abrir sección de Mercado con Calculadora y Escáner"
            >
              <div className="kpi-header">
                <span className="kpi-label">Mercado para Casa</span>
                <ShoppingCart size={18} className="kpi-icon" />
              </div>
              <div className="kpi-dual-values">
                <div className="kpi-ars-highlight">{formatCurrencyARS(mercadoTotalARS)}</div>
                <div className="kpi-usd-sub">≈ ${(mercadoTotalARS / safeRate).toFixed(1)} USD Blue</div>
              </div>
              <div className="kpi-quick-nav-pill">
                <span>🛒 Calculadora & Escáner →</span>
              </div>
            </div>

            <div 
              className="kpi-card regalos-card interactive-link"
              onClick={() => setActiveSubTab('regalos')}
              role="button"
              tabIndex={0}
              title="Abrir sección de Regalos del Viaje"
            >
              <div className="kpi-header">
                <span className="kpi-label">Regalos & Recuerdos</span>
                <Gift size={18} className="kpi-icon text-rose" />
              </div>
              <div className="kpi-dual-values">
                <div className="kpi-ars-highlight">{formatCurrencyARS(regalosTotalARS)}</div>
                <div className="kpi-usd-sub">≈ ${(regalosTotalARS / safeRate).toFixed(1)} USD Blue</div>
              </div>
              <div className="kpi-quick-nav-pill">
                <span>🎁 Ver Regalos →</span>
              </div>
            </div>

            <div className="kpi-card transport-card">
              <div className="kpi-header">
                <span className="kpi-label">Transporte & SUBE</span>
                <Bus size={18} className="kpi-icon" />
              </div>
              <div className="kpi-dual-values">
                <div className="kpi-ars-highlight">{formatCurrencyARS(transporteTotalARS)}</div>
                <div className="kpi-usd-sub">≈ ${(transporteTotalARS / safeRate).toFixed(1)} USD Blue</div>
              </div>
            </div>
          </div>

          {/* MAIN LAYOUT: ADD EXPENSE FORM & ALL-EXPENSES LIST */}
          <div className="budget-main-layout">
            
            {/* Left Column: Form to Add New Expense */}
            <div className="budget-form-column">
              <div className="form-card">
                <div className="form-card-title">
                  <Plus size={18} />
                  <h4>Registrar Nuevo Gasto General</h4>
                </div>

                <form onSubmit={handleAddSubmit} className="add-expense-form">
                  <div className="form-group">
                    <label>Concepto del Gasto *</label>
                    <input
                      type="text"
                      placeholder="Ej: Almuerzo parrilla, SUBE, entrada museo..."
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

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
                        type="text"
                        inputMode="decimal"
                        placeholder={inputCurrency === 'ARS' ? "Ej: 19.741" : "Ej: 15"}
                        value={rawAmount}
                        onChange={(e) => setRawAmount(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

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
                          onClick={() => setNewPaymentMethod('efectivo')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: newPaymentMethod === 'efectivo' ? '2px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
                            background: newPaymentMethod === 'efectivo' ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                            color: newPaymentMethod === 'efectivo' ? '#10b981' : 'inherit',
                            fontWeight: newPaymentMethod === 'efectivo' ? '700' : '500',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>💵</span>
                          <span>Efectivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPaymentMethod('tarjeta')}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: newPaymentMethod === 'tarjeta' ? '2px solid #3b82f6' : '1px solid var(--border-color, #e2e8f0)',
                            background: newPaymentMethod === 'tarjeta' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                            color: newPaymentMethod === 'tarjeta' ? '#3b82f6' : 'inherit',
                            fontWeight: newPaymentMethod === 'tarjeta' ? '700' : '500',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>💳</span>
                          <span>Tarjeta</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nota / Detalle (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Incluyó propina del 10%"
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

              {/* Category Breakdown */}
              <div className="category-breakdown-card">
                <h4>Distribución por Categorías</h4>
                <div className="breakdown-list">
                  {categories.map(cat => {
                    const amount = mergedExpenses
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
                            <span className="cat-amount-ars">{formatCurrencyARS(amount)}</span>
                            <span className="cat-amount-usd">≈ ${(amount / safeRate).toFixed(1)} USD</span>
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

            {/* Right Column: All Expenses List with Receipt buttons */}
            <div className="budget-list-column">
              <div className="list-card-header">
                <h4>Historial Completo de Gastos ({filteredExpenses.length})</h4>
                <div className="category-filter-chips">
                  <button 
                    className={`filter-chip ${filterCat === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterCat('all')}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
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
                    const catObj = categories.find(c => c.id === exp.category) || { name: 'Varios', color: '#64748b' };
                    const expUSD = (Number(exp.amountARS) || 0) / safeRate;
                    const hasReceipt = Boolean(exp.receipt_id);
                    const isCard = getExpensePaymentMethod(exp) === 'tarjeta';

                    return (
                      <div key={exp.id} className={`expense-item-row ${exp.isFromItinerary ? 'from-itinerary' : ''}`}>
                        <div className="expense-cat-badge" style={{ backgroundColor: `${catObj.color}20`, color: catObj.color }}>
                          <span className="cat-dot" style={{ backgroundColor: catObj.color }}></span>
                          <span>{catObj.name}</span>
                        </div>

                        <div className="expense-details">
                          <div className="expense-concept-row">
                            <span className="expense-concept">{exp.concept}</span>
                            {exp.isFromItinerary && (
                              <span className="itinerary-source-pill">
                                📅 Día {exp.dayNumber} · Itinerario
                              </span>
                            )}
                            {exp.isFromItinerary && exp.completed && (
                              <span className="itinerary-completed-tag">
                                ✓ Realizado
                              </span>
                            )}
                            {hasReceipt && (
                              <button
                                type="button"
                                onClick={() => handleOpenReceipt(exp)}
                                className="btn-view-receipt-pill"
                                title="Ver foto del comprobante escaneado"
                              >
                                <Camera size={12} />
                                <span>Ver Factura</span>
                              </button>
                            )}
                          </div>
                          <div className="expense-meta">
                            <span>{exp.date}</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: isCard ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: isCard ? '#3b82f6' : '#10b981'
                            }}>
                              {isCard ? '💳 Tarjeta' : '💵 Efectivo'}
                            </span>
                            {exp.note && <span>• {exp.note}</span>}
                          </div>
                        </div>

                        <div className="expense-amount-group">
                          <div className="expense-amount-ars-badge">
                            {formatCurrencyARS(exp.amountARS)}
                          </div>
                          <div className="expense-amount-usd-badge">
                            ≈ ${expUSD.toFixed(1)} <small>USD Blue</small>
                          </div>
                        </div>

                        <div className="expense-row-actions">
                          <button
                            type="button"
                            className="btn-edit-expense"
                            onClick={() => setEditingExpenseItem(exp)}
                            title="Editar precio y sincronizar"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button 
                            className="btn-delete-expense"
                            onClick={() => {
                              if (exp.isFromItinerary) {
                                if (window.confirm(`¿Quitar el costo estimado de "${exp.concept}" en el Día ${exp.dayNumber}? Se pondrá en $0 en la tarjeta del itinerario.`)) {
                                  if (onUpdateActivityCost) {
                                    onUpdateActivityCost(exp.activityId, 0);
                                  } else {
                                    onDeleteExpense(exp.id, exp);
                                  }
                                }
                              } else {
                                if (window.confirm(`¿Eliminar gasto "${exp.concept}"? Se restará de la billetera.`)) {
                                  onDeleteExpense(exp.id, exp);
                                }
                              }
                            }}
                            title={exp.isFromItinerary ? "Poner costo en $0 en la tarjeta del itinerario" : "Eliminar gasto"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* ====================================================================
           SUB-TAB VIEW 2+: DYNAMIC SECTION (MERCADO, REGALOS, CUSTOM TABS)
           ==================================================================== */
        activeCategoryObj && (
          <DynamicExpenseSection
            category={activeCategoryObj}
            expenses={mergedExpenses}
            onAddExpense={onAddExpense}
            onDeleteExpense={(id, exp) => onDeleteExpense(id, exp)}
            onEditExpense={(exp) => setEditingExpenseItem(exp)}
            exchangeRate={exchangeRate}
            onViewReceipt={handleOpenReceipt}
          />
        )
      )}

      {/* Modal: Edit Expense / Mirror Itinerary Activity Price */}
      {editingExpenseItem && (
        <EditExpenseModal
          isOpen={Boolean(editingExpenseItem)}
          onClose={() => setEditingExpenseItem(null)}
          expense={editingExpenseItem}
          categories={categories}
          exchangeRate={safeRate}
          onSave={(updated) => {
            if (onUpdateExpense) onUpdateExpense(updated);
            setEditingExpenseItem(null);
          }}
        />
      )}

      {/* Modal: Add New Custom Category */}
      <NewCategoryModal
        isOpen={isNewCatModalOpen}
        onClose={() => setIsNewCatModalOpen(false)}
        onCreateCategory={(newCat) => {
          onAddCategory(newCat);
          setActiveSubTab(newCat.id);
        }}
      />

      {/* Modal: View Receipt Image & OCR */}
      <ReceiptViewerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceiptData?.receipt}
        expense={selectedReceiptData?.expense}
        exchangeRate={exchangeRate}
      />

    </div>
  );
}
