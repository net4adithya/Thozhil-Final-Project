/**
 * Access-code system tests — Plain JavaScript (CJS), no build step required.
 * Run with: node --test tests/assessments/assessments.test.js
 *
 * Covers:
 *   1. Code generation (6 chars, A-Z0-9, uniqueness)
 *   2. Code validation (format, case-insensitive, length, bad chars)
 *   3. Service: publish (generates code, idempotent, missing assignment)
 *   4. Service: findPublishedByCode (valid, draft, bad format, not found)
 *   5. Service: joinAssessment (new attempt, multiple interns, duplicate join, draft, bad code)
 */

'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Inline the utility logic so the test file is self-contained (no TS import)
// ─────────────────────────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

function generateAccessCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

function isValidAccessCode(code) {
  if (typeof code !== 'string') return false;
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory mock Prisma (no DB needed)
// ─────────────────────────────────────────────────────────────────────────────
function makeMockPrisma() {
  const assignments = {};   // id → assignment
  const submissions = [];   // flat array

  return {
    _seed(assignment) { assignments[assignment.id] = { ...assignment }; },

    assignment: {
      async findUnique({ where }) {
        if (where.accessCode !== undefined) {
          return Object.values(assignments).find(a => a.accessCode === where.accessCode) ?? null;
        }
        return assignments[where.id] ?? null;
      },
      async update({ where, data, select }) {
        const a = assignments[where.id];
        Object.assign(a, data);
        if (!select) return a;
        const r = {};
        for (const k of Object.keys(select)) r[k] = a[k];
        return r;
      },
      async findMany({ where }) {
        return Object.values(assignments).filter(a => a.status === where.status);
      },
    },

    submission: {
      async findFirst({ where }) {
        return submissions.find(s =>
          s.assignmentId === where.assignmentId &&
          s.internId === where.internId &&
          (where.status?.not ? s.status !== where.status.not : true)
        ) ?? null;
      },
      async create({ data, select }) {
        const sub = { id: `sub-${Date.now()}-${Math.random()}`, ...data };
        submissions.push(sub);
        if (!select) return sub;
        const r = {};
        for (const k of Object.keys(select)) r[k] = sub[k];
        return r;
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline service logic (mirrors assessments.service.ts exactly)
// ─────────────────────────────────────────────────────────────────────────────
class NotFoundException extends Error {
  constructor(msg) { super(msg); this.name = 'NotFoundException'; }
}
class BadRequestException extends Error {
  constructor(msg) { super(msg); this.name = 'BadRequestException'; }
}

class AssessmentsService {
  constructor(prisma) { this.prisma = prisma; }

  async _generateUniqueCode() {
    for (let i = 0; i < 10; i++) {
      const code = generateAccessCode();
      const existing = await this.prisma.assignment.findUnique({ where: { accessCode: code } });
      if (!existing) return code;
    }
    throw new Error('Failed to generate a unique access code after retries.');
  }

  async publishAssignment(id) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found.`);
    const accessCode = assignment.accessCode ?? (await this._generateUniqueCode());
    return this.prisma.assignment.update({
      where: { id },
      data: { status: 'PUBLISHED', accessCode },
      select: { id: true, title: true, status: true, accessCode: true },
    });
  }

  async findPublishedByCode(rawCode) {
    const code = (rawCode ?? '').toUpperCase().trim();
    if (!isValidAccessCode(code)) {
      throw new BadRequestException('Access code must be exactly 6 alphanumeric characters (A-Z, 0-9).');
    }
    const assignment = await this.prisma.assignment.findUnique({
      where: { accessCode: code },
      select: { id: true, title: true, description: true, difficulty: true, deadline: true, status: true, accessCode: true },
    });
    if (!assignment) throw new NotFoundException('No assessment found for this access code.');
    if (assignment.status !== 'PUBLISHED') throw new BadRequestException('This assessment is not currently available.');
    return assignment;
  }

  async joinAssessment(rawCode, internId, languageId) {
    const assignment = await this.findPublishedByCode(rawCode);
    const existing = await this.prisma.submission.findFirst({
      where: { assignmentId: assignment.id, internId, status: { not: 'REJECTED' } },
      select: { id: true },
    });
    if (existing) {
      return { submissionId: existing.id, assignmentId: assignment.id, title: assignment.title, description: assignment.description, difficulty: assignment.difficulty, isNewAttempt: false };
    }
    const sub = await this.prisma.submission.create({
      data: { assignmentId: assignment.id, internId, languageId, status: 'DRAFT' },
      select: { id: true },
    });
    return { submissionId: sub.id, assignmentId: assignment.id, title: assignment.title, description: assignment.description, difficulty: assignment.difficulty, isNewAttempt: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── TEST SUITES ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

describe('1. generateAccessCode()', () => {
  it('returns exactly 6 characters', () => {
    for (let i = 0; i < 100; i++) {
      const c = generateAccessCode();
      assert.strictEqual(c.length, 6, `Expected 6, got ${c.length} (${c})`);
    }
  });

  it('only contains uppercase A-Z and 0-9', () => {
    for (let i = 0; i < 200; i++) {
      assert.match(generateAccessCode(), /^[A-Z0-9]{6}$/);
    }
  });

  it('generates at least 490 unique codes out of 500 calls', () => {
    const codes = new Set();
    for (let i = 0; i < 500; i++) codes.add(generateAccessCode());
    assert.ok(codes.size >= 490, `Too many collisions: ${codes.size} unique`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('2. isValidAccessCode()', () => {
  it('accepts valid 6-char uppercase alphanumeric codes', () => {
    assert.ok(isValidAccessCode('A7K92P'));
    assert.ok(isValidAccessCode('4X9B2Q'));
    assert.ok(isValidAccessCode('M8T4ZA'));
    assert.ok(isValidAccessCode('000000'));
    assert.ok(isValidAccessCode('AAAAAA'));
  });

  it('normalises lowercase to uppercase before validating', () => {
    assert.ok(isValidAccessCode('a7k92p'));
    assert.ok(isValidAccessCode('m8t4za'));
  });

  it('rejects codes that are too short', () => {
    assert.ok(!isValidAccessCode('ABC'));
    assert.ok(!isValidAccessCode('12345'));
    assert.ok(!isValidAccessCode(''));
  });

  it('rejects codes that are too long', () => {
    assert.ok(!isValidAccessCode('ABCDEFG'));
    assert.ok(!isValidAccessCode('1234567'));
  });

  it('rejects codes with invalid characters', () => {
    assert.ok(!isValidAccessCode('AB!@#5'));
    assert.ok(!isValidAccessCode('AB CD5'));
    assert.ok(!isValidAccessCode('AB-CD5'));
  });

  it('rejects non-string input', () => {
    assert.ok(!isValidAccessCode(null));
    assert.ok(!isValidAccessCode(undefined));
    assert.ok(!isValidAccessCode(123456));
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('3. AssessmentsService.publishAssignment()', () => {
  it('assigns an access code when publishing a DRAFT assignment', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a1', title: 'T1', status: 'DRAFT', accessCode: null });
    const svc = new AssessmentsService(p);
    const r = await svc.publishAssignment('a1');
    assert.strictEqual(r.status, 'PUBLISHED');
    assert.match(r.accessCode, /^[A-Z0-9]{6}$/);
  });

  it('preserves existing access code when re-publishing', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a2', title: 'T2', status: 'PUBLISHED', accessCode: 'EXIST1' });
    const svc = new AssessmentsService(p);
    const r = await svc.publishAssignment('a2');
    assert.strictEqual(r.accessCode, 'EXIST1');
  });

  it('throws NotFoundException for non-existent assignment', async () => {
    const p = makeMockPrisma();
    const svc = new AssessmentsService(p);
    await assert.rejects(() => svc.publishAssignment('no-such-id'), { name: 'NotFoundException' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('4. AssessmentsService.findPublishedByCode()', () => {
  it('returns assessment details for a valid published code', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a3', title: 'T3', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'VAL1D1' });
    const svc = new AssessmentsService(p);
    const r = await svc.findPublishedByCode('VAL1D1');
    assert.strictEqual(r.accessCode, 'VAL1D1');
  });

  it('is case-insensitive (lowercase input)', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a4', title: 'T4', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'AB12CD' });
    const svc = new AssessmentsService(p);
    await assert.doesNotReject(() => svc.findPublishedByCode('ab12cd'));
    await assert.doesNotReject(() => svc.findPublishedByCode('Ab12Cd'));
  });

  it('throws BadRequestException for code that is too short', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).findPublishedByCode('ABC'), { name: 'BadRequestException' });
  });

  it('throws BadRequestException for code that is too long', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).findPublishedByCode('ABCDEFG'), { name: 'BadRequestException' });
  });

  it('throws BadRequestException for code with invalid characters', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).findPublishedByCode('AB!@#5'), { name: 'BadRequestException' });
  });

  it('throws NotFoundException for non-existent code', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).findPublishedByCode('ZZZZZZ'), { name: 'NotFoundException' });
  });

  it('throws BadRequestException for code belonging to a DRAFT assignment', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a5', title: 'T5', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'DRAFT', accessCode: 'DRAFT1' });
    await assert.rejects(() => new AssessmentsService(p).findPublishedByCode('DRAFT1'), { name: 'BadRequestException' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('5. AssessmentsService.joinAssessment()', () => {
  it('creates a new submission for an intern with a valid code', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a6', title: 'T6', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'JOIN01' });
    const svc = new AssessmentsService(p);
    const r = await svc.joinAssessment('JOIN01', 'intern-1', 'lang-py');
    assert.strictEqual(r.isNewAttempt, true);
    assert.ok(r.submissionId);
  });

  it('multiple different interns get independent submissions for the same code', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a7', title: 'T7', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'MULTI1' });
    const svc = new AssessmentsService(p);
    const r1 = await svc.joinAssessment('MULTI1', 'intern-A', 'lang-py');
    const r2 = await svc.joinAssessment('MULTI1', 'intern-B', 'lang-py');
    assert.strictEqual(r1.isNewAttempt, true);
    assert.strictEqual(r2.isNewAttempt, true);
    assert.notStrictEqual(r1.submissionId, r2.submissionId, 'Each intern needs their own submission');
  });

  it('joining twice returns the same submission (no duplicates)', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a8', title: 'T8', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'PUBLISHED', accessCode: 'IDEM01' });
    const svc = new AssessmentsService(p);
    const r1 = await svc.joinAssessment('IDEM01', 'intern-X', 'lang-py');
    const r2 = await svc.joinAssessment('IDEM01', 'intern-X', 'lang-py');
    assert.strictEqual(r1.submissionId, r2.submissionId);
    assert.strictEqual(r2.isNewAttempt, false);
  });

  it('throws BadRequestException when joining a DRAFT/unpublished assessment', async () => {
    const p = makeMockPrisma();
    p._seed({ id: 'a9', title: 'T9', description: 'D', difficulty: 'EASY', deadline: new Date(), status: 'DRAFT', accessCode: 'UNPUB1' });
    await assert.rejects(() => new AssessmentsService(p).joinAssessment('UNPUB1', 'intern-Y', 'lang-py'), { name: 'BadRequestException' });
  });

  it('throws BadRequestException for invalid code format on join', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).joinAssessment('TOO', 'intern-Z', 'lang-py'), { name: 'BadRequestException' });
  });

  it('throws NotFoundException for a non-existent code on join', async () => {
    const p = makeMockPrisma();
    await assert.rejects(() => new AssessmentsService(p).joinAssessment('ZZZZZZ', 'intern-Z', 'lang-py'), { name: 'NotFoundException' });
  });
});
