/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Pause, Play, RotateCcw } from 'lucide-react';
import { CalculatorPanel } from './components/CalculatorPanel';
import { KinematicsChart } from './components/KinematicsChart';
import { RotationalCanvas } from './components/RotationalCanvas';
import { WorksheetTable } from './components/WorksheetTable';
import {
  calculateRotationalPhysics,
  formatNum,
  getKinematicStateAtTime,
  PRESETS,
  PresetKey,
  SimulationMode,
  SimulationParams,
  validateParams,
  WorksheetEntry,
} from './utils/physics';

type NumericField = 'M' | 'R' | 'r' | 'm' | 'g' | 'N' | 't';

function toRawStrings(p: SimulationParams): Record<NumericField, string> {
  return {
    M: String(p.M),
    R: String(p.R),
    r: String(p.r),
    m: String(p.m),
    g: String(p.g),
    N: String(p.N),
    t: String(p.t),
  };
}

export default function App() {
  const [params, setParams] = useState<SimulationParams>(PRESETS.laprak.params);
  const [rawInputs, setRawInputs] = useState<Record<NumericField, string>>(() =>
    toRawStrings(PRESETS.laprak.params)
  );
  const [lockRadiusEqual, setLockRadiusEqual] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('laprak');

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    }
    return false;
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [worksheetEntries, setWorksheetEntries] = useState<WorksheetEntry[]>(() => [
    {
      id: 'laprak-default',
      label: 'Data Laprak (Kelompok 1)',
      isDefault: true,
      params: PRESETS.laprak.params,
      results: calculateRotationalPhysics(PRESETS.laprak.params),
    },
  ]);

  const errors = useMemo(() => validateParams(params), [params]);
  const hasErrors = errors.length > 0;
  const results = useMemo(() => calculateRotationalPhysics(params), [params]);
  const kinematic = useMemo(
    () => getKinematicStateAtTime(params, results, currentTime),
    [params, results, currentTime]
  );

  const simStatus = hasErrors
    ? 'invalid'
    : isPlaying
    ? 'running'
    : currentTime >= results.activeTime - 1e-4 && currentTime > 0
    ? 'completed'
    : currentTime > 0
    ? 'paused'
    : 'idle';

  // Animation RAF loop using refs to avoid stale closures
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(currentTime);
  currentTimeRef.current = currentTime;

  const activeTimeRef = useRef<number>(results.activeTime);
  activeTimeRef.current = results.activeTime;

  const speedRef = useRef<number>(playbackSpeed);
  speedRef.current = playbackSpeed;

  useEffect(() => {
    if (!isPlaying || hasErrors) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }
      const dt = ((timestamp - lastFrameRef.current) / 1000) * speedRef.current;
      lastFrameRef.current = timestamp;

      const nextTime = currentTimeRef.current + dt;
      const targetTime = activeTimeRef.current;

      if (nextTime >= targetTime) {
        setCurrentTime(targetTime);
        setIsPlaying(false);
        rafRef.current = null;
        lastFrameRef.current = null;
        return;
      }

      setCurrentTime(nextTime);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
    };
  }, [isPlaying, hasErrors]);

  const handleTogglePlay = () => {
    if (hasErrors) return;
    if (!isPlaying && currentTime >= results.activeTime - 1e-4) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSelectPreset = (presetKey: PresetKey) => {
    const presetParams = { ...PRESETS[presetKey].params, mode: params.mode };
    setIsPlaying(false);
    setCurrentTime(0);
    setParams(presetParams);
    setRawInputs(toRawStrings(presetParams));
    setLockRadiusEqual(true);
    setActivePreset(presetKey);
  };

  const handleInputChange = (field: NumericField, rawValue: string) => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActivePreset('custom');

    const parsed = parseFloat(rawValue);
    const nextRaw = { ...rawInputs, [field]: rawValue };

    if (field === 'R' && lockRadiusEqual) {
      nextRaw.r = rawValue;
    }
    setRawInputs(nextRaw);

    setParams((prev) => {
      const updated: SimulationParams = {
        ...prev,
        [field]: Number.isFinite(parsed) ? parsed : NaN,
      };
      if (field === 'R' && lockRadiusEqual) {
        updated.r = Number.isFinite(parsed) ? parsed : NaN;
      }
      return updated;
    });
  };

  const handleToggleLockRadius = (locked: boolean) => {
    setLockRadiusEqual(locked);
    if (locked) {
      setIsPlaying(false);
      setCurrentTime(0);
      setParams((prev) => ({ ...prev, r: prev.R }));
      setRawInputs((prev) => ({ ...prev, r: prev.R }));
    }
  };

  const handleModeChange = (mode: SimulationMode) => {
    setIsPlaying(false);
    setCurrentTime(0);
    setParams((prev) => ({ ...prev, mode }));
  };

  const handleAddWorksheetEntry = () => {
    if (hasErrors) return;
    const nextIndex = worksheetEntries.length + 1;
    const label =
      activePreset === 'laprak'
        ? `Salinan Laprak #${nextIndex}`
        : activePreset === 'jobsheet'
        ? `Jobsheet #${nextIndex}`
        : `Percobaan #${nextIndex}`;

    setWorksheetEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}-${nextIndex}`,
        label,
        params: { ...params },
        results: { ...results },
      },
    ]);
  };

  const handleLoadEntry = (entry: WorksheetEntry) => {
    setIsPlaying(false);
    setCurrentTime(0);
    setParams({ ...entry.params });
    setRawInputs(toRawStrings(entry.params));
    setLockRadiusEqual(Math.abs(entry.params.r - entry.params.R) < 1e-9);
    setActivePreset(entry.isDefault ? 'laprak' : 'custom');
    const simEl = document.getElementById('simulasi');
    if (simEl) {
      simEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteEntry = (id: string) => {
    setWorksheetEntries((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Three-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#simulasi"
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Gerak Rotasi dan Torsi
          </a>

          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#simulasi"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Animasi Alat
            </a>
            <a
              href="#perhitungan"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Perhitungan
            </a>
            <a
              href="#lembar-kerja"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Lembar Kerja
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              disabled={hasErrors}
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Jeda Simulasi
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Jalankan Simulasi
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6"
        data-sim-state={simStatus}
        data-current-time={currentTime.toFixed(2)}
      >
        {/* Two-Zone Sandbox: Animation Stage (Left) + Parameter & Calculation Deck (Right) */}
        <div
          id="simulasi"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left Stage: Canvas + Controls + Live Chart */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    Simulasi Skema Percobaan Gerak Rotasi
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activePreset === 'laprak'
                      ? PRESETS.laprak.subtitle
                      : activePreset === 'jobsheet'
                      ? PRESETS.jobsheet.subtitle
                      : `Konfigurasi Kustom · M = ${formatNum(params.M, 3)} kg · R = ${formatNum(params.R, 3)} m · m = ${formatNum(params.m, 3)} kg`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVectors((v) => !v)}
                  aria-pressed={showVectors}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {showVectors ? (
                    <Eye className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  )}
                  Vektor Gaya & Torsi
                </button>
              </div>

              {/* Live Digital Instrument Readout Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Stopwatch Digital
                  </div>
                  <div
                    data-testid="stopwatch-readout"
                    className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-0.5"
                  >
                    {formatNum(kinematic.time, 2)}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / {formatNum(results.activeTime, 2)} s
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Putaran (N)
                  </div>
                  <div
                    data-testid="turns-readout"
                    className="text-lg font-mono font-bold tabular-nums text-sky-700 mt-0.5"
                  >
                    {formatNum(kinematic.turns, 2)}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / {formatNum(params.N, 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Kecepatan Sudut (ω)
                  </div>
                  <div className="text-lg font-mono font-bold tabular-nums text-amber-700 mt-0.5">
                    {formatNum(kinematic.omega, 2)}{' '}
                    <span className="text-xs font-normal text-slate-500">rad/s</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-slate-500">
                    Percepatan Sudut (α)
                  </div>
                  <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                    {formatNum(results.activeAlpha, 4)}{' '}
                    <span className="text-xs font-normal text-slate-500">rad/s²</span>
                  </div>
                </div>
              </div>

              {/* Interactive Canvas */}
              <RotationalCanvas
                params={params}
                results={results}
                currentTime={currentTime}
                showVectors={showVectors}
                isPlaying={isPlaying}
              />

              {/* Playback & Timeline Scrubber Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={hasErrors}
                    onClick={handleTogglePlay}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                        Jeda
                      </>
                    ) : currentTime >= results.activeTime - 1e-4 && currentTime > 0 ? (
                      <>
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        Putar Ulang
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        Putar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Reset
                  </button>
                </div>

                {/* Time Scrubber */}
                <div className="flex-1 min-w-[160px] flex items-center gap-2.5">
                  <label htmlFor="time-scrubber" className="text-xs font-mono text-slate-500 shrink-0">
                    t:
                  </label>
                  <input
                    id="time-scrubber"
                    type="range"
                    aria-label="Penggeser waktu simulasi"
                    min={0}
                    max={Math.max(results.activeTime, 0.01)}
                    step={0.01}
                    value={Math.min(currentTime, results.activeTime)}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentTime(parseFloat(e.target.value));
                    }}
                    className="lab-slider w-full"
                  />
                </div>

                {/* Speed Controls */}
                <div
                  className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0"
                  role="group"
                  aria-label="Kecepatan Pemutaran"
                >
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Live θ(t) and ω(t) Chart */}
            <KinematicsChart
              params={params}
              results={results}
              currentTime={currentTime}
            />
          </div>

          {/* Right Deck: Parameters + Step-by-Step Calculation */}
          <div className="lg:col-span-5">
            <CalculatorPanel
              params={params}
              rawInputs={rawInputs}
              lockRadiusEqual={lockRadiusEqual}
              activePreset={activePreset}
              errors={errors}
              results={results}
              onSelectPreset={handleSelectPreset}
              onInputChange={handleInputChange}
              onToggleLockRadius={handleToggleLockRadius}
              onModeChange={handleModeChange}
            />
          </div>
        </div>

        {/* Full-Width Lembar Kerja Table */}
        <WorksheetTable
          entries={worksheetEntries}
          onAddCurrent={handleAddWorksheetEntry}
          onLoadEntry={handleLoadEntry}
          onDeleteEntry={handleDeleteEntry}
          disabledAdd={hasErrors}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Praktikum Fisika Teknik · Gerak Rotasi dan Torsi</span>
          <span>Referensi: Laporan Resmi Kelompok 1 & Jobsheet Praktikum 6</span>
        </div>
      </footer>
    </div>
  );
}
