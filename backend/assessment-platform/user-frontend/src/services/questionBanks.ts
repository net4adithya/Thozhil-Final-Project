import api from './api';

export interface QuestionBank {
  id: string;
  owner_id?: string;
  filename: string;
  status: string;
  question_count: number;
  created_at: string;
  updated_at?: string;
  questions?: any[];
}

export interface Question {
  id: string;
  question_bank_id?: string;
  title: string;
  problem_statement: string;
  topic: string;
  difficulty: string;
  expected_time_minutes?: number;
  programming_languages: string[];
  constraints?: string;
  examples?: any[];
  testCases?: any[];
}

export const questionBanksService = {
  getQuestionBanks: async (): Promise<QuestionBank[]> => {
    const response = await api.get('/question-banks');
    return response.data.map((b: any) => ({
      id: b._id || b.id,
      filename: b.name || b.filename || 'Question Bank',
      status: b.status || 'COMPLETED',
      question_count: Array.isArray(b.questions) ? b.questions.length : 0,
      created_at: b.createdAt || new Date().toISOString(),
      questions: b.questions || [],
    }));
  },

  getQuestionBank: async (id: string | number): Promise<QuestionBank> => {
    const response = await api.get('/question-banks');
    const banks = response.data;
    const found = banks.find((b: any) => String(b._id || b.id) === String(id));
    if (found) {
      return {
        id: found._id || found.id,
        filename: found.name || found.filename || 'Question Bank',
        status: found.status || 'COMPLETED',
        question_count: Array.isArray(found.questions) ? found.questions.length : 0,
        created_at: found.createdAt || new Date().toISOString(),
        questions: found.questions || [],
      };
    }
    throw new Error('Question bank not found');
  },

  getQuestions: async (id: string | number): Promise<Question[]> => {
    const bank = await questionBanksService.getQuestionBank(id);
    const rawQs = bank.questions || [];
    return rawQs.map((q: any) => ({
      id: q._id || q.id,
      title: q.title || 'Untitled Question',
      problem_statement: q.statement || q.problem_statement || '',
      topic: q.group || q.topic || 'Data Structures',
      difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
      expected_time_minutes: 15,
      programming_languages: q.allowedLanguages?.length ? q.allowedLanguages : ['python', 'javascript', 'java', 'cpp'],
      constraints: q.constraints || '',
      examples: q.examples || [],
      testCases: (q.testCases || []).filter((tc: any) => !tc.isHidden),
    }));
  },

  uploadQuestionBank: async (file: File): Promise<QuestionBank> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/question-banks/upload', formData);
    const b = response.data;
    return {
      id: b._id || b.id,
      filename: b.name || file.name,
      status: 'COMPLETED',
      question_count: Array.isArray(b.questions) ? b.questions.length : 0,
      created_at: new Date().toISOString(),
    };
  },
};
