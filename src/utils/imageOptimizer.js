import { createWorker } from 'tesseract.js';

// Month dictionary for Spanish receipt dates (e.g. "OCTUBRE 03 DE" or "03 DE OCTUBRE")
const MONTH_MAP = {
  'ENERO': '01', 'ENE': '01',
  'FEBRERO': '02', 'FEB': '02',
  'MARZO': '03', 'MAR': '03',
  'ABRIL': '04', 'ABR': '04',
  'MAYO': '05', 'MAY': '05',
  'JUNIO': '06', 'JUN': '06',
  'JULIO': '07', 'JUL': '07',
  'AGOSTO': '08', 'AGO': '08',
  'SEPTIEMBRE': '09', 'SETIEMBRE': '09', 'SEP': '09', 'SET': '09',
  'OCTUBRE': '10', 'OCT': '10',
  'NOVIEMBRE': '11', 'NOV': '11',
  'DICIEMBRE': '12', 'DIC': '12'
};

/**
 * Loads a File or Blob into an HTML5 Canvas at optimal resolution.
 *
 * @param {File|Blob} fileOrBlob 
 * @param {number} maxDimension 
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function loadImageToCanvas(fileOrBlob, maxDimension = 1800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error leyendo archivo de imagen"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Error decodificando imagen"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Compresses an image file or canvas into a lightweight, clear WebP for database storage.
 *
 * @param {File|Blob|HTMLCanvasElement} input 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<{ base64: string, blob: Blob, originalSizeKb: number, compressedSizeKb: number, reductionPercent: number, width: number, height: number }>}
 */
export async function compressImage(input, maxWidth = 1300, quality = 0.78) {
  let sourceCanvas;
  let originalSizeKb = 0;

  if (input instanceof HTMLCanvasElement) {
    sourceCanvas = input;
    // Estimated uncompressed raw size in KB
    originalSizeKb = Math.round((sourceCanvas.width * sourceCanvas.height * 4) / 1024);
  } else {
    originalSizeKb = Math.round(input.size / 1024);
    sourceCanvas = await loadImageToCanvas(input, maxWidth);
  }

  return new Promise((resolve, reject) => {
    let width = sourceCanvas.width;
    let height = sourceCanvas.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen"));
          return;
        }

        const base64 = canvas.toDataURL('image/webp', quality);
        const compressedSizeKb = Math.round(blob.size / 1024);
        const reductionPercent = Math.max(0, Math.round((1 - (blob.size / (originalSizeKb * 1024 || blob.size * 2))) * 100));

        resolve({
          base64,
          blob,
          originalSizeKb: originalSizeKb || compressedSizeKb,
          compressedSizeKb,
          reductionPercent,
          width,
          height
        });
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Preprocesses an image canvas specifically for OCR:
 * Converts to grayscale, enhances contrast, and normalizes lighting
 * so thermal dot-matrix characters become deep black and paper becomes crisp white.
 *
 * @param {HTMLCanvasElement} sourceCanvas 
 * @returns {string} DataURL of preprocessed image for Tesseract
 */
export function preprocessCanvasForOcr(sourceCanvas) {
  try {
    const enhanced = enhanceDocumentContrast(sourceCanvas);
    return enhanced.toDataURL('image/png');
  } catch (err) {
    console.warn("Fallo en preprocesamiento de OCR, usando canvas original:", err);
    return sourceCanvas.toDataURL('image/png');
  }
}

/**
 * Runs OCR on the image using Tesseract.js (Spanish + English models).
 *
 * @param {string|Blob|HTMLCanvasElement} imageSource DataURL, Blob, or Canvas
 * @param {(progress: number) => void} onProgress Callback for progress percentage (0 - 100)
 * @returns {Promise<{ rawText: string, confidence: number }>}
 */
export async function recognizeReceiptText(imageSource, onProgress) {
  try {
    const worker = await createWorker(['spa', 'eng'], 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress && typeof m.progress === 'number') {
          onProgress(Math.min(100, Math.round(m.progress * 100)));
        }
      }
    });

    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    return {
      rawText: ret.data.text || '',
      confidence: ret.data.confidence || 0
    };
  } catch (err) {
    console.error("Error en transcripción OCR:", err);
    throw err;
  }
}

/**
 * Smart Regex Parser to extract Store, Total Amount, Date, Time, and Line Items
 * from Argentine, Colombian, and Latin American fiscal tickets and POS invoices.
 *
 * @param {string} rawText 
 * @returns {{ detectedStore: string, detectedTotalARS: number, detectedDate: string, detectedTime: string, detectedItems: Array, isUpsideDownDetected: boolean, rawText: string }}
 */
