import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, 
  Sparkles, Check, X, ArrowRight, Eye, ChevronDown, ChevronUp, Image as ImageIcon,
  RotateCw, RotateCcw, SwitchCamera, ZoomIn, ZoomOut, Maximize2, ShoppingBag,
  Plus, Trash2, AlertTriangle, FlipHorizontal, Clock, Crop, Wand2
} from 'lucide-react';
import { 
  compressImage, 
  loadImageToCanvas, 
  preprocessCanvasForOcr, 
  recognizeReceiptText, 
  parseReceiptData,
  transformCanvas,
  extractReceiptItems,
  detectUpsideDown,
  warpPerspective,
  enhanceDocumentContrast,
  autoDetectCorners
} from '../utils/imageOptimizer';
import { formatCurrencyARS, formatCurrencyUSD, parseCurrencyNumber } from '../utils/helpers';

const PIPELINE_STEPS = [
  { id: 1, title: 'Optimización de encuadre y resolución', subtitle: 'Preservando cabecera y márgenes completos' },
  { id: 2, title: 'Balance de iluminación y sombras', subtitle: 'Normalizando luz de fondo sin distorsión' },
  { id: 3, title: 'Realce óptico de texto térmico', subtitle: 'Nitidez continua con antialiasing suave' },
  { id: 4, title: 'Extracción de productos y totales con OCR', subtitle: 'Poblando la tabla de ítems' }
];

