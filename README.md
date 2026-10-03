# 🇦🇷 Mi Itinerario en Buenos Aires (10 al 23 de Octubre de 2026)

Aplicación web progresiva (PWA) interactiva, responsiva y diseñada a medida para organizar tu viaje a Buenos Aires, moverte en transporte público con Google Maps, controlar los gastos de la casa y planes, y consultar la guía de supervivencia porteña.

---

## ✨ Características Principales

1. **Itinerario Día por Día (14 Días):**
   - Desde el **Sábado 10 de octubre a las 5:30 AM** (llegada y aclimatación) hasta el **Viernes 23 de octubre a las 3:30 PM** (despedida y vuelo).
   - Agrupación por barrios lógicos: *San Telmo, Plaza de Mayo / Centro, Palermo Soho & Hollywood, Recoleta, La Boca, Puerto Madero & Costanera, Bosques de Palermo & Asado, Delta del Tigre, Chacarita & Villa Crespo, Miradores Porteños y Despedida*.
   - **Interruptor "¿Va mi amiga?":** Filtra y marca qué planes haces acompañado y cuáles en solitario.
   - **Check de planes listos:** Marca cada actividad conforme la vas realizando.

2. **Integración Directa con Google Maps:**
   - Botón **"¿Cómo llegar?"** en cada actividad: Abre automáticamente Google Maps en tu celular o PC con el destino preconfigurado y en modo **Transporte Público (Subte y Colectivo)** con rutas y tiempos en tiempo real.

3. **Mapa Interactivo con Pines (Leaflet):**
   - Vista general de todos los puntos de la ciudad con colores por categoría.
   - Filtro por día y acceso rápido a rutas.

4. **Control de Presupuesto & Mercado:**
   - Diseñado especialmente para tu caso: **$0 de hospedaje** por quedarte en casa de tu amiga.
   - Seguimiento enfocado en: **Mercado para la casa** (desayunos, picadas), **Restaurantes y bares**, **Transporte (SUBE/Apps)** y **Planes**.
   - Conversión automática en tiempo real de **Pesos Argentinos (ARS) a Dólares (USD)** con cotización editable.

5. **Guía Porteña & Tarjeta SUBE:**
   - Mapa de líneas de Subte (A, B, C, D, E, H).
   - Cómo pedir el boleto en colectivo ("¿Hasta dónde vas?").
   - Descuento RED SUBE (50% y 75% en trasbordos dentro de las 2 horas).
   - Dólar MEP con tarjeta extranjera, enchufes Tipo I y seguridad.

6. **Checklist & Equipaje:**
   - Lista interactiva de documentos, dinero, tecnología y equipaje.

7. **Respaldo & WhatsApp:**
   - Guarda automáticamente todo en la memoria de tu celular (`localStorage`).
   - Botón para exportar e importar copias de seguridad en formato `.json`.
   - Botón para compartir el enlace por WhatsApp.

---

## 🚀 Cómo ponerla en tu celular (PWA con Vercel)

### Paso 1: Subir a GitHub
1. Abre tu terminal o GitHub Desktop.
2. Crea un nuevo repositorio en [github.com](https://github.com) llamado `itinerario-argentina`.
3. Ejecuta en esta carpeta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/itinerario-argentina.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Conectar a Vercel (Gratis en 1 minuto)
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** y selecciona el repositorio `itinerario-argentina`.
3. Deja la configuración por defecto (Framework Preset: **Vite**).
4. Presiona **Deploy**.
5. ¡Listo! Vercel te dará una URL pública (ejemplo: `https://itinerario-argentina.vercel.app`).

### Paso 3: Instalar en la Pantalla de Inicio de tu Teléfono
1. Abre la URL de Vercel en el navegador de tu celular (Safari en iPhone o Chrome en Android).
2. **En iPhone (Safari):**
   - Toca el botón central de **Compartir** (icono de cuadrado con flecha hacia arriba).
   - Desliza hacia abajo y selecciona **"Agregar a pantalla de inicio"** (Add to Home Screen).
3. **En Android (Chrome):**
   - Toca los tres puntos de la esquina superior derecha.
   - Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. ¡Listo! Se abrirá como una app nativa con su icono del sol y obelisco porteño.

---

## 🛠️ Ejecución Local para Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev

# Compilar para producción
npm run build
```
