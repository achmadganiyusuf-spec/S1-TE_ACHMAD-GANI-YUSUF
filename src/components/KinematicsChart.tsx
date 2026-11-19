import React from 'react';
import { formatNum, getKinematicStateAtTime, PhysicsResults, SimulationParams } from '../utils/physics';

interface KinematicsChartProps {
  params: SimulationParams;
  results: PhysicsResults;
  currentTime: number;
}

export const KinematicsChart: React.FC<KinematicsChartProps> = ({
  params,
  results,
  currentTime,
}) => {
  const width = 640;
  const height = 180;
  const padLeft = 48;
  const padRight = 52;
  const padTop = 18;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const totalT = Math.max(results.activeTime, 0.001);
  const maxTheta = Math.max(results.thetaTotal, 0.001);
  const maxOmega = Math.max(results.omegaFinal, 0.001);

  const steps = 40;
  const thetaPoints: string[] = [];
  const omegaPoints: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const t = frac * totalT;
    const kin = getKinematicStateAtTime(params, results, t);
    const x = padLeft + frac * plotW;
    const yTheta = padTop + plotH - (kin.theta / maxTheta) * plotH;
    const yOmega = padTop + plotH - (kin.omega / maxOmega) * plotH;
    thetaPoints.push(`${x.toFixed(1)},${yTheta.toFixed(1)}`);
    omegaPoints.push(`${x.toFixed(1)},${yOmega.toFixed(1)}`);
  }

  const currentKin = getKinematicStateAtTime(params, results, currentTime);
  const curX = padLeft + currentKin.progress * plotW;
  const curYTheta = padTop + plotH - (currentKin.theta / maxTheta) * plotH;
  const curYOmega = padTop + plotH - (currentKin.omega / maxOmega) * plotH;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold text-slate-700">
          Grafik Kinematika Rotasi Terhadap Waktu
        </h3>
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" aria-hidden="true" />
            θ(t) = ½αt² ({formatNum(currentKin.theta, 2)} rad)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-600 inline-block" aria-hidden="true" />
            ω(t) = αt ({formatNum(currentKin.omega, 2)} rad/s)
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label="Grafik perubahan sudut tempuh theta dan kecepatan sudut omega terhadap waktu"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padTop + (1 - frac) * plotH;
          return (
            <line
              key={frac}
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke="#F1F5F9"
              strokeWidth={1}
            />
          );
        })}

        {/* Axes */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={padTop + plotH}
          stroke="#CBD5E1"
          strokeWidth={1.2}
        />
        <line
          x1={padLeft + plotW}
          y1={padTop}
          x2={padLeft + plotW}
          y2={padTop + plotH}
          stroke="#CBD5E1"
          strokeWidth={1.2}
        />
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={padLeft + plotW}
          y2={padTop + plotH}
          stroke="#94A3B8"
          strokeWidth={1.2}
        />

        {/* Y-axis Left labels (theta rad) */}
        <text x={padLeft - 6} y={padTop + 4} textAnchor="end" className="fill-sky-700 text-[10px] font-mono">
          {formatNum(maxTheta, 1)}
        </text>
        <text x={padLeft - 6} y={padTop + plotH + 3} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
          0
        </text>

        {/* Y-axis Right labels (omega rad/s) */}
        <text x={padLeft + plotW + 6} y={padTop + 4} textAnchor="start" className="fill-amber-700 text-[10px] font-mono">
          {formatNum(maxOmega, 1)}
        </text>
        <text x={padLeft + plotW + 6} y={padTop + plotH + 3} textAnchor="start" className="fill-slate-400 text-[10px] font-mono">
          0
        </text>

        {/* X-axis labels */}
        <text x={padLeft} y={height - 8} textAnchor="start" className="fill-slate-500 text-[10px] font-mono">
          0 s
        </text>
        <text x={padLeft + plotW / 2} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
          {formatNum(totalT / 2, 2)} s
        </text>
        <text x={padLeft + plotW} y={height - 8} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
          {formatNum(totalT, 2)} s
        </text>

        {/* Curves */}
        <polyline
          fill="none"
          stroke="#0284C7"
          strokeWidth={2.2}
          points={thetaPoints.join(' ')}
        />
        <polyline
          fill="none"
          stroke="#D97706"
          strokeWidth={2}
          strokeDasharray="5,3"
          points={omegaPoints.join(' ')}
        />

        {/* Live time cursor */}
        <line
          x1={curX}
          y1={padTop}
          x2={curX}
          y2={padTop + plotH}
          stroke="#0F172A"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
        <circle cx={curX} cy={curYTheta} r={4.5} fill="#0284C7" stroke="#FFFFFF" strokeWidth={1.5} />
        <circle cx={curX} cy={curYOmega} r={4.5} fill="#D97706" stroke="#FFFFFF" strokeWidth={1.5} />
      </svg>
    </div>
  );
};
