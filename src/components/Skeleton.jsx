import React, { useEffect, useState } from 'react';
import '../styles/Skeleton.css';

/**
 * Lightweight skeleton primitives. Use composed page-level skeletons that
 * mirror the real layout instead of showing a "Loading..." text.
 *
 * Variants:
 *  - block    : default rectangle
 *  - text     : single line of text (height = 1em)
 *  - circle   : circular avatar / icon
 *  - pill     : rounded pill (chips, tags)
 */
export function Skeleton({
  variant = 'block',
  width,
  height,
  className = '',
  style: styleProp,
  ...rest
}) {
  const style = { ...(styleProp || {}) };
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <span
      className={`sk sk-${variant} ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...rest}
    />
  );
}

/**
 * useDelayedFlag(true, 150) → returns true only after the input has been
 * truthy for `delayMs`, preventing skeleton flashes on fast loads.
 */
export function useDelayedFlag(active, delayMs = 150) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return undefined;
    }
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return shown;
}

/**
 * useMountSkeleton(180) → returns true for the first `durationMs` ms after
 * a component mounts, then false. Use to show a brief route-transition
 * skeleton on every navigation.
 */
export function useMountSkeleton(durationMs = 180) {
  const [mounting, setMounting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMounting(false), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);
  return mounting;
}

/** A11y-only live region announcing what's loading. */
export function LoadingAnnouncer({ label = 'Loading' }) {
  return (
    <span className="sk-sr-only" role="status" aria-live="polite">
      {label}
    </span>
  );
}

/* ------------------ Composed skeletons ------------------ */

export function OrdersListSkeleton({ count = 4 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card sk-order-card">
          <div className="sk-row sk-row-between">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="pill" width={64} height={20} />
          </div>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="55%" />
          <div className="sk-row sk-row-between">
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OffersListSkeleton({ count = 4 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card sk-offer-card">
          <Skeleton variant="block" height={120} className="sk-offer-banner" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="45%" />
        </div>
      ))}
    </div>
  );
}

export function CentresListSkeleton({ count = 3 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card sk-centre-card">
          <div className="sk-row sk-row-between">
            <Skeleton variant="text" width="55%" height={18} />
            <Skeleton variant="pill" width={48} height={20} />
          </div>
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="70%" />
          <div className="sk-row" style={{ gap: 8 }}>
            <Skeleton variant="pill" width={70} height={22} />
            <Skeleton variant="pill" width={70} height={22} />
            <Skeleton variant="pill" width={70} height={22} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SubscriptionsListSkeleton({ count = 2 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card">
          <div className="sk-row sk-row-between">
            <Skeleton variant="text" width="50%" height={18} />
            <Skeleton variant="pill" width={70} height={22} />
          </div>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="block" height={6} />
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="sk-detail">
      <Skeleton variant="block" height={140} className="sk-detail-hero" />
      <div className="sk-card">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <div className="sk-card">
        <Skeleton variant="text" width="40%" height={18} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="70%" />
      </div>
    </div>
  );
}

/** Booking page mount skeleton — mirrors centre/address card + schedule + wash + cars + cta. */
export function BookingPageSkeleton() {
  return (
    <div className="sk-page sk-booking">
      <Skeleton variant="block" height={92} className="sk-booking-hero" />
      <Skeleton variant="block" height={64} className="sk-card-block" />
      <div className="sk-card">
        <Skeleton variant="text" width="40%" height={14} />
        <div className="sk-row" style={{ gap: 8 }}>
          <Skeleton variant="pill" width={70} height={32} />
          <Skeleton variant="pill" width={70} height={32} />
          <Skeleton variant="pill" width={70} height={32} />
        </div>
      </div>
      <div className="sk-card">
        <Skeleton variant="text" width="35%" height={14} />
        <div className="sk-row" style={{ gap: 10 }}>
          <Skeleton variant="block" height={104} className="sk-vehicle" />
          <Skeleton variant="block" height={104} className="sk-vehicle" />
          <Skeleton variant="block" height={104} className="sk-vehicle" />
        </div>
      </div>
      <Skeleton variant="block" height={56} className="sk-cta" />
    </div>
  );
}

/** Review page mount skeleton — service summary + price + cta. */
export function ReviewPageSkeleton() {
  return (
    <div className="sk-page sk-review">
      <Skeleton variant="block" height={48} className="sk-card-block" />
      <div className="sk-card">
        <div className="sk-row sk-row-between">
          <Skeleton variant="text" width="40%" height={18} />
          <Skeleton variant="pill" width={70} height={22} />
        </div>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="50%" />
      </div>
      <div className="sk-card">
        <Skeleton variant="text" width="50%" height={18} />
        <div className="sk-row sk-row-between">
          <Skeleton variant="text" width="35%" />
          <Skeleton variant="text" width="20%" />
        </div>
        <div className="sk-row sk-row-between">
          <Skeleton variant="text" width="35%" />
          <Skeleton variant="text" width="20%" />
        </div>
        <div className="sk-row sk-row-between">
          <Skeleton variant="text" width="40%" height={18} />
          <Skeleton variant="text" width="25%" height={18} />
        </div>
      </div>
      <Skeleton variant="block" height={56} className="sk-cta" />
    </div>
  );
}

/** Home page mount skeleton — hero + greeting + deals carousel + bottom strip. */
export function HomePageSkeleton() {
  return (
    <div className="sk-page sk-home">
      <Skeleton variant="block" height={140} className="sk-home-hero" />
      <div className="sk-row" style={{ padding: '0 16px', gap: 12 }}>
        <Skeleton variant="circle" width={48} height={48} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="55%" height={16} />
          <Skeleton variant="text" width="35%" />
        </div>
      </div>
      <div className="sk-row" style={{ padding: '0 16px', gap: 12, overflow: 'hidden' }}>
        <Skeleton variant="block" height={160} className="sk-deal-card" />
        <Skeleton variant="block" height={160} className="sk-deal-card" />
      </div>
      <Skeleton variant="block" height={120} className="sk-card-block" />
    </div>
  );
}

export default Skeleton;
