/**
 * Tests for the access-code system.
 *
 * These are plain Jest/Node tests that do NOT require a running database.
 * They test the utility functions and the service logic in isolation using mocks.
 *
 * Run with:  node --test  OR  npx jest tests/assessments/
 */

import * as assert from 'assert';
import { describe, it, beforeEach } from 'node:test';
import { generateAccessCode, isValidAccessCode } from '../../src/assessments/access-code.util';

// ────────────────────────────────────────────────────────────────────────────────
// 1. Access-code generation utility tests
// ────────────────────────────────────────────────────────────────────────────────

describe('generateAccessCode()', () => {
  it('returns exactly 6 characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateAccessCode();
      assert.strictEqual(code.length, 6, `Expected length 6, got ${code.length} (code=${code})`);
    }
  });

  it('only contains uppercase A-Z and 0-9', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateAccessCode();
      assert.match(code, /^[A-Z0-9]{6}$/, `Invalid characters in code: ${code}`);
    }
  });

  it('generates unique codes across many calls (collision check)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) {
      codes.add(generateAccessCode());
    }
    // With 36^6 ≈ 2.1 billion possibilities, 500 calls should be essentially all unique
    assert.ok(codes.size >= 490, `Too many collisions: only ${codes.size} unique codes from 500`);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// 2. Access-code validation utility tests
// ────────────────────────────────────────────────────────────────────────────────

describe('isValidAccessCode()', () => {
  it('accepts valid 6-char uppercase alphanumeric codes', () => {
    assert.strictEqual(isValidAccessCode('A7K92P'), true);
    assert.strictEqual(isValidAccessCode('4X9B2Q'), true);
    assert.strictEqual(isValidAccessCode('M8T4ZA'), true);
    assert.strictEqual(isValidAccessCode('000000'), true);
    assert.strictEqual(isValidAccessCode('AAAAAA'), true);
    assert.strictEqual(isValidAccessCode('ZZZZZZ'), true);
  });

  it('normalises lowercase input to uppercase before validating', () => {
    // The function uppercases first, so lowercase letters are valid
    assert.strictEqual(isValidAccessCode('a7k92p'), true);
    assert.strictEqual(isValidAccessCode('m8t4za'), true);
  });

  it('rejects codes that are too short', () => {
    assert.strictEqual(isValidAccessCode('ABC'), false);
    assert.strictEqual(isValidAccessCode('12345'), false);
    assert.strictEqual(isValidAccessCode(''), false);
  });

  it('rejects codes that are too long', () => {
    assert.strictEqual(isValidAccessCode('ABCDEFG'), false);
    assert.strictEqual(isValidAccessCode('1234567'), false);
  });

  it('rejects codes with invalid characters', () => {
    assert.strictEqual(isValidAccessCode('AB!@#5'), false);
    assert.strictEqual(isValidAccessCode('AB CD5'), false); // space
    assert.strictEqual(isValidAccessCode('AB-CD5'), false); // hyphen
    assert.strictEqual(isValidAccessCode('ΑΒΓΔΕΖ'), false); // Greek letters
  });

  it('rejects non-string input', () => {
    assert.strictEqual(isValidAccessCode(null as any), false);
    assert.strictEqual(isValidAccessCode(undefined as any), false);
    assert.strictEqual(isValidAccessCode(123456 as any), false);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// 3. Service-level logic tests (with in-memory mock Prisma)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Minimal mock for PrismaService – only the methods we use.
 */
function makeMockPrisma(overrides: Partial<any> = {}): any {
  const store: Record<string, any> = {};
  const submissions: any[] = [];

  return {
    assignment: {
      findUnique: async ({ where }: any) => {
        if (where.accessCode) return Object.values(store).find((a: any) => a.accessCode === where.accessCode) ?? null;
        return store[where.id] ?? null;
      },
      update: async ({ where, data, select }: any) => {
        const a = store[where.id];
        Object.assign(a, data);
        if (select) {
          const result: any = {};
          for (const k of Object.keys(select)) result[k] = a[k];
          return result;
        }
        return a;
      },
      findMany: async ({ where }: any) => {
        return Object.values(store).filter((a: any) => a.status === where.status);
      },
      _seed: (assignment: any) => { store[assignment.id] = { ...assignment }; },
    },
    submission: {
      findFirst: async ({ where }: any) => {
        return submissions.find(s =>
          s.assignmentId === where.assignmentId &&
          s.internId === where.internId &&
          (where.status?.not ? s.status !== where.status.not : true),
        ) ?? null;
      },
      create: async ({ data, select }: any) => {
        const sub = { id: `sub-${Date.now()}-${Math.random()}`, ...data };
        submissions.push(sub);
        if (select) {
          const result: any = {};
          for (const k of Object.keys(select)) result[k] = sub[k];
          return result;
        }
        return sub;
      },
    },
    ...overrides,
  };
}

// Lazy import to avoid loading @nestjs/common during non-NestJS tests
async function makeService(prismaMock: any) {
  const { AssessmentsService } = await import('../../src/assessments/assessments.service');
  return new AssessmentsService(prismaMock);
}

describe('AssessmentsService – publishAssignment()', () => {
  it('assigns an access code when publishing a DRAFT assignment', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-1', title: 'Test', status: 'DRAFT', accessCode: null });
    const svc = await makeService(prisma);
    const result = await svc.publishAssignment('asgn-1');
    assert.strictEqual(result.status, 'PUBLISHED');
    assert.match(result.accessCode, /^[A-Z0-9]{6}$/);
  });

  it('preserves existing access code when re-publishing', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-2', title: 'Test', status: 'PUBLISHED', accessCode: 'EXIST1' });
    const svc = await makeService(prisma);
    const result = await svc.publishAssignment('asgn-2');
    assert.strictEqual(result.accessCode, 'EXIST1', 'Should preserve existing code');
  });

  it('throws NotFoundException for non-existent assignment', async () => {
    const prisma = makeMockPrisma();
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.publishAssignment('no-such-id'), { name: 'NotFoundException' });
  });
});

describe('AssessmentsService – findPublishedByCode()', () => {
  it('returns assessment details for a valid code', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-3', title: 'A', description: 'B', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'VAL1D1' });
    const svc = await makeService(prisma);
    const result = await svc.findPublishedByCode('val1d1'); // lowercase input
    assert.strictEqual(result.accessCode, 'VAL1D1');
  });

  it('is case-insensitive for code lookup', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-4', title: 'A', description: 'B', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'AB12CD' });
    const svc = await makeService(prisma);
    await assert.doesNotReject(() => svc.findPublishedByCode('ab12cd'));
    await assert.doesNotReject(() => svc.findPublishedByCode('AB12CD'));
    await assert.doesNotReject(() => svc.findPublishedByCode('Ab12Cd'));
  });

  it('throws BadRequestException for invalid-format code', async () => {
    const prisma = makeMockPrisma();
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.findPublishedByCode('ABC'), { name: 'BadRequestException' });
    await assert.rejects(() => svc.findPublishedByCode('ABCDEFG'), { name: 'BadRequestException' });
    await assert.rejects(() => svc.findPublishedByCode('AB!@#5'), { name: 'BadRequestException' });
  });

  it('throws NotFoundException for non-existent code', async () => {
    const prisma = makeMockPrisma();
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.findPublishedByCode('ZZZZZZ'), { name: 'NotFoundException' });
  });

  it('throws BadRequestException for valid code on DRAFT assignment', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-5', title: 'A', description: 'B', difficulty: 'EASY', deadline: new Date(), status: 'DRAFT', accessCode: 'DRAFT1' });
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.findPublishedByCode('DRAFT1'), { name: 'BadRequestException' });
  });
});

