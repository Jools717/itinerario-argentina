// Datos reales del viaje a Buenos Aires (10 al 14 de Octubre de 2026)

export const TRIP_INFO = {
  destination: "Buenos Aires, Argentina",
  arrivalDate: "2026-10-10T05:30:00",
  departureDate: "2026-10-23T15:30:00",
  hostNote: "Control de gastos y registro real del viaje en Buenos Aires.",
  defaultExchangeRateUSD: 1520 // Tasa pactada: ARS 760.000 recibidos por USD 500 cambiados ($1.520 ARS por USD)
};

export const CASH_EXCHANGE_INFO = {
  initialUSDChanged: 500,
  totalArsAgreed: 760000,
  effectiveRate: 1520,
  cashDeliveries: [
    { date: "2026-10-10", label: "Sábado (madrugada)", amountARS: 250000 },
    { date: "2026-10-12", label: "Lunes", amountARS: 240000 }
  ],
  totalCashReceived: 490000,
  cashPending: 270000
};

export const SUBE_STATUS_INFO = {
  totalRechargedARS: 10000,
  currentBalanceARS: 3500,
  totalUsedARS: 6500,
  note: "El transporte del lunes está incluido en los movimientos de la SUBE, por lo que no se suma como un gasto adicional."
};

export const INITIAL_DAYS = [
  {
    dayNumber: 1,
    date: "2026-10-10",
    dateFormatted: "Sábado 10 de Octubre",
    barrioPrincipal: "Palermo • Ecoparque y salida",
    badgeColor: "#38bdf8",
    summary: "Llegada a Buenos Aires, visita al Ecoparque, tarde de café y postre, y salida nocturna en Bellgamba.",
    isDepartureDay: false
  },
  {
    dayNumber: 2,
    date: "2026-10-11",
    dateFormatted: "Domingo 11 de Octubre",
    barrioPrincipal: "San Telmo • Feria, Compras, Fonda y Noche",
    badgeColor: "#fbbf24",
    summary: "Recarga de SUBE, compras tradicionales en San Telmo (pezuña, imanes, peluches, mates), comida en Alberro Fonda, bar y discoteca.",
    isDepartureDay: false
  },
  {
    dayNumber: 3,
    date: "2026-10-12",
    dateFormatted: "Lunes 12 de Octubre",
    barrioPrincipal: "La Boca • Museo, Pizza & Alfajores",
    badgeColor: "#818cf8",
    summary: "Recorrido en La Boca con transporte SUBE cubierto, entrada al museo, pizza porteña y alfajores de recuerdo.",
    isDepartureDay: false
  },
  {
    dayNumber: 4,
    date: "2026-10-13",
    dateFormatted: "Martes 13 de Octubre",
    barrioPrincipal: "Recoleta & Puerto Madero • Cementerio y Gastronomía",
    badgeColor: "#34d399",
    summary: "Circuito histórico en Recoleta (Cementerio de la Recoleta) y paseo gastronómico en Puerto Madero.",
    isDepartureDay: false
  }
];

