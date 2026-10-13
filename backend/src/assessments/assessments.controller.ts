import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus, Headers, ForbiddenException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  /** GET /api/assessments — list all assessments (Authority view) */
  @Get()
  async getAssessments() {
    return this.assessmentsService.getAssessments();
  }

  /** POST /api/assessments — create a new assessment */
  @Post()
  async createAssessment(@Body() data: any, @Headers('x-user-id') userId: string) {
    return this.assessmentsService.createAssessment(data, userId);
  }

  /** POST /api/assessments/:id/generate — trigger question generation */
  @Post(':id/generate')
  @HttpCode(HttpStatus.OK)
  async generateAssessment(@Param('id') id: string) {
    return { status: 'GENERATED' };
  }

  /** POST /api/assessments/:id/publish — publish and get access code */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id') id: string,
    @Headers('x-user-role') role: string,
  ) {
    const userRole = (role ?? '').toUpperCase();
    if (userRole === 'INTERN') {
      throw new ForbiddenException('Only Authorities can publish assessments.');
    }
    return this.assessmentsService.publishAssignment(id);
  }

  /** POST /api/assessments/:id/terminate — terminate an intern session */
  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  async terminateAssessment(@Param('id') assessmentId: string, @Headers('x-user-id') userId: string) {
    return this.assessmentsService.terminateAssessment(assessmentId, userId);
  }

  /** POST /api/assessments/:id/submit — intern submits their assessment */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitAssessment(@Param('id') assessmentId: string, @Headers('x-user-id') userId: string) {
    return this.assessmentsService.submitAssessment(assessmentId, userId);
  }

  /** POST /api/assessments/join — intern joins via access code */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(@Body() dto: any) {
    return this.assessmentsService.joinAssessment(
      dto.code,
      dto.userId,
      dto.language,
      dto.userEmail,
    );
  }

  /** GET /api/assessments/published — lists all published assessments */
  @Get('published')
  async listPublished(@Headers('x-user-role') role: string) {
    const userRole = (role ?? '').toUpperCase();
    if (userRole === 'INTERN') {
      throw new ForbiddenException('Only Authorities can list all published assessments.');
    }
    return this.assessmentsService.listPublished();
  }

  /** GET /api/assessments/question-banks — list all question banks */
  @Get('question-banks')
  async getQuestionBanks() {
    return this.assessmentsService.getQuestionBanks();
  }

  /** GET /api/assessments/question-banks/:id/questions — questions in a bank */
  @Get('question-banks/:id/questions')
  async getQuestionBankQuestions(@Param('id') id: string) {
    return this.assessmentsService.getQuestionBankQuestions(id);
  }

  /** GET /api/assessments/lookup/:code — preview assignment by access code */
  @Get('lookup/:code')
  async lookupByCode(@Param('code') code: string) {
    return this.assessmentsService.findPublishedByCode(code);
  }

  /** GET /api/assessments/:id/questions — questions for a specific assignment */
  @Get(':id/questions')
  async getAssessmentQuestions(@Param('id') id: string) {
    return this.assessmentsService.getQuestionsForAssignment(id);
  }
}
