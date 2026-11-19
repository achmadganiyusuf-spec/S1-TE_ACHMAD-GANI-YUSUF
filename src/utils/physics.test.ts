import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS,
  calculateRotationalPhysics,
  getKinematicStateAtTime,
  validateParams,
  formatNum,
} from './physics';

test('Laprak preset matches exact observational results from Laporan Resmi', () => {
  const params = PRESETS.laprak.params;
  const res = calculateRotationalPhysics(params);

  // Gaya F = m * g = 0.017 * 9.8 = 0.1666 N
  assert.ok(Math.abs(res.force - 0.1666) < 1e-6);

  // Torsi tau = r * F = 0.05 * 0.1666 = 0.00833 N·m
  assert.ok(Math.abs(res.torque - 0.00833) < 1e-7);

  // Sudut tempuh theta = 2 * pi * 10 ≈ 62.83185 rad
  assert.ok(Math.abs(res.thetaTotal - 20 * Math.PI) < 1e-6);

  // Percepatan sudut alpha = (4 * pi * 10) / 7^2 ≈ 2.5646 rad/s^2
  assert.ok(Math.abs(res.alphaExp - 2.5645654) < 1e-5);

  // Momen inersia eksperimen I_exp = tau / alpha ≈ 0.003248 kg·m^2
  assert.ok(Math.abs(res.inertiaExp - 0.0032481) < 1e-5);

  // Momen inersia teoritis I_teori = 0.5 * 0.02 * 0.05^2 = 0.000025 kg·m^2
  assert.ok(Math.abs(res.inertiaTheo - 0.000025) < 1e-9);
});

test('Kinematic state obeys theta = 0.5 * alpha * t^2 and omega = alpha * t', () => {
  const params = PRESETS.laprak.params;
  const res = calculateRotationalPhysics(params);

  const start = getKinematicStateAtTime(params, res, 0);
  assert.equal(start.theta, 0);
  assert.equal(start.omega, 0);
  assert.equal(start.turns, 0);
  assert.equal(start.progress, 0);

  const half = getKinematicStateAtTime(params, res, 3.5);
  // At t/2, quadratic displacement is 1/4 of total turns (2.5 turns)
  assert.ok(Math.abs(half.turns - 2.5) < 1e-6);
  assert.ok(Math.abs(half.omega - res.alphaExp * 3.5) < 1e-6);

  const end = getKinematicStateAtTime(params, res, 7.0);
  assert.ok(Math.abs(end.turns - 10) < 1e-6);
  assert.ok(Math.abs(end.theta - res.thetaTotal) < 1e-6);
  assert.equal(end.progress, 1);
});

test('Theoretical mode computes ideal acceleration and shorter completion time', () => {
  const params = { ...PRESETS.laprak.params, mode: 'theoretical' as const };
  const res = calculateRotationalPhysics(params);

  // alpha_theo = 0.00833 / 0.000025 = 333.2 rad/s^2
  assert.ok(Math.abs(res.alphaTheo - 333.2) < 1e-5);
  assert.equal(res.activeAlpha, res.alphaTheo);
  assert.ok(res.activeTime < 1.0);

  const end = getKinematicStateAtTime(params, res, res.activeTime);
  assert.ok(Math.abs(end.turns - 10) < 1e-6);
});

test('validateParams catches non-positive values without silent fallback', () => {
  const invalid = { ...PRESETS.laprak.params, m: 0, t: -2 };
  const errors = validateParams(invalid);
  assert.equal(errors.length, 2);
  assert.deepEqual(
    errors.map((e) => e.field),
    ['m', 't']
  );
});

test('formatNum uses Indonesian decimal comma notation', () => {
  assert.equal(formatNum(0.1666, 4), '0,1666');
  assert.equal(formatNum(0.00833, 5), '0,00833');
});