export const INITIAL_ACTIVITIES = [
  // ==========================================
  // DÍA 1 (SÁBADO 10 OCT) – ECOPARQUE Y SALIDA
  // ==========================================
  {
    id: "act-1-1",
    dayNumber: 1,
    time: "14:30",
    period: "tarde",
    title: "🦁 Entrada y Visita al Ecoparque",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Av. Sarmiento 2601 / Plaza Italia, Palermo",
    coords: [-34.5802, -58.4190],
    description: "Recorrido por el Ecoparque de Buenos Aires disfrutando de la flora autóctona y fauna libre en Palermo.",
    tip: "Entrada ARS 22.650 abonada con tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 22650
  },
  {
    id: "act-1-2",
    dayNumber: 1,
    time: "17:30",
    period: "tarde",
    title: "☕ Café y Postre",
    barrio: "Palermo",
    category: "gastronomia",
    address: "Cafetería de Especialidad, Palermo",
    coords: [-34.5855, -58.4230],
    description: "Merienda de café y postre para recargar energías por la tarde.",
    tip: "Gasto de ARS 32.000 abonado con tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 32000
  },
  {
    id: "act-1-3",
    dayNumber: 1,
    time: "21:30",
    period: "noche",
    title: "🍻 Gastos en Bellgamba",
    barrio: "Palermo",
    category: "gastronomia",
    address: "Bellgamba Bodegón, Buenos Aires",
    coords: [-34.5930, -58.4210],
    description: "Cena y tragos en el tradicional bodegón Bellgamba cerrando la noche de bienvenida.",
    tip: "Gasto de ARS 50.000 abonado con mi tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 50000
  },
  {
    id: "act-1-4",
    dayNumber: 1,
    time: "01:30",
    period: "noche",
    title: "💵 Entrega de Efectivo Sencillo (Madrugada)",
    barrio: "Buenos Aires",
    category: "varios",
    address: "Buenos Aires",
    coords: [-34.5900, -58.4200],
    description: "Primera entrega del cambio de dólares en efectivo sencillo para los gastos diarios.",
    tip: "Recibí ARS 250.000 en efectivo.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 0
  },

  // ==========================================
  // DÍA 2 (DOMINGO 11 OCT) – SAN TELMO
  // ==========================================
  {
    id: "act-2-1",
    dayNumber: 2,
    time: "11:00",
    period: "mañana",
    title: "🚇 Recarga de la Tarjeta SUBE",
    barrio: "San Telmo",
    category: "transporte",
    address: "Estación de Subte / Kiosco, San Telmo",
    coords: [-34.6178, -58.3740],
    description: "Carga de saldo a la tarjeta SUBE para viajes en transporte público (Subte y colectivos).",
    tip: "Recarga por ARS 10.000. Cubrió los viajes de domingo y lunes.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 10000
  },
  {
    id: "act-2-2",
    dayNumber: 2,
    time: "12:30",
    period: "tarde",
    title: "🛍️ Compras en Feria de San Telmo",
    barrio: "San Telmo",
    category: "compras",
    address: "Plaza Dorrego & Calle Defensa, San Telmo",
    coords: [-34.6205, -58.3725],
    description: "Compras de recuerdos y artesanías: Pezuña ($35.000), Imanes ($12.000), Peluches de Messi y Maradona ($12.000), Mates con nombres ($9.000) y Medias 3 pares ($15.000).",
    tip: "Total en compras: ARS 83.000 pagados en efectivo.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 83000
  },
  {
    id: "act-2-3",
    dayNumber: 2,
    time: "14:30",
    period: "tarde",
    title: "🌭 Comida en Alberro Fonda",
    barrio: "San Telmo",
    category: "gastronomia",
    address: "Alberro Fonda, Defensa y Carlos Calvo, San Telmo",
    coords: [-34.6190, -58.3735],
    description: "Almuerzo típico porteño: 2 choripanes al pan, 1 fernet y 1 Coca-Cola.",
    tip: "Total de ARS 40.000.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 40000
  },
  {
    id: "act-2-4",
    dayNumber: 2,
    time: "21:00",
    period: "noche",
    title: "🍸 Parada en Bar",
    barrio: "San Telmo",
    category: "gastronomia",
    address: "Bar de Tragos, San Telmo",
    coords: [-34.6180, -58.3720],
    description: "Cocktails y tragos de noche.",
    tip: "Gasto de ARS 17.000 abonado con tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 17000
  },
  {
    id: "act-2-5",
    dayNumber: 2,
    time: "01:00",
    period: "noche",
    title: "🪩 Discoteca (Madrugada del Lunes)",
    barrio: "Buenos Aires",
    category: "gastronomia",
    address: "Club Nocturno, Buenos Aires",
    coords: [-34.5800, -58.3900],
    description: "Salida nocturna de fiesta y baile.",
    tip: "Gasto de ARS 30.000 abonado con tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 30000
  },

  // ==========================================
  // DÍA 3 (LUNES 12 OCT) – LA BOCA
  // ==========================================
  {
    id: "act-3-1",
    dayNumber: 3,
    time: "11:00",
    period: "mañana",
    title: "💵 Segunda Entrega de Efectivo Sencillo",
    barrio: "Buenos Aires",
    category: "varios",
    address: "Buenos Aires",
    coords: [-34.6000, -58.3800],
    description: "Segunda cuota del cambio de dólares en efectivo sencillo.",
    tip: "Recibí otros ARS 240.000 (Total entregado a la fecha: ARS 490.000 de los 760.000).",
    withFriend: true,
    completed: true,
    costEstimatedARS: 0
  },
  {
    id: "act-3-2",
    dayNumber: 3,
    time: "12:00",
    period: "tarde",
    title: "🚌 Transporte a La Boca (SUBE)",
    barrio: "La Boca",
    category: "transporte",
    address: "Colectivo hacia La Boca",
    coords: [-34.6345, -58.3630],
    description: "Traslado en colectivo a La Boca utilizando la tarjeta SUBE recargada el domingo.",
    tip: "ARS 0 adicional (cubierto con saldo de la SUBE).",
    withFriend: true,
    completed: true,
    costEstimatedARS: 0
  },
  {
    id: "act-3-3",
    dayNumber: 3,
    time: "13:00",
    period: "tarde",
    title: "🎟️ Entrada al Museo",
    barrio: "La Boca",
    category: "cultura",
    address: "Museo en La Boca, Buenos Aires",
    coords: [-34.6394, -58.3628],
    description: "Visita cultural y artística al museo en el barrio de La Boca.",
    tip: "Entrada ARS 47.000.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 47000
  },
  {
    id: "act-3-4",
    dayNumber: 3,
    time: "15:00",
    period: "tarde",
    title: "🍕 Almuerzo de Pizza Porteña",
    barrio: "La Boca",
    category: "gastronomia",
    address: "Pizzería tradicional, La Boca",
    coords: [-34.6370, -58.3640],
    description: "Clásica pizza al molde porteña con abundante muzzarella.",
    tip: "Gasto de ARS 16.000.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 16000
  },
  {
    id: "act-3-5",
    dayNumber: 3,
    time: "17:00",
    period: "tarde",
    title: "🍬 Compra de Alfajores (12 unidades)",
    barrio: "La Boca / San Telmo",
    category: "compras",
    address: "Tienda de Alfajores, Buenos Aires",
    coords: [-34.6380, -58.3630],
    description: "Caja de 12 alfajores tradicionales argentinos de dulce de leche.",
    tip: "Total ARS 26.000.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 26000
  },

  // ==========================================
  // DÍA 4 (MARTES 13 OCT) – RECOLETA Y PUERTO MADERO
  // ==========================================
  {
    id: "act-4-1",
    dayNumber: 4,
    time: "11:30",
    period: "mañana",
    title: "🚌 Transporte de Ida y Vuelta",
    barrio: "Recoleta",
    category: "transporte",
    address: "Buenos Aires (Colectivos / Subte)",
    coords: [-34.5880, -58.3930],
    description: "Traslado en transporte público para el circuito de Recoleta y Puerto Madero.",
    tip: "Gasto total de ARS 4.500.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 4500
  },
  {
    id: "act-4-2",
    dayNumber: 4,
    time: "13:30",
    period: "tarde",
    title: "⚰️ Entrada al Cementerio de la Recoleta",
    barrio: "Recoleta",
    category: "cultura",
    address: "Junín 1760, Recoleta",
    coords: [-34.5879, -58.3927],
    description: "Visita histórica y arquitectónica a los mausoleos de mármol y bóvedas en Recoleta.",
    tip: "ARS 27.000 abonado con tarjeta de crédito Nu.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 27000
  },
  {
    id: "act-4-3",
    dayNumber: 4,
    time: "17:30",
    period: "tarde",
    title: "🍽️ Comida y Bebida en Puerto Madero",
    barrio: "Puerto Madero",
    category: "gastronomia",
    address: "Diques de Puerto Madero, Av. Alicia Moreau de Justo",
    coords: [-34.6080, -58.3660],
    description: "Comida completa y bebidas disfrutando de los diques de Puerto Madero.",
    tip: "ARS 67.600 abonado con tarjeta.",
    withFriend: true,
    completed: true,
    costEstimatedARS: 67600
  }
];

