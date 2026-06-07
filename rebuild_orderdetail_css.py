import sys
sys.stdout.reconfigure(encoding='utf-8')

css = """/* =========================================
   ORDER DETAIL PAGE
   ========================================= */

.od-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 0 0 80px 0;
  max-width: 480px;
  margin: 0 auto;
  font-family: inherit;
}

.od-loading {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-size: 15px;
}

/* ── Top bar ── */
.od-top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 10px;
  background: #fff;
}

.od-back-btn {
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1a237e;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  flex-shrink: 0;
}

.od-order-number {
  font-size: 17px;
  font-weight: 700;
  color: #1a1f36;
  margin: 0;
}

/* ── Info cards row (SERVICE TYPE + PHONE) ── */
.od-info-cards {
  display: flex;
  gap: 10px;
  padding: 12px 16px 0;
}

.od-info-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #eeedf8;
  border-radius: 14px;
  padding: 12px 14px;
}

.od-info-icon-wrap {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  background: #eef0fb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f51b5;
}

.od-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.od-info-label {
  font-size: 9px;
  font-weight: 700;
  color: #9e9e9e;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.od-info-val {
  font-size: 13px;
  font-weight: 700;
  color: #1a1f36;
  word-break: break-all;
}

/* ── Car image ── */
.od-image-wrapper {
  margin: 14px 16px;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  background: #1a1a2e;
  box-shadow: 0 4px 18px rgba(0,0,0,0.15);
}

.od-service-image {
  width: 100%;
  height: 190px;
  object-fit: cover;
  display: block;
}

.od-img-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.od-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
}

.od-dot.active {
  background: #fff;
  width: 22px;
  border-radius: 4px;
}

/* ── Detail rows (address + appointment) ── */
.od-detail-rows {
  margin: 0 16px 12px;
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #eeedf8;
  overflow: hidden;
}

.od-detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f2f1fa;
}

.od-detail-row:last-child {
  border-bottom: none;
}

.od-detail-icon-wrap {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background: #eef0fb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f51b5;
}

.od-detail-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.od-detail-label {
  font-size: 9px;
  font-weight: 700;
  color: #9e9e9e;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.od-detail-val {
  font-size: 13px;
  font-weight: 600;
  color: #1a1f36;
}

.od-appt-val {
  font-weight: 700;
  color: #1a1f36;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.od-detail-chevron {
  color: #c5c5d5;
  flex-shrink: 0;
}

/* ── Subscription redeemed card ── */
.od-sub-redeemed-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 16px 12px;
  background: #f1fdf2;
  border: 1.5px solid #c8e6c9;
  border-radius: 12px;
  padding: 12px 16px;
}

.od-sub-redeemed-text {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

/* ── Price breakdown ── */
.od-price-breakdown {
  margin: 0 16px 16px;
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #eeedf8;
  padding: 16px;
}

.od-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
}

.od-price-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.od-price-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.od-price-divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}

.od-total-label {
  font-size: 15px;
  font-weight: 700;
  color: #1a1f36;
}

.od-total-value {
  font-size: 15px;
  font-weight: 800;
  color: #3f51b5;
}

/* ── Action buttons ── */
.od-actions-row {
  display: flex;
  gap: 12px;
  margin: 0 16px 16px;
}

.od-reschedule-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #FF8C00;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(255,140,0,0.3);
  transition: opacity 0.2s;
}

.od-reschedule-btn:hover { opacity: 0.9; }

.od-cancel-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ef5350;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239,83,80,0.3);
  transition: opacity 0.2s;
}

.od-cancel-btn:hover { opacity: 0.9; }
.od-cancel-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Status badges ── */
.od-status-badge {
  margin: 0 16px 16px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: 2px solid;
}

.od-status-completed  { color: #2e7d32; border-color: #2e7d32; background: transparent; }
.od-status-cancelled  { color: #d32f2f; border-color: #d32f2f; background: transparent; }
.od-status-in-servicing { color: #e65100; border-color: #e65100; background: transparent; }

/* ── Invoice section ── */
.od-invoice-section {
  margin: 0 16px 16px;
  text-align: center;
}

.od-download-btn {
  width: 100%;
  background: #1a237e;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(26,35,126,0.3);
  transition: opacity 0.2s;
  margin-bottom: 8px;
}

.od-download-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.od-invoice-number {
  font-size: 12px;
  color: #1a237e;
  font-weight: 600;
  margin: 0;
}

/* =========================================
   MODALS (Cancel + Reschedule)
   ========================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.cancel-popup,
.reschedule-popup {
  background: #fff;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  padding-bottom: 32px;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: #1a1f36;
  margin: 0;
}

.popup-back-btn {
  background: transparent;
  border: none;
  font-size: 22px;
  color: #333;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.popup-spacer { width: 32px; }

.popup-content { padding: 20px; }

/* Refund card */
.refund-card {
  background: #f8f9ff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #e8e4f8;
}

.refund-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1a1f36;
  margin: 0 0 16px;
}

.refund-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
}

.refund-label { color: #555; font-weight: 500; }
.refund-value { color: #333; font-weight: 600; }
.refund-divider { height: 1px; background: #e0e0e0; margin: 8px 0; }
.refund-item.total .refund-label { font-weight: 700; color: #1a1f36; }
.refund-value-total { font-size: 16px; font-weight: 800; color: #3f51b5; }
.refund-message { font-size: 12px; color: #888; margin: 12px 0 0; }

.cancel-ineligible { text-align: center; padding: 20px 0; }
.ineligible-icon { font-size: 40px; margin-bottom: 12px; }
.ineligible-message { font-size: 15px; color: #555; font-weight: 500; }

.cancel-confirm-btn {
  width: 100%;
  background: #ef5350;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: none;
  cursor: pointer;
}
.cancel-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Reschedule form */
.reschedule-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: #444; }

.date-input {
  padding: 11px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  color: #333;
  background: #fafafa;
  outline: none;
}
.date-input:focus { border-color: #5E4DB2; }

.loading-slots { text-align: center; color: #888; font-size: 13px; padding: 12px 0; }

.slots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }

.slot-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 6px;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s;
}
.slot-btn:hover:not(:disabled) { border-color: #5E4DB2; }
.slot-btn.slot-selected { border-color: #5E4DB2; background: #f0eeff; }
.slot-btn.slot-booked { background: #fafafa; opacity: 0.5; cursor: not-allowed; }
.slot-time { font-size: 13px; font-weight: 700; color: #1a1f36; }
.slot-status { font-size: 11px; color: #888; }
.slot-btn.slot-selected .slot-time { color: #5E4DB2; }

.reason-input {
  padding: 11px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}
.reason-input:focus { border-color: #5E4DB2; }

.char-count { font-size: 11px; color: #aaa; text-align: right; }

.update-booking-btn {
  width: 100%;
  background: #5E4DB2;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 0;
  border-radius: 28px;
  border: none;
  cursor: pointer;
  margin-top: 4px;
}
.update-booking-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* =========================================
   RESPONSIVE
   ========================================= */
@media (min-width: 480px) {
  .od-service-image { height: 220px; }
  .modal-overlay { align-items: center; }
  .cancel-popup, .reschedule-popup { border-radius: 24px; max-height: 80vh; }
}
"""

with open(r'E:\Car wash\MainApp\src\styles\OrderDetail.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('CSS written, lines:', css.count('\n'))
