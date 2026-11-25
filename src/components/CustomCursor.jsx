import React, { useEffect, useRef, useState } from 'react';

/**
 * Custom architectural cursor with central point, spring-eased trailing ring,
 * restrained warm champagne particle flecks on movement, magnetic hover pull,
 * and automatic touch / reduced-motion bypass.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const noHover = window.matchMedia?.('(hover: none)')?.matches;
    if (isCoarse || reducedMotion || noHover) {
      setEnabled(false);
      return undefined;
    }

    setEnabled(true);
    let active = true;
    let rafId = null;

    const pointer = { x: -120, y: -120, visible: false };
    const dotPos = { x: -120, y: -120 };
    const ringPos = { x: -120, y: -120 };
    const lastSpawn = { x: -120, y: -120 };
    let hoverMode = 'default'; // default | interactive | card | campus | text
    let hoverLabel = '';
    let magneticTarget = null;
    const particles = [];

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    if (canvas && ctx) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    const resolveTargetContext = (target) => {
      if (!target || !(target instanceof Element)) return { mode: 'default', label: '', mag: null };
      if (target.closest('input, textarea, select')) return { mode: 'text', label: '', mag: null };

      const customEl = target.closest('[data-cursor]');
      if (customEl) {
        const mode = customEl.getAttribute('data-cursor') || 'interactive';
        const label = customEl.getAttribute('data-cursor-label') || '';
        const mag = target.closest('[data-magnetic]');
        return { mode, label, mag };
      }

      if (target.closest('.arch-webgl-canvas')) {
        return { mode: 'campus', label: 'ORBIT', mag: null };
      }

      const btn = target.closest('button, a, [role="button"], .arch-building-marker');
      if (btn) {
        return {
          mode: 'interactive',
          label: btn.getAttribute('data-cursor-label') || '',
          mag: btn.hasAttribute('data-magnetic') ? btn : null
        };
      }

      const card = target.closest('.ls-depth-card, .course-card-3d, .stat-card');
      if (card) {
        return { mode: 'card', label: card.getAttribute('data-cursor-label') || '', mag: null };
      }

      return { mode: 'default', label: '', mag: null };
    };

    const resetMagnetic = () => {
      if (magneticTarget) {
        magneticTarget.style.transform = '';
        magneticTarget = null;
      }
    };

    const onMouseMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.visible = true;

      // Restrained metallic fleck spawn (max 16 active)
      const dist = Math.hypot(pointer.x - lastSpawn.x, pointer.y - lastSpawn.y);
      if (dist > 14 && hoverMode !== 'text') {
        lastSpawn.x = pointer.x;
        lastSpawn.y = pointer.y;
        if (particles.length >= 16) particles.shift();
        particles.push({
          x: pointer.x + (Math.random() - 0.5) * 6,
          y: pointer.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45 - 0.25,
          life: 1,
          size: 1.2 + Math.random() * 1.4
        });
      }

      const next = resolveTargetContext(e.target);
      hoverMode = next.mode;
      hoverLabel = next.label;

      if (next.mag) {
        if (magneticTarget && magneticTarget !== next.mag) resetMagnetic();
        magneticTarget = next.mag;
        const rect = magneticTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = Math.max(-5, Math.min(5, (pointer.x - cx) * 0.16));
        const dy = Math.max(-5, Math.min(5, (pointer.y - cy) * 0.16));
        magneticTarget.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      } else {
        resetMagnetic();
      }
    };

    const onMouseLeave = () => {
      pointer.visible = false;
      resetMagnetic();
    };

    const onMouseDown = () => {
      if (ringRef.current) ringRef.current.dataset.pressed = 'true';
    };
    const onMouseUp = () => {
      if (ringRef.current) ringRef.current.dataset.pressed = 'false';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });

    const tick = () => {
      if (!active) return;

      dotPos.x += (pointer.x - dotPos.x) * 0.45;
      dotPos.y += (pointer.y - dotPos.y) * 0.45;
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.opacity = pointer.visible ? (hoverMode === 'text' ? '0.3' : '1') : '0';
        dotRef.current.style.transform = `translate3d(${dotPos.x.toFixed(1)}px, ${dotPos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.opacity = pointer.visible ? (hoverMode === 'text' ? '0' : '1') : '0';
        ringRef.current.dataset.mode = hoverMode;
        ringRef.current.style.transform = `translate3d(${ringPos.x.toFixed(1)}px, ${ringPos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      if (labelRef.current) {
        labelRef.current.textContent = hoverLabel || '';
        labelRef.current.style.opacity = hoverLabel ? '1' : '0';
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.042;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.fillStyle = `rgba(218, 177, 124, ${(p.life * 0.48).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      resetMagnetic();
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="ls-cursor-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="ls-cursor-trail-canvas" />
      <div ref={ringRef} className="ls-cursor-ring" data-mode="default">
        <span ref={labelRef} className="ls-cursor-label" />
      </div>
      <div ref={dotRef} className="ls-cursor-dot" />
    </div>
  );
}