export const INITIAL_EXPENSES = [
  // Sábado 10 de octubre
  {
    id: "exp-1",
    date: "2026-10-10",
    concept: "Entrada al Ecoparque",
    category: "cultura",
    amountARS: 22650,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Entrada general"
  },
  {
    id: "exp-2",
    date: "2026-10-10",
    concept: "Café y postre",
    category: "gastronomia",
    amountARS: 32000,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Merienda cafetería"
  },
  {
    id: "exp-3",
    date: "2026-10-10",
    concept: "Gastos en Bellgamba",
    category: "gastronomia",
    amountARS: 50000,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Cena bodegón"
  },

  // Domingo 11 de octubre
  {
    id: "exp-4",
    date: "2026-10-11",
    concept: "Recarga de la tarjeta SUBE",
    category: "transporte",
    amountARS: 10000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Recarga en boletería / kiosco"
  },
  {
    id: "exp-5",
    date: "2026-10-11",
    concept: "Compras: Pezuña",
    category: "compras",
    amountARS: 35000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Feria San Telmo"
  },
  {
    id: "exp-6",
    date: "2026-10-11",
    concept: "Compras: Imanes",
    category: "compras",
    amountARS: 12000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Feria San Telmo"
  },
  {
    id: "exp-7",
    date: "2026-10-11",
    concept: "Compras: Peluches de Messi y Maradona",
    category: "compras",
    amountARS: 12000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Feria San Telmo"
  },
  {
    id: "exp-8",
    date: "2026-10-11",
    concept: "Compras: Mates con nombres",
    category: "compras",
    amountARS: 9000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Feria San Telmo"
  },
  {
    id: "exp-9",
    date: "2026-10-11",
    concept: "Compras: Medias (3 pares)",
    category: "compras",
    amountARS: 15000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Feria San Telmo"
  },
  {
    id: "exp-10",
    date: "2026-10-11",
    concept: "Alberro Fonda: 2 choripanes, 1 fernet y 1 Coca-Cola",
    category: "gastronomia",
    amountARS: 40000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Almuerzo en San Telmo"
  },
  {
    id: "exp-11",
    date: "2026-10-11",
    concept: "Bar",
    category: "gastronomia",
    amountARS: 17000,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Tragos de noche"
  },
  {
    id: "exp-12",
    date: "2026-10-11",
    concept: "Discoteca (madrugada del lunes)",
    category: "gastronomia",
    amountARS: 30000,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Salida nocturna"
  },

  // Lunes 12 de octubre
  {
    id: "exp-13",
    date: "2026-10-12",
    concept: "Entrada al museo",
    category: "cultura",
    amountARS: 47000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "La Boca"
  },
  {
    id: "exp-14",
    date: "2026-10-12",
    concept: "Pizza",
    category: "gastronomia",
    amountARS: 16000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "La Boca"
  },
  {
    id: "exp-15",
    date: "2026-10-12",
    concept: "Alfajores (12 unidades)",
    category: "compras",
    amountARS: 26000,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Recuerdo tradicional"
  },

  // Martes 13 de octubre
  {
    id: "exp-16",
    date: "2026-10-13",
    concept: "Transporte de ida y vuelta",
    category: "transporte",
    amountARS: 4500,
    paymentMethod: "efectivo",
    paidBy: "Efectivo",
    note: "Colectivo / Subte"
  },
  {
    id: "exp-17",
    date: "2026-10-13",
    concept: "Entrada al Cementerio de la Recoleta",
    category: "cultura",
    amountARS: 27000,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Tarjeta de crédito Nu"
  },
  {
    id: "exp-18",
    date: "2026-10-13",
    concept: "Comida y bebida en Puerto Madero",
    category: "gastronomia",
    amountARS: 67600,
    paymentMethod: "tarjeta",
    paidBy: "Tarjeta",
    note: "Cena en Diques"
  }
];

