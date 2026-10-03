import React, { useState } from 'react';
import { 
  Bus, CreditCard, ShieldCheck, Zap, UtensilsCrossed, Smartphone, 
  Map, CheckCircle, ExternalLink, HelpCircle, AlertCircle
} from 'lucide-react';
import { SURVIVAL_TIPS } from '../data/initialData';

export default function SurvivalGuide() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todos los Tips' },
    { id: 'Transporte & SUBE', label: 'Transporte & SUBE' },
    { id: 'Dinero & Pagos', label: 'Dinero & Tarjetas' },
    { id: 'Enchufes & Tecnología', label: 'Enchufes & Tech' },
    { id: 'Seguridad Urbana', label: 'Seguridad Porteña' },
    { id: 'Gastronomía Porteña', label: 'Comida & Costumbres' }
  ];

  const filteredTips = activeCategory === 'all'
    ? SURVIVAL_TIPS
    : SURVIVAL_TIPS.filter(t => t.category === activeCategory);

  return (
    <div className="survival-guide-view">
      
      {/* Intro Header */}
      <div className="survival-hero-card">
        <div className="hero-text-content">
          <span className="hero-eyebrow">Manual del Viajero Inteligente</span>
          <h2>Todo lo que necesitas saber en Buenos Aires</h2>
          <p>
            Moverse por la Ciudad Autónoma de Buenos Aires (CABA) es súper fácil y económico una vez 
            que dominas el <strong>Subte</strong>, los <strong>colectivos</strong> y la <strong>tarjeta SUBE</strong>.
          </p>
        </div>

        {/* Quick App Recommendation Badges */}
        <div className="essential-apps-card">
          <h4>📱 Apps esenciales en tu celular:</h4>
          <div className="app-chips-grid">
            <div className="app-chip">
              <span className="app-name">Google Maps</span>
              <span className="app-desc">Rutas en Subte y Bus</span>
            </div>
            <div className="app-chip">
              <span className="app-name">Cabify & Uber</span>
              <span className="app-desc">Taxis y remises seguros</span>
            </div>
            <div className="app-chip">
              <span className="app-name">Carga SUBE</span>
              <span className="app-desc">Recarga con NFC</span>
            </div>
            <div className="app-chip">
              <span className="app-name">BA Cómo Llego</span>
              <span className="app-desc">App oficial de la ciudad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subte Lines Cheat Sheet */}
      <div className="subte-cheat-sheet">
        <div className="subte-header">
          <Map size={20} className="text-sky" />
          <h3>Guía Rápida de Líneas del Subte (Metro)</h3>
        </div>
        <div className="subte-lines-grid">
          <div className="subte-line-card line-a">
            <span className="line-circle">A</span>
            <div>
              <strong>Línea A (Celeste):</strong> Plaza de Mayo ↔ San Pedrito. (Pasa por Congreso y Av. de Mayo).
            </div>
          </div>
          <div className="subte-line-card line-b">
            <span className="line-circle">B</span>
            <div>
              <strong>Línea B (Roja):</strong> L.N. Alem ↔ J.M. de Rosas. (Calle Corrientes, teatros, Güerrin, Chacarita).
            </div>
          </div>
          <div className="subte-line-card line-c">
            <span className="line-circle">C</span>
            <div>
              <strong>Línea C (Azul):</strong> Retiro ↔ Constitución. (Conecta las dos terminales ferroviarias principales).
            </div>
          </div>
          <div className="subte-line-card line-d">
            <span className="line-circle">D</span>
            <div>
              <strong>Línea D (Verde):</strong> Catedral ↔ Congreso de Tucumán. (Conecta Centro, Recoleta y Palermo).
            </div>
          </div>
          <div className="subte-line-card line-e">
            <span className="line-circle">E</span>
            <div>
              <strong>Línea E (Violeta):</strong> Retiro ↔ Plaza de los Virreyes. (San Telmo y conexiones sur).
            </div>
          </div>
          <div className="subte-line-card line-h">
            <span className="line-circle">H</span>
            <div>
              <strong>Línea H (Amarilla):</strong> Facultad de Derecho ↔ Hospitales. (Línea transversal moderna).
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="guide-categories-nav">
        {categories.map(c => (
          <button
            key={c.id}
            className={`guide-cat-btn ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tips Cards Grid */}
      <div className="tips-grid">
        {filteredTips.map((tip, idx) => (
          <div key={idx} className="tip-card">
            <div className="tip-card-top">
              <span className="tip-badge">{tip.badge}</span>
              <span className="tip-cat-name">{tip.category}</span>
            </div>
            <h4 className="tip-title">{tip.title}</h4>
            <p className="tip-body">{tip.content}</p>
          </div>
        ))}
      </div>

      {/* Crucial Argentine Expressions */}
      <div className="slang-card">
        <h3>🇦🇷 Diccionario de supervivencia porteña:</h3>
        <div className="slang-grid">
          <div className="slang-item">
            <strong>"Colectivo" / "Bondi"</strong> = El bus urbano.
          </div>
          <div className="slang-item">
            <strong>"Subte"</strong> = El metro subterráneo.
          </div>
          <div className="slang-item">
            <strong>"Bife de chorizo"</strong> = Corte tierno y jugoso de carne de res (sirloin/strip).
          </div>
          <div className="slang-item">
            <strong>"Fugazzeta"</strong> = Pizza rellena de queso con cebolla caramelizada por encima.
          </div>
          <div className="slang-item">
            <strong>"Che / Boludo"</strong> = Trato coloquial amistoso entre amigos.
          </div>
          <div className="slang-item">
            <strong>"De una"</strong> = ¡Totalmente / Claro que sí!
          </div>
        </div>
      </div>

    </div>
  );
}
