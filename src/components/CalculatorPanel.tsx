import React from 'react';
import {
  formatNum,
  formatSmartInertia,
  PhysicsResults,
  PRESETS,
  PresetKey,
  SimulationMode,
  SimulationParams,
  ValidationError,
} from '../utils/physics';

interface CalculatorPanelProps {
  params: SimulationParams;
  rawInputs: Record<'M' | 'R' | 'r' | 'm' | 'g' | 'N' | 't', string>;
  lockRadiusEqual: boolean;
  activePreset: PresetKey | 'custom';
  errors: ValidationError[];
  results: PhysicsResults;
  onSelectPreset: (preset: PresetKey) => void;
  onInputChange: (field: 'M' | 'R' | 'r' | 'm' | 'g' | 'N' | 't', rawValue: string) => void;
  onToggleLockRadius: (locked: boolean) => void;
  onModeChange: (mode: SimulationMode) => void;
}

interface ParamFieldConfig {
  key: 'M' | 'R' | 'r' | 'm' | 'g' | 'N' | 't';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}

const PARAM_FIELDS: ParamFieldConfig[] = [
  { key: 'M', label: 'Massa Piringan (M)', unit: 'kg', min: 0.005, max: 0.5, step: 0.005, decimals: 3 },
  { key: 'R', label: 'Jari-jari Piringan (R)', unit: 'm', min: 0.02, max: 0.2, step: 0.005, decimals: 3 },
  { key: 'r', label: 'Lengan Gaya / Radius Lilitan (r)', unit: 'm', min: 0.01, max: 0.2, step: 0.005, decimals: 3 },
  { key: 'm', label: 'Massa Beban Gantung (m)', unit: 'kg', min: 0.005, max: 0.2, step: 0.001, decimals: 3 },
  { key: 'N', label: 'Jumlah Putaran (N)', unit: 'putaran', min: 1, max: 30, step: 1, decimals: 0 },
  { key: 't', label: 'Waktu Stopwatch (t)', unit: 's', min: 0.5, max: 20, step: 0.1, decimals: 2 },
  { key: 'g', label: 'Percepatan Gravitasi (g)', unit: 'm/s²', min: 1, max: 15, step: 0.1, decimals: 2 },
];

