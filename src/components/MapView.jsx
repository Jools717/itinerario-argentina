import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink, Filter, Calendar } from 'lucide-react';
import { INITIAL_DAYS } from '../data/initialData';
import { getGoogleMapsTransitUrl, getCategoryBadge } from '../utils/helpers';

export default function MapView({ activities, selectedActivity, onSelectActivity }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [filterDay, setFilterDay] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Filter activities that have valid coordinates
  const validActivities = activities.filter(a => a.coords && a.coords.length === 2);

  const filteredPlaces = validActivities.filter(a => {
    if (filterDay !== 'all' && a.dayNumber !== Number(filterDay)) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of Buenos Aires (near Obelisco / Plaza de Mayo)
      const map = L.map(mapContainerRef.current, {
        center: [-34.6037, -58.3816],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Voyager tiles (clean, beautiful, high-contrast typography)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when filters or activities change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredPlaces.forEach(act => {
      const [lat, lng] = act.coords;
      const catBadge = getCategoryBadge(act.category);
      const mapsUrl = getGoogleMapsTransitUrl(act);

      // Create a modern custom pin
      const customIcon = L.divIcon({
        className: 'custom-map-marker-wrapper',
        html: `
          <div class="custom-marker-pin" style="background-color: ${catBadge.color}">
            <span class="marker-day-number">D${act.dayNumber}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header">
            <span class="popup-day-tag">Día ${act.dayNumber} · ${act.barrio}</span>
            <span class="popup-time">${act.time} hs</span>
          </div>
          <h4 class="popup-title">${act.title}</h4>
          ${act.address ? `<p class="popup-address">📍 ${act.address}</p>` : ''}
          ${act.tip ? `<p class="popup-tip">💡 ${act.tip}</p>` : ''}
          <div class="popup-footer">
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-maps-btn">
              <span>Cómo llegar (Google Maps)</span>
              <span class="btn-arrow">↗</span>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current.addLayer(marker);
      bounds.extend([lat, lng]);

      // If this was selected specifically
      if (selectedActivity && selectedActivity.id === act.id) {
        setTimeout(() => {
          marker.openPopup();
          mapInstanceRef.current.setView([lat, lng], 15);
        }, 150);
      }
    });

    if (filteredPlaces.length > 0 && !selectedActivity) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredPlaces, selectedActivity]);

  return (
    <div className="map-view-container">
      {/* Controls & Filter bar */}
      <div className="map-controls-card">
        <div className="map-controls-row">
          
          <div className="control-field">
            <label className="control-label">
              <Calendar size={14} />
              <span>Filtrar por Día:</span>
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="map-filter-select"
            >
              <option value="all">Todos los días (14 Días)</option>
              {INITIAL_DAYS.map(d => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  Día {d.dayNumber}: {d.barrioPrincipal}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label className="control-label">
              <Filter size={14} />
              <span>Categoría:</span>
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="map-filter-select"
            >
              <option value="all">Todas las categorías</option>
              <option value="gastronomia">Gastronomía & Bares</option>
              <option value="cultura">Cultura & Monumentos</option>
              <option value="naturaleza">Parques & Naturaleza</option>
              <option value="vida_nocturna">Vida Nocturna & Tango</option>
              <option value="compras">Compras & Alfajores</option>
              <option value="transporte">Transporte & Llegadas</option>
            </select>
          </div>

          <div className="map-quick-count">
            <strong>{filteredPlaces.length}</strong> puntos marcados
          </div>

        </div>
      </div>

      {/* Map Container */}
      <div className="map-canvas-wrapper">
        <div ref={mapContainerRef} className="leaflet-map-element" />
      </div>

      {/* Quick Transit Legend / Hint */}
      <div className="map-transit-legend">
        <p>
          💡 <strong>Tip de navegación:</strong> Toca cualquier marcador para ver detalles y presiona 
          <strong> "¿Cómo llegar?"</strong> para que tu celular abra la app de <strong>Google Maps</strong> con la combinación óptima de <strong>Subte o Colectivo</strong> desde tu ubicación actual.
        </p>
      </div>

    </div>
  );
}
