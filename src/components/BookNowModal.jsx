import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookNowModal.css';

const WASH_TYPES = [
  { id: 'INTERIOR', label: 'Interior',  grad: ['#4facfe','#00c9f5'], emoji: '\u{1F6AA}' },
  { id: 'EXTERIOR', label: 'Exterior',  grad: ['#43e97b','#0ba360'], emoji: '\u2728'    },
  { id: 'FULL_WASH',label: 'Full Wash', grad: ['#667eea','#764ba2'], emoji: '\u{1F4A7}' },
  { id: 'TEFLON',   label: 'Teflon',    grad: ['#f093fb','#c471ed'], emoji: '\u{1F6E1}' },
];

const SERVICE_TYPES = [
  { id: 'HOME',   label: 'Home',   grad: ['#4facfe','#00c9f5'], emoji: '\u{1F3E0}' },
  { id: 'CENTRE', label: 'Centre', grad: ['#43e97b','#0ba360'], emoji: '\u{1F3EB}' },
];

const BookNowModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedWash, setSelectedWash] = useState(null);
  const [poppingId, setPoppingId] = useState(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  const handleWashClick = (w) => {
    if (poppingId) return;
    setPoppingId(w.id);
    setTimeout(() => {
      setSelectedWash(w);
      setPoppingId(null);
      setStep(2);
    }, 420);
  };

  const handleServiceClick = (s) => {
    if (poppingId) return;
    setPoppingId(s.id);
    setTimeout(() => {
      onClose();
      navigate('/select-center', {
        state: { prefilledWashType: selectedWash.id, serviceType: s.id }
      });
    }, 420);
  };

  return (
    <div className={`bnm-overlay${entered ? ' bnm-in' : ''}`}
         onClick={(e) => e.target === e.currentTarget && handleClose()}>

      <button className="bnm-close-btn" onClick={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {step === 1 ? (
        <div className="bnm-scene">
          <p className="bnm-heading">Choose a service</p>
          <div className="bnm-grid bnm-grid-2x2">
            {WASH_TYPES.map((w, i) => (
              <button
                key={w.id}
                className={`bnm-bubble${poppingId === w.id ? ' bnm-pop' : ''}`}
                style={{
                  '--c1': w.grad[0], '--c2': w.grad[1],
                  '--enter-delay': `${i * 90}ms`,
                }}
                onClick={() => handleWashClick(w)}
              >
                <span className="bnm-emit" />
                <span className="bnm-shine" />
                <span className="bnm-shine2" />
                <span className="bnm-emoji">{w.emoji}</span>
                <span className="bnm-label">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bnm-scene">
          <p className="bnm-sub">{selectedWash?.label}</p>
          <p className="bnm-heading">Where?</p>
          <div className="bnm-grid bnm-grid-1x2">
            {SERVICE_TYPES.map((s, i) => (
              <button
                key={s.id}
                className={`bnm-bubble bnm-bubble-lg${poppingId === s.id ? ' bnm-pop' : ''}`}
                style={{
                  '--c1': s.grad[0], '--c2': s.grad[1],
                  '--enter-delay': `${i * 110}ms`,
                }}
                onClick={() => handleServiceClick(s)}
              >
                <span className="bnm-emit" />
                <span className="bnm-shine" />
                <span className="bnm-shine2" />
                <span className="bnm-emoji">{s.emoji}</span>
                <span className="bnm-label">{s.label}</span>
              </button>
            ))}
          </div>
          <button className="bnm-back-btn" onClick={() => setStep(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default BookNowModal;