export default function ReceiptScanner({
  defaultCategory = 'mercado',
  categoryName = 'Mercado de Alimentos',
  exchangeRate = 1280,
  onSaveExpenseWithReceipt,
  onClose
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const wrapperRef = useRef(null);
  const guideRef = useRef(null);

  // Status: 'idle' | 'processing' | 'review'
  const [scanStatus, setScanStatus] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(1);
  const [pipelineStatusText, setPipelineStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front/webcam)
  const [frameOrientation, setFrameOrientation] = useState('vertical'); // 'vertical' | 'horizontal'
  const [rotationAngle, setRotationAngle] = useState(0); // 0 | 90 | 180 | 270
  const [autoCropGuide, setAutoCropGuide] = useState(true); // Crop to viewfinder guide for max resolution
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Compression & OCR metrics
  const [compressionStats, setCompressionStats] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [originalCanvasRef, setOriginalCanvasRef] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [isRetryingOcr, setIsRetryingOcr] = useState(false);
  const [isUpsideDown, setIsUpsideDown] = useState(false);

  // Lightbox / Photo Inspection Modal
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Perspective Warp & Recomposition (CamScanner mode)
  const imgContainerRef = useRef(null);
  const [isPerspectiveMode, setIsPerspectiveMode] = useState(false);
  const [corners, setCorners] = useState({
    tl: { x: 4, y: 4 },
    tr: { x: 96, y: 4 },
    br: { x: 96, y: 96 },
    bl: { x: 4, y: 96 }
  });
  const [activeCorner, setActiveCorner] = useState(null);
  const [isApplyingPerspective, setIsApplyingPerspective] = useState(false);

  // Extracted & Editable Fields
  const [storeName, setStoreName] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receiptTime, setReceiptTime] = useState('');
  const [amountARS, setAmountARS] = useState('');
  const [paidBy, setPaidBy] = useState('Yo');
  const [receiptNote, setReceiptNote] = useState('');

  // Structured Line Items / Products breakdown
  const [itemsList, setItemsList] = useState([]);

  // Detect available video devices on mount
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // START LIVE WEBCAM / CAMERA STREAM
  const startLiveCamera = async (mode = facingMode) => {
    try {
      setErrorMessage('');
      setRotationAngle(0);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta cámara directa. Por favor usa el botón de subir imagen.");
      }

      // Stop any existing stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      // Attach to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.warn("Video play error:", err));
        }
      }, 100);
    } catch (err) {
      console.warn("No se pudo iniciar cámara directa:", err);
      setIsCameraActive(false);
      setErrorMessage("No se pudo activar la cámara directa (permiso denegado o no disponible). Puedes usar el botón de 'Subir Foto / Archivo'.");
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Toggle front / back camera if device has multiple
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  // Rotate camera image by 90 degrees
  const rotateCamera90 = () => {
    setRotationAngle(prev => (prev + 90) % 360);
  };

  // CAPTURE FRAME FROM LIVE CAMERA WITH CROPPING & ROTATION APPLIED
  const captureFrameFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const wrapper = wrapperRef.current;
    const guide = guideRef.current;

    const rawWidth = video.videoWidth || 1280;
    const rawHeight = video.videoHeight || 720;

    const isRotated90or270 = rotationAngle === 90 || rotationAngle === 270;
    const targetWidth = isRotated90or270 ? rawHeight : rawWidth;
    const targetHeight = isRotated90or270 ? rawWidth : rawHeight;

    // 1. Draw the complete rotated camera frame
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = targetWidth;
    rotCanvas.height = targetHeight;

    const rotCtx = rotCanvas.getContext('2d');
    rotCtx.imageSmoothingEnabled = true;
    rotCtx.imageSmoothingQuality = 'high';
    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate((rotationAngle * Math.PI) / 180);
    rotCtx.drawImage(video, -rawWidth / 2, -rawHeight / 2, rawWidth, rawHeight);

    let finalCanvas = rotCanvas;

    // 2. Crop to the viewfinder guide if autoCropGuide is active
    if (autoCropGuide && guide && wrapper) {
      try {
        const wrapperRect = wrapper.getBoundingClientRect();
        const guideRect = guide.getBoundingClientRect();

        const videoAspect = targetWidth / targetHeight;
        const wrapperAspect = wrapperRect.width / wrapperRect.height;

        let renderW, renderH, offsetX, offsetY;
        if (wrapperAspect > videoAspect) {
          renderW = wrapperRect.width;
          renderH = wrapperRect.width / videoAspect;
          offsetX = 0;
          offsetY = (wrapperRect.height - renderH) / 2;
        } else {
          renderH = wrapperRect.height;
          renderW = wrapperRect.height * videoAspect;
          offsetY = 0;
          offsetX = (wrapperRect.width - renderW) / 2;
        }

        const scale = targetWidth / renderW;
        const guideRelX = guideRect.left - (wrapperRect.left + offsetX);
        const guideRelY = guideRect.top - (wrapperRect.top + offsetY);

        let cropX = Math.round(guideRelX * scale);
        let cropY = Math.round(guideRelY * scale);
        let cropW = Math.round(guideRect.width * scale);
        let cropH = Math.round(guideRect.height * scale);

        // Add 8% safety padding margin
        const padX = Math.round(cropW * 0.08);
        const padY = Math.round(cropH * 0.08);
        cropX = Math.max(0, cropX - padX);
        cropY = Math.max(0, cropY - padY);
        cropW = Math.min(targetWidth - cropX, cropW + padX * 2);
        cropH = Math.min(targetHeight - cropY, cropH + padY * 2);

        if (cropW > 120 && cropH > 120) {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cCtx = cropCanvas.getContext('2d');
          cCtx.imageSmoothingEnabled = true;
          cCtx.imageSmoothingQuality = 'high';
          cCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          finalCanvas = cropCanvas;
        }
      } catch (cropErr) {
        console.warn("Fallo al recortar según visor, usando marco completo:", cropErr);
      }
    }

    stopLiveCamera();
    processReceiptCanvas(finalCanvas);
  };

  // PROCESS CANVAS (AUTOMATIC PIPELINE: AUTO-CROP -> WARP PERSPECTIVE -> THERMAL ENHANCE -> OCR)
  const processReceiptCanvas = async (sourceCanvas, skipAutoPipeline = false) => {
    setErrorMessage('');
    setScanStatus('processing');
    setOcrProgress(0);

    try {
      let finalProcessingCanvas = sourceCanvas;

      if (!skipAutoPipeline) {
        // Step 1: Enfoque y resolución nativa (preservando cabecera completa)
        setPipelineStep(1);
        setPipelineStatusText('Optimizando encuadre y preservando cabecera...');
        await new Promise(r => setTimeout(r, 160));

        // Step 2: Nivelación y balance de iluminación
        setPipelineStep(2);
        setPipelineStatusText('Nivelando iluminación y removiendo sombras...');
        await new Promise(r => setTimeout(r, 160));

        // Step 3: Realce óptico de texto térmico suave y continuo
        setPipelineStep(3);
        setPipelineStatusText('Aplicando realce óptico continuo de alta definición...');
        finalProcessingCanvas = enhanceDocumentContrast(sourceCanvas);
        await new Promise(r => setTimeout(r, 160));
      }

      // Step 4: Compression for storage & OCR recognition
      setPipelineStep(4);
      setPipelineStatusText('Extrayendo productos, cantidades, precios y total...');

      const compressed = await compressImage(finalProcessingCanvas, 1300, 0.80);
      setCompressionStats({
        originalSizeKb: compressed.originalSizeKb,
        compressedSizeKb: compressed.compressedSizeKb,
        reductionPercent: compressed.reductionPercent
      });
      setPreviewBase64(compressed.base64);
      setOriginalCanvasRef(finalProcessingCanvas);

      // Run OCR on the refined, flattened canvas
      const ocrSourceDataUrl = finalProcessingCanvas.toDataURL('image/png');
      const ocrResult = await recognizeReceiptText(ocrSourceDataUrl, (pct) => {
        setOcrProgress(pct);
      });

      setRawOcrText(ocrResult.rawText);

      // Smart extraction with items & total reconciliation
      const parsed = parseReceiptData(ocrResult.rawText);
      setStoreName(parsed.detectedStore || 'Ticket de Compra');
      if (parsed.detectedDate) setReceiptDate(parsed.detectedDate);
      if (parsed.detectedTime) setReceiptTime(parsed.detectedTime);
      if (parsed.detectedTotalARS > 0) setAmountARS(parsed.detectedTotalARS.toString());
      
      // Items breakdown table
      setItemsList(parsed.detectedItems || []);

      // Check if inverted/upside-down
      setIsUpsideDown(parsed.isUpsideDownDetected || false);

      setScanStatus('review');
    } catch (err) {
      console.error("Error en pipeline de procesamiento de imagen:", err);
      setErrorMessage("No se pudo procesar la imagen automáticamente. Intenta con otra foto con mejor iluminación.");
      setScanStatus('idle');
    }
  };

  // ROTATE OR FLIP CAPTURED PHOTO IN REVIEW / LIGHTBOX AND RE-OCR
  const handleTransform = async (angleDelta = 0, flipHorizontal = false) => {
    if (!originalCanvasRef) return;
    try {
      const transformed = transformCanvas(originalCanvasRef, angleDelta, flipHorizontal);
      setOriginalCanvasRef(transformed);
      await processReceiptCanvas(transformed);
    } catch (err) {
      console.warn("Error transformando imagen:", err);
    }
  };

  // Handle dragging a corner handle in Perspective Mode
  const handlePointerDownCorner = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveCorner(key);
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) {}

    const container = imgContainerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvt) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const xPct = Math.max(0, Math.min(100, ((moveEvt.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((moveEvt.clientY - rect.top) / rect.height) * 100));
      setCorners(prev => ({
        ...prev,
        [key]: { x: Number(xPct.toFixed(1)), y: Number(yPct.toFixed(1)) }
      }));
    };

    const onPointerUp = (upEvt) => {
      try {
        upEvt.target.releasePointerCapture(upEvt.pointerId);
      } catch (_) {}
      setActiveCorner(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleResetCorners = () => {
    setCorners({
      tl: { x: 4, y: 4 },
      tr: { x: 96, y: 4 },
      br: { x: 96, y: 96 },
      bl: { x: 4, y: 96 }
    });
  };

  // Apply Bilinear Perspective Warp (flatten ticket) + CamScanner Magic Filter
  const handleApplyPerspectiveWarp = async () => {
    if (!originalCanvasRef) return;
    setIsApplyingPerspective(true);
    try {
      const w = originalCanvasRef.width;
      const h = originalCanvasRef.height;
      const nativeCorners = {
        topLeft: { x: (corners.tl.x / 100) * w, y: (corners.tl.y / 100) * h },
        topRight: { x: (corners.tr.x / 100) * w, y: (corners.tr.y / 100) * h },
        bottomRight: { x: (corners.br.x / 100) * w, y: (corners.br.y / 100) * h },
        bottomLeft: { x: (corners.bl.x / 100) * w, y: (corners.bl.y / 100) * h }
      };

      const warpedCanvas = warpPerspective(originalCanvasRef, nativeCorners);
      const enhancedCanvas = enhanceDocumentContrast(warpedCanvas);

      setOriginalCanvasRef(enhancedCanvas);
      setIsPerspectiveMode(false);
      setIsLightboxOpen(false);

      await processReceiptCanvas(enhancedCanvas, true);
    } catch (err) {
      console.error("Error aplicando recomposición de perspectiva:", err);
      setErrorMessage("No se pudo aplanar la perspectiva. Verifica que las 4 esquinas formen un cuadrilátero válido.");
    } finally {
      setIsApplyingPerspective(false);
    }
  };

  // 1-Click CamScanner Document Filter on the existing photo
  const handleApplyDocumentFilter = async () => {
    if (!originalCanvasRef) return;
    try {
      const enhancedCanvas = enhanceDocumentContrast(originalCanvasRef);
      setOriginalCanvasRef(enhancedCanvas);
      await processReceiptCanvas(enhancedCanvas, true);
    } catch (err) {
      console.warn("Error aplicando filtro documento:", err);
    }
  };

  // Re-run OCR if user wants to re-analyze without taking a new photo
  const handleRerunOcr = async () => {
    if (!originalCanvasRef) return;
    setIsRetryingOcr(true);
    setOcrProgress(0);
    try {
      const ocrSource = preprocessCanvasForOcr(originalCanvasRef);
      const ocrResult = await recognizeReceiptText(ocrSource, (pct) => setOcrProgress(pct));
      setRawOcrText(ocrResult.rawText);
      const parsed = parseReceiptData(ocrResult.rawText);
      if (parsed.detectedStore && parsed.detectedStore !== 'Comercio Local') {
        setStoreName(parsed.detectedStore);
      }
      if (parsed.detectedDate) setReceiptDate(parsed.detectedDate);
      if (parsed.detectedTime) setReceiptTime(parsed.detectedTime);
      if (parsed.detectedTotalARS > 0) setAmountARS(parsed.detectedTotalARS.toString());
      setItemsList(parsed.detectedItems || []);
      setIsUpsideDown(parsed.isUpsideDownDetected || false);
    } catch (err) {
      console.warn("Error reintentando OCR:", err);
    } finally {
      setIsRetryingOcr(false);
    }
  };

  // Handle file input change (upload from disk/gallery)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopLiveCamera();
    try {
      setScanStatus('compressing');
      const canvas = await loadImageToCanvas(file, 1800);
      await processReceiptCanvas(canvas);
    } catch (err) {
      console.error("Error cargando archivo:", err);
      setErrorMessage("No se pudo cargar la imagen seleccionada.");
      setScanStatus('idle');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    stopLiveCamera();
    setIsLightboxOpen(false);
    setScanStatus('idle');
    setCompressionStats(null);
    setOcrProgress(0);
    setPreviewBase64(null);
    setOriginalCanvasRef(null);
    setRawOcrText('');
    setStoreName('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setReceiptTime('');
    setAmountARS('');
    setReceiptNote('');
    setItemsList([]);
    setIsUpsideDown(false);
    setErrorMessage('');
  };

  // Items CRUD
  const handleAddItem = () => {
    setItemsList(prev => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        name: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]);
  };

  const handleItemChange = (id, field, value) => {
    setItemsList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? (parseCurrencyNumber(value) || 0) : (parseCurrencyNumber(item.quantity) || 0);
        const u = field === 'unitPrice' ? (parseCurrencyNumber(value) || 0) : (parseCurrencyNumber(item.unitPrice) || 0);
        updated.total = Math.round(q * u);
      } else if (field === 'total') {
        updated.total = parseCurrencyNumber(value) || 0;
      }
      return updated;
    }));
  };

  const handleDeleteItem = (id) => {
    setItemsList(prev => prev.filter(item => item.id !== id));
  };

  const handleSyncTotalFromItems = () => {
    const sum = itemsList.reduce((acc, it) => acc + (parseCurrencyNumber(it.total) || 0), 0);
    if (sum > 0) {
      setAmountARS(sum.toString());
    }
  };

  const handleApprove = (e) => {
    e.preventDefault();
    const finalARS = parseCurrencyNumber(amountARS) || 0;
    if (finalARS <= 0) {
      alert("Por favor verifica el monto total.");
      return;
    }

    const receiptId = 'rec-' + Date.now();
    const cleanStore = storeName.trim() || 'Comercio';

    // Format item summary for note
    const itemsSummary = itemsList.length > 0 
      ? ` • [Ítems]: ` + itemsList.map(it => `${it.name}${it.quantity > 1 ? ` (x${it.quantity})` : ''} $${it.total.toLocaleString()}`).join(', ')
      : '';

    const timePrefix = receiptTime ? `[Hora: ${receiptTime}] ` : '';
    const fullNote = (receiptNote.trim() ? receiptNote.trim() : `${timePrefix}Escaneado con cámara OCR`) + itemsSummary;

    const mediaItem = {
      uuid: receiptId,
      filename: `ticket-${cleanStore.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.webp`,
      description: rawOcrText ? `[OCR ${cleanStore}]: ${rawOcrText.slice(0, 500)}` : `Ticket ${cleanStore}`,
      extension: 'webp',
      content_type: 'image/webp',
      content_base64: previewBase64,
      items: itemsList
    };

    const expenseItem = {
      id: 'exp-' + Date.now(),
      date: receiptDate,
      time: receiptTime || undefined,
      concept: `${cleanStore}`,
      category: defaultCategory,
      amountARS: Math.round(finalARS),
      paidBy: paidBy,
      note: fullNote,
      receipt_id: receiptId,
      items: itemsList
    };

    onSaveExpenseWithReceipt(expenseItem, mediaItem);
    handleReset();
    if (onClose) onClose();
  };

  const parsedAmountARS = parseCurrencyNumber(amountARS) || 0;
  const computedUSD = parsedAmountARS / exchangeRate;
  const itemsSumARS = itemsList.reduce((acc, it) => acc + (parseCurrencyNumber(it.total) || 0), 0);

  return (
    <div className="receipt-scanner-card">
      
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="scanner-header-row">
        <div className="scanner-header-title">
          <Camera size={22} className="text-emerald" />
          <div>
            <h4>Escáner de Facturas & Tickets</h4>
            <span className="scanner-header-sub">
              Toma foto al ticket para transcribir y registrar en <strong>{categoryName}</strong>
            </span>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={() => { stopLiveCamera(); onClose(); }} className="btn-close-scanner">
            <X size={18} />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="scanner-error-alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ===================== STATE 1: IDLE / OPTIONS ===================== */}
      {scanStatus === 'idle' && (
        !isCameraActive ? (
          <div className="scanner-dropzone">
            <div className="scanner-prompt-content">
              <div className="scanner-icon-bubble">
                <Camera size={34} className="text-emerald" />
              </div>

              <h5>Captura o sube la foto de tu factura</h5>
              <p>
                Puedes activar la cámara en vivo de tu portátil o celular para encuadrar el ticket,
                o seleccionar una foto de tu galería/archivos.
              </p>

              <div className="scanner-actions-group">
                {/* 1. Live Camera Button */}
                <button
                  type="button"
                  className="btn-trigger-camera"
                  onClick={() => startLiveCamera()}
                >
                  <Camera size={18} />
                  <span>Activar Cámara en Vivo</span>
                </button>

                {/* 2. File Upload Button */}
                <button
                  type="button"
                  className="btn-trigger-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>Subir Foto / Archivo</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* LIVE CAMERA STREAM VIEW */
          <div className="scanner-live-camera-view animate-fade-in">
            
            {/* Top Bar: Framing Mode Selector + AutoCrop Guide Toggle */}
            <div className="live-camera-format-bar">
              <button
                type="button"
                className={`btn-format-toggle ${frameOrientation === 'vertical' ? 'active' : ''}`}
                onClick={() => setFrameOrientation('vertical')}
              >
                <span>↕️ Ticket Vertical</span>
              </button>

              <button
                type="button"
                className={`btn-format-toggle ${frameOrientation === 'horizontal' ? 'active' : ''}`}
                onClick={() => setFrameOrientation('horizontal')}
              >
                <span>↔️ Factura Ancha</span>
              </button>

              <button
                type="button"
                className={`btn-format-toggle ${autoCropGuide ? 'active-crop' : ''}`}
                onClick={() => setAutoCropGuide(prev => !prev)}
                title={autoCropGuide ? 'Recortará automáticamente el ticket del recuadro verde' : 'Capturará todo el marco de la cámara'}
              >
                <span>{autoCropGuide ? '🎯 Auto-recorte: ON' : '📷 Foto Completa'}</span>
              </button>
            </div>

            <div className="live-video-wrapper" ref={wrapperRef}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="live-camera-stream" 
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              />
              <div className="live-camera-overlay">
                <div 
                  ref={guideRef} 
                  className={`ticket-viewfinder-guide ${frameOrientation}`}
                >
                  <div className="viewfinder-corner top-left"></div>
                  <div className="viewfinder-corner top-right"></div>
                  <div className="viewfinder-corner bottom-left"></div>
                  <div className="viewfinder-corner bottom-right"></div>
                  <span className="viewfinder-text">
                    {frameOrientation === 'vertical' 
                      ? 'Sostén el ticket verticalmente aquí' 
                      : 'Encuadra la factura horizontal'}
                  </span>
                </div>
              </div>

              {/* Floating Live Helper Tip */}
              <div className="live-camera-tip-pill">
                <Sparkles size={13} className="text-emerald" />
                <span>Acerca el ticket bien a la cámara para letras nítidas</span>
              </div>
            </div>

            <div className="live-camera-controls-bar">
              <button 
                type="button" 
                onClick={stopLiveCamera} 
                className="btn-live-control btn-cancel"
              >
                <X size={16} />
                <span>Cancelar</span>
              </button>

              {/* Rotar 90° Real Button */}
              <button 
                type="button" 
                onClick={rotateCamera90} 
                className="btn-live-control btn-rotate"
                title="Girar orientación de la cámara 90°"
              >
                <RotateCw size={16} />
                <span>Rotar 90°</span>
              </button>

              {/* Shutter Capture Button */}
              <button 
                type="button" 
                onClick={captureFrameFromCamera} 
                className="btn-live-shutter"
                title="Tomar Foto"
              >
                <div className="shutter-circle-inner">
                  <Camera size={26} />
                </div>
              </button>

              {/* Only show Cambiar Cámara if device actually has multiple cameras */}
              {hasMultipleCameras && (
                <button 
                  type="button" 
                  onClick={toggleFacingMode} 
                  className="btn-live-control btn-flip"
                  title="Cambiar entre cámara trasera y delantera"
                >
                  <SwitchCamera size={16} />
                  <span>Cámara</span>
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* ===================== STATE 2: RECOMPOSITION PIPELINE & OCR ===================== */}
      {(scanStatus === 'processing' || scanStatus === 'compressing' || scanStatus === 'recognizing') && (
        <div className="scanner-processing-state animate-fade-in">
          
          <div className="processing-spinner-box">
            <RefreshCw size={34} className="spin-icon text-emerald" />
          </div>

          <div className="processing-titles">
            <h5>Recomponiendo y digitalizando factura...</h5>
            <p>
              {pipelineStatusText || 'Mejorando calidad óptica para transcribir productos con precisión'}
            </p>
          </div>

          {/* Overall Pipeline Progress Bar */}
          <div className="ocr-progress-container">
            <div className="ocr-progress-labels">
              <span>Progreso de digitalización:</span>
              <strong>
                {pipelineStep === 1 ? '25%' :
                 pipelineStep === 2 ? '50%' :
                 pipelineStep === 3 ? '75%' :
                 `${Math.min(100, Math.round(75 + (ocrProgress * 0.25)))}%`}
              </strong>
            </div>
            <div className="ocr-progress-track">
              <div 
                className="ocr-progress-fill pipeline-gradient-fill" 
                style={{ 
                  width: `${pipelineStep === 1 ? 25 :
                           pipelineStep === 2 ? 50 :
                           pipelineStep === 3 ? 75 :
                           Math.min(100, Math.round(75 + (ocrProgress * 0.25)))}%` 
                }}
              />
            </div>
          </div>

          {/* CamScanner Multi-Step Pipeline Checklist */}
          <div className="pipeline-stepper-card">
            {PIPELINE_STEPS.map((step) => {
              const isDone = pipelineStep > step.id;
              const isActive = pipelineStep === step.id;
              const isPending = pipelineStep < step.id;
              return (
                <div 
                  key={step.id} 
                  className={`pipeline-step-item ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${isPending ? 'is-pending' : ''}`}
                >
                  <div className="pipeline-step-indicator">
                    {isDone ? (
                      <div className="step-circle step-done">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : isActive ? (
                      <div className="step-circle step-active">
                        <div className="step-pulse-ring" />
                        <span className="step-num">{step.id}</span>
                      </div>
                    ) : (
                      <div className="step-circle step-pending">
                        <span className="step-num">{step.id}</span>
                      </div>
                    )}
                  </div>

                  <div className="pipeline-step-info">
                    <div className="pipeline-step-title-row">
                      <span className="step-title-text">{step.title}</span>
                      {isDone && <span className="step-status-tag tag-done">Listo</span>}
                      {isActive && (
                        <span className="step-status-tag tag-active">
                          {step.id === 4 && ocrProgress > 0 ? `${ocrProgress}%` : 'En proceso...'}
                        </span>
                      )}
                    </div>
                    <span className="step-subtitle-text">
                      {isActive && pipelineStatusText ? pipelineStatusText : step.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {compressionStats && (
            <div className="compression-success-badge animate-fade-in">
              <Sparkles size={14} className="text-amber" />
              <span>
                Resolución optimizada: <strong>{compressionStats.compressedSizeKb} KB</strong> (-{compressionStats.reductionPercent}%)
              </span>
            </div>
          )}

        </div>
      )}

      {/* ===================== STATE 3: REVIEW & APPROVE ===================== */}
      {scanStatus === 'review' && (
        <form onSubmit={handleApprove} className="scanner-review-form animate-fade-in">
          
          {compressionStats && (
            <div className="review-compression-pill">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>
                Imagen optimizada a <strong>{compressionStats.compressedSizeKb} KB</strong> (-{compressionStats.reductionPercent}%)
              </span>
            </div>
          )}

          {/* Upside Down Detected Warning Banner */}
          {isUpsideDown && (
            <div className="upside-down-detected-alert animate-fade-in">
              <div className="alert-content-row">
                <AlertTriangle size={20} className="text-amber" />
                <div>
                  <strong>¡El ticket parece estar al revés (boca abajo)!</strong>
                  <p>La cámara capturó el texto invertido. Haz clic en el botón para girarlo 180° y transcribir correctamente.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleTransform(180, false)} 
                className="btn-auto-rotate-180"
              >
                <RotateCw size={15} />
                <span>Girar 180° y Re-leer</span>
              </button>
            </div>
          )}

          <div className="scanner-review-layout">
            
            {/* Left: Thumbnail Preview with Rotation Tools & Lightbox */}
            <div className="scanner-preview-col">
              <div 
                className="preview-image-frame clickable" 
                onClick={() => {
                  setLightboxZoom(1);
                  setIsLightboxOpen(true);
                }}
                title="Haz clic para inspeccionar y comprobar si la foto quedó nítida"
              >
                <img src={previewBase64} alt="Foto del ticket" className="ticket-thumbnail" />
                <div className="preview-hover-zoom-hint">
                  <Eye size={15} />
                  <span>Clic para ampliar</span>
                </div>
              </div>

              {/* Photo Rotation & Flip Toolbar under thumbnail */}
              <div className="scanner-rotate-toolbar" title="Ajustar orientación de la foto">
                <button
                  type="button"
                  className="btn-rotate-tool"
                  onClick={() => handleTransform(270, false)}
                  title="Girar 90° a la izquierda"
                >
                  <RotateCcw size={14} />
                  <span>-90°</span>
                </button>

                <button
                  type="button"
                  className={`btn-rotate-tool ${isUpsideDown ? 'highlight' : ''}`}
                  onClick={() => handleTransform(180, false)}
                  title="Invertir 180° (poner de cabeza/al derecho)"
                >
                  <RotateCw size={14} />
                  <span>180°</span>
                </button>

                <button
                  type="button"
                  className="btn-rotate-tool"
                  onClick={() => handleTransform(90, false)}
                  title="Girar 90° a la derecha"
                >
                  <RotateCw size={14} />
                  <span>+90°</span>
                </button>

                <button
                  type="button"
                  className="btn-rotate-tool"
                  onClick={() => handleTransform(0, true)}
                  title="Reflejar horizontalmente (Efecto Espejo)"
                >
                  <FlipHorizontal size={14} />
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setLightboxZoom(1);
                  setIsPerspectiveMode(false);
                  setIsLightboxOpen(true);
                }}
                className="btn-inspect-photo"
                title="Ampliar foto para verificar que el texto no esté borroso"
              >
                <Eye size={14} />
                <span>Revisar nitidez</span>
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setLightboxZoom(1);
                  setIsPerspectiveMode(true);
                  setIsLightboxOpen(true);
                }}
                className="btn-perspective-tool"
                title="Aplanar perspectiva y encuadrar ticket con 4 esquinas (Estilo CamScanner)"
              >
                <Crop size={14} className="text-emerald" />
                <span>Aplanar Perspectiva</span>
              </button>

              <button 
                type="button" 
                onClick={handleApplyDocumentFilter}
                className="btn-enhance-filter"
                title="Filtro B/N mágico: blanquea el papel térmico y realza el texto a negro profundo"
              >
                <Wand2 size={14} className="text-amber" />
                <span>Filtro Escáner B/N</span>
              </button>

              <button 
                type="button" 
                onClick={handleReset} 
                className="btn-retry-photo"
              >
                <RefreshCw size={14} />
                <span>Tomar otra foto</span>
              </button>
            </div>

            {/* Right: Data Confirmation Fields & Items Table */}
            <div className="scanner-fields-col">
              
              <div className="form-group">
                <label>Comercio / Lugar detectado *</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="form-input"
                  placeholder="Ej: Coto, Red Comercial Express, Güerrín..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Monto Total (ARS) *</label>
                  <div className="currency-input-wrapper">
                    <span className="curr-symbol">$ ARS</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountARS}
                      onChange={(e) => setAmountARS(e.target.value)}
                      className="form-input font-bold"
                      placeholder="Ej: 19.741"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ minWidth: '150px' }}>
                  <label>Fecha de la Factura</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ minWidth: '130px' }}>
                  <label>Hora</label>
                  <div className="time-input-group">
                    <Clock size={15} className="time-icon text-muted" />
                    <input
                      type="text"
                      value={receiptTime}
                      onChange={(e) => setReceiptTime(e.target.value)}
                      className="form-input"
                      placeholder="Ej: 10:26:28"
                    />
                  </div>
                </div>
              </div>

              {/* Dual Currency Preview */}
              {parsedAmountARS > 0 && (
                <div className="scanner-dual-preview">
                  <span>Equivalente en Dólar Blue:</span>
                  <strong className="text-emerald">≈ ${computedUSD.toFixed(1)} USD Blue</strong>
                  <span>({formatCurrencyARS(parsedAmountARS)})</span>
                </div>
              )}

              {/* ===================== NEW: INTERACTIVE ITEMS TABLE ===================== */}
              <div className="scanner-items-section">
                <div className="scanner-items-header">
                  <div className="scanner-items-title">
                    <ShoppingBag size={16} className="text-emerald" />
                    <strong>Desglose de Productos / Ítems Detectados</strong>
                    <span className="items-count-pill">{itemsList.length} {itemsList.length === 1 ? 'producto' : 'productos'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-add-item-row"
                  >
                    <Plus size={14} />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                {itemsList.length > 0 ? (
                  <div className="scanner-items-table-wrapper">
                    <table className="scanner-items-table">
                      <thead>
                        <tr>
                          <th>Detalle / Producto</th>
                          <th style={{ width: '105px' }}>Precio Unit.</th>
                          <th style={{ width: '75px' }}>Cant.</th>
                          <th style={{ width: '110px' }}>Valor ($)</th>
                          <th style={{ width: '38px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsList.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                placeholder="Ej: Frijol Cáscara..."
                                className="item-table-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                className="item-table-input text-right"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                className="item-table-input text-center"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.total}
                                onChange={(e) => handleItemChange(item.id, 'total', e.target.value)}
                                className="item-table-input text-right font-bold"
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="btn-delete-item-row"
                                title="Eliminar ítem"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="scanner-items-footer">
                      <div className="items-sum-info">
                        <span>Suma de ítems:</span>
                        <strong className="text-emerald">{formatCurrencyARS(itemsSumARS)}</strong>
                        {Number(amountARS) > 0 && Math.abs(itemsSumARS - Number(amountARS)) > 1 && (
                          <button
                            type="button"
                            onClick={handleSyncTotalFromItems}
                            className="btn-sync-total"
                            title="Actualizar el Monto Total con la suma de los productos"
                          >
                            ⚡ Ajustar Total al valor de ítems ({formatCurrencyARS(itemsSumARS)})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="scanner-items-empty">
                    <p>No se detectaron líneas de productos automáticamente. Puedes hacer clic en <strong>+ Agregar Ítem</strong> si deseas detallar los productos de la compra.</p>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>¿Quién pagó?</label>
                  <select 
                    value={paidBy} 
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="form-select"
                  >
                    <option value="Yo">Yo</option>
                    <option value="Mi Amiga">Mi Amiga</option>
                    <option value="Compartido">Compartido (50/50)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nota o Detalle</label>
                  <input
                    type="text"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    className="form-input"
                    placeholder="Ej: Desayunos y meriendas"
                  />
                </div>
              </div>


              {/* APPROVE BUTTON */}
              <button type="submit" className="btn-approve-scanned-receipt">
                <Check size={18} />
                <span>
                  Aprobar y Sumar a la Billetera ({formatCurrencyARS(Number(amountARS) || 0)})
                </span>
              </button>

            </div>

          </div>

        </form>
      )}

      {/* ===================== LIGHTBOX / PHOTO INSPECTION MODAL ===================== */}
      {isLightboxOpen && previewBase64 && (
        <div 
          className="photo-lightbox-backdrop animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="photo-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Lightbox Header with Zoom & Rotate Controls */}
            <div className="photo-lightbox-header">
              <div className="photo-lightbox-title-box">
                <Eye size={18} className="text-emerald" />
                <div>
                  <h5>Inspección de Foto del Ticket</h5>
                  <span className="photo-lightbox-sub">
                    Comprueba que las letras, precios y fecha estén enfocados y legibles
                  </span>
                </div>
              </div>

              <div className="photo-lightbox-controls">
                {/* Rotate tools in lightbox */}
                <button
                  type="button"
                  className="btn-lightbox-zoom"
                  onClick={() => handleTransform(270, false)}
                  title="Girar 90° a la izquierda"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  className="btn-lightbox-zoom font-bold"
                  onClick={() => handleTransform(180, false)}
                  title="Invertir 180° (Poner al derecho)"
                >
                  <span>180°</span>
                </button>

                <button
                  type="button"
                  className="btn-lightbox-zoom"
                  onClick={() => handleTransform(90, false)}
                  title="Girar 90° a la derecha"
                >
                  <RotateCw size={15} />
                </button>

                <button
                  type="button"
                  className="btn-lightbox-zoom"
                  onClick={() => handleTransform(0, true)}
                  title="Reflejar espejo"
                >
                  <FlipHorizontal size={15} />
                </button>

                <button
                  type="button"
                  className={`btn-lightbox-tool ${isPerspectiveMode ? 'active' : ''}`}
                  onClick={() => setIsPerspectiveMode(prev => !prev)}
                  title="Modo Recomponer y Aplanar Perspectiva (4 esquinas estilo CamScanner)"
                >
                  <Crop size={15} />
                  <span>{isPerspectiveMode ? 'Salir Modo Aplanar' : 'Modo Aplanar'}</span>
                </button>

                <span className="toolbar-sep"></span>

                <button
                  type="button"
                  className="btn-lightbox-zoom"
                  onClick={() => setLightboxZoom(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                  title="Reducir zoom (-)"
                >
                  <ZoomOut size={16} />
                </button>

                <button
                  type="button"
                  className="btn-lightbox-zoom font-mono"
                  onClick={() => setLightboxZoom(1)}
                  title="Restablecer tamaño normal (100%)"
                >
                  <span>{Math.round(lightboxZoom * 100)}%</span>
                </button>

                <button
                  type="button"
                  className="btn-lightbox-zoom"
                  onClick={() => setLightboxZoom(prev => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn size={16} />
                </button>

                <button
                  type="button"
                  className="btn-close-lightbox"
                  onClick={() => setIsLightboxOpen(false)}
                  title="Cerrar visor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox Body / Viewport */}
            <div className="photo-lightbox-viewport">
              <div 
                className="perspective-img-container" 
                ref={imgContainerRef}
                style={{ position: 'relative', display: 'inline-block' }}
              >
                <img 
                  src={previewBase64} 
                  alt="Foto del ticket en tamaño completo" 
                  className="photo-lightbox-img"
                  style={{ transform: `scale(${lightboxZoom})`, pointerEvents: isPerspectiveMode ? 'none' : 'auto' }}
                />

                {isPerspectiveMode && (
                  <svg 
                    className="perspective-overlay-svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      transform: `scale(${lightboxZoom})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <polygon 
                      points={`${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`}
                      fill="rgba(16, 185, 129, 0.22)"
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="2.5,1.5"
                    />
                  </svg>
                )}

                {isPerspectiveMode && (
                  <div 
                    className="perspective-handles-layer"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transform: `scale(${lightboxZoom})`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none'
                    }}
                  >
                    {[
                      { key: 'tl', label: '1 (Sup. Izq)' },
                      { key: 'tr', label: '2 (Sup. Der)' },
                      { key: 'br', label: '3 (Inf. Der)' },
                      { key: 'bl', label: '4 (Inf. Izq)' }
                    ].map(({ key, label }) => {
                      const c = corners[key];
                      return (
                        <div
                          key={key}
                          className={`perspective-handle ${activeCorner === key ? 'active' : ''}`}
                          style={{
                            position: 'absolute',
                            left: `${c.x}%`,
                            top: `${c.y}%`,
                            transform: 'translate(-50%, -50%)',
                            cursor: 'grab',
                            pointerEvents: 'auto'
                          }}
                          onPointerDown={(e) => handlePointerDownCorner(key, e)}
                          title={`Esquina ${label} - Arrastra para encuadrar`}
                        >
                          <div className="handle-outer-ring"></div>
                          <div className="handle-inner-dot"></div>
                          <span className="handle-badge">{key.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Lightbox Footer */}
            <div className="photo-lightbox-footer">
              {isPerspectiveMode ? (
                <div className="perspective-toolbar-banner animate-fade-in">
                  <div className="perspective-toolbar-info">
                    <Wand2 size={16} className="text-emerald" />
                    <span>
                      Arrastra las 4 esquinas circulares a los vértices de la factura para eliminar la mesa, manos y aplanar el documento.
                    </span>
                  </div>
                  <div className="perspective-toolbar-buttons">
                    <button
                      type="button"
                      className="btn-reset-perspective"
                      onClick={handleResetCorners}
                      title="Restablecer cuadrilátero"
                    >
                      Restablecer
                    </button>
                    <button
                      type="button"
                      className="btn-apply-perspective"
                      onClick={handleApplyPerspectiveWarp}
                      disabled={isApplyingPerspective}
                      title="Transformar perspectiva y mejorar nitidez"
                    >
                      <Sparkles size={15} />
                      <span>{isApplyingPerspective ? 'Aplanando...' : '⚡ Aplanar y Transcribir'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="photo-lightbox-hint">
                  <Sparkles size={15} className="text-amber" />
                  <span>
                    Si la foto quedó inclinada o con bordes de la mesa, haz clic en <strong>Modo Aplanar</strong> para recomponer el ticket con las 4 esquinas.
                  </span>
                </div>
              )}

              <div className="photo-lightbox-actions">
                <button
                  type="button"
                  className="btn-lightbox-retry"
                  onClick={handleReset}
                >
                  <RefreshCw size={14} />
                  <span>Tomar otra foto</span>
                </button>

                <button
                  type="button"
                  className="btn-lightbox-confirm"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  <Check size={16} />
                  <span>La foto está clara (Continuar)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


