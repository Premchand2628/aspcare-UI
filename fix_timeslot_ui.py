import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ── Booking.jsx ──────────────────────────────────────────────
f = open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', encoding='utf-8')
src = f.read(); f.close()

# 1. Add formatSlotFull after formatSlotShort
OLD_FMT = """  const formatSlotShort = (slot) => {
    if (!slot) return slot;
    const hour = parseInt(slot.split(':')[0], 10);
    if (isNaN(hour)) return slot;
    if (hour === 0 || hour === 12) return hour === 0 ? '12am' : '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };"""
NEW_FMT = OLD_FMT + """

  const formatSlotFull = (slot) => {
    if (!slot) return slot;
    const [start, end] = slot.split('-');
    if (!start || !end) return slot;
    const fmtTime = (t) => {
      const [hStr, mStr] = t.split(':');
      const h = parseInt(hStr, 10);
      if (isNaN(h)) return t;
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(h12).padStart(2, '0')}:${mStr || '00'}${ampm}`;
    };
    return `${fmtTime(start)}-${fmtTime(end)}`;
  };"""

if OLD_FMT in src:
    src = src.replace(OLD_FMT, NEW_FMT, 1)
    print('formatSlotFull: OK')
else:
    print('formatSlotFull: NOT FOUND')

# 2. Replace schedule trigger block
OLD_SCHED = """        <div className="booking-info-card" onClick={() => setShowCalendar(true)}>
          <div className="booking-schedule">
            <span className="schedule-icon-svg" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
            </span>
            <div className="schedule-text-col">
              <span className="schedule-date-text">
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </span>
              <span
                className={`schedule-time-text${selectedTimeSlot ? '' : ' muted'}`}
                onClick={(e) => { if (selectedDate) { e.stopPropagation(); setShowTimeSlots(true); } }}
              >
                {selectedTimeSlot || (selectedDate ? 'Tap to pick time' : 'Select time slot')}
              </span>
            </div>
          </div>
          <button
            className="points-badge"
            onClick={(e) => { e.stopPropagation(); setShowCalendar(true); }}
            aria-label="Pick date"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          </button>
        </div>"""

NEW_SCHED = """        <div className="schedule-pills-row">
          {/* Date pill */}
          <button
            type="button"
            className="schedule-pill date-pill"
            onClick={() => setShowCalendar(true)}
            aria-label="Select date"
          >
            <span className="schedule-pill-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
            </span>
            <div className="schedule-pill-content">
              <span className="schedule-pill-top-label">Select Date</span>
              <span className="schedule-pill-val">
                {selectedDate ? formatDateWithMonth(selectedDate) : '\u2014'}
              </span>
            </div>
          </button>

          <span className="schedule-pills-amp">&amp;</span>

          {/* Time slot pill */}
          <button
            type="button"
            className={`schedule-pill time-pill${!selectedDate ? ' disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedDate) setShowTimeSlots(true);
              else setShowCalendar(true);
            }}
            aria-label="Select time slot"
          >
            <div className="schedule-pill-content">
              <span className="schedule-pill-top-label">Time Slot</span>
              <span className={`schedule-pill-val${!selectedTimeSlot ? ' placeholder' : ''}`}>
                {selectedTimeSlot ? formatSlotFull(selectedTimeSlot) : 'HH:MM\u2013HH:MM'}
              </span>
            </div>
            <span className="schedule-pill-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </button>
        </div>"""

if OLD_SCHED in src:
    src = src.replace(OLD_SCHED, NEW_SCHED, 1)
    print('Schedule trigger: OK')
else:
    print('Schedule trigger: NOT FOUND')

# 3. Replace timeslot modal legend + grid with list
OLD_MODAL = """              <div className="timeslot-legend">
                <span className="timeslot-legend-note">\u2022 Every slot is 1 hour</span>
                <span className="timeslot-legend-item">
                  <span className="timeslot-legend-dot available"></span> Available
                </span>
                <span className="timeslot-legend-item">
                  <span className="timeslot-legend-dot booked"></span> Booked
                </span>
              </div>
              {loadingSlots ? (
                <p className="timeslots-loading">Loading available slots...</p>
              ) : (
                <div className="timeslots-grid">
                  {slotsToRender.map(([slot, isAvailable]) => (
                    <button
                      key={slot}
                      className={`timeslot-btn ${selectedTimeSlot === slot ? 'active' : ''} ${!isAvailable ? 'booked' : ''}`}
                      onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                      disabled={!isAvailable}
                    >
                      <span className="timeslot-time">{formatSlotShort(slot)}</span>
                    </button>
                  ))}
                </div>
              )}"""

NEW_MODAL = """              {loadingSlots ? (
                <p className="timeslots-loading">Loading available slots...</p>
              ) : (
                <div className="timeslots-list">
                  {slotsToRender.map(([slot, isAvailable]) => (
                    <button
                      key={slot}
                      type="button"
                      className={`timeslot-row ${selectedTimeSlot === slot ? 'active' : ''} ${!isAvailable ? 'booked' : ''}`}
                      onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                      disabled={!isAvailable}
                    >
                      <span className="timeslot-row-time">{formatSlotFull(slot)}</span>
                      <span className={`timeslot-row-badge ${isAvailable ? 'available' : 'booked'}`}>
                        {isAvailable ? '\u2713' : '\u2717'}
                      </span>
                    </button>
                  ))}
                </div>
              )}"""

