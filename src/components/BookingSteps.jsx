import React from 'react';
import '../styles/BookingSteps.css';

const STEPS = [
  { num: 1, label: 'Centre' },
  { num: 2, label: 'Book' },
  { num: 3, label: 'Review' },
  { num: 4, label: 'Payment' },
  { num: 5, label: 'Confirm' },
];

const BookingSteps = ({ current }) => (
  <div className="booking-steps">
    {STEPS.map((step, idx) => {
      const state = step.num < current ? 'done' : step.num === current ? 'active' : 'pending';
      return (
        <React.Fragment key={step.num}>
          <div className={`bs-step bs-step--${state}`}>
            <div className="bs-bubble">
              {state === 'done' ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <polyline points="1.5,6 4.5,9 10.5,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : step.num}
            </div>
            <span className="bs-label">{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`bs-line${step.num < current ? ' done' : ''}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default BookingSteps;
