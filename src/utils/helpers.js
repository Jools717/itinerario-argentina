// Utilidades de mapas, enlaces y persistencia con soporte de Dólar Blue y Pesos Argentinos

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

export const formatCurrencyUSD = (amountARS, rate = 1540) => {
  const safeRate = (Number(rate) && Number(rate) >= 100) ? Number(rate) : 1540;
  const usd = (amountARS || 0) / safeRate;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(usd);
};

export const convertUsdToArs = (amountUSD, rate = 1540) => {
  const safeRate = (Number(rate) && Number(rate) >= 100) ? Number(rate) : 1540;
  return Math.round((amountUSD || 0) * safeRate);
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

/**
 * Universal number parser supporting Latin American / Argentine / Colombian currency notation:
 * - Divisores de miles con punto o coma: "19.741" -> 19741, "19,741" -> 19741, "1.019.741" -> 1019741
 * - Decimales estándar: "19.741,50" -> 19741.5, "19,741.50" -> 19741.5, "19.741.00" -> 19741
 * - Cantidades decimales: "1.25" -> 1.25, "0.50" -> 0.5
 * - Formato simple: "19741" -> 19741
 */
export const parseCurrencyNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).replace(/[^0-9.,]/g, '').trim();
  if (!s) return 0;

  // Case 1: Both dot and comma present (e.g. 19.741,50 or 19,741.50)
  if (s.includes('.') && s.includes(',')) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // 19.741,50 -> dot is thousands, comma is decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 19,741.50 -> comma is thousands, dot is decimal
      s = s.replace(/,/g, '');
    }
  } 
  // Case 2: Only dots present
  else if (s.includes('.') && !s.includes(',')) {
    const parts = s.split('.');
    if (parts.length > 2) {
      // e.g. 1.019.741 or 19.741.00
      const lastPart = parts[parts.length - 1];
      if (lastPart.length === 2) {
        // e.g. 19.741.00 (POS ticket with .00 cents)
        s = parts.slice(0, -1).join('') + '.' + lastPart;
      } else {
        // 1.019.741 -> 1019741
        s = parts.join('');
      }
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // Thousands separator! 19.741 -> 19741
        s = parts[0] + parts[1];
      }
      // If 1 or 2 digits, keep as decimal (e.g. 1.25 kg, 0.5)
    }
  } 
  // Case 3: Only commas present
  else if (s.includes(',') && !s.includes('.')) {
    const parts = s.split(',');
    if (parts.length > 2) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.length === 2) {
        s = parts.slice(0, -1).join('') + '.' + lastPart;
      } else {
        s = parts.join('');
      }
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        // Thousands separator! 19,741 -> 19741
        s = parts[0] + parts[1];
      } else {
        // Decimal: 19,5 -> 19.5
        s = s.replace(',', '.');
      }
    }
  }

  const valNum = parseFloat(s);
  return isNaN(valNum) ? 0 : valNum;
};

/**
 * Normalizes an arithmetic expression with thousands separators so eval/Function evaluates correctly:
 * - "19.741 + 5.000" -> "19741 + 5000" = 24741
 * - "1.019.741" -> "1019741"
 */
export const cleanCalcExpression = (expr) => {
  if (!expr || typeof expr !== 'string') return '';
  let s = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // Loop to remove all thousands dots/commas
  let prev;
  do {
    prev = s;
    s = s.replace(/(\d+)[.,](\d{3})(?!\d)/g, '$1$2');
  } while (s !== prev);

  // Remaining commas with decimals (e.g. 1,5) become 1.5
  s = s.replace(/,/g, '.');
  return s;
};

