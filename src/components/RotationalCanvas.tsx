import React, { useEffect, useRef } from 'react';
import {
  formatNum,
  getKinematicStateAtTime,
  PhysicsResults,
  SimulationParams,
} from '../utils/physics';

interface RotationalCanvasProps {
  params: SimulationParams;
  results: PhysicsResults;
  currentTime: number;
  showVectors: boolean;
  isPlaying: boolean;
}

export const RotationalCanvas: React.FC<RotationalCanvasProps> = ({
  params,
  results,
  currentTime,
  showVectors,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    params,
    results,
    currentTime,
    showVectors,
    isPlaying,
  });

  stateRef.current = {
    params,
    results,
    currentTime,
    showVectors,
    isPlaying,
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { params: p, results: res, currentTime: tNow, showVectors: vectors } = stateRef.current;
    const kin = getKinematicStateAtTime(p, res, tNow);

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Crisp lab grid background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    const minorStep = 24;
    ctx.strokeStyle = '#EEF2F6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += minorStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = 0; y <= height; y += minorStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    const majorStep = 96;
    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    for (let x = 0; x <= width; x += majorStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = 0; y <= height; y += majorStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    // Scale coordinates responsively inside canvas
    const discX = Math.min(width * 0.31, 250);
    const discY = height * 0.5;

    // Map physical R (0.02..0.20 m) to pixel radius (54..110 px)
    const clampR = Math.max(0.02, Math.min(0.2, p.R));
    const discRadiusPx = 54 + ((clampR - 0.02) / 0.18) * 56;

    // Effective radius r proportional to R, clamped cleanly
    const ratioR = p.R > 0 ? p.r / p.R : 1;
    const effectiveRadiusPx = Math.max(18, Math.min(discRadiusPx * 1.15, discRadiusPx * ratioR));

    const pulleyX = Math.max(discX + discRadiusPx + 95, width * 0.67);
    const pulleyRadiusPx = 22;
    const stringY = discY - effectiveRadiusPx;
    const pulleyY = stringY + pulleyRadiusPx;

    // Lab bench baseline
    const benchY = height - 34;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(24, benchY, width - 48, 6);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, benchY, width - 48, 6);

    // 2. Penyangga Poros (Two subtle glass beaker / stand silhouettes like Laprak setup)
    const drawSupportPillar = (cx: number, label: string) => {
      const topY = discY + 6;
      const w = 40;
      const h = benchY - topY;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, topY, w, h, [3, 3, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Lip at top
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(cx - w / 2 - 3, topY - 3, w + 6, 6);
      ctx.strokeRect(cx - w / 2 - 3, topY - 3, w + 6, 6);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, benchY + 18);
    };

    drawSupportPillar(discX - discRadiusPx - 26, 'Penyangga Kiri');
    drawSupportPillar(discX + discRadiusPx + 26, 'Penyangga Kanan');

    // Horizontal axle beam across both supports
    ctx.fillStyle = '#64748B';
    ctx.fillRect(discX - discRadiusPx - 36, discY - 4, (discRadiusPx + 36) * 2, 8);

    // 3. Pulley stand (Tiang Katrol)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pulleyX, pulleyY);
    ctx.lineTo(pulleyX, benchY);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(pulleyX - 18, benchY - 6, 36, 6);

    // 4. Piringan Rotasi (Disc / Kaset)
    ctx.save();
    ctx.translate(discX, discY);

    // Soft elevation shadow
    ctx.beginPath();
    ctx.arc(0, 4, discRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.fill();

    // Metallic-pearl disc surface
    const discGrad = ctx.createRadialGradient(-discRadiusPx * 0.25, -discRadiusPx * 0.25, 8, 0, 0, discRadiusPx);
    discGrad.addColorStop(0, '#FFFFFF');
    discGrad.addColorStop(0.55, '#E2E8F0');
    discGrad.addColorStop(0.85, '#CBD5E1');
    discGrad.addColorStop(1, '#94A3B8');

    ctx.beginPath();
    ctx.arc(0, 0, discRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Concentric subtle disc grooves (evoking CD/piringan)
    [0.78, 0.56, 0.34].forEach((frac) => {
      ctx.beginPath();
      ctx.arc(0, 0, discRadiusPx * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Swept angular displacement sector (theta mod 2pi)
    const modTheta = kin.theta % (Math.PI * 2);
    if (kin.theta > 0.02) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Clockwise rotation from -PI/2 (top)
      ctx.arc(0, 0, discRadiusPx * 0.88, -Math.PI / 2, -Math.PI / 2 + modTheta, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 132, 199, 0.14)';
      ctx.fill();
    }

    // Rotating spokes and primary reference marker
    ctx.save();
    ctx.rotate(kin.theta);

    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * (discRadiusPx - 3), Math.sin(ang) * (discRadiusPx - 3));
      ctx.strokeStyle = i === 0 ? '#0284C7' : 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = i === 0 ? 3 : 1.5;
      ctx.stroke();
    }

    // Reference dot on rim so rotation speed & turns are unmistakable
    ctx.beginPath();
    ctx.arc(0, -discRadiusPx + 10, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Secondary opposite marker
    ctx.beginPath();
    ctx.arc(0, discRadiusPx - 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#64748B';
    ctx.fill();

    ctx.restore();

    // Effective radius r dashed ring (where string is wound)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.arc(0, 0, effectiveRadiusPx, 0, Math.PI * 2);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Remaining wound string wraps visual on hub/radius r
    const remainingFrac = Math.max(0, 1 - kin.progress);
    const wrapArcs = Math.max(0, remainingFrac * 2.5);
    if (wrapArcs > 0.05) {
      ctx.beginPath();
      ctx.arc(0, 0, effectiveRadiusPx + 2, -Math.PI / 2, -Math.PI / 2 - Math.PI * 1.4 * remainingFrac, true);
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Central axle hub (Poros)
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();

    // Vector overlays on Disc
    if (vectors) {
      // Lever arm r vector (center to top tangent)
      drawArrow(ctx, 0, 0, 0, -effectiveRadiusPx, '#0284C7', 2.5);
      ctx.fillStyle = '#0369A1';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`r=${formatNum(p.r, 2)}m`, 7, -effectiveRadiusPx * 0.48);

      // Curved Torque & Rotation direction arrow
      const arcR = discRadiusPx + 18;
      ctx.beginPath();
      ctx.arc(0, 0, arcR, -Math.PI * 0.35, Math.PI * 0.12, false);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const tipAngle = Math.PI * 0.12;
      const tipX = Math.cos(tipAngle) * arcR;
      const tipY = Math.sin(tipAngle) * arcR;
      drawArrowHead(ctx, tipX, tipY, tipAngle + Math.PI / 2, '#D97706', 8);

      ctx.fillStyle = '#B45309';
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('τ, α', tipX + 8, tipY - 4);
    }

    // Label Piringan
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Piringan (M = ${formatNum(p.M, 3)} kg, R = ${formatNum(p.R, 2)} m)`, 0, discRadiusPx + 36);

    ctx.restore();

    // 5. Katrol (Pulley)
    const pulleyAngle = kin.linearDrop / 0.025; // r_katrol = 2.5 cm (diam 5 cm)
    ctx.save();
    ctx.translate(pulleyX, pulleyY);

    ctx.beginPath();
    ctx.arc(0, 0, pulleyRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.save();
    ctx.rotate(pulleyAngle);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (pulleyRadiusPx - 3), Math.sin(a) * (pulleyRadiusPx - 3));
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Katrol (∅ 5 cm)', 0, -pulleyRadiusPx - 10);
    ctx.restore();

    // 6. Vertical drop rail & Hanging Mass (Beban Gantung)
    const massX = pulleyX + pulleyRadiusPx;
    const minMassY = pulleyY + 26;
    const maxMassY = benchY - 82;
    const massY = minMassY + kin.progress * (maxMassY - minMassY);

    // Calibrated ruler beside drop path
    const rulerX = massX + 44;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerX, minMassY);
    ctx.lineTo(rulerX, maxMassY);
    ctx.stroke();

    for (let tick = 0; tick <= 4; tick++) {
      const ty = minMassY + (tick / 4) * (maxMassY - minMassY);
      ctx.beginPath();
      ctx.moveTo(rulerX - 5, ty);
      ctx.lineTo(rulerX + 5, ty);
      ctx.stroke();

      const distVal = (tick / 4) * res.linearDropTotal;
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${formatNum(distVal, 2)} m`, rulerX + 8, ty + 3);
    }

    // String (Benang) from disc top tangent -> pulley top -> hanging mass
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(discX, stringY);
    ctx.lineTo(pulleyX, stringY);
    ctx.arc(pulleyX, pulleyY, pulleyRadiusPx, -Math.PI / 2, 0, false);
    ctx.lineTo(massX, massY - 12);
    ctx.stroke();

    // Tension / horizontal force arrow along string
    if (vectors) {
      const midStringX = (discX + pulleyX) / 2;
      drawArrow(ctx, midStringX - 24, stringY - 10, midStringX + 24, stringY - 10, '#D97706', 2);
      ctx.fillStyle = '#B45309';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`F = ${formatNum(res.force, 4)} N`, midStringX, stringY - 18);
    }

    // Hanging Mass (Beban)
    const massSize = 18 + Math.min(14, p.m * 350);
    ctx.save();
    ctx.translate(massX, massY);

    // Hook ring
    ctx.beginPath();
    ctx.arc(0, -10, 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metallic cylindrical weight body
    const wGrad = ctx.createLinearGradient(-massSize / 2, 0, massSize / 2, 0);
    wGrad.addColorStop(0, '#334155');
    wGrad.addColorStop(0.5, '#64748B');
    wGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = wGrad;
    ctx.beginPath();
    ctx.roundRect(-massSize / 2, -6, massSize, massSize + 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mass text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${formatNum(p.m * 1000, 0)}g`, 0, massSize / 2 + 2);

    // Gravity Force vector F = m*g downward
    if (vectors) {
      drawArrow(ctx, 0, massSize + 4, 0, massSize + 30, '#DC2626', 2.5);
      ctx.fillStyle = '#B91C1C';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('F = mg', -8, massSize + 21);
    }

    ctx.restore();

    ctx.restore();
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(340, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      drawScene();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, results, currentTime, showVectors, isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[420px] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        data-testid="rotational-canvas"
        aria-label="Animasi skema alat praktikum gerak rotasi dan torsi"
        className="block w-full h-full"
      />
    </div>
  );
};

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 2
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  drawArrowHead(ctx, x2, y2, angle, color, 7);
  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size = 7
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 1.4, -size * 0.6);
  ctx.lineTo(-size * 1.4, size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
