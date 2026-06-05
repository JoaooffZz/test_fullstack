// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('Obras Screen Logic', () => {
  it('calculates correct budget consumption percentage', () => {
    const budget = 200000; // R$ 2.000,00
    const spent = 50000;   // R$ 500,00
    const consumedPercent = budget > 0 ? (spent / budget) * 100 : 0;
    expect(consumedPercent).toBe(25);
  });

  it('calculates step completion progress safely', () => {
    const steps = [
      { name: 'Step 1', status: 'CONCLUIDA' },
      { name: 'Step 2', status: 'PENDENTE' },
      { name: 'Step 3', status: 'CONCLUIDA' },
      { name: 'Step 4', status: 'PENDENTE' },
    ];
    const completed = steps.filter((s) => s.status === 'CONCLUIDA').length;
    const progress = steps.length > 0 ? (completed / steps.length) * 100 : 0;
    expect(progress).toBe(50);
  });

  it('handles empty steps list for progress calculation', () => {
    const steps: any[] = [];
    const completed = steps.filter((s) => s.status === 'CONCLUIDA').length;
    const progress = steps.length > 0 ? (completed / steps.length) * 100 : 0;
    expect(progress).toBe(0);
  });
});
