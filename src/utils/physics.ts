export type SimulationMode = 'experiment' | 'theoretical';

export interface SimulationParams {
  /** Massa piringan rotasi M (kg) */
  M: number;
  /** Jari-jari piringan rotasi R (m) */
  R: number;
  /** Lengan gaya / radius efektif lilitan benang r (m) */
  r: number;
  /** Massa beban gantung m (kg) */
  m: number;
  /** Percepatan gravitasi g (m/s^2) */
  g: number;
  /** Jumlah putaran target N */
  N: number;
  /** Waktu pengukuran stopwatch eksperimen t (s) */
  t: number;
  /** Mode animasi: menggunakan data stopwatch eksperimen atau model teoritis ideal */
  mode: SimulationMode;
}

export interface PhysicsResults {
  /** Gaya berat beban F = m * g (N) */
  force: number;
  /** Torsi / momen gaya tau = F * r (N·m) */
  torque: number;
  /** Sudut tempuh total theta = 2 * pi * N (rad) */
  thetaTotal: number;
  /** Percepatan sudut eksperimen alpha = (4 * pi * N) / t^2 (rad/s^2) */
  alphaExp: number;
  /** Percepatan sudut teoritis ideal alpha_teori = tau / I_teori (rad/s^2) */
  alphaTheo: number;
  /** Percepatan sudut aktif sesuai mode simulasi */
  activeAlpha: number;
  /** Waktu tempuh aktif sesuai mode simulasi (s) */
  activeTime: number;
  /** Kecepatan sudut rata-rata omega_avg = theta / t (rad/s) */
  omegaAvg: number;
  /** Kecepatan sudut sesaat akhir omega_final = alpha * t (rad/s) */
  omegaFinal: number;
  /** Momen inersia eksperimen I_exp = tau / alpha_exp (kg·m^2) */
  inertiaExp: number;
  /** Momen inersia teoritis piringan pejal I_teori = 0.5 * M * R^2 (kg·m^2) */
  inertiaTheo: number;
  /** Rasio perbandingan I_eksperimen / I_teori */
  inertiaRatio: number;
  /** Jarak turun beban total s = r * thetaTotal (m) */
  linearDropTotal: number;
}

export interface KinematicState {
  time: number;
  theta: number;
  turns: number;
  omega: number;
  alpha: number;
  linearDrop: number;
  progress: number;
}

export interface ValidationError {
  field: keyof SimulationParams;
  message: string;
}

export interface WorksheetEntry {
  id: string;
  label: string;
  isDefault?: boolean;
  params: SimulationParams;
  results: PhysicsResults;
}

export type PresetKey = 'laprak' | 'jobsheet';

export const PRESETS: Record<
  PresetKey,
  {
    name: string;
    subtitle: string;
    params: SimulationParams;
  }
> = {
  laprak: {
    name: 'Contoh Laporan Resmi (Laprak)',
    subtitle: 'Data Kelompok 1 · Piringan (kaset) M = 0,02 kg, R = 0,05 m, m = 0,017 kg, N = 10, t = 7,00 s',
    params: {
      M: 0.02,
      R: 0.05,
      r: 0.05,
      m: 0.017,
      g: 9.8,
      N: 10,
      t: 7.0,
      mode: 'experiment',
    },
  },
  jobsheet: {
    name: 'Standar Jobsheet Praktikum 6',
    subtitle: 'Spesifikasi Jobsheet · Piringan R = 0,10 m, M = 0,05 kg, m = 0,020 kg, N = 10, t = 5,00 s',
    params: {
      M: 0.05,
      R: 0.1,
      r: 0.1,
      m: 0.02,
      g: 9.8,
      N: 10,
      t: 5.0,
      mode: 'experiment',
    },
  },
};

export function validateParams(params: SimulationParams): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!Number.isFinite(params.M) || params.M <= 0) {
    errors.push({ field: 'M', message: 'Massa piringan (M) harus lebih dari 0 kg.' });
  }
  if (!Number.isFinite(params.R) || params.R <= 0) {
    errors.push({ field: 'R', message: 'Jari-jari piringan (R) harus lebih dari 0 m.' });
  }
  if (!Number.isFinite(params.r) || params.r <= 0) {
    errors.push({ field: 'r', message: 'Radius efektif lilitan (r) harus lebih dari 0 m.' });
  }
  if (!Number.isFinite(params.m) || params.m <= 0) {
    errors.push({ field: 'm', message: 'Massa beban (m) harus lebih dari 0 kg.' });
  }
  if (!Number.isFinite(params.g) || params.g <= 0) {
    errors.push({ field: 'g', message: 'Percepatan gravitasi (g) harus lebih dari 0 m/s².' });
  }
  if (!Number.isFinite(params.N) || params.N <= 0) {
    errors.push({ field: 'N', message: 'Jumlah putaran (N) harus lebih dari 0.' });
  }
  if (!Number.isFinite(params.t) || params.t <= 0) {
    errors.push({ field: 't', message: 'Waktu putaran (t) harus lebih dari 0 detik.' });
  }
  return errors;
}

export function calculateRotationalPhysics(params: SimulationParams): PhysicsResults {
  const safeM = Math.max(params.M, 1e-9);
  const safeR = Math.max(params.R, 1e-9);
  const safer = Math.max(params.r, 1e-9);
  const safem = Math.max(params.m, 1e-9);
  const safeg = Math.max(params.g, 1e-9);
  const safeN = Math.max(params.N, 1e-9);
  const safet = Math.max(params.t, 1e-9);

  const force = safem * safeg;
  const torque = force * safer;
  const thetaTotal = 2 * Math.PI * safeN;
  const alphaExp = (2 * thetaTotal) / (safet * safet);
  const inertiaTheo = 0.5 * safeM * safeR * safeR;
  const alphaTheo = torque / inertiaTheo;
  const inertiaExp = torque / alphaExp;
  const inertiaRatio = inertiaExp / inertiaTheo;

  const activeAlpha = params.mode === 'theoretical' ? alphaTheo : alphaExp;
  const activeTime =
    params.mode === 'theoretical' ? Math.sqrt((2 * thetaTotal) / activeAlpha) : safet;

  const omegaAvg = thetaTotal / activeTime;
  const omegaFinal = activeAlpha * activeTime;
  const linearDropTotal = safer * thetaTotal;

  return {
    force,
    torque,
    thetaTotal,
    alphaExp,
    alphaTheo,
    activeAlpha,
    activeTime,
    omegaAvg,
    omegaFinal,
    inertiaExp,
    inertiaTheo,
    inertiaRatio,
    linearDropTotal,
  };
}

export function getKinematicStateAtTime(
  params: SimulationParams,
  results: PhysicsResults,
  currentTime: number
): KinematicState {
  const clampedTime = Math.max(0, Math.min(currentTime, results.activeTime));
  const alpha = results.activeAlpha;
  const theta = 0.5 * alpha * clampedTime * clampedTime;
  const turns = theta / (2 * Math.PI);
  const omega = alpha * clampedTime;
  const linearDrop = Math.max(params.r, 0) * theta;
  const progress = results.activeTime > 0 ? clampedTime / results.activeTime : 0;

  return {
    time: clampedTime,
    theta,
    turns,
    omega,
    alpha,
    linearDrop,
    progress,
  };
}

export function formatNum(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(decimals).replace('.', ',');
}

export function formatSmartInertia(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < 0.0001) {
    return value.toFixed(6).replace('.', ',');
  }
  return value.toFixed(6).replace('.', ',');
}