export function parseReceiptData(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { detectedStore: '', detectedTotalARS: 0, detectedDate: '', detectedTime: '', detectedItems: [], isUpsideDownDetected: false, rawText: '' };
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect Store
  let detectedStore = '';
  const knownStores = [
    { pattern: /\bCOTO\b/i, name: 'Coto' },
    { pattern: /\bCARREFOUR\b/i, name: 'Carrefour' },
    { pattern: /\bDIA\b|D[ÍI]A\s*%/i, name: 'Día %' },
    { pattern: /\bCHANGOMAS\b|CHANGO\s*M[ÁA]S/i, name: 'ChangoMás' },
    { pattern: /\bJUMBO\b/i, name: 'Jumbo' },
    { pattern: /\bDISCO\b/i, name: 'Supermercado Disco' },
    { pattern: /\bVEA\b/i, name: 'Supermercado Vea' },
    { pattern: /\bFARMACITY\b/i, name: 'Farmacity' },
    { pattern: /\bHAVANNA\b/i, name: 'Havanna' },
    { pattern: /\bFREDDO\b/i, name: 'Freddo' },
    { pattern: /DON\s*JULIO/i, name: 'Parrilla Don Julio' },
    { pattern: /GUERRIN|GÜERR[IÍ]N/i, name: 'Pizzería Güerrín' },
    { pattern: /CONTINENTAL/i, name: 'La Continental' },
    { pattern: /VERDULER[IÍ]A/i, name: 'Verdulería' },
    { pattern: /PANADER[IÍ]A/i, name: 'Panadería' },
    { pattern: /CARNICER[IÍ]A/i, name: 'Carnicería' },
    { pattern: /ALMAC[EÉ]N/i, name: 'Almacén de Barrio' },
    { pattern: /RED\s*COMERCIAL/i, name: 'Red Comercial Express' },
    { pattern: /\bEXITO\b|[EÉ]XITO/i, name: 'Éxito' },
    { pattern: /\bD1\b/i, name: 'Tiendas D1' },
    { pattern: /\bARA\b/i, name: 'Tiendas Ara' },
    { pattern: /\bOLIMPICA\b|OLÍMPICA/i, name: 'Olímpica' },
    { pattern: /\bCARULLA\b/i, name: 'Carulla' },
    { pattern: /\bSURTIMAX\b/i, name: 'Surtimax' }
  ];

  for (const st of knownStores) {
    if (st.pattern.test(rawText)) {
      detectedStore = st.name;
      break;
    }
  }

  // Fallback store: skip legal disclaimers, DIAN resolutions, employee titles
  if (!detectedStore) {
    for (const l of lines.slice(0, 12)) {
      const clean = l.replace(/[^a-zA-Z0-9\sÁÉÍÓÚáéíóúÑñ]/g, '').trim();
      const up = clean.toUpperCase();
      if (
        up.includes('NIT') || up.includes('RUT') || up.includes('CUIT') || 
        up.includes('CUIL') || up.includes('FACTURA') || up.includes('FA TURA') ||
        up.includes('TICKET') || up.includes('CAJA') || up.includes('CAJERO') || 
        up.includes('FECHA') || up.includes('HORA') || up.includes('NOMBRE') || 
        up.startsWith('DIR') || up.includes('DIRECCION') || up.includes('SOMOS') || 
        up.includes('FRANCES') || up.includes('CONTRIBUY') || up.includes('REGIMEN') || 
        up.includes('RES DIAN') || up.includes('HABILITA') || up.includes('CONSUMIDOR') ||
        up.includes('DETALLE') || up.includes('PRECIO') || up.includes('VALOR') ||
        up.includes('TOTAL') || up.includes('PAGAR') ||
        /\d{2,}/.test(clean) ||
        clean.length < 3 || clean.length > 30 || /^\d+$/.test(clean)
      ) {
        continue;
      }
      if (clean.length >= 3 && clean.length <= 30) {
        detectedStore = clean;
        break;
      }
    }
  }

  // 2. Detect Date & Time ("Fecha con Hora")
  let detectedDate = '';
  let detectedTime = '';

  // Extract Time (e.g. "HORA: 10:26:28", "10:26:28", "10:26", "02:15 PM")
  const timeMatch = rawText.match(/\b(?:HORA:?\s*)?([0-2]?\d:[0-5]\d(?::[0-5]\d)?(?:\s*[AaPp][Mm])?)\b/);
  if (timeMatch) {
    detectedTime = timeMatch[1].trim();
  }

  // Find line with FECHA explicitly, ignoring DIAN resolution dates
  const fechaLine = lines.find(l => /FECHA/i.test(l));
  const candidateDateLines = fechaLine ? [fechaLine, ...lines] : lines;

  const monthRegex = /(?:(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+([0-3]?\d)|([0-3]?\d)(?:\s+DE)?\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE))(?:\s+DE\s*(\d{2,4})?)?/i;

  for (const line of candidateDateLines) {
    const up = line.toUpperCase();
    if (up.includes('RES DIAN') || up.includes('RESOLUCION') || up.includes('HABILITA')) {
      continue;
    }

    const mMatch = line.match(monthRegex);
    if (mMatch) {
      let day, monthStr, year;
      if (mMatch[1] && mMatch[2]) {
        monthStr = mMatch[1].toUpperCase();
        day = mMatch[2].padStart(2, '0');
      } else if (mMatch[3] && mMatch[4]) {
        day = mMatch[3].padStart(2, '0');
        monthStr = mMatch[4].toUpperCase();
      }
      year = mMatch[5] || new Date().getFullYear().toString();
      if (year.length === 2) year = '20' + year;
      const month = MONTH_MAP[monthStr];
      if (day && month) {
        detectedDate = `${year}-${month}-${day}`;
        break;
      }
    }

    if (up.includes('FECHA')) {
      const numMatch = line.match(/\b([0-3]?\d)[\/\.-]([0-1]?\d)[\/\.-](20\d{2}|\d{2})\b/);
      if (numMatch) {
        let day = numMatch[1].padStart(2, '0');
        let month = numMatch[2].padStart(2, '0');
        let year = numMatch[3];
        if (year.length === 2) year = '20' + year;
        detectedDate = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // 3. Detect Total Amount (with OCR typo tolerance: "TAL APAGAR", "TALA PAGAR", "TOTAL A PAGAR", etc.)
  let detectedTotalARS = 0;
  const totalRegexes = [
    /(?:\bTOTAL|\bTO\s*TAL|\bTAL|\bTALA|\bTOT|\bT0TAL)\s*(?:A\s*)?(?:PAGAR|APAGAR|PAGO|COBRAR)?\s*[:$]?\s*([0-9]+(?:[.,][0-9]{1,3})*)/i,
    /(?:IMPORTE|VALOR|NETO)\s*TOTAL\s*[:$]?\s*([0-9]+(?:[.,][0-9]{1,3})*)/i,
    /\bAPAGAR\s*[:$]?\s*([0-9]+(?:[.,][0-9]{1,3})*)/i,
    /\bPAGO\s*[:$]?\s*([0-9]+(?:[.,][0-9]{1,3})*)/i
  ];

  for (const reg of totalRegexes) {
    const match = rawText.match(reg);
    if (match && match[1]) {
      const cleanNum = parseCurrencyNumber(match[1]);
      if (cleanNum > 0 && cleanNum < 50000000) {
        detectedTotalARS = cleanNum;
        break;
      }
    }
  }

  // 4. Extract Line Items / Products breakdown
  const detectedItems = extractReceiptItems(rawText);

  // Cross-reconcile items sum and total amount
  const itemsSum = detectedItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  if (detectedTotalARS === 0 && itemsSum > 0) {
    detectedTotalARS = itemsSum;
  } else if (itemsSum > 0 && detectedTotalARS > 0 && Math.abs(detectedTotalARS - itemsSum) / itemsSum > 0.4) {
    // If detected total is suspiciously huge compared to items sum (e.g. NIT 7002253 vs 16404), trust the items!
    if (detectedTotalARS > 1000000 || (detectedTotalARS / itemsSum > 3)) {
      detectedTotalARS = itemsSum;
    }
  }

  // 5. Detect if the receipt text looks inverted / upside-down
  const isUpsideDownDetected = detectUpsideDown(rawText);

  return {
    detectedStore: detectedStore || 'Comercio Local',
    detectedTotalARS: Math.round(detectedTotalARS),
    detectedDate: detectedDate || new Date().toISOString().split('T')[0],
    detectedTime: detectedTime || '',
    detectedItems,
    isUpsideDownDetected,
    rawText
  };
}

/**
 * Detects if the OCR recognized characters indicating the image is upside-down.
 */
export function detectUpsideDown(rawText) {
  if (!rawText || typeof rawText !== 'string') return false;
  const patterns = [
    /TY1O1/i, /MVOVd/i, /SYDVID/i, /VHJROD/i, /VUNIDY/i, /VA3NIVL/i, 
    /O9Vd/i, /IHLIN/i, /VLNV/i, /wHomowEs/i, /CLUNOWT/i
  ];
  return patterns.some(reg => reg.test(rawText));
}

/**
 * Extracts line items from receipt OCR text into structured rows:
 * [{ id, name, quantity, unitPrice, total }]
 * Supports Colombian POS (Detalle, Precio, Cant, Valor) and Argentine formats.
 */
export function extractReceiptItems(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];

  // Determine section bounds
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const up = lines[i].toUpperCase();
    if (
      up.includes('DETALLE') || up.includes('DESCRIPCION') || 
      up.includes('PRODUCTO') || up.includes('ARTICULO') || 
      (up.includes('CANT') && (up.includes('PRECIO') || up.includes('VALOR') || up.includes('IMPORTE')))
    ) {
      startIndex = i + 1;
      break;
    }
  }

  for (let i = startIndex >= 0 ? startIndex : 0; i < lines.length; i++) {
    const up = lines[i].toUpperCase();
    if (
      up.includes('TOTAL') || up.includes('APAGAR') || up.includes('PAGAR') ||
      up.includes('TAL APAGAR') || up.includes('TALA PAGAR') ||
      up.includes('SUBTOTAL') || up.includes('EFECTIVO') || up.includes('TARJETA') || 
      up.includes('PAGO') || up.includes('RECIBIDO') ||
      up.includes('CAMBIO') || up.includes('VUELTO')
    ) {
      endIndex = i;
      break;
    }
  }

  const candidateLines = lines.slice(startIndex >= 0 ? startIndex : 0, endIndex);

  for (const line of candidateLines) {
    const up = line.toUpperCase();

    // Skip fiscal, employee, store or document headers, and payment totals
    if (
      up.includes('FACTURA') || up.includes('FA TURA') || up.includes('CAJA') || 
      up.includes('CAJERO') || up.includes('NOMBRE') || up.includes('FECHA') || 
      up.includes('HORA') || up.includes('CLIENTE') || up.includes('DIR:') || 
      up.includes('NIT') || up.includes('CUIT') || up.includes('CUIL') || up.includes('RUT') || 
      up.includes('IIBB') || up.includes('AFIP') || up.includes('TIQUE') ||
      up.includes('RESPONSABLE') || up.includes('CONDICION IVA') ||
      up.includes('GRACIAS') || up.includes('CALLE') || up.includes('DIAN') ||
      up.includes('REGIMEN') || up.includes('CONTRIBUYENTES') || 
      up.includes('NOS FRANCES') || up.includes('HABILITA') ||
      up.includes('TOTAL') || up.includes('APAGAR') || up.includes('PAGAR') ||
      up.includes('SUBTOTAL') || up.includes('EFECTIVO') || up.includes('TARJETA') || 
      up.includes('PAGO') || up.includes('RECIBIDO') ||
      up.includes('CAMBIO') || up.includes('VUELTO') || up.length < 3
    ) {
      continue;
    }

    // Pattern like "2 X 1100 PRODUCT" or "1 MUZZARELLA 9500"
    let qtyFromStart = 1;
    let unitPriceFromStart = 0;
    let cleanLine = line;

    const startMultiplierMatch = cleanLine.match(/^([0-9]{1,3}(?:[.,][0-9]{1,2})?)\s*[xX*]\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\s*(.*)/);
    if (startMultiplierMatch) {
      qtyFromStart = parseCurrencyNumber(startMultiplierMatch[1]) || 1;
      unitPriceFromStart = parseCurrencyNumber(startMultiplierMatch[2]) || 0;
      cleanLine = startMultiplierMatch[3];
    } else {
      const startQtyMatch = cleanLine.match(/^([0-9]{1,2}(?:[.,][0-9]{1,2})?)\s+([A-Za-zÁ-ú].*)/);
      if (startQtyMatch) {
        qtyFromStart = parseCurrencyNumber(startQtyMatch[1]) || 1;
        cleanLine = startQtyMatch[2];
      }
    }

    const tokens = cleanLine.split(/\s+/);
    const numbersAtEnd = [];
    let nameTokens = [];

    for (let j = tokens.length - 1; j >= 0; j--) {
      const rawTok = tokens[j].replace(/[$]/g, '');
      // Skip Argentine tax column like (21.00) or (10.5)
      if (/^\([0-9]{1,2}(?:[.,][0-9]{1,2})?%?\)$/.test(rawTok)) {
        continue;
      }
      const tok = rawTok;
      const num = parseCurrencyNumber(tok);
      if (/^[\d.,]+$/.test(tok) && !isNaN(num)) {
        numbersAtEnd.unshift({ raw: tok, val: num });
      } else {
        nameTokens = tokens.slice(0, j + 1);
        break;
      }
    }

    const name = nameTokens.join(' ')
      .replace(/^[0-9]{1,3}\s*[xX*]\s*[0-9.,]+\s*/, '')
      .replace(/[^a-zA-Z0-9\sÁÉÍÓÚáéíóúÑñ/%-]/g, '')
      .trim();

    if (name && name.length >= 2 && (numbersAtEnd.length >= 1 || unitPriceFromStart > 0)) {
      let qty = qtyFromStart;
      let unitPrice = unitPriceFromStart;
      let total = 0;

      if (numbersAtEnd.length === 1) {
        total = numbersAtEnd[0].val;
        unitPrice = unitPriceFromStart > 0 ? unitPriceFromStart : Math.round(total / (qty || 1));
      } else if (numbersAtEnd.length === 2) {
        const n1 = numbersAtEnd[0].val;
        const n2 = numbersAtEnd[1].val;
        if (n1 <= 50 && n2 > 100) {
          qty = n1;
          total = n2;
          unitPrice = Math.round(total / (qty || 1));
        } else {
          unitPrice = n1;
          total = n2;
          qty = 1;
        }
      } else if (numbersAtEnd.length === 3) {
        // Universal 3-number resolver (supports both Colombian [PRECIO, CANT, VALOR] and Argentine/Intl [CANT, PRECIO, IMPORTE])
        const p1 = numbersAtEnd[0].val;
        const p2 = numbersAtEnd[1].val;
        const p3 = numbersAtEnd[2].val;

        // Mathematical cross-validation: Unit Price * Quantity = Total
        if (Math.abs(p1 * p2 - p3) <= 5 || (p3 > 0 && Math.abs((p1 * p2) - p3) / p3 < 0.05)) {
          total = p3;
          qty = Math.min(p1, p2);
          unitPrice = Math.max(p1, p2);
        } else if (Math.abs(p2 * p3 - p1) <= 5) {
          total = p1;
          qty = Math.min(p2, p3);
          unitPrice = Math.max(p2, p3);
        } else {
          unitPrice = Math.max(p1, p2);
          qty = Math.min(p1, p2);
          total = p3;
        }
      } else if (numbersAtEnd.length === 4) {
        // Check for split decimal in quantity: e.g. [9200, 1, 25, 11500] or [5600, 0, 59, 3304]
        const p1 = numbersAtEnd[0].val;
        const qInt = numbersAtEnd[1].val;
        const qDec = numbersAtEnd[2].val;
        const pTotal = numbersAtEnd[3].val;
        const decStr = numbersAtEnd[2].raw.replace(/[^0-9]/g, '');
        const reconstructedQty = qInt + (qDec / Math.pow(10, decStr.length || 2));

        if (Math.abs(p1 * reconstructedQty - pTotal) <= 5 || (pTotal > 0 && Math.abs(p1 * reconstructedQty - pTotal) / pTotal < 0.05)) {
          unitPrice = p1;
          qty = reconstructedQty;
          total = pTotal;
        } else if (Math.abs(numbersAtEnd[1].val * numbersAtEnd[2].val - numbersAtEnd[3].val) <= 5) {
          // CODIGO, PRECIO, CANT, VALOR format
          unitPrice = numbersAtEnd[1].val;
          qty = numbersAtEnd[2].val;
          total = numbersAtEnd[3].val;
        } else {
          unitPrice = p1;
          qty = numbersAtEnd[1].val;
          total = pTotal;
        }
      }

      items.push({
        id: 'item-' + Math.random().toString(36).slice(2, 8),
        name: capitalizeWords(name),
        quantity: Number(qty.toFixed(2)) || 1,
        unitPrice: Math.round(unitPrice) || Math.round(total),
        total: Math.round(total)
      });
    }
  }

  return items;
}

function capitalizeWords(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}

/**
 * Rotates and/or flips an HTML5 Canvas to any angle (0, 90, 180, 270)
 * and horizontal mirror for camera corrections.
 *
 * @param {HTMLCanvasElement} sourceCanvas 
 * @param {number} angleDegrees (0, 90, 180, 270)
 * @param {boolean} flipHorizontal 
 * @returns {HTMLCanvasElement}
 */
export function transformCanvas(sourceCanvas, angleDegrees = 0, flipHorizontal = false) {
  const normAngle = ((angleDegrees % 360) + 360) % 360;
  const is90or270 = normAngle === 90 || normAngle === 270;
  
  const width = is90or270 ? sourceCanvas.height : sourceCanvas.width;
  const height = is90or270 ? sourceCanvas.width : sourceCanvas.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.translate(width / 2, height / 2);
  ctx.rotate((normAngle * Math.PI) / 180);
  if (flipHorizontal) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);

  return canvas;
}

