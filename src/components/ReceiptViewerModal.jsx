import React from 'react';
import { X, Receipt, Calendar, Store, FileText, Download } from 'lucide-react';
import { formatCurrencyARS, formatCurrencyUSD } from '../utils/helpers';

export default function ReceiptViewerModal({
  isOpen,
  onClose,
  receipt, // { uuid, filename, description, content_base64, ... }
  expense,
  exchangeRate = 1280
}) {
  if (!isOpen || !receipt) return null;

  const totalUSD = expense ? (expense.amountARS / exchangeRate) : 0;

  return (
    <div className="modal-backdrop-overlay animate-fade-in" onClick={onClose}>
      <div className="receipt-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="receipt-modal-header">
          <div className="receipt-modal-title">
            <Receipt size={22} className="text-emerald" />
            <div>
              <h3>Comprobante / Factura</h3>
              <span className="receipt-filename">{receipt.filename || 'Comprobante escaneado'}</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Cerrar comprobante"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="receipt-modal-body">
          
          {/* Image Container */}
          <div className="receipt-image-preview-box">
            {receipt.content_base64 ? (
              <img 
                src={receipt.content_base64} 
                alt="Foto del comprobante" 
                className="receipt-full-image" 
              />
            ) : (
              <div className="no-image-placeholder">
                <Receipt size={48} className="text-muted" />
                <p>Imagen no disponible en base64</p>
              </div>
            )}
          </div>

          {/* Details & OCR Column */}
          <div className="receipt-details-column">
            
            {expense && (
              <div className="receipt-expense-summary-box">
                <div className="receipt-info-item">
                  <Store size={16} className="text-dim" />
                  <div>
                    <label>Comercio / Concepto</label>
                    <strong>{expense.concept}</strong>
                  </div>
                </div>

                <div className="receipt-info-item">
                  <Calendar size={16} className="text-dim" />
                  <div>
                    <label>Fecha y Hora del Comprobante</label>
                    <span>{expense.date}{expense.time ? ` • ${expense.time}` : ''} • Pagó: <strong>{expense.paidBy}</strong></span>
                  </div>
                </div>

                <div className="receipt-amount-highlight">
                  <label>Monto Aprobado a la Billetera</label>
                  <div className="receipt-dual-amounts">
                    <span className="receipt-ars-val">{formatCurrencyARS(expense.amountARS)}</span>
                    <span className="receipt-usd-val">≈ ${totalUSD.toFixed(1)} USD Blue</span>
                  </div>
                </div>
              </div>
            )}

            {/* Items Breakdown Table if available */}
            {((expense && expense.items && expense.items.length > 0) || (receipt && receipt.items && receipt.items.length > 0)) && (
              <div className="receipt-items-viewer-box">
                <div className="ocr-text-header">
                  <span>Desglose de Productos / Ítems:</span>
                </div>
                <div className="receipt-modal-items-table-wrapper">
                  <table className="receipt-modal-items-table">
                    <thead>
                      <tr>
                        <th>Detalle (Producto)</th>
                        <th className="text-right">Precio Unit.</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-right">Valor ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expense?.items || receipt?.items || []).map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td><strong>{it.name}</strong></td>
                          <td className="text-right">{formatCurrencyARS(it.unitPrice)}</td>
                          <td className="text-center">{it.quantity}</td>
                          <td className="text-right text-emerald font-bold">{formatCurrencyARS(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OCR Transcribed Text */}
            <div className="receipt-ocr-text-box">
              <div className="ocr-text-header">
                <FileText size={15} />
                <span>Texto Transcripto por OCR (Tesseract):</span>
              </div>
              <pre className="ocr-text-content">
                {receipt.description || 'No hay transcripción disponible.'}
              </pre>
            </div>

            {/* Download Link */}
            {receipt.content_base64 && (
              <a
                href={receipt.content_base64}
                download={receipt.filename || 'factura-comprobante.webp'}
                className="btn-download-receipt"
              >
                <Download size={16} />
                <span>Descargar Imagen Comprimida</span>
              </a>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