describe('AssessmentsService – joinAssessment()', () => {
  it('creates a new submission for intern joining with valid code', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-6', title: 'T', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'JOIN01' });
    const svc = await makeService(prisma);
    const result = await svc.joinAssessment('JOIN01', 'intern-1', 'lang-py');
    assert.strictEqual(result.isNewAttempt, true);
    assert.ok(result.submissionId);
  });

  it('multiple different interns can join the same assessment', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-7', title: 'T', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'MULTI1' });
    const svc = await makeService(prisma);
    const r1 = await svc.joinAssessment('MULTI1', 'intern-A', 'lang-py');
    const r2 = await svc.joinAssessment('MULTI1', 'intern-B', 'lang-py');
    assert.strictEqual(r1.isNewAttempt, true);
    assert.strictEqual(r2.isNewAttempt, true);
    assert.notStrictEqual(r1.submissionId, r2.submissionId, 'Each intern should have independent submission');
  });

  it('joining twice does not create duplicate submission (idempotent)', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-8', title: 'T', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'IDEM01' });
    const svc = await makeService(prisma);
    const r1 = await svc.joinAssessment('IDEM01', 'intern-X', 'lang-py');
    const r2 = await svc.joinAssessment('IDEM01', 'intern-X', 'lang-py');
    assert.strictEqual(r1.submissionId, r2.submissionId, 'Should return same submission');
    assert.strictEqual(r2.isNewAttempt, false);
  });

  it('throws for joining an unpublished assessment', async () => {
    const prisma = makeMockPrisma();
    prisma.assignment._seed({ id: 'asgn-9', title: 'T', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'DRAFT', accessCode: 'UNPUB1' });
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.joinAssessment('UNPUB1', 'intern-Y', 'lang-py'), { name: 'BadRequestException' });
  });

  it('throws for joining with an invalid code format', async () => {
    const prisma = makeMockPrisma();
    const svc = await makeService(prisma);
    await assert.rejects(() => svc.joinAssessment('TOOSHORT', 'intern-Z', 'lang-py'), { name: 'BadRequestException' });
  });
});