/**
 * Robust currency number parser supporting dot/comma thousands and decimals:
 * - "16,404" -> 16404
 * - "16.404" -> 16404
 * - "16.404,50" -> 16404.5
 * - "50,000" -> 50000
 */
export function parseCurrencyNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).replace(/[^0-9.,]/g, '').trim();
  if (!s) return 0;

  // Case 1: Both dot and comma present
  if (s.includes('.') && s.includes(',')) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } 
  // Case 2: Only dots present
  else if (s.includes('.') && !s.includes(',')) {
    const parts = s.split('.');
    if (parts.length > 2) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.length === 2) {
        s = parts.slice(0, -1).join('') + '.' + lastPart;
      } else {
        s = parts.join('');
      }
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        s = parts[0] + parts[1];
      }
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
        s = parts[0] + parts[1];
      } else {
        s = s.replace(',', '.');
      }
    }
  }

  const valNum = parseFloat(s);
  return isNaN(valNum) ? 0 : valNum;
}

/**
 * Solves the 3x3 homography matrix H mapping dst (u, v) -> src (x, y)
 * using standard Gaussian elimination on an 8x8 linear system.
 */
export function getHomography(srcPts, dstPts) {
  const a = [];
  for (let i = 0; i < 4; i++) {
    const u = dstPts[i].x;
    const v = dstPts[i].y;
    const x = srcPts[i].x;
    const y = srcPts[i].y;
    a.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    a.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }

  for (let i = 0; i < 8; i++) {
    let maxRow = i;
    for (let r = i + 1; r < 8; r++) {
      if (Math.abs(a[r][i]) > Math.abs(a[maxRow][i])) maxRow = r;
    }
    const tmp = a[i]; a[i] = a[maxRow]; a[maxRow] = tmp;
    const pivot = a[i][i];
    if (Math.abs(pivot) > 1e-10) {
      for (let c = i; c <= 8; c++) a[i][c] /= pivot;
      for (let r = 0; r < 8; r++) {
        if (r !== i) {
          const factor = a[r][i];
          for (let c = i; c <= 8; c++) a[r][c] -= factor * a[i][c];
        }
      }
    }
  }

  return [
    a[0][8], a[1][8], a[2][8],
    a[3][8], a[4][8], a[5][8],
    a[6][8], a[7][8], 1
  ];
}

