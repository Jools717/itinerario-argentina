import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, CheckCircle2, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { TRIP_INFO } from '../data/initialData';
import { formatCurrencyARS, parseCurrencyNumber } from '../utils/helpers';

export default function Header({ 
  activitiesCount, 
  completedCount, 
  totalSpentARS, 
  exchangeRate = 1540, 
  onUpdateExchangeRate,
  cloudSyncStatus = 'offline',
  onNavigateToBudget
}) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [arsInput, setArsInput] = useState(exchangeRate ? exchangeRate.toString() : '1540');
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const BUDGET_CAP_USD = 1000; // Tope máximo de $1,000 USD
  const totalSpentUSD = totalSpentARS / (exchangeRate || 1540);
  const remainingUSD = Math.max(0, BUDGET_CAP_USD - totalSpentUSD);
  const budgetPercentage = Math.min(100, Math.round((totalSpentUSD / BUDGET_CAP_USD) * 100));

  useEffect(() => {
    const target = new Date(TRIP_INFO.arrivalDate);
    const now = new Date();
    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setDaysLeft(days > 0 ? days : 0);
  }, []);

  // Keep arsInput in sync if exchangeRate changes externally
  useEffect(() => {
    if (exchangeRate && exchangeRate >= 100) {
      setArsInput(exchangeRate.toString());
    }
  }, [exchangeRate]);

  const handleArsChange = (e) => {
    const val = e.target.value;
    setArsInput(val);
    const parsedArs = parseCurrencyNumber(val);
    if (parsedArs >= 100 && onUpdateExchangeRate) {
      onUpdateExchangeRate(parsedArs);
    }
  };

  const handleArsBlur = () => {
    const parsedArs = parseCurrencyNumber(arsInput);
    if (!parsedArs || parsedArs < 100) {
      const fallback = (exchangeRate && exchangeRate >= 100) ? exchangeRate : 1540;
      setArsInput(fallback.toString());
      if (onUpdateExchangeRate) onUpdateExchangeRate(fallback);
    } else {
      if (onUpdateExchangeRate) onUpdateExchangeRate(parsedArs);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleQuickPreset = (rate) => {
    setArsInput(rate.toString());
    if (onUpdateExchangeRate) {
      onUpdateExchangeRate(rate);
    }
  };

  const handleFetchLive = async () => {
    setIsFetchingRate(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue');
      if (res.ok) {
        const data = await res.json();
        const live = Number(data.compra) || Number(data.venta);
        if (live && onUpdateExchangeRate) {
          handleQuickPreset(live);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Status color for the budget cap progress
  const getBudgetMeterClass = () => {
    if (budgetPercentage >= 90) return 'danger';
    if (budgetPercentage >= 70) return 'warning';
    return 'healthy';
  };

  return (
    <header className="app-header">
      <div className="header-backdrop-pattern"></div>
      <div className="header-container">
        
        {/* Brand & Title */}
        <div className="header-brand">
          <div className="brand-logo">
            <span className="arg-flag-indicator">
              <span className="flag-stripe sky"></span>
              <span className="flag-sun">☀️</span>
              <span className="flag-stripe sky"></span>
            </span>
          </div>
          <div>
            <div className="brand-badge-row">
              <span className="brand-badge">Buenos Aires 2026</span>
              {cloudSyncStatus === 'connected' && (
                <span className="cloud-badge connected" title="Sincronizado en tiempo real con Supabase">
                  🟢 Nube en Vivo
                </span>
              )}
              {cloudSyncStatus === 'syncing' && (
                <span className="cloud-badge syncing">
                  🔄 Guardando...
                </span>
              )}
              {cloudSyncStatus === 'offline' && (
                <span className="cloud-badge offline" title="Guardando en la memoria del dispositivo">
                  💾 Local
                </span>
              )}
            </div>
            <h1 className="brand-title">Mi Itinerario Porteño</h1>
            <p className="brand-subtitle">
              Sábado 10 al Viernes 23 de Octubre • Casa de mi amiga
            </p>
          </div>
        </div>

        {/* Stats Badges + Interactive Wallet Widget ($1,000 USD Cap) */}
        <div className="header-stats">
          
          <div className="stat-pill">
            <Calendar className="stat-icon text-sky" size={16} />
            <div className="stat-text">
              <span className="stat-label">Llegada</span>
              <span className="stat-value">10 Oct · 05:30 AM</span>
            </div>
          </div>

          <div className="stat-pill">
            <CheckCircle2 className="stat-icon text-emerald" size={16} />
            <div className="stat-text">
              <span className="stat-label">Planes</span>
              <span className="stat-value">{completedCount}/{activitiesCount} listos</span>
            </div>
          </div>

          {/* BILLETERA CON TOPE DE $1,000 USD BLUE */}
          <div 
            className={`stat-pill wallet-header-pill ${getBudgetMeterClass()}`}
            onClick={onNavigateToBudget}
            title="Haz clic para ver el desglose en Gastos & Mercado"
            role="button"
            tabIndex={0}
          >
            <div className="wallet-icon-wrapper">
              <Wallet size={18} className="wallet-icon" />
            </div>
            <div className="stat-text wallet-stat-text">
              <div className="wallet-labels-row">
                <span className="stat-label">Billetera (Tope $1.000 USD)</span>
                <span className="wallet-remaining-tag">
                  Quedan ${Math.round(remainingUSD)} USD
                </span>
              </div>
              <div className="wallet-values-row">
                <span className="wallet-usd-val">
                  ${Math.round(totalSpentUSD)} <small className="usd-cap">/ $1.000 USD Blue</small>
                </span>
                <span className="wallet-ars-val">
                  ({formatCurrencyARS(totalSpentARS)})
                </span>
              </div>
              <div className="header-budget-track">
                <div 
                  className={`header-budget-bar ${getBudgetMeterClass()}`}
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>

        {/* Input de Cotización de Moneda (Reemplaza los botones de backup, restaurar y compartir) */}
        <div className="header-currency-widget">
          <div className="currency-widget-top">
            <div className="currency-widget-title">
              <ArrowRightLeft size={13} className="text-sky" />
              <span>Cotización Dólar Blue</span>
            </div>
            <button
              type="button"
              className="btn-header-live-rate"
              onClick={handleFetchLive}
              disabled={isFetchingRate}
              title="Consultar precio real de hoy en DolarApi.com"
            >
              <RefreshCw size={11} className={isFetchingRate ? 'spin-icon' : ''} />
              <span>{isFetchingRate ? 'Consultando...' : 'En vivo'}</span>
            </button>
          </div>

          <div className="currency-widget-inputs-row">
            <div className="fixed-usd-tag">
              <span className="usd-flag">🇺🇸</span>
              <span className="usd-text">1 USD</span>
              <span className="currency-equals-sign">=</span>
            </div>

            <div className="currency-input-pill ars-pill">
              <span className="pill-currency-symbol">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={arsInput}
                onChange={handleArsChange}
                onBlur={handleArsBlur}
                onKeyDown={handleKeyDown}
                placeholder="1540"
                className="currency-input-field ars"
                title="Ajusta el valor en Pesos Argentinos (ARS) de 1 Dólar"
                aria-label="Pesos Argentinos por 1 USD"
              />
              <span className="pill-currency-code">ARS</span>
            </div>
          </div>

          <div className="currency-widget-presets">
            <button
              type="button"
              className={`widget-preset-chip ${Number(exchangeRate) === 1540 ? 'active' : ''}`}
              onClick={() => handleQuickPreset(1540)}
              title="Precio de compra en cuevas (cambiar USD a ARS)"
            >
              1.540 (Compra)
            </button>
            <button
              type="button"
              className={`widget-preset-chip ${Number(exchangeRate) === 1560 ? 'active' : ''}`}
              onClick={() => handleQuickPreset(1560)}
              title="Precio de venta en cuevas"
            >
              1.560 (Venta)
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
