// Datos iniciales de Buenos Aires (10 al 23 de Octubre de 2026)

export const TRIP_INFO = {
  destination: "Buenos Aires, Argentina",
  arrivalDate: "2026-10-10T05:30:00",
  departureDate: "2026-10-23T15:30:00",
  hostNote: "Hospedaje en casa de mi amiga. Gastos concentrados en mercado para la casa, comidas afuera, transporte y planes.",
  defaultExchangeRateUSD: 1540, // Cotización real Dólar Blue (Compra para cambiar efectivo)
};

export const INITIAL_DAYS = [
  {
    dayNumber: 1,
    date: "2026-10-10",
    dateFormatted: "Sábado 10 de Octubre",
    barrioPrincipal: "Palermo • Ecoparque & Jardín Botánico",
    badgeColor: "#38bdf8",
    summary: "Tarde en Palermo recorriendo el Ecoparque y el Jardín Botánico en solitario mientras mi amiga termina de trabajar, cerrando la noche juntos para cenar.",
    isDepartureDay: false
  },
  {
    dayNumber: 2,
    date: "2026-10-11",
    dateFormatted: "Domingo 11 de Octubre",
    barrioPrincipal: "La Boca • San Telmo • Obelisco • Puerto Madero",
    badgeColor: "#fbbf24",
    summary: "Itinerario dominical completo: Caminito, La Bombonera, almuerzo, Feria de San Telmo, Obelisco y atardecer en Puerto Madero.",
    isDepartureDay: false
  },
  {
    dayNumber: 3,
    date: "2026-10-12",
    dateFormatted: "Lunes 12 de Octubre",
    barrioPrincipal: "Recoleta • Bellas Artes, Floralis & Cementerio",
    badgeColor: "#818cf8",
    summary: "Circuito cultural y patrimonial en Recoleta: Floralis Genérica, Facultad de Derecho, Museo Nacional de Bellas Artes, almuerzo, Cementerio de la Recoleta y Centro Cultural Recoleta con Plaza Francia.",
    isDepartureDay: false
  },
  {
    dayNumber: 4,
    date: "2026-10-13",
    dateFormatted: "Martes 13 de Octubre",
    barrioPrincipal: "Palermo • Jardines, Bosques & Soho",
    badgeColor: "#34d399",
    summary: "Día verde y diseño en Palermo: Jardín Japonés, Rosedal de Palermo, Bosques de Palermo, Planetario Galileo Galilei y compras / terraceo en Palermo Soho y Plaza Serrano.",
    isDepartureDay: false
  },
  {
    dayNumber: 5,
    date: "2026-10-14",
    dateFormatted: "Miércoles 14 de Octubre",
    barrioPrincipal: "Recoleta & Gran Splendid",
    badgeColor: "#f472b6",
    summary: "Cementerio de la Recoleta, Floralis Genérica, Bellas Artes y la famosa librería El Ateneo.",
    isDepartureDay: false
  },
  {
    dayNumber: 6,
    date: "2026-10-15",
    dateFormatted: "Jueves 15 de Octubre",
    barrioPrincipal: "La Boca & Pasión Xeneize",
    badgeColor: "#60a5fa",
    summary: "Caminito, conventillos de chapa colorida, Museo Proa y Estadio de Boca Juniors (Bombonera).",
    isDepartureDay: false
  },
  {
    dayNumber: 7,
    date: "2026-10-16",
    dateFormatted: "Viernes 16 de Octubre",
    barrioPrincipal: "Puerto Madero & Show de Tango",
    badgeColor: "#c084fc",
    summary: "Puente de la Mujer, Reserva Ecológica al borde del Río de la Plata y noche de tango porteño.",
    isDepartureDay: false
  },
  {
    dayNumber: 8,
    date: "2026-10-17",
    dateFormatted: "Sábado 17 de Octubre",
    barrioPrincipal: "Bosques de Palermo & Asado",
    badgeColor: "#22c55e",
    summary: "Rosedal de Palermo, Jardín Japonés, Barrio Chino en Belgrano y noche de gran parrilla argentina.",
    isDepartureDay: false
  },
  {
    dayNumber: 9,
    date: "2026-10-18",
    dateFormatted: "Domingo 18 de Octubre",
    barrioPrincipal: "Escapada al Delta del Tigre",
    badgeColor: "#06b6d4",
    summary: "Tren panorámico Mitre, lancha colectiva por los canales del Delta, Puerto de Frutos y naturaleza.",
    isDepartureDay: false
  },
  {
    dayNumber: 10,
    date: "2026-10-19",
    dateFormatted: "Lunes 19 de Octubre",
    barrioPrincipal: "Chacarita & Villa Crespo",
    badgeColor: "#f97316",
    summary: "El barrio gastronómico de moda (Chacarita), outlets de cuero en Murillo y café notable con billar.",
    isDepartureDay: false
  },
  {
    dayNumber: 11,
    date: "2026-10-20",
    dateFormatted: "Martes 20 de Octubre",
    barrioPrincipal: "Día Flexible & Paseo con Amiga",
    badgeColor: "#ec4899",
    summary: "Cocinar algo rico en casa, Galerías Pacífico, compras tranquilas y helados artesanales en Rapanui.",
    isDepartureDay: false
  },
  {
    dayNumber: 12,
    date: "2026-10-21",
    dateFormatted: "Miércoles 21 de Octubre",
    barrioPrincipal: "Palacio Barolo & MALBA",
    badgeColor: "#a855f7",
    summary: "Ascenso al faro del Barolo (inspirado en Dante), arte latinoamericano en el MALBA y terraza rooftop.",
    isDepartureDay: false
  },
  {
    dayNumber: 13,
    date: "2026-10-22",
    dateFormatted: "Jueves 22 de Octubre",
    barrioPrincipal: "Favoritos, Recuerdos & Cena Despedida",
    badgeColor: "#eab308",
    summary: "Comprar alfajores (Havanna/Cachafaz) y vino Malbec. Gran cena de despedida con amigos.",
    isDepartureDay: false
  },
  {
    dayNumber: 14,
    date: "2026-10-23",
    dateFormatted: "Viernes 23 de Octubre",
    barrioPrincipal: "Despedida & Salida al Aeropuerto (3:30 PM)",
    badgeColor: "#ef4444",
    summary: "Día reservado exclusivamente para empacar, abrazar a mi amiga y trasladarse al aeropuerto con tiempo.",
    isDepartureDay: true
  }
];