/**
 * Recomposes and flattens a ticket from 4 corners using bilinear perspective warp (Homography).
 * Similar to CamScanner / Adobe Scan perspective deskewing.
 *
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {{ topLeft: {x,y}, topRight: {x,y}, bottomRight: {x,y}, bottomLeft: {x,y} }} corners
 * @param {number} [targetWidth]
 * @param {number} [targetHeight]
 * @returns {HTMLCanvasElement}
 */
export function warpPerspective(sourceCanvas, corners, targetWidth, targetHeight) {
  const srcPts = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];

  // Calculate target dimensions from corner distances
  const wTop = Math.hypot(srcPts[1].x - srcPts[0].x, srcPts[1].y - srcPts[0].y);
  const wBottom = Math.hypot(srcPts[2].x - srcPts[3].x, srcPts[2].y - srcPts[3].y);
  const hLeft = Math.hypot(srcPts[3].x - srcPts[0].x, srcPts[3].y - srcPts[0].y);
  const hRight = Math.hypot(srcPts[2].x - srcPts[1].x, srcPts[2].y - srcPts[1].y);

  const dstW = Math.round(targetWidth || Math.max(wTop, wBottom));
  const dstH = Math.round(targetHeight || Math.max(hLeft, hRight));

  if (dstW <= 10 || dstH <= 10) return sourceCanvas;

  const dstPts = [
    { x: 0, y: 0 },
    { x: dstW, y: 0 },
    { x: dstW, y: dstH },
    { x: 0, y: dstH }
  ];

  const H = getHomography(srcPts, dstPts);

  const srcCtx = sourceCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const sD = srcData.data;
  const sW = sourceCanvas.width;
  const sH = sourceCanvas.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = dstW;
  outCanvas.height = dstH;
  const outCtx = outCanvas.getContext('2d');
  const outData = outCtx.createImageData(dstW, dstH);
  const oD = outData.data;

  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = H;

  let dstIdx = 0;
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const den = h6 * x + h7 * y + h8;
      const sx = (h0 * x + h1 * y + h2) / den;
      const sy = (h3 * x + h4 * y + h5) / den;

      const x0 = sx | 0;
      const y0 = sy | 0;

      if (x0 >= 0 && x0 < sW - 1 && y0 >= 0 && y0 < sH - 1) {
        const dx = sx - x0;
        const dy = sy - y0;
        const w00 = (1 - dx) * (1 - dy);
        const w10 = dx * (1 - dy);
        const w01 = (1 - dx) * dy;
        const w11 = dx * dy;

        const i00 = (y0 * sW + x0) * 4;
        const i10 = i00 + 4;
        const i01 = ((y0 + 1) * sW + x0) * 4;
        const i11 = i01 + 4;

        oD[dstIdx] = (sD[i00] * w00 + sD[i10] * w10 + sD[i01] * w01 + sD[i11] * w11) | 0;
        oD[dstIdx + 1] = (sD[i00 + 1] * w00 + sD[i10 + 1] * w10 + sD[i01 + 1] * w01 + sD[i11 + 1] * w11) | 0;
        oD[dstIdx + 2] = (sD[i00 + 2] * w00 + sD[i10 + 2] * w10 + sD[i01 + 2] * w01 + sD[i11 + 2] * w11) | 0;
        oD[dstIdx + 3] = 255;
      }
      dstIdx += 4;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

