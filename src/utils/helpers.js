// Utilidades de mapas, enlaces y persistencia con colores pasteles claros

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
    transporte: { label: "Transporte", bg: "#e0f2fe", color: "#0284c7", icon: "Bus" },
    cultura: { label: "Cultura & Paseo", bg: "#ede9fe", color: "#6d28d9", icon: "Landmark" },
    gastronomia: { label: "Gastronomía", bg: "#fef3c7", color: "#b45309", icon: "Utensils" },
    naturaleza: { label: "Naturaleza & Parques", bg: "#d1fae5", color: "#047857", icon: "Trees" },
    compras: { label: "Compras", bg: "#fce7f3", color: "#be185d", icon: "ShoppingBag" },
    vida_nocturna: { label: "Vida Nocturna", bg: "#e0e7ff", color: "#4338ca", icon: "Moon" },
    relax: { label: "Relax & Casa", bg: "#ccfbf1", color: "#0f766e", icon: "Coffee" },
    mercado: { label: "Mercado Casa", bg: "#dcfce7", color: "#15803d", icon: "ShoppingCart" }
  };
  return map[category] || { label: "General", bg: "#f1f5f9", color: "#475569", icon: "MapPin" };
};
