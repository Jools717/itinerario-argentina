// Utilidades de mapas, enlaces y persistencia

export const getGoogleMapsTransitUrl = (activity) => {
  if (activity.coords && activity.coords.length === 2) {
    const [lat, lng] = activity.coords;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
  }
  const query = encodeURIComponent(`${activity.address || activity.title}, Buenos Aires, Argentina`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=transit`;
};

export const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const formatCurrencyUSD = (amountARS, rate = 1280) => {
  const usd = (amountARS || 0) / (rate || 1280);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 1
  }).format(usd);
};

export const getCategoryBadge = (category) => {
  const map = {
    transporte: { label: "Transporte", bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", icon: "Bus" },
    cultura: { label: "Cultura & Paseo", bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", icon: "Landmark" },
    gastronomia: { label: "Gastronomía", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", icon: "Utensils" },
    naturaleza: { label: "Naturaleza & Parques", bg: "rgba(34, 197, 94, 0.15)", color: "#4ade80", icon: "Trees" },
    compras: { label: "Compras", bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6", icon: "ShoppingBag" },
    vida_nocturna: { label: "Vida Nocturna", bg: "rgba(129, 140, 248, 0.15)", color: "#a5b4fc", icon: "Moon" },
    relax: { label: "Relax & Casa", bg: "rgba(20, 184, 166, 0.15)", color: "#2dd4bf", icon: "Coffee" },
    mercado: { label: "Mercado Casa", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", icon: "ShoppingCart" }
  };
  return map[category] || { label: "General", bg: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", icon: "MapPin" };
};
