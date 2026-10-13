import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateAccessCode, isValidAccessCode } from './access-code.util';

/** Statuses that permanently block re-entry to an assessment */
const BLOCKED_STATUSES = ['SUBMITTED', 'COMPLETED', 'BANNED', 'TERMINATED', 'BLOCKED'];

const MAX_CODE_GENERATION_ATTEMPTS = 10;

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique access code with collision retry.
   * Never returns a code already in use.
   */
    async getAssessments() {
    const rows = await this.prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, status: true, deadline: true,
        createdAt: true, accessCode: true, description: true,
        difficulty: true,
      }
    });
    return rows.map(r => ({
      ...r,
      // Mirror field names frontend expects
      created_at: r.createdAt,
    }));
  }

  async createAssessment(data: any, userId: string) {
    // Get a valid language ID (fall back to first available)
    const lang = await this.prisma.programmingLanguage.findFirst();
    if (!lang) throw new Error('No programming languages found in DB. Please seed languages first.');
    const languageId = lang.id;

    // Get a valid createdById — try the provided userId, fall back to first user
    let createdById: string | null = null;
    if (userId) {
      const user = await this.prisma.user.findFirst({ where: { id: userId } });
      if (user) createdById = user.id;
    }
    if (!createdById) {
      const fallback = await this.prisma.user.findFirst();
      if (fallback) createdById = fallback.id;
    }
    if (!createdById) throw new Error('No users found in DB. Please seed a user first.');

    const intern = await this.prisma.intern.findFirst();
    
    // Convert duration_minutes to deadline
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + (data.duration_minutes || 60));

    // Store metadata (questionBankId etc.) in description as JSON
    const meta = {
      questionBankId: data.question_bank_id || null,
      questionIds: data.question_ids || null,
      totalQuestions: data.total_questions || 5,
      durationMinutes: data.duration_minutes || 60,
      aiSelectionEnabled: data.ai_selection_enabled || false,
    };

    const created = await this.prisma.assignment.create({
      data: {
        title: data.title || 'Untitled Assessment',
        description: JSON.stringify(meta),
        difficulty: data.difficulty || 'BEGINNER',
        language: { connect: { id: languageId } },
        deadline: deadline,
        status: 'GENERATED',
        createdBy: { connect: { id: createdById } },
        ...(intern ? { intern: { connect: { id: intern.id } } } : {}),
      }
    });
    return {
      ...created,
      id: created.id,
      created_at: created.createdAt,
      duration_minutes: meta.durationMinutes,
      total_questions: meta.totalQuestions,
      ai_selection_enabled: meta.aiSelectionEnabled,
      question_bank_id: meta.questionBankId,
    };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = generateAccessCode();
      const existing = await this.prisma.assignment.findUnique({
        where: { accessCode: code },
      });
      if (!existing) return code;
    }
    throw new Error('Failed to generate a unique access code after retries.');
  }

  /**
   * Publish an assignment. Generates an access code if one does not
   * already exist for this assignment. Idempotent: does NOT regenerate
   * if already published with a valid code.
   */
  async publishAssignment(assignmentId: string): Promise<{
    id: string;
    title: string;
    status: string;
    accessCode: string;
  }> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found.`);
    }

    // Preserve existing code when re-publishing
    const accessCode = assignment.accessCode ?? (await this.generateUniqueCode());

    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'PUBLISHED', accessCode },
      select: { id: true, title: true, status: true, accessCode: true },
    });

    return updated as { id: string; title: string; status: string; accessCode: string };
  }

  /**
   * Validate an access code and return the published assignment.
   * Throws clear errors for: invalid format, not found, not published.
   */
  async findPublishedByCode(rawCode: string): Promise<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    deadline: Date;
    accessCode: string;
  }> {
    const code = rawCode?.toUpperCase().trim();
    if (!isValidAccessCode(code)) {
      throw new BadRequestException(
        'Access code must be exactly 6 alphanumeric characters (A-Z, 0-9).',
      );
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: { accessCode: code },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        deadline: true,
        status: true,
        accessCode: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('No assessment found for this access code.');
    }
    if (assignment.status !== 'PUBLISHED') {
      throw new BadRequestException('This assessment is not currently available.');
    }

    return assignment as any;
  }

  /**
   * Resolve a userId (User.id) to an Intern.id.
   * For local/offline auth users, auto-provisions a minimal User + Intern row.
   */
  private async resolveInternId(userId: string, userEmail?: string): Promise<string> {
    // 1. Try direct Intern lookup by userId
    const intern = await this.prisma.intern.findUnique({ where: { userId } });
    if (intern) return intern.id;

    // 2. Check if the User row exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      // User exists but no Intern row yet — create one
      const newIntern = await this.prisma.intern.create({ data: { userId } });
      return newIntern.id;
    }

    // 3. Local/offline auth: provisionally create User + Intern
    const email = userEmail ?? `${userId}@local.test`;
    const internRole = await this.prisma.role.upsert({
      where: { name: 'INTERN' },
      update: {},
      create: { name: 'INTERN', description: 'Intern', permissions: '[]' },
    });
    const newUser = await this.prisma.user.create({
      data: {
        id: userId,
        email,
        firstName: 'Intern',
        lastName: 'User',
        passwordHash: '$2a$10$placeholder_hash_for_local_auth',
        roleId: internRole.id,
      },
    });
    const newIntern = await this.prisma.intern.create({ data: { userId: newUser.id } });
    return newIntern.id;
  }

  /**
   * Resolve a language slug (e.g. "python") or UUID to a ProgrammingLanguage.id.
   * Falls back to creating the language if not found.
   */
  private async resolveLanguageId(langSlugOrId: string): Promise<string> {
    // Try by id first (UUID)
    const byId = await this.prisma.programmingLanguage.findUnique({ where: { id: langSlugOrId } });
    if (byId) return byId.id;

    // Try by slug
    const bySlug = await this.prisma.programmingLanguage.findUnique({ where: { slug: langSlugOrId } });
    if (bySlug) return bySlug.id;

    // Auto-create with sensible defaults
    const slug = langSlugOrId.toLowerCase().trim();
    const name = slug.charAt(0).toUpperCase() + slug.slice(1);
    const created = await this.prisma.programmingLanguage.create({ data: { name, slug } });
    return created.id;
  }

  /**
   * Intern joins an assessment using an access code.
   * Accepts userId (User.id) and language slug from frontend.
   * Resolves both to their proper FK IDs internally.
   * Returns blocked:true if the intern's attempt is in a terminal state.
   */
  async joinAssessment(
    rawCode: string,
    userId: string,
    langSlugOrId: string,
    userEmail?: string,
  ): Promise<{
    submissionId: string;
    assignmentId: string;
    title: string;
    description: string;
    difficulty: string;
    isNewAttempt: boolean;
    blocked?: boolean;
    blockReason?: string;
    status?: string;
  }> {
    const assignment = await this.findPublishedByCode(rawCode);

    const [internId, languageId] = await Promise.all([
      this.resolveInternId(userId, userEmail),
      this.resolveLanguageId(langSlugOrId),
    ]);

    // Check for any existing submission (including blocked ones)
    const existing = await this.prisma.submission.findFirst({
      where: { assignmentId: assignment.id, internId },
      select: { id: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const status = existing.status?.toUpperCase();
      // Block if terminal status
      if (BLOCKED_STATUSES.includes(status)) {
        return {
          submissionId: existing.id,
          assignmentId: assignment.id,
          title: assignment.title,
          description: assignment.description,
          difficulty: assignment.difficulty,
          isNewAttempt: false,
          blocked: true,
          blockReason: status,
          status,
        };
      }
      // Resume active submission
      return {
        submissionId: existing.id,
        assignmentId: assignment.id,
        title: assignment.title,
        description: assignment.description,
        difficulty: assignment.difficulty,
        isNewAttempt: false,
        status,
      };
    }

    // Create a new submission
    const submission = await this.prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        internId,
        languageId,
        status: 'DRAFT',
      },
      select: { id: true },
    });

    return {
      submissionId: submission.id,
      assignmentId: assignment.id,
      title: assignment.title,
      description: assignment.description,
      difficulty: assignment.difficulty,
      isNewAttempt: true,
      status: 'DRAFT',
    };
  }

  /**
   * List all published assessments (for admin/authority use).
   */
  async listPublished() {
    return this.prisma.assignment.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        deadline: true,
        accessCode: true,
        status: true,
      },
    });
  }

  /**
   * List all predefined question banks.
   */
  async getQuestionBanks() {
    const banks = await this.prisma.questionBank.findMany({
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    return banks.map(bank => ({
      id: bank.id,
      filename: bank.name, // The UI expects `filename`
      status: 'COMPLETED',
      question_count: bank._count.questions,
      created_at: bank.createdAt.toISOString(),
      updated_at: bank.updatedAt.toISOString(),
    }));
  }

  /**
   * Get questions for a specific question bank.
   */
  async getQuestionBankQuestions(id: string) {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: {
          include: { testCases: true }
        }
      }
    });

    if (!bank) {
      throw new NotFoundException(`Question Bank ${id} not found.`);
    }

    return bank.questions.map(q => ({
      id: q.id,
      question_bank_id: q.questionBankId,
      title: q.title,
      problem_statement: q.statement,
      difficulty: q.difficulty,
      examples: q.testCases
        .filter((tc: any) => !tc.isHidden)
        .slice(0, 2)
        .map((tc: any) => ({ input: tc.stdin, output: tc.expectedOutput })),
      constraints: null,
    }));
  }

  /**
   * Get questions for a specific assignment.
   * Reads the questionBankId from the assignment's description JSON (stored at create time).
   * Supports title/code inference for legacy records, and filters by questionIds if specified.
   */
  async getQuestionsForAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, title: true, description: true, accessCode: true },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found.`);
    }

    // Try to parse questionBankId and questionIds from stored JSON metadata
    let bankId: string | null = null;
    let questionIds: string[] | null = null;
    try {
      const meta = JSON.parse(assignment.description || '{}');
      bankId = meta.questionBankId || null;
      questionIds = meta.questionIds || null;
    } catch {
      // description is not JSON (legacy record)
    }

    // If no bankId stored in JSON, try to infer from title or access code
    if (!bankId) {
      const titleLower = (assignment.title || '').toLowerCase();
      const codeUpper = (assignment.accessCode || '').toUpperCase();

      if (titleLower.includes('2') || titleLower.includes('sort') || codeUpper === 'TEST01') {
        const b = await this.prisma.questionBank.findFirst({
          where: { name: { contains: 'Sorting' } },
        });
        if (b) bankId = b.id;
      } else if (titleLower.includes('3') || titleLower.includes('tree')) {
        const b = await this.prisma.questionBank.findFirst({
          where: { name: { contains: 'Trees' } },
        });
        if (b) bankId = b.id;
      } else if (titleLower.includes('odd') || titleLower.includes('math')) {
        const b = await this.prisma.questionBank.findFirst({
          where: { name: { contains: 'Odd' } },
        });
        if (b) bankId = b.id;
      }
    }

    // Fall back to first available bank if still null
    if (!bankId) {
      const firstBank = await this.prisma.questionBank.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!firstBank) return [];
      bankId = firstBank.id;
    }

    const allQuestions = await this.getQuestionBankQuestions(bankId);

    // If specific questions were selected, filter to only those
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      const idSet = new Set(questionIds.map(String));
      const filtered = allQuestions.filter(q => idSet.has(String(q.id)));
      if (filtered.length > 0) return filtered;
    }

    return allQuestions;
  }

  async submitAssessment(assessmentId: string, userId: string) {
    if (!assessmentId) throw new BadRequestException('Assessment ID is required');
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assessmentId } });
    if (!assignment) throw new NotFoundException('Assessment not found');
    const intern = await this.prisma.intern.findUnique({ where: { userId } });
    if (!intern) throw new NotFoundException('Intern not found');
    const submission = await this.prisma.submission.findFirst({
      where: { assignmentId: assignment.id, internId: intern.id },
      orderBy: { createdAt: 'desc' }
    });
    if (submission) {
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'SUBMITTED' }
      });
      return { success: true, message: 'Assessment submitted' };
    }
    return { success: false, message: 'No active submission found' };
  }

  async terminateAssessment(assessmentId: string, userId: string) {
    if (!assessmentId) throw new BadRequestException('Assessment ID is required');
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assessmentId }
    });
    if (!assignment) throw new NotFoundException('Assessment not found');
    
    // Find the latest active submission for this user on this assignment
    const intern = await this.prisma.intern.findUnique({ where: { userId } });
    if (!intern) throw new NotFoundException('Intern not found');
    
    const submission = await this.prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        internId: intern.id
      },
      orderBy: { createdAt: 'desc' }
    });

    if (submission) {
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { status: 'TERMINATED' }
      });
      return { success: true, message: 'Assessment terminated' };
    }
    
    return { success: false, message: 'No active submission found' };
  }
}