/**
 * CamScanner-style Adaptive Local Background Normalization ("Magic Filter")
 * Eliminates uneven shadows, whitens thermal paper, and boosts text ink to deep black
 * while strictly PRESERVING continuous anti-aliased font edges (zero jagged binarization).
 *
 * @param {HTMLCanvasElement} sourceCanvas
 * @returns {HTMLCanvasElement}
 */
export function enhanceDocumentContrast(sourceCanvas) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  // Block grid for local background estimation (smooth floating-point cells)
  const blockW = Math.max(20, Math.round(width / 22));
  const blockH = Math.max(20, Math.round(height / 22));
  const gridCols = Math.ceil(width / blockW);
  const gridRows = Math.ceil(height / blockH);
  const bgGrid = new Float32Array(gridCols * gridRows);

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      let maxVal = 0;
      const startX = gx * blockW;
      const startY = gy * blockH;
      const endX = Math.min(width, startX + blockW);
      const endY = Math.min(height, startY + blockH);

      // Sample 85th-95th percentile luminance in this block
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
          if (lum > maxVal) maxVal = lum;
        }
      }
      bgGrid[gy * gridCols + gx] = Math.max(60, maxVal);
    }
  }

  // Smooth Bilinear Interpolation across grid cell centers + Continuous S-curve
  for (let y = 0; y < height; y++) {
    const fy = (y - blockH * 0.5) / blockH;
    const y0 = Math.max(0, Math.min(gridRows - 1, Math.floor(fy)));
    const y1 = Math.min(gridRows - 1, y0 + 1);
    const wy = Math.max(0, Math.min(1, fy - y0));

    for (let x = 0; x < width; x++) {
      const fx = (x - blockW * 0.5) / blockW;
      const x0 = Math.max(0, Math.min(gridCols - 1, Math.floor(fx)));
      const x1 = Math.min(gridCols - 1, x0 + 1);
      const wx = Math.max(0, Math.min(1, fx - x0));

      const bg00 = bgGrid[y0 * gridCols + x0];
      const bg10 = bgGrid[y0 * gridCols + x1];
      const bg01 = bgGrid[y1 * gridCols + x0];
      const bg11 = bgGrid[y1 * gridCols + x1];

      const bg = (1 - wx) * (1 - wy) * bg00 +
                 wx * (1 - wy) * bg10 +
                 (1 - wx) * wy * bg01 +
                 wx * wy * bg11;

      const idx = (y * width + x) * 4;
      const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
      const ratio = lum / Math.max(40, bg);

      let v;
      if (ratio >= 0.82) {
        // Clean white paper background
        const paperFactor = Math.min(1, (ratio - 0.82) / 0.18);
        v = Math.round(225 + paperFactor * 30);
      } else {
        // Smooth dark text preserving continuous anti-aliased edge gradient
        const norm = ratio / 0.82;
        v = Math.round(Math.pow(norm, 1.45) * 225);
      }

      v = Math.max(0, Math.min(255, v));
      d[idx] = v;
      d[idx + 1] = v;
      d[idx + 2] = v;
      d[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Automatically estimates the 4 corners of a receipt in the canvas.
 * Falls back to a clean 5% inset rectangle if high contrast contour isn't definitive.
 */
export function autoDetectCorners(sourceCanvas) {
  try {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Fast downsampling grid for edge detection
    const sw = 100, sh = 140;
    const ctx = sourceCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    const stepX = width / sw;
    const stepY = height / sh;
    const grid = new Float32Array(sw * sh);
    let totalLum = 0;

    for (let gy = 0; gy < sh; gy++) {
      const y = Math.min(height - 1, (gy * stepY) | 0);
      for (let gx = 0; gx < sw; gx++) {
        const x = Math.min(width - 1, (gx * stepX) | 0);
        const idx = (y * width + x) * 4;
        const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
        grid[gy * sw + gx] = lum;
        totalLum += lum;
      }
    }

    const avgLum = totalLum / (sw * sh);
    const threshold = Math.max(75, Math.min(185, avgLum * 1.04));

    let top = 0, bottom = sh - 1, left = 0, right = sw - 1;

    // Scan top
    for (let y = 0; y < sh * 0.45; y++) {
      let brightCount = 0;
      for (let x = 0; x < sw; x++) {
        if (grid[y * sw + x] > threshold) brightCount++;
      }
      if (brightCount > sw * 0.25) { top = y; break; }
    }

    // Scan bottom
    for (let y = sh - 1; y > sh * 0.55; y--) {
      let brightCount = 0;
      for (let x = 0; x < sw; x++) {
        if (grid[y * sw + x] > threshold) brightCount++;
      }
      if (brightCount > sw * 0.25) { bottom = y; break; }
    }

    // Scan left
    for (let x = 0; x < sw * 0.45; x++) {
      let brightCount = 0;
      for (let y = top; y <= bottom; y++) {
        if (grid[y * sw + x] > threshold) brightCount++;
      }
      if (brightCount > (bottom - top) * 0.25) { left = x; break; }
    }

    // Scan right
    for (let x = sw - 1; x > sw * 0.55; x--) {
      let brightCount = 0;
      for (let y = top; y <= bottom; y++) {
        if (grid[y * sw + x] > threshold) brightCount++;
      }
      if (brightCount > (bottom - top) * 0.25) { right = x; break; }
    }

    // Map back with 2% margin
    const padX = Math.round(width * 0.02);
    const padY = Math.round(height * 0.02);
    const realLeft = Math.max(0, Math.round(left * stepX) - padX);
    const realRight = Math.min(width, Math.round(right * stepX) + padX);
    const realTop = Math.max(0, Math.round(top * stepY) - padY);
    const realBottom = Math.min(height, Math.round(bottom * stepY) + padY);

    const coverage = ((realRight - realLeft) * (realBottom - realTop)) / (width * height);
    if (coverage >= 0.28 && coverage <= 0.98) {
      return {
        topLeft: { x: realLeft, y: realTop },
        topRight: { x: realRight, y: realTop },
        bottomRight: { x: realRight, y: realBottom },
        bottomLeft: { x: realLeft, y: realBottom }
      };
    }
  } catch (err) {
    console.warn("Fallo en auto-detección de bordes, usando margen por defecto:", err);
  }

  // Safe fallback: 3% inset
  const marginX = Math.round(sourceCanvas.width * 0.03);
  const marginY = Math.round(sourceCanvas.height * 0.03);
  return {
    topLeft: { x: marginX, y: marginY },
    topRight: { x: sourceCanvas.width - marginX, y: marginY },
    bottomRight: { x: sourceCanvas.width - marginX, y: sourceCanvas.height - marginY },
    bottomLeft: { x: marginX, y: sourceCanvas.height - marginY }
  };
}


