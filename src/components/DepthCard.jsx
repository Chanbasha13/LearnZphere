import React, { useRef, useState } from 'react';

/**
 * Architectural surface card with subtle CSS 3D perspective tilt and warm metallic highlight.
 * Automatically stays flat when reduced-motion is preferred or on touch inputs.
 */
export function DepthCard({ children, className = '', style = {}, maxTilt = 4.5, cursorLabel = '', ...rest }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [shinePos, setShinePos] = useState({ x: 50, y: 20, active: false });

  const canTilt = () => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
    if (window.matchMedia?.('(pointer: coarse)')?.matches) return false;
    return true;
  };

  const handleMouseMove = (e) => {
    if (!canTilt() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * (maxTilt * 2);
    const rotateX = (0.5 - py) * (maxTilt * 2);
    setTransformStyle(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -3px, 0)`
    );
    setShinePos({ x: Math.round(px * 100), y: Math.round(py * 100), active: true });
  };

  const handleMouseLeave = () => {
    setTransformStyle('');
    setShinePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor="card"
      data-cursor-label={cursorLabel || undefined}
      className={`ls-depth-card ${className}`.trim()}
      style={{
        ...style,
        transform: transformStyle || undefined,
        '--mx': `${shinePos.x}%`,
        '--my': `${shinePos.y}%`,
        '--shine-opacity': shinePos.active ? 1 : 0
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default DepthCard;
