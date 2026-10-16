# 🗺️ Guía Maestra de Refactorización y Arquitectura (React + TypeScript + Microcomponentes)

> **Nota para futuros agentes de IA y desarrolladores:**  
> Este documento contiene el contexto integral del proyecto, la estructura de la base de datos en Supabase, los flujos de negocio activos y el plan paso a paso para migrar progresivamente a **TypeScript y microcomponentes** sin romper ninguna funcionalidad ni perder datos de producción.

---

## 1. 📌 Estado Actual del Proyecto

### Stack Tecnológico
* **Frontend:** React 19 + Vite + JavaScript (`.jsx`) + Vanilla CSS.
* **Backend / Base de Datos:** Supabase (PostgreSQL en la nube con API REST).
* **Despliegue:** Vercel (CI/CD conectado al repositorio de GitHub).
* **Iconografía & Mapas:** `lucide-react`, `leaflet`, `react-leaflet`.
* **Procesamiento de Comprobantes:** `tesseract.js` (OCR).

### El Problema de Desempeño con Agentes de IA
El proyecto funciona muy bien visualmente y en el navegador, pero los ciclos de edición asistida por IA se volvieron lentos debido a archivos **monolíticos de más de 1.000 líneas**:
1. `src/App.jsx` (~1.155 líneas): Estado global, sincronización con Supabase, migraciones de caché y mapeo de datos.
2. `src/components/ItineraryView.jsx` (~1.190 líneas): Tablero Kanban, Timeline día a día, modales de inspección y filtros.
3. `src/components/BudgetTracker.jsx` (~1.002 líneas): Cálculos de liquidez, cotización Dólar Blue, formularios y lista de gastos.
4. `src/index.css` (~8.500+ líneas): Todos los estilos concentrados en un solo archivo.

---

## 2. 🗄️ Modelo de Datos y Contratos (Supabase)

La base de datos está en producción con datos reales del viaje. **No se deben renombrar ni eliminar columnas sin una migración explícita.**

### Tabla `activities`
| Columna en Supabase (`snake_case`) | Propiedad en React (`camelCase`) | Tipo | Descripción |
|---|---|---|---|
| `id` | `id` | `text` (PK) | Ej: `act-1792082845815` |
| `day_number` | `dayNumber` | `integer` | Día del viaje (1 al 14) |
| `time` | `time` | `text` | Ej: `"10:30"` |
| `period` | `period` | `text` | `"mañana"`, `"tarde"`, `"noche"` |
| `title` | `title` | `text` | Título del plan o lote de compra |
| `barrio` | `barrio` | `text` | Ej: `"San Telmo"`, `"Palermo"` |
| `category` | `category` | `text` | `"compras"`, `"mercado"`, `"regalos"`, `"gastronomia"`, etc. |
| `address` | `address` | `text` | Dirección física |
| `lat`, `lng` | `coords.lat`, `coords.lng` | `float` | Coordenadas Leaflet |
| `description` | `description` / `items` / `note` | `text` (JSON) | **Crítico:** Almacena compras multi-ítem y notas en formato JSON: `{"type":"compras","items":[{"id":"it-1","name":"Pezuña","price":35000}],"note":"..."}` |
| `tip` | `tip` | `text` | Tip porteño |
| `with_friend` | `withFriend` | `boolean` | Alternador "¿Va mi amiga?" |
| `completed` | `completed` | `boolean` | Checkbox de plan realizado |
| `cost_estimated_ars` | `costEstimatedARS` | `numeric` | Costo estimado en ARS (suma de ítems en compras) |

