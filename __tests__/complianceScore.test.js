import {
  calculateComplianceScore,
  getScoreDescription,
} from '../src/utils/complianceScore';
import {
  fiveItemChecklistAllComplete,
  fiveItemChecklistHalfComplete,
} from './fixtures/complianceScoreFixtures';

describe('calculateComplianceScore', () => {
  const frozenNow = new Date('2026-03-10T15:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers({ now: frozenNow, doNotFake: ['nextTick', 'setImmediate'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns zeros when all inputs empty', () => {
    const r = calculateComplianceScore({});
    expect(r.score).toBe(0);
    expect(r.checklistCompletion).toBe(0);
    expect(r.overduePenalty).toBe(0);
    expect(r.expiryPenalty).toBe(0);
    expect(r.mediaBonus).toBe(0);
    expect(r.factors.totalChecklistItems).toBe(0);
  });

  it('scores 100 when checklist complete and no penalties', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.score).toBe(100);
    expect(r.checklistCompletion).toBe(100);
  });

  it('applies overdue base penalty and keeps score in 0–100', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [{ id: 'o1', priority: 'normal' }],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.overdueBasePenalty).toBe(8);
    expect(r.criticalOverduePenalty).toBe(0);
    expect(r.overduePenalty).toBe(8);
    expect(r.score).toBe(92);
  });

  it('adds critical overdue penalty on top of base', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [
        { id: 'o1', priority: 'critical' },
        { id: 'o2', priority: 'critical' },
      ],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.factors.criticalOverdueCount).toBe(2);
    expect(r.criticalOverduePenalty).toBe(12);
    expect(r.overduePenalty).toBe(28);
  });

  it('caps checklist completion from partial completion', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistHalfComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.checklistCompletion).toBe(40);
    expect(r.score).toBe(40);
  });

  it('applies expiring and expired document penalties with cap 30', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
      expiredDocuments: [{ id: 'x1' }],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.expiryPenalty).toBe(19);
    expect(r.score).toBe(81);
  });

  it('applies open severe incident penalty', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [{ id: 'i1', severity: 'severe', status: 'open' }],
      maintenanceTasks: [],
    });
    expect(r.openHighSeverityIncidentPenalty).toBe(4);
    expect(r.factors.openHighSeverityIncidentCount).toBe(1);
    expect(r.score).toBe(96);
  });

  it('does not penalize resolved severe incidents', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [{ id: 'i1', severity: 'severe', status: 'resolved' }],
      maintenanceTasks: [],
    });
    expect(r.openHighSeverityIncidentPenalty).toBe(0);
    expect(r.score).toBe(100);
  });

  it('applies overdue maintenance penalty', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [],
      incidents: [],
      maintenanceTasks: [
        { id: 'm1', dueDate: '2026-03-01T00:00:00.000Z', status: 'open' },
      ],
    });
    expect(r.overdueMaintenancePenalty).toBe(3);
    expect(r.factors.overdueMaintenanceCount).toBe(1);
    expect(r.score).toBe(97);
  });

  it('adds media bonus for recent logs', () => {
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistAllComplete,
      overdueItems: [],
      expiringDocuments: [],
      expiredDocuments: [],
      mediaLogs: [
        { id: 'l1', createdAt: '2026-03-09T12:00:00.000Z' },
        { id: 'l2', logDate: '2026-03-08T12:00:00.000Z' },
        { id: 'l3', createdAt: '2026-03-07T12:00:00.000Z' },
      ],
      incidents: [],
      maintenanceTasks: [],
    });
    expect(r.mediaBonus).toBe(10);
    expect(r.factors.recentMediaLogsCount).toBe(3);
    expect(r.score).toBe(100);
  });

  it('clamps final score to 0 under heavy penalties', () => {
    const manyOverdue = Array.from({ length: 10 }, (_, i) => ({
      id: `o${i}`,
      priority: 'critical',
    }));
    const r = calculateComplianceScore({
      checklistItems: fiveItemChecklistHalfComplete,
      overdueItems: manyOverdue,
      expiringDocuments: Array.from({ length: 20 }, (_, i) => ({ id: `e${i}` })),
      expiredDocuments: Array.from({ length: 10 }, (_, i) => ({ id: `x${i}` })),
      mediaLogs: [],
      incidents: Array.from({ length: 10 }, (_, i) => ({
        id: `i${i}`,
        severity: 'severe',
        status: 'open',
      })),
      maintenanceTasks: Array.from({ length: 10 }, (_, i) => ({
        id: `m${i}`,
        dueDate: '2026-01-01T00:00:00.000Z',
        status: 'open',
      })),
    });
    expect(r.score).toBe(0);
  });
});

describe('getScoreDescription', () => {
  it('maps score bands to labels', () => {
    expect(getScoreDescription(90).label).toBe('Excellent');
    expect(getScoreDescription(70).label).toBe('Good');
    expect(getScoreDescription(50).label).toBe('Fair');
    expect(getScoreDescription(10).label).toBe('Low');
  });
});
