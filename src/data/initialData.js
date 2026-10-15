// Datos reales del viaje a Buenos Aires (10 al 23 de Octubre de 2026)

export const TRIP_INFO = {
  destination: "Buenos Aires, Argentina",
  arrivalDate: "2026-10-10T05:30:00",
  departureDate: "2026-10-23T15:30:00",
  hostNote: "Control de gastos y registro en tiempo real del viaje en Buenos Aires.",
  defaultExchangeRateUSD: 1520 // Tasa pactada inicial
};

export const CASH_EXCHANGE_INFO = {
  initialUSDChanged: 0,
  totalArsAgreed: 0,
  effectiveRate: 1520,
  cashDeliveries: [],
  totalCashReceived: 0,
  cashPending: 0
};

export const SUBE_STATUS_INFO = {
  totalRechargedARS: 0,
  currentBalanceARS: 0,
  totalUsedARS: 0,
  note: ""
};

export const INITIAL_DAYS = [
  {
    dayNumber: 1,
    date: "2026-10-10",
    dateFormatted: "Sábado 10 de Octubre",
    barrioPrincipal: "Día 1",
    badgeColor: "#38bdf8",
    summary: "Planes del Día 1",
    isDepartureDay: false
  },
  {
    dayNumber: 2,
    date: "2026-10-11",
    dateFormatted: "Domingo 11 de Octubre",
    barrioPrincipal: "Día 2",
    badgeColor: "#fbbf24",
    summary: "Planes del Día 2",
    isDepartureDay: false
  },
  {
    dayNumber: 3,
    date: "2026-10-12",
    dateFormatted: "Lunes 12 de Octubre",
    barrioPrincipal: "Día 3",
    badgeColor: "#818cf8",
    summary: "Planes del Día 3",
    isDepartureDay: false
  },
  {
    dayNumber: 4,
    date: "2026-10-13",
    dateFormatted: "Martes 13 de Octubre",
    barrioPrincipal: "Día 4",
    badgeColor: "#34d399",
    summary: "Planes del Día 4",
    isDepartureDay: false
  },
  {
    dayNumber: 5,
    date: "2026-10-14",
    dateFormatted: "Miércoles 14 de Octubre",
    barrioPrincipal: "Día 5",
    badgeColor: "#f472b6",
    summary: "Planes del Día 5",
    isDepartureDay: false
  },
  {
    dayNumber: 6,
    date: "2026-10-15",
    dateFormatted: "Jueves 15 de Octubre",
    barrioPrincipal: "Día 6",
    badgeColor: "#a78bfa",
    summary: "Planes del Día 6",
    isDepartureDay: false
  },
  {
    dayNumber: 7,
    date: "2026-10-16",
    dateFormatted: "Viernes 16 de Octubre",
    barrioPrincipal: "Día 7",
    badgeColor: "#fb7185",
    summary: "Planes del Día 7",
    isDepartureDay: false
  },
  {
    dayNumber: 8,
    date: "2026-10-17",
    dateFormatted: "Sábado 17 de Octubre",
    barrioPrincipal: "Día 8",
    badgeColor: "#38bdf8",
    summary: "Planes del Día 8",
    isDepartureDay: false
  },
  {
    dayNumber: 9,
    date: "2026-10-18",
    dateFormatted: "Domingo 18 de Octubre",
    barrioPrincipal: "Día 9",
    badgeColor: "#fbbf24",
    summary: "Planes del Día 9",
    isDepartureDay: false
  },
  {
    dayNumber: 10,
    date: "2026-10-19",
    dateFormatted: "Lunes 19 de Octubre",
    barrioPrincipal: "Día 10",
    badgeColor: "#818cf8",
    summary: "Planes del Día 10",
    isDepartureDay: false
  },
  {
    dayNumber: 11,
    date: "2026-10-20",
    dateFormatted: "Martes 20 de Octubre",
    barrioPrincipal: "Día 11",
    badgeColor: "#34d399",
    summary: "Planes del Día 11",
    isDepartureDay: false
  },
  {
    dayNumber: 12,
    date: "2026-10-21",
    dateFormatted: "Miércoles 21 de Octubre",
    barrioPrincipal: "Día 12",
    badgeColor: "#f472b6",
    summary: "Planes del Día 12",
    isDepartureDay: false
  },
  {
    dayNumber: 13,
    date: "2026-10-22",
    dateFormatted: "Jueves 22 de Octubre",
    barrioPrincipal: "Día 13",
    badgeColor: "#a78bfa",
    summary: "Planes del Día 13",
    isDepartureDay: false
  },
  {
    dayNumber: 14,
    date: "2026-10-23",
    dateFormatted: "Viernes 23 de Octubre",
    barrioPrincipal: "Día 14 • Regreso",
    badgeColor: "#fb7185",
    summary: "Día de salida y vuelo de regreso.",
    isDepartureDay: true
  }
];

// Base de datos limpia: Inicializada en vacío para recibir los nuevos planes y gastos
export const INITIAL_ACTIVITIES = [];

export const INITIAL_EXPENSES = [];

export const INITIAL_CHECKLIST = [];
