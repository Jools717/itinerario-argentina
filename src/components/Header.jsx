import React, { useState, useEffect } from 'react';
import { Compass, Calendar, DollarSign, Download, Upload, Share2, CheckCircle2, Heart } from 'lucide-react';
import { TRIP_INFO } from '../data/initialData';

export default function Header({ 
  activitiesCount, 
  completedCount, 
  totalSpentARS, 
  exchangeRate, 
  onExportData, 
  onImportData 
}) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

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
            <div className="brand-badge">Viaje a Buenos Aires • Primavera 2026</div>
            <h1 className="brand-title">Mi Itinerario Porteño</h1>
            <p className="brand-subtitle">
              Sábado 10 al Viernes 23 de Octubre • Quedándome con mi amiga
            </p>
          </div>
        </div>

        {/* Stats Badges */}
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

          <div className="stat-pill">
            <DollarSign className="stat-icon text-amber" size={16} />
            <div className="stat-text">
              <span className="stat-label">Gastos</span>
              <span className="stat-value">
                ${Math.round(totalSpentARS / (exchangeRate || 1280))} USD
              </span>
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