export const EXPENSE_CATEGORIES = [
  { id: "gastronomia", name: "Restaurantes & Bares", icon: "Utensils", color: "#f59e0b" },
  { id: "compras", name: "Compras & Feria", icon: "ShoppingBag", color: "#ec4899" },
  { id: "cultura", name: "Entradas & Museos", icon: "Ticket", color: "#8b5cf6" },
  { id: "transporte", name: "Transporte & SUBE", icon: "Bus", color: "#3b82f6" },
  { id: "mercado", name: "Mercado para Casa", icon: "ShoppingCart", color: "#10b981" },
  { id: "varios", name: "Varios & Efectivo", icon: "Receipt", color: "#64748b" }
];

export const SURVIVAL_TIPS = [
  {
    category: "Transporte & SUBE",
    title: "Estado de tu Tarjeta SUBE",
    content: "Recarga realizada: ARS 10.000. Total utilizado hasta ahora: ARS 6.500. Saldo actual disponible: ARS 3.500. El transporte del lunes a La Boca estuvo cubierto con esta recarga sin gastos extras.",
    badge: "Activa"
  },
  {
    category: "Dinero & Pagos",
    title: "Control de Cambio de Dólares (Efectivo)",
    content: "Cambiados: USD 250 por ARS 760.000 acordados. Recibido en efectivo sencillo: ARS 250.000 (madrugada sábado) + ARS 240.000 (lunes) = ARS 490.000 recibidos. Pendiente por entregar: ARS 270.000.",
    badge: "Finanzas"
  },
  {
    category: "Dinero & Pagos",
    title: "Gastos con Tarjeta (Dólar MEP)",
    content: "Tus pagos en el Ecoparque, Bellgamba, Bar, Discoteca, Cementerio de la Recoleta (Nu) y Puerto Madero se debitan al tipo de cambio MEP automático.",
    badge: "Tarjeta"
  },
  {
    category: "Transporte & SUBE",
    title: "El 'Red SUBE': Descuento por trasbordo",
    content: "Si tomas un colectivo y dentro de las 2 horas siguientes tomas el Subte u otro colectivo, el segundo boleto tiene un 50% de descuento automático, y el tercero un 75% de descuento.",
    badge: "Ahorro"
  },
  {
    category: "Enchufes & Tecnología",
    title: "Enchufe Tipo I (Patas oblicuas a 220V)",
    content: "Argentina utiliza enchufes con dos patas planas en ángulo (oblicuas en V) y una vertical de tierra (Norma IRAM 2073, Tipo I).",
    badge: "Equipaje"
  },
  {
    category: "Seguridad Urbana",
    title: "Moverse seguro como un local",
    content: "En ferias como San Telmo o zonas turísticas como Caminito, no lleves el celular en la mano distraído. Las apps Cabify, Didi y Uber funcionan excelente.",
    badge: "Seguridad"
  }
];

export const INITIAL_CHECKLIST = [
  { id: "chk-1", text: "Pasaporte o Documento de Identidad vigente", category: "documentos", completed: true },
  { id: "chk-2", text: "Tarjeta de crédito Nu habilitada para el exterior", category: "dinero", completed: true },
  { id: "chk-3", text: "Tarjeta SUBE física cargada y activa", category: "transporte", completed: true },
  { id: "chk-4", text: "Adaptador de enchufe Tipo I (patas inclinadas en V)", category: "tecnologia", completed: true },
  { id: "chk-5", text: "Batería portátil (Powerbank) para salidas largas", category: "tecnologia", completed: true },
  { id: "chk-6", text: "Zapatillas cómodas para caminatas", category: "equipaje", completed: true },
  { id: "chk-7", text: "Abrigo liviano / campera rompevientos", category: "equipaje", completed: true }
];