export const INITIAL_ACTIVITIES = [
  // DÍA 1 (SÁBADO 10 OCT) - PALERMO: ECOPARQUE & JARDÍN BOTÁNICO
  {
    id: "act-1-1",
    dayNumber: 1,
    time: "14:00",
    period: "tarde",
    title: "Paseo por el Ecoparque de Buenos Aires",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Av. Sarmiento 2601 / Plaza Italia, Palermo",
    coords: [-34.5802, -58.4190],
    description: "Exploración en solitario mientras mi amiga trabaja. Antiguo zoológico transformado en parque de conservación ambiental con flora autóctona, lagunas y fauna libre (carpinchos, maras patagónicas y pavos reales).",
    tip: "Entrada libre y gratuita. Se ingresa directo frente a Plaza Italia y la estación de Subte D.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-1-2",
    dayNumber: 1,
    time: "16:30",
    period: "tarde",
    title: "Visita al Jardín Botánico Carlos Thays",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Av. Santa Fe 3951, Palermo",
    coords: [-34.5833, -58.4175],
    description: "Caminata tranquila por más de 5 hectáreas de senderos botánicos, invernaderos franceses art nouveau de hierro de 1897 y esculturas de mármol. Paseo sereno mientras espero a que mi amiga termine su jornada laboral.",
    tip: "Entrada libre y gratuita. Ubicado justo cruzando Plaza Italia desde el Ecoparque, muy fácil de conectar a pie.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-1-3",
    dayNumber: 1,
    time: "18:30",
    period: "tarde",
    title: "Café de Especialidad & Merienda en Palermo",
    barrio: "Palermo",
    category: "gastronomia",
    address: "Cuervo Café / Lattente, Palermo",
    coords: [-34.5855, -58.4230],
    description: "Tiempo de relax en una cafetería de especialidad de Palermo mientras mi amiga termina su jornada de trabajo. Café filtrado de origen y medialuna o pastry artesanal.",
    tip: "Ideal para descansar los pies, recargar batería en el celular y coordinar el punto de encuentro.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 6000
  },
  {
    id: "act-1-4",
    dayNumber: 1,
    time: "20:30",
    period: "noche",
    title: "Cena de Bienvenida con mi amiga en Palermo Soho",
    barrio: "Palermo Soho",
    category: "gastronomia",
    address: "Plaza Serrano / Honduras y Armenia, Palermo Soho",
    coords: [-34.5885, -58.4300],
    description: "Encuentro con mi amiga al salir de su trabajo para brindar por la llegada en un bistró o bar de Palermo con empanadas gourmet, pizzas o tapeo porteño.",
    tip: "La zona alrededor de Plaza Serrano y pasaje Russell se llena de vida a partir de las 20:30 hs.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 18000
  },

  // DÍA 2 (DOMINGO 11 OCT) - CAMINITO, BOCA, ALMUERZO, SAN TELMO, OBELISCO & PUERTO MADERO
  {
    id: "act-2-1",
    dayNumber: 2,
    time: "10:00",
    period: "mañana",
    title: "🎨 Caminito + La Boca",
    barrio: "La Boca",
    category: "cultura",
    address: "Caminito, Valle Iberlucea y Magallanes, La Boca",
    coords: [-34.6394, -58.3628],
    description: "Duración: 2 h. Recorrido por la famosa calle museo a cielo abierto, conventillos de chapa pintada con colores vivos, adoquines, arte boquense y parejas bailando tango.",
    tip: "Gratis. Excelente para recorrer con buena luz matinal y sacar fotos de los murales.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-2",
    dayNumber: 2,
    time: "12:00",
    period: "mañana",
    title: "⚽ La Bombonera / zona Boca (opcional)",
    barrio: "La Boca",
    category: "cultura",
    address: "Estadio Alberto J. Armando (La Bombonera), Brandsen 805, La Boca",
    coords: [-34.6356, -58.3648],
    description: "Duración: 1 h. Paseo por los alrededores del mítico estadio de Boca Juniors, murales de Maradona y tiendas de recuerdos xeneizes.",
    tip: "Gratis* (Paseo exterior y fotos gratis. Entrada al museo/tour del estadio opcional).",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-3",
    dayNumber: 2,
    time: "13:00",
    period: "tarde",
    title: "🍽️ Almuerzo",
    barrio: "La Boca / San Telmo",
    category: "gastronomia",
    address: "Bodegón tradicional o parrilla, La Boca / San Telmo",
    coords: [-34.6320, -58.3680],
    description: "Duración: 1 h. Almuerzo tradicional porteño (milanesa napolitana, pastas caseras, bife de chorizo o empanadas) para recargar energías.",
    tip: "Presupuesto estimado: ARS 17.500.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 17500
  },
  {
    id: "act-2-4",
    dayNumber: 2,
    time: "14:00",
    period: "tarde",
    title: "🚕 Traslado a San Telmo",
    barrio: "La Boca / San Telmo",
    category: "transporte",
    address: "De La Boca a Plaza Dorrego, San Telmo",
    coords: [-34.6280, -58.3700],
    description: "Duración: 20–30 min. Conexión en taxi, Cabify, Uber o colectivo (líneas 29 o 64) desde La Boca hasta el casco histórico de San Telmo.",
    tip: "Costo variable según transporte elegido (aprox. $3.500 ARS en app o tarifa de colectivo con SUBE).",
    withFriend: true,
    completed: false,
    costEstimatedARS: 3500
  },
  {
    id: "act-2-5",
    dayNumber: 2,
    time: "14:30",
    period: "tarde",
    title: "🏘️ San Telmo + Plaza Dorrego + calles históricas",
    barrio: "San Telmo",
    category: "cultura",
    address: "Plaza Dorrego, Defensa y Humberto 1°, San Telmo",
    coords: [-34.6202, -58.3728],
    description: "Duración: 2 h. Recorrido por la famosa Feria Dominical de antigüedades a lo largo de calle Defensa, tango en Plaza Dorrego, Mercado de San Telmo y escultura de Mafalda en Chile y Defensa.",
    tip: "Gratis. Entrada libre a la feria al aire libre. Cuidar pertenencias en aglomeraciones.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-6",
    dayNumber: 2,
    time: "16:30",
    period: "tarde",
    title: "🚶 Traslado hacia Obelisco",
    barrio: "San Telmo / Centro",
    category: "transporte",
    address: "De San Telmo al Obelisco (Av. 9 de Julio y Corrientes)",
    coords: [-34.6120, -58.3780],
    description: "Duración: 20–30 min. Caminata panorámica subiendo por Diagonal Sur o Av. de Mayo (o en Subte/colectivo) hasta Plaza de la República.",
    tip: "Caminata gratuita y muy visual pasando junto a Plaza de Mayo y el Cabildo.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-7",
    dayNumber: 2,
    time: "17:00",
    period: "tarde",
    title: "🗿 Obelisco + Avenida 9 de Julio",
    barrio: "San Nicolás / Centro",
    category: "cultura",
    address: "Obelisco, Plaza de la República (Av. 9 de Julio y Corrientes)",
    coords: [-34.6037, -58.3816],
    description: "Duración: 1 h. Postales icónicas en la Plaza de la República frente al Obelisco de 67 metros de altura y el cartel BA de arbustos verdes, contemplando la avenida más ancha del mundo.",
    tip: "Gratis. Gran punto para fotos clásicas de la ciudad.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-8",
    dayNumber: 2,
    time: "18:00",
    period: "tarde",
    title: "🚶/🚕 Puerto Madero",
    barrio: "Centro / Puerto Madero",
    category: "transporte",
    address: "Del Obelisco a Dique 3, Puerto Madero",
    coords: [-34.6060, -58.3730],
    description: "Duración: 20–30 min. Caminata suave bajando por Diagonal Norte hacia la Casa Rosada y cruzando a los diques, o taxi rápido.",
    tip: "Variable (Gratis a pie en 15–20 min o taxi corto).",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-2-9",
    dayNumber: 2,
    time: "18:30",
    period: "noche",
    title: "🌆 Puerto Madero + Puente de la Mujer",
    barrio: "Puerto Madero",
    category: "cultura",
    address: "Puente de la Mujer, Dique 3, Puerto Madero",
    coords: [-34.6083, -58.3653],
    description: "Horario: 18:30–20:00 (1–1,5 h). Paseo costero contemplando el Puente de la Mujer de Santiago Calatrava, los antiguos silos de ladrillo rojo, veleros amarrados y las luces de los rascacielos al caer la tarde.",
    tip: "Gratis. Paseo peatonal junto al agua, momento ideal para fotos con el atardecer.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 0
  },

  // DÍA 3 (LUNES 12 OCT) - RECOLETA
  {
    id: "act-3-1",
    dayNumber: 3,
    time: "10:00",
    period: "mañana",
    title: "🌸 Floralis Genérica",
    barrio: "Recoleta",
    category: "cultura",
    address: "Plaza de las Naciones Unidas, Av. Pres. Figueroa Alcorta 2301, Recoleta",
    coords: [-34.5828, -58.3927],
    description: "Imponente escultura metálica de 20 metros de altura donada por Eduardo Catalano, cuyos pétalos de acero inoxidable se abren de día y se cierran de noche.",
    tip: "Cruzando el puente peatonal sobre Figueroa Alcorta llegas en 3 minutos a la Facultad de Derecho y Bellas Artes.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-3-2",
    dayNumber: 3,
    time: "11:00",
    period: "mañana",
    title: "🏛️ Facultad de Derecho (UBA)",
    barrio: "Recoleta",
    category: "cultura",
    address: "Av. Pres. Figueroa Alcorta 2263, Recoleta",
    coords: [-34.5843, -58.3915],
    description: "Monumento arquitectónico de estilo neoclásico imponente con sus monumentales columnas dóricas. Vista clásica porteña.",
    tip: "Las escalinatas exteriores son un clásico para fotos panorámicas de la ciudad.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-3-3",
    dayNumber: 3,
    time: "11:45",
    period: "mañana",
    title: "🖼️ Museo Nacional de Bellas Artes",
    barrio: "Recoleta",
    category: "cultura",
    address: "Av. del Libertador 1473, Recoleta",
    coords: [-34.5838, -58.3930],
    description: "El acervo de arte público más valioso de Argentina: pinturas de Van Gogh, Monet, Rembrandt, Degas, Rodin y artistas nacionales como Berni y Quinquela Martín.",
    tip: "La entrada a la colección permanente es completamente libre y gratuita.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-3-4",
    dayNumber: 3,
    time: "13:30",
    period: "tarde",
    title: "🍽️ Almuerzo",
    barrio: "Recoleta",
    category: "gastronomia",
    address: "Zona Plaza Francia / Junín y Vicente López, Recoleta",
    coords: [-34.5872, -58.3918],
    description: "Almuerzo en los bistrós y cafés de Recoleta frente a Plaza Francia (La Biela, Camping o bistrós de Junín).",
    tip: "Excelente zona para disfrutar un almuerzo porteño bajo los árboles centenarios.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 17500
  },
  {
    id: "act-3-5",
    dayNumber: 3,
    time: "15:00",
    period: "tarde",
    title: "⚰️ Cementerio de la Recoleta",
    barrio: "Recoleta",
    category: "cultura",
    address: "Junín 1760, Recoleta",
    coords: [-34.5878, -58.3928],
    description: "Museo al aire libre con deslumbrante arte funerario en mármol y bronce. Alberga las tumbas de próceres, presidentes y el célebre mausoleo de Eva Perón (Evita).",
    tip: "Para turistas extranjeros la entrada se adquiere en boletería o web con tarjeta.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 10000
  },
  {
    id: "act-3-6",
    dayNumber: 3,
    time: "17:00",
    period: "tarde",
    title: "🏘️ Centro Cultural Recoleta + Plaza Francia",
    barrio: "Recoleta",
    category: "cultura",
    address: "Junín 1930 / Plaza Francia, Recoleta",
    coords: [-34.5865, -58.3920],
    description: "Centro cultural dinámico con terrazas de diseño, muestras de arte urbano, talleres y descanso en el pasto de Plaza Francia frente al Gran Gomero histórico.",
    tip: "Hermoso plan de atardecer para relajarse tomando un café o mate al aire libre.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },

  // DÍA 4 (MARTES 13 OCT) - PALERMO
  {
    id: "act-4-1",
    dayNumber: 4,
    time: "10:00",
    period: "mañana",
    title: "🌺 Jardín Japonés",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Av. Casares 3450 / Av. Berro, Palermo",
    coords: [-34.5752, -58.4060],
    description: "Un oasis oriental en el corazón de Buenos Aires. Puentes rojos curvados (Puente de Dios), estanques con cientos de carpas koi multicolores, bonsáis y casa de té tradicional.",
    tip: "Comprar comida para peces en el puesto del puente; uno de los paseos más fotogénicos y pacíficos de la ciudad.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 4500
  },
  {
    id: "act-4-2",
    dayNumber: 4,
    time: "12:00",
    period: "mañana",
    title: "🪐 Planetario Galileo Galilei",
    barrio: "Palermo",
    category: "cultura",
    address: "Av. Sarmiento y Belisario Roldán, Parque 3 de Febrero",
    coords: [-34.5700, -58.4116],
    description: "Emblemático edificio futurista con forma de platillo volador ovni y cúpula semiesférica de 20 metros de diámetro, rodeado por lagos artificiales habitados por patos.",
    tip: "En el parque exterior se exhibe un meteorito metálico auténtico encontrado en Campo del Cielo.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-4-3",
    dayNumber: 4,
    time: "13:30",
    period: "tarde",
    title: "🌹 Rosedal de Palermo",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Av. Infanta Isabel 900, Parque 3 de Febrero",
    coords: [-34.5714, -58.4190],
    description: "Paseo del Rosedal con más de 18.000 rosales en plena floración de primavera en octubre, puente griego blanco sobre el lago, glorieta romántica y jardín de los poetas.",
    tip: "Entrada libre y gratuita. Lugar perfecto para caminar relajado entre los senderos florecidos.",
    withFriend: false,
    completed: false,
    costEstimatedARS: 0
  },
  {
    id: "act-4-4",
    dayNumber: 4,
    time: "15:00",
    period: "tarde",
    title: "🌳 Bosques de Palermo",
    barrio: "Palermo",
    category: "naturaleza",
    address: "Parque 3 de Febrero, Av. del Libertador y Sarmiento",
    coords: [-34.5730, -58.4160],
    description: "El inmenso pulmón verde de la ciudad con lagos, arboledas frondosas de eucaliptos y jacarandás, y el polo gastronómico de los Arcos del Rosedal.",
    tip: "Ideal para almorzar o merendar algo fresco en los restaurantes de los Arcos del Rosedal (Av. Casares).",
    withFriend: false,
    completed: false,
    costEstimatedARS: 12000
  },
  {
    id: "act-4-5",
    dayNumber: 4,
    time: "17:30",
    period: "tarde",
    title: "🛍️ Palermo Soho / Plaza Serrano",
    barrio: "Palermo Soho",
    category: "compras",
    address: "Plaza Serrano (Plaza Cortázar), Honduras y Serrano, Palermo",
    coords: [-34.5884, -58.4305],
    description: "Caminar por los pasajes con adoquines (Russell y Soria), murales de arte urbano, galerías de moda y diseño independiente de autor argentino, culminando en los bares de Plaza Serrano.",
    tip: "Gran ambiente nocturno para tomar una cerveza artesanal o vermut y compartir cena.",
    withFriend: true,
    completed: false,
    costEstimatedARS: 16000
  }
];

export const INITIAL_EXPENSES = [
  {
    id: "exp-1",
    date: "2026-10-10",
    concept: "Supermercado inicial para la casa (desayunos, frutas, bebidas)",
    category: "mercado",
    amountARS: 45000,
    paidBy: "Yo",
    note: "Compra para la casa de mi amiga para toda la quincena"
  },
  {
    id: "exp-2",
    date: "2026-10-10",
    concept: "Traslado en Cabify desde el aeropuerto a casa",
    category: "transporte",
    amountARS: 25000,
    paidBy: "Yo",
    note: "Viaje al llegar 5:30 AM"
  },
  {
    id: "exp-3",
    date: "2026-10-10",
    concept: "Carga inicial de tarjeta SUBE física",
    category: "transporte",
    amountARS: 6000,
    paidBy: "Yo",
    note: "Para Subtes y colectivos de los primeros días"
  }
];

export const EXPENSE_CATEGORIES = [
  { id: "mercado", name: "Mercado para Casa", icon: "ShoppingCart", color: "#10b981" },
  { id: "gastronomia", name: "Restaurantes & Bares", icon: "Utensils", color: "#f59e0b" },
  { id: "transporte", name: "Transporte (SUBE/Apps)", icon: "Bus", color: "#3b82f6" },
  { id: "cultura", name: "Entradas & Espectáculos", icon: "Ticket", color: "#8b5cf6" },
  { id: "compras", name: "Compras & Recuerdos", icon: "ShoppingBag", color: "#ec4899" },
  { id: "varios", name: "Varios & Emergencias", icon: "Receipt", color: "#64748b" }
];

export const SURVIVAL_TIPS = [
  {
    category: "Transporte & SUBE",
    title: "La Tarjeta SUBE es la reina de la movilidad",
    content: "En Buenos Aires el Subte (Metro) y los Colectivos (Buses) funcionan con la tarjeta SUBE. La consigues en kioscos o estaciones de subte. Si tu amiga tiene una extra, ¡te ahorras buscarla! Puedes recargarla con MercadoPago/tarjeta si tienes un teléfono con NFC o en boleterías de subte con efectivo.",
    badge: "Imprescindible"
  },
  {
    category: "Transporte & SUBE",
    title: "El 'Red SUBE': Descuento por trasbordo",
    content: "Si tomas un colectivo y dentro de las 2 horas siguientes tomas el Subte u otro colectivo, el segundo boleto tiene un 50% de descuento automático, y el tercero un 75% de descuento.",
    badge: "Ahorro"
  },
  {
    category: "Transporte & SUBE",
    title: "Cómo tomar el colectivo en Buenos Aires",
    content: "Para que el colectivo pare, debes estirar el brazo con anticipación. Al subir por la puerta delantera, le dices al chofer: 'Hasta Corrientes' o 'Boleto mínimo', acercas la tarjeta SUBE al lector cuando marque el monto en la pantalla, y listo. Se desciende por la puerta del medio o trasera.",
    badge: "Costumbre"
  },
  {
    category: "Dinero & Pagos",
    title: "Dólar MEP y Pago con Tarjeta Extranjera",
    content: "Desde hace tiempo, si pagas en Argentina con tarjetas de crédito/débito extranjeras (Visa o Mastercard emitidas fuera del país), el banco aplica automáticamente el tipo de cambio oficial MEP (muy cercano al valor de mercado real, no el oficial bajo). Aún así, siempre es útil tener algo de pesos argentinos en efectivo para propinas o ferias callejeras.",
    badge: "Finanzas"
  },
  {
    category: "Enchufes & Tecnología",
    title: "Enchufe Tipo I (Patas oblicuas a 220V)",
    content: "Argentina utiliza enchufes con dos patas planas en ángulo (oblicuas en V) y una vertical de tierra (Norma IRAM 2073, Tipo I). No uses adaptadores comunes de dos patas redondas porque no encajarán en la mayoría de tomas. Consigue un adaptador Tipo I antes de viajar o en una ferretería de barrio porteño.",
    badge: "Equipaje"
  },
  {
    category: "Seguridad Urbana",
    title: "Moverse seguro como un local",
    content: "Buenos Aires es una ciudad muy transitable y activa día y noche, pero en zonas concurridas (calle Florida, Av. Corrientes, San Telmo los domingos, andenes de subte) no lleves el celular en la mano distraído cerca de las puertas ni en el bolsillo trasero. Las apps Cabify, Didi y Uber funcionan excelente y son muy seguras para la noche.",
    badge: "Seguridad"
  },
  {
    category: "Gastronomía Porteña",
    title: "La cultura del café y la comida",
    content: "Las cenas en Buenos Aires son tarde (de 21:00 a 23:30 hs). La merienda (de 17:00 a 19:00 hs) es una institución sagrada. Si pides un café, casi siempre viene acompañado de un vasito de agua con gas y una masita o galletita de cortesía.",
    badge: "Cultura"
  }
];

export const INITIAL_CHECKLIST = [
  { id: "chk-1", text: "Pasaporte o Documento de Identidad vigente", category: "documentos", completed: true },
  { id: "chk-2", text: "Seguro médico de viaje internacional contratado", category: "documentos", completed: false },
  { id: "chk-3", text: "Avisar al banco de la salida del país (habilitar tarjetas)", category: "dinero", completed: false },
  { id: "chk-4", text: "Adaptador de enchufe Tipo I (patas inclinadas en V)", category: "tecnologia", completed: false },
  { id: "chk-5", text: "Batería portátil (Powerbank) para salidas largas", category: "tecnologia", completed: false },
  { id: "chk-6", text: "Zapatillas cómodas (se caminan 10-18 km por día)", category: "equipaje", completed: false },
  { id: "chk-7", text: "Abrigo liviano / campera rompevientos (primavera con noches frescas)", category: "equipaje", completed: false },
  { id: "chk-8", text: "Pedirle a mi amiga que aparte o consiga una tarjeta SUBE", category: "amiga", completed: false },
  { id: "chk-9", text: "Instalar apps en celular: Google Maps, Cabify, Uber", category: "tecnologia", completed: false },
  { id: "chk-10", text: "Guardar esta app web en la pantalla de inicio del celular", category: "app", completed: false }
];