export const CalculatorPanel: React.FC<CalculatorPanelProps> = ({
  params,
  rawInputs,
  lockRadiusEqual,
  activePreset,
  errors,
  results,
  onSelectPreset,
  onInputChange,
  onToggleLockRadius,
  onModeChange,
}) => {
  const errorMap = new Map<string, string>();
  errors.forEach((e) => errorMap.set(e.field, e.message));

  return (
    <div className="flex flex-col gap-5">
      {/* Parameter Input Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Parameter Percobaan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih contoh Laprak / Jobsheet atau ubah nilai untuk menghitung ulang.
            </p>
          </div>
          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Pilih Preset Data"
          >
            <button
              type="button"
              onClick={() => onSelectPreset('laprak')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'laprak'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contoh Laprak
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('jobsheet')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'jobsheet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jobsheet
            </button>
          </div>
        </div>

        {/* Simulation Physics Mode */}
        <div className="py-3.5 border-b border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-700">
              Basis Animasi Percepatan Sudut (α)
            </span>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Mode Simulasi"
          >
            <button
              type="button"
              onClick={() => onModeChange('experiment')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                params.mode === 'experiment'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Stopwatch (t = {formatNum(params.t, 2)} s)
            </button>
            <button
              type="button"
              onClick={() => onModeChange('theoretical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                params.mode === 'theoretical'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teoritis Ideal (I = ½MR²)
            </button>
          </div>
        </div>

        {/* Sliders & Exact Number Inputs */}
        <div className="pt-4 space-y-4">
          {PARAM_FIELDS.map((field) => {
            const isLockedR = field.key === 'r' && lockRadiusEqual;
            const err = errorMap.get(field.key);
            const numericVal = params[field.key];
            const inputId = `param-input-${field.key}`;
            const sliderId = `param-slider-${field.key}`;

            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={inputId}
                    className="text-xs font-medium text-slate-700"
                  >
                    {field.label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={inputId}
                      type="number"
                      step="any"
                      min="0"
                      disabled={isLockedR}
                      value={rawInputs[field.key]}
                      onChange={(e) => onInputChange(field.key, e.target.value)}
                      className={`w-24 px-2 py-1 text-right text-xs font-mono tabular-nums rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                        err
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : isLockedR
                          ? 'border-slate-200 bg-slate-100 text-slate-500'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                    <span className="text-xs font-mono text-slate-500 w-12">
                      {field.unit}
                    </span>
                  </div>
                </div>

                <input
                  id={sliderId}
                  type="range"
                  aria-label={`${field.label} slider`}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  disabled={isLockedR}
                  value={Math.min(field.max, Math.max(field.min, Number.isFinite(numericVal) ? numericVal : field.min))}
                  onChange={(e) => onInputChange(field.key, e.target.value)}
                  className="lab-slider w-full disabled:opacity-50"
                />

                {field.key === 'r' && (
                  <label className="flex items-center gap-2 pt-0.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lockRadiusEqual}
                      onChange={(e) => onToggleLockRadius(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                    />
                    <span>Samakan lengan gaya r = R (sesuai Laprak)</span>
                  </label>
                )}

                {err && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Step-by-Step Calculation Section */}
      <section
        id="perhitungan"
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="pb-3 border-b border-slate-100 flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Perhitungan Langkah demi Langkah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rumus sesuai Dasar Teori Laporan Resmi dan Jobsheet
            </p>
          </div>
          {activePreset !== 'custom' && (
            <span className="text-xs font-mono text-sky-700 whitespace-nowrap shrink-0">
              {activePreset === 'laprak' ? 'Preset Laprak' : 'Preset Jobsheet'}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          <FormulaStep
            index="1"
            title="Gaya Berat Beban (F)"
            formula="F = m · g"
            substitution={`${formatNum(params.m, 3)} × ${formatNum(params.g, 2)}`}
            result={`${formatNum(results.force, 4)} N`}
          />
          <FormulaStep
            index="2"
            title="Torsi / Momen Gaya (τ)"
            formula="τ = r · F = r · m · g"
            substitution={`${formatNum(params.r, 3)} × ${formatNum(results.force, 4)}`}
            result={`${formatNum(results.torque, 5)} N·m`}
            highlight
          />
          <FormulaStep
            index="3"
            title="Sudut Tempuh (θ)"
            formula="θ = 2π · N"
            substitution={`2π × ${formatNum(params.N, 0)}`}
            result={`${formatNum(results.thetaTotal, 4)} rad`}
          />
          <FormulaStep
            index="4"
            title="Percepatan Sudut Eksperimen (α)"
            formula="α = (2 · θ) / t² = (4π · N) / t²"
            substitution={`(4π × ${formatNum(params.N, 0)}) / (${formatNum(params.t, 2)})²`}
            result={`${formatNum(results.alphaExp, 4)} rad/s²`}
            highlight
          />
          <FormulaStep
            index="5"
            title="Kecepatan Sudut (ω)"
            formula="ω_rata = Δθ / Δt  |  ω_akhir = α · t"
            substitution={`${formatNum(results.thetaTotal, 2)} / ${formatNum(results.activeTime, 2)}  |  ${formatNum(results.activeAlpha, 4)} × ${formatNum(results.activeTime, 2)}`}
            result={`${formatNum(results.omegaAvg, 4)} | ${formatNum(results.omegaFinal, 4)} rad/s`}
          />
          <FormulaStep
            index="6"
            title="Momen Inersia Eksperimen (I_eksperimen)"
            formula="I_eksperimen = τ / α"
            substitution={`${formatNum(results.torque, 5)} / ${formatNum(results.alphaExp, 4)}`}
            result={`${formatSmartInertia(results.inertiaExp)} kg·m²`}
            highlight
          />
          <FormulaStep
            index="7"
            title="Momen Inersia Teoritis Piringan Pejal (I_teori)"
            formula="I_teori = ½ · M · R²"
            substitution={`0,5 × ${formatNum(params.M, 3)} × (${formatNum(params.R, 3)})²`}
            result={`${formatSmartInertia(results.inertiaTheo)} kg·m²`}
          />
        </div>

        {/* Concise Comparison Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">
              Rasio I_eksperimen / I_teori
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {formatNum(results.inertiaRatio, 2)}×
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {results.inertiaExp > results.inertiaTheo
              ? 'I_eksperimen > I_teori karena sistem nyata memiliki inersia tambahan dari poros rotasi (I_total = I_piringan + I_poros) dan gesekan mekanis pada penopang/katrol.'
              : 'I_eksperimen lebih kecil atau mendekati I_teori untuk parameter ini.'}
          </p>
        </div>
      </section>
    </div>
  );
};

interface FormulaStepProps {
  index: string;
  title: string;
  formula: string;
  substitution: string;
  result: string;
  highlight?: boolean;
}

const FormulaStep: React.FC<FormulaStepProps> = ({
  index,
  title,
  formula,
  substitution,
  result,
  highlight = false,
}) => {
  return (
    <div className="py-3 flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-800">
          {index}. {title}
        </span>
        <span
          className={`text-xs font-mono font-semibold tabular-nums whitespace-nowrap ${
            highlight ? 'text-sky-700' : 'text-slate-900'
          }`}
        >
          {result}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-mono tabular-nums text-slate-500">
        <span>{formula}</span>
        <span className="text-slate-600">= {substitution}</span>
      </div>
    </div>
  );
};