if OLD_MODAL in src:
    src = src.replace(OLD_MODAL, NEW_MODAL, 1)
    print('Timeslot modal: OK')
else:
    print('Timeslot modal: NOT FOUND')

with open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', 'w', encoding='utf-8') as f:
    f.write(src)

# ── Booking.css ──────────────────────────────────────────────
f = open(r'E:\Car wash\MainApp\src\styles\Booking.css', encoding='utf-8')
css = f.read(); f.close()

# 4. Add schedule pills CSS after .schedule-time-text.muted block
OLD_CSS_SCHED = """.schedule-time-text.muted {
  color: #9990c0;
  font-weight: 500;
}"""

NEW_CSS_SCHED = """.schedule-time-text.muted {
  color: #9990c0;
  font-weight: 500;
}

/* ── Schedule pills row (date & time trigger) ── */
.schedule-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.schedule-pills-amp {
  font-size: 14px;
  font-weight: 800;
  color: #5E4DB2;
  flex-shrink: 0;
}

.schedule-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: #f8f7ff;
  border: 1.5px solid #e8e4f8;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  text-align: left;
  box-shadow: 0 2px 8px rgba(94, 77, 178, 0.07);
}

.schedule-pill:hover {
  border-color: #5E4DB2;
  box-shadow: 0 2px 10px rgba(94, 77, 178, 0.18);
}

.schedule-pill.disabled {
  opacity: 0.6;
  cursor: default;
}

.schedule-pill-icon {
  display: flex;
  align-items: center;
  color: #5E4DB2;
  flex-shrink: 0;
}

.schedule-pill-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.schedule-pill-top-label {
  font-size: 10px;
  font-weight: 600;
  color: #9990c0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.schedule-pill-val {
  font-size: 12px;
  font-weight: 700;
  color: #2d2754;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-pill-val.placeholder {
  color: #9990c0;
  font-weight: 500;
}

.schedule-pill-chevron {
  display: flex;
  align-items: center;
  color: #5E4DB2;
  flex-shrink: 0;
}"""

if OLD_CSS_SCHED in css:
    css = css.replace(OLD_CSS_SCHED, NEW_CSS_SCHED, 1)
    print('CSS schedule pills: OK')
else:
    print('CSS schedule pills: NOT FOUND')

# 5. Replace .timeslots-grid / .timeslot-btn block with list styles
OLD_CSS_GRID = """.timeslots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.timeslot-btn {
  padding: 10px 4px;
  background-color: #e8f5e9;
  border: 2px solid #a5d6a7;
  border-radius: 10px;
  font-size: 13px;
  color: #1b5e20;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
  line-height: 1.2;
}

.timeslot-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
}

.timeslot-btn.active {
  background-color: #5E4DB2;
  color: white;
  border-color: #5E4DB2;
  box-shadow: 0 4px 12px rgba(94,77,178,0.4);
}

.timeslot-btn.booked,
.timeslot-btn:disabled {
  background-color: #ffebee;
  border-color: #ef9a9a;
  color: #b71c1c;
  cursor: not-allowed;
}

.timeslot-time {
  font-size: 13px;
  font-weight: 800;
  color: inherit;
}

.timeslot-status {
  display: none;
}"""

NEW_CSS_GRID = """.timeslots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.timeslot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: #f8f9ff;
  border: 1.5px solid #e8e4f8;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: left;
}

.timeslot-row:hover:not(:disabled) {
  border-color: #5E4DB2;
  background: #f0eeff;
}

.timeslot-row.active {
  background: #5E4DB2;
  border-color: #5E4DB2;
}

.timeslot-row.booked,
.timeslot-row:disabled {
  background: #fafafa;
  border-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.5;
}

.timeslot-row-time {
  font-size: 14px;
  font-weight: 700;
  color: #2d2754;
}

.timeslot-row.active .timeslot-row-time {
  color: #fff;
}

.timeslot-row.booked .timeslot-row-time,
.timeslot-row:disabled .timeslot-row-time {
  color: #aaa;
  text-decoration: line-through;
}

.timeslot-row-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.timeslot-row-badge.available {
  background: #43a047;
  color: #fff;
}

.timeslot-row.active .timeslot-row-badge.available {
  background: rgba(255,255,255,0.25);
  color: #fff;
}

.timeslot-row-badge.booked {
  background: #ffcdd2;
  color: #b71c1c;
}"""

if OLD_CSS_GRID in css:
    css = css.replace(OLD_CSS_GRID, NEW_CSS_GRID, 1)
    print('CSS timeslot list: OK')
else:
    print('CSS timeslot list: NOT FOUND')

# 6. Update responsive overrides for timeslot (line ~1931-1932)
OLD_CSS_RESP = """  .timeslots-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .timeslot-btn { padding: 14px; font-size: 15px; }"""

NEW_CSS_RESP = """  .timeslots-list { gap: 10px; }
  .timeslot-row { padding: 14px 18px; }
  .timeslot-row-time { font-size: 15px; }"""

if OLD_CSS_RESP in css:
    css = css.replace(OLD_CSS_RESP, NEW_CSS_RESP, 1)
    print('CSS responsive: OK')
else:
    print('CSS responsive: NOT FOUND')

with open(r'E:\Car wash\MainApp\src\styles\Booking.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Done')
