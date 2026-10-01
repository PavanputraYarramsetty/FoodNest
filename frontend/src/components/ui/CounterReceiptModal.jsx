import React, { useRef } from 'react';
import { Printer, X, Check, Utensils } from 'lucide-react';
import MotionButton from './MotionButton';

const CounterReceiptModal = ({ receipt, isOpen, onClose }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.created_at
    ? new Date(receipt.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');

  const formattedTime = receipt.created_at
    ? new Date(receipt.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleTimeString('en-IN');

  const receiptNumber = receipt.receipt_number || 1;
  const items = receipt.items || [];
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  const grandTotal = receipt.total_amount || items.reduce((sum, item) => sum + (Number(item.price) * parseInt(item.quantity)), 0);

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div 
        className="receipt-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Header / Actions */}
        <div className="receipt-modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="receipt-badge">
              <Check size={14} /> Sale Recorded
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Receipt Ready
            </span>
          </div>
          <button 
            type="button" 
            className="btn-icon-close" 
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="thermal-receipt-container" id="thermal-receipt-print" ref={receiptRef}>
          {/* Header */}
          <div className="receipt-header">
            <h1 className="receipt-title">Aparna Devi Canteen</h1>
            <p className="receipt-subtitle">Counter Sale Receipt</p>
            <div className="receipt-divider-double"></div>
          </div>

          {/* Meta Info */}
          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <span>Date: {formattedDate}</span>
              <span>Time: {formattedTime}</span>
            </div>
            <div className="receipt-meta-row" style={{ marginTop: '3px' }}>
              <span className="receipt-number-badge">Receipt: #CS-{receiptNumber}</span>
              <span>Mode: Cash / Direct</span>
            </div>
          </div>

          <div className="receipt-divider-dash"></div>

          {/* Items Table */}
          <div className="receipt-items-table">
            <div className="receipt-table-header">
              <span className="col-item">ITEM</span>
              <span className="col-qty">QTY</span>
              <span className="col-rate">RATE</span>
              <span className="col-amt">AMOUNT</span>
            </div>
            <div className="receipt-divider-dash"></div>

            <div className="receipt-table-body">
              {items.map((item, index) => {
                const qty = parseInt(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const lineTotal = price * qty;
                return (
                  <div key={index} className="receipt-table-row">
                    <span className="col-item">{item.item_name || item.name}</span>
                    <span className="col-qty">{qty}</span>
                    <span className="col-rate">{price.toFixed(0)}</span>
                    <span className="col-amt">{lineTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="receipt-divider-dash"></div>

          {/* Summary */}
          <div className="receipt-summary">
            <div className="receipt-summary-row">
              <span>Total Items: {items.length}</span>
              <span>Total Qty: {totalQty}</span>
            </div>
            <div className="receipt-divider-dash"></div>
            <div className="receipt-total-row">
              <span className="receipt-total-label">GRAND TOTAL:</span>
              <span className="receipt-total-amount">₹{Number(grandTotal).toFixed(2)}</span>
            </div>
          </div>

          <div className="receipt-divider-double"></div>

          {/* Footer */}
          <div className="receipt-footer">
            <p className="receipt-token">*** TOKEN #{receiptNumber} ***</p>
            <p className="receipt-thankyou">Thank You! Visit Again</p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden during print) */}
        <div className="receipt-modal-actions no-print">
          <MotionButton
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Next Sale (Esc)
          </MotionButton>
          <MotionButton
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            id="print-receipt-btn"
            autoFocus
          >
            <Printer size={16} />
            <span>Print Bill (Ctrl+P)</span>
          </MotionButton>
        </div>
      </div>

      {/* Embedded CSS for Thermal Receipt Preview & Printing */}
      <style>{`
        .receipt-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1rem;
          animation: fadeIn 0.15s ease-out;
        }

        .receipt-modal-content {
          background: var(--bg-surface, #1e293b);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 12px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          max-height: 92vh;
          overflow: hidden;
        }

        .receipt-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          background: rgba(0, 0, 0, 0.15);
        }

        .receipt-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
        }

        .btn-icon-close {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          display: flex;
          padding: 0.35rem;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .btn-icon-close:hover {
          color: var(--text-primary, #fff);
          background: rgba(255, 255, 255, 0.1);
        }

        /* Thermal receipt styling */
        .thermal-receipt-container {
          background: #ffffff;
          color: #000000;
          padding: 1.25rem 1rem;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          line-height: 1.35;
          margin: 1rem;
          border-radius: 6px;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          max-height: calc(92vh - 150px);
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 6px;
        }

        .receipt-title {
          font-size: 17px;
          font-weight: 900;
          margin: 0;
          letter-spacing: 0.5px;
          color: #000;
          text-transform: uppercase;
        }

        .receipt-subtitle {
          font-size: 11px;
          font-weight: 600;
          margin: 2px 0 6px 0;
          color: #333;
          text-transform: uppercase;
        }

        .receipt-divider-double {
          border-bottom: 2px dashed #000;
          margin: 6px 0;
        }

        .receipt-divider-dash {
          border-bottom: 1px dashed #444;
          margin: 5px 0;
        }

        .receipt-meta {
          font-size: 11.5px;
          font-weight: 600;
          margin: 6px 0;
        }

        .receipt-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .receipt-number-badge {
          font-weight: 800;
          font-size: 12.5px;
        }

        .receipt-items-table {
          width: 100%;
          margin: 6px 0;
        }

        .receipt-table-header {
          display: flex;
          font-weight: 800;
          font-size: 11.5px;
          padding-bottom: 2px;
        }

        .receipt-table-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .receipt-table-row {
          display: flex;
          font-size: 12px;
          align-items: flex-start;
        }

        .col-item {
          flex: 2.2;
          text-align: left;
          word-break: break-word;
        }

        .col-qty {
          flex: 0.6;
          text-align: center;
          font-weight: 700;
        }

        .col-rate {
          flex: 0.8;
          text-align: right;
        }

        .col-amt {
          flex: 1.1;
          text-align: right;
          font-weight: 700;
        }

        .receipt-summary {
          font-size: 12px;
          font-weight: 600;
          margin: 4px 0;
        }

        .receipt-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
        }

        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
          font-weight: 900;
          padding: 3px 0;
        }

        .receipt-total-label {
          letter-spacing: 0.5px;
        }

        .receipt-total-amount {
          font-size: 16px;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 6px;
        }

        .receipt-token {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
          margin: 4px 0 2px 0;
        }

        .receipt-thankyou {
          font-size: 11.5px;
          font-weight: 600;
          margin: 0;
        }

        .receipt-modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          background: rgba(0, 0, 0, 0.15);
        }

        /* Print Specific Styles */
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm;
          }

          body * {
            visibility: hidden !important;
          }

          #thermal-receipt-print, #thermal-receipt-print * {
            visibility: visible !important;
          }

          #thermal-receipt-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            padding: 3mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10.5px !important;
            line-height: 1.25 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CounterReceiptModal;
