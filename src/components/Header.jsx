import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, Download, Upload, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import { TRIP_INFO } from '../data/initialData';
import { formatCurrencyARS, formatCurrencyUSD } from '../utils/helpers';

export default function Header({ 
  activitiesCount, 
  completedCount, 
  totalSpentARS, 
  exchangeRate, 
  cloudSyncStatus = 'offline',
  onExportData, 
  onImportData,
  onNavigateToBudget
}) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  const BUDGET_CAP_USD = 1000; // Tope máximo de $1,000 USD
  const totalSpentUSD = totalSpentARS / (exchangeRate || 1280);
  const remainingUSD = Math.max(0, BUDGET_CAP_USD - totalSpentUSD);
  const budgetPercentage = Math.min(100, Math.round((totalSpentUSD / BUDGET_CAP_USD) * 100));

  useEffect(() => {
    const target = new Date(TRIP_INFO.arrivalDate);
    const now = new Date();
    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setDaysLeft(days > 0 ? days : 0);
  }, []);

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "Mi Itinerario Buenos Aires 2026",
        text: "Aquí está nuestro itinerario para Buenos Aires (10 al 23 de Octubre)!",
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            onImportData(data);
          } catch (err) {
            alert('Error al leer el archivo JSON.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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

        {/* Actions (Share, Backup) */}
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={handleShare}
            title="Compartir enlace o guardar en WhatsApp"
            aria-label="Compartir"
          >
            <Share2 size={16} />
            <span className="btn-label">{copiedShare ? "¡Copiado!" : "Compartir"}</span>
          </button>

          <button 
            className="action-btn"
            onClick={onExportData}
            title="Descargar copia de seguridad en JSON"
            aria-label="Exportar"
          >
            <Download size={16} />
            <span className="btn-label">Backup</span>
          </button>

          <button 
            className="action-btn"
            onClick={handleImportClick}
            title="Importar itinerario guardado"
            aria-label="Importar"
          >
            <Upload size={16} />
            <span className="btn-label">Restaurar</span>
          </button>
        </div>

      </div>
    </header>
  );
}