### Reglas de Negocio Esenciales (¡No Romper!)
1. **Sincronización Espejo Itinerario-Billetera:**  
   Toda actividad con `costEstimatedARS > 0` genera automáticamente un registro espejo en `itineraryExpenses` en la Billetera. Si se edita el valor o los ítems desde la Billetera ([EditExpenseModal.jsx](file:///c:/PROJECTS/REACT/itinerario-argentina/src/components/EditExpenseModal.jsx)), este cambio se sincroniza bidireccionalmente hacia la tarjeta del itinerario.
2. **Compras Multi-ítem (`type === 'compras'`):**  
   El valor `costEstimatedARS` es siempre la suma exacta de los productos en `items: [{ id, name, price }]`.
3. **Notas / Avisos (`type === 'nota'`):**  
   Costo $0, sin botón de Google Maps transit ni cálculo engañoso en billetera.
4. **Control de Liquidez en Billetera:**  
   Seguimiento de **USD 500 cambiados** = $760.000 ARS pactados ($490.000 ARS recibidos en mano), descontando gastos en efectivo vs. pagos con tarjeta frente al tope global de $1.000 USD.

---

## 3. 🎯 Arquitectura Objetivo (TypeScript + Microcomponentes)

El objetivo es modularizar el código para que **ningún archivo supere las 150 - 200 líneas**. Esto permite que cualquier IA o programador lea, edite y verifique componentes en segundos con consumo mínimo de tokens.

### Estructura de Directorios Propuesta
```
src/
├── types/                          # Interfaces de TypeScript (Contratos únicos)
│   ├── activity.ts                 # Type Activity, PurchaseItem, ActivityType
│   ├── expense.ts                  # Type Expense, PaymentMethod
│   ├── category.ts                 # Type ExpenseCategory
│   └── supabase.ts                 # Mapeo snake_case <-> camelCase
│
├── services/                       # Capa de datos desacoplada de la UI
│   ├── supabaseClient.ts           # Cliente Supabase singleton
│   ├── activityService.ts          # CRUD de actividades y parseo JSON de description
│   ├── expenseService.ts           # CRUD de gastos y comprobantes
│   └── exchangeRateService.ts      # Fetch en vivo a DolarApi.com
│
├── components/
│   ├── itinerary/
│   │   ├── ItineraryView.tsx       # Contenedor orquestador
│   │   ├── KanbanBoard.tsx         # Track horizontal con scroll
│   │   ├── KanbanColumn.tsx        # Columna de día (Header + Drop zone)
│   │   ├── KanbanCard.tsx          # Tarjeta individual con drag handle
│   │   ├── KanbanItemsDropdown.tsx # Lista desplegable de artículos de compras
│   │   ├── TimelineView.tsx        # Vista día a día
│   │   ├── TimelineCard.tsx        # Card del timeline con conector vertical
│   │   └── InspectActivityModal.tsx# Modal de detalles y ruta Google Maps
│   │
│   ├── wallet/
│   │   ├── BudgetTracker.tsx       # Orquestador de la billetera
│   │   ├── WalletHero.tsx          # Banner con tope $1.000 USD y cotización
│   │   ├── LiquidityTracker.tsx    # Tarjetas de Efectivo en Mano vs. Tarjeta
│   │   ├── CategoryToolbar.tsx     # Barra superior (General, Mercado, Regalos, [+])
│   │   ├── ExpenseList.tsx         # Historial completo con filtros
│   │   └── ExpenseRow.tsx          # Fila individual de gasto con tag de comprobante
│   │
│   ├── modals/
│   │   ├── ActivityModal.tsx       # Modal selector 3-en-1 (Plan / Compras / Nota)
│   │   ├── EditExpenseModal.tsx    # Modal de edición y espejo
│   │   └── NewCategoryModal.tsx    # Modal para crear sección personalizada
│   │
│   └── common/
│       ├── Header.tsx
│       └── Navigation.tsx
│
└── styles/                         # CSS Modularizado (Adiós al archivo de 8.500 líneas)
    ├── variables.css               # Tokens de color, sombras y tipografía
    ├── kanban.css                  # Estilos del tablero y cards
    ├── wallet.css                  # Estilos de la billetera y KPIs
    ├── modals.css                  # Estilos de formularios y modales
    └── main.css                    # Imports globales y resets
```

---

## 4. 🚀 Plan de Migración Paso a Paso (Fase por Fase)

> [!IMPORTANT]
> **Regla de oro:** Vite soporta archivos `.js`, `.jsx`, `.ts` y `.tsx` en el mismo proyecto al mismo tiempo. **Nunca hagas una migración "Big Bang" de un solo golpe.** Migra componente por componente.

### Paso 1: Configurar TypeScript sin romper Vite
1. Instalar dependencias de desarrollo:
   ```bash
   npm install -D typescript @types/react @types/react-dom
   ```
2. Crear un archivo `tsconfig.json` con `"allowJs": true` y `"checkJs": false`:
   ```json
   {
     "compilerOptions": {
       "target": "ESNext",
       "useDefineForClassFields": true,
       "lib": ["DOM", "DOM.Iterable", "ESNext"],
       "allowJs": true,
       "skipLibCheck": true,
       "esModuleInterop": false,
       "allowSyntheticDefaultImports": true,
       "strict": false,
       "forceConsistentCasingInFileNames": true,
       "module": "ESNext",
       "moduleResolution": "Node",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx"
     },
     "include": ["src"]
   }
   ```

### Paso 2: Crear los Contratos de Datos en `src/types/`
Crear `src/types/activity.ts`:
```typescript
export type ActivityType = 'plan' | 'compras' | 'nota';

export interface PurchaseItem {
  id: string;
  name: string;
  price: number;
}

export interface Activity {
  id: string;
  dayNumber: number;
  time: string;
  period: 'mañana' | 'tarde' | 'noche';
  title: string;
  barrio: string;
  category: string;
  address?: string;
  coords?: { lat: number; lng: number };
  type: ActivityType;
  items?: PurchaseItem[];
  note?: string;
  description?: string;
  tip?: string;
  withFriend: boolean;
  completed: boolean;
  costEstimatedARS: number;
}
```

Crear `src/types/expense.ts`:
```typescript
export type PaymentMethod = 'efectivo' | 'tarjeta';

export interface Expense {
  id: string;
  date: string;
  concept: string;
  category: string;
  amountARS: number;
  paymentMethod: PaymentMethod;
  paidBy: string;
  note?: string;
  activityId?: string | null;
  receiptId?: string | null;
  isFromItinerary?: boolean;
  type?: 'plan' | 'compras' | 'nota';
  items?: { id: string; name: string; price: number }[];
}
```

### Paso 3: Extraer Servicios de Datos (`src/services/`)
Mover las funciones de transformación de datos fuera de [App.jsx](file:///c:/PROJECTS/REACT/itinerario-argentina/src/App.jsx):
* `src/services/activityService.ts`: Contiene `dbToActivity()`, `activityToDb()`, `fetchActivities()`, `saveActivityDb()`, `deleteActivityDb()`.
* Desacopla la lógica de Supabase de los componentes de React.

### Paso 4: Descomponer [ItineraryView.jsx](file:///c:/PROJECTS/REACT/itinerario-argentina/src/components/ItineraryView.jsx)
1. Extraer `src/components/itinerary/KanbanCard.tsx` (con su drag handler, badges de tipo y costo).
2. Extraer `src/components/itinerary/KanbanItemsDropdown.tsx` (la lista desplegable de compras).
3. Extraer `src/components/itinerary/TimelineCard.tsx`.
4. Extraer `src/components/itinerary/InspectActivityModal.tsx`.
5. Reducir `ItineraryView.tsx` a menos de 180 líneas encargadas solo de alternar vistas y montar el tablero.

### Paso 5: Descomponer [BudgetTracker.jsx](file:///c:/PROJECTS/REACT/itinerario-argentina/src/components/BudgetTracker.jsx)
1. Extraer `src/components/wallet/WalletHero.tsx`.
2. Extraer `src/components/wallet/LiquidityCards.tsx` (Efectivo vs. Tarjeta).
3. Extraer `src/components/wallet/CategoryToolbar.tsx`.
4. Extraer `src/components/wallet/ExpenseRow.tsx`.

### Paso 6: Modularizar [index.css](file:///c:/PROJECTS/REACT/itinerario-argentina/src/index.css)
1. Dividir las 8.500 líneas en archivos temáticos (`kanban.css`, `wallet.css`, `modals.css`).
2. En `src/index.css`, solo importar los módulos:
   ```css
   @import './styles/variables.css';
   @import './styles/kanban.css';
   @import './styles/wallet.css';
   @import './styles/modals.css';
   ```

---

## 5. 🛡️ Restricciones y Cuidados para la IA
* **No ejecutar `git commit` ni `git push`**: El usuario realiza los commits manualmente.
* **No ejecutar suites de tests automatizados pesados**.
* **Preservar el caché de LocalStorage**: Cuando se hagan cambios estructurales en los datos, actualizar la clave `ba_trip_wipe_clean_vX` en [App.jsx](file:///c:/PROJECTS/REACT/itinerario-argentina/src/App.jsx) para que el navegador del usuario sincronice el estado fresco de Supabase.
* **Nunca asumir columnas nuevas en Supabase sin consultar**: Las compras multi-ítem conviven serializadas en `description` como JSON para no alterar el esquema de Postgres existente.
