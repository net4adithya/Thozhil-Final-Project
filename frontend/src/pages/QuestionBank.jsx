import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, BookOpen, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

export const QuestionBank = () => {
  const { interviews, templates, addQuestionToBank, loading } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Aggregate questions from all active interviews and templates
  const interviewQuestions = (interviews || []).flatMap((i) =>
    (i.questions || []).map((q, idx) => ({
      id: q.id || `q-${i.id}-${idx}`,
      text: q.text,
      category: q.category || 'General',
      difficulty: q.difficulty || 'Medium',
      duration: q.duration || q.timeLimit || 180,
      interviewTitle: i.title || i.jobRole || 'Assessment Track'
    }))
  );

  const templateQuestions = (templates || []).flatMap((t) =>
    (t.questions || []).map((q, idx) => ({
      id: q.id || `tpl-${t.id}-${idx}`,
      text: q.text,
      category: q.category || t.department || 'Engineering',
      difficulty: q.difficulty || 'Medium',
      duration: q.duration || 180,
      interviewTitle: `${t.name || t.title} (Template)`
    }))
  );

  const questions = [...interviewQuestions, ...templateQuestions];

  const handleAddQuestion = async (data) => {
    try {
      setSubmitting(true);
      const targetInterview = interviews?.[0]?.id || null;
      await addQuestionToBank({
        text: data.text,
        category: data.category,
        difficulty: data.difficulty
      }, targetInterview);
      setModalOpen(false);
      reset();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const catMatch = categoryFilter === 'ALL' || q.category === categoryFilter;
    const diffMatch = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    const textMatch = q.text.toLowerCase().includes(search.toLowerCase());
    return catMatch && diffMatch && textMatch;
  });

  const categories = ['ALL', 'React', 'System Design', 'JavaScript', 'Web Performance', 'Security', 'Architecture', 'Communication'];

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Question Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">Standard technical evaluation questions categorized by skills and difficulty.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          Add Question
        </Button>
      </div>

      {/* Filters Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 select-none shadow-xs">
        {/* Categories horizontal pill bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                cat === categoryFilter
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Difficulty and search box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search question prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Difficulty:</span>
            <div className="flex space-x-1">
              {['ALL', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors border ${
                    diff === difficultyFilter
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table view */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          title="No questions found"
          description={search ? "No questions match your search filter." : "Your question library is empty. Add standard questions to use across assessments."}
          actionLabel="Add Question"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
              <tr>
                <th className="px-5 py-3">Question Prompt</th>
                <th className="px-5 py-3">Skill Category</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3">Origin Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.map((q, idx) => (
                <tr key={q.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 max-w-lg">
                    <span className="font-medium text-slate-900 leading-relaxed block">{q.text}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="secondary" size="xs">{q.category}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${
                      q.difficulty === 'Hard' ? 'text-red-600' : q.difficulty === 'Medium' ? 'text-blue-600' : 'text-emerald-600'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {q.interviewTitle || 'Standard Bank'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Question to Library"
        size="md"
      >
        <form onSubmit={handleSubmit(handleAddQuestion)} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Question Prompt</label>
            <textarea
              rows={3}
              {...register('text', { required: 'Question prompt is required' })}
              placeholder="e.g. Describe the trade-offs between optimistic UI updates and server-verified state..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {errors.text && <span className="text-[11px] text-red-600 font-medium">{errors.text.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Category</label>
              <select
                {...register('category')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="React">React</option>
                <option value="System Design">System Design</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Web Performance">Web Performance</option>
                <option value="Architecture">Architecture</option>
                <option value="Security">Security</option>
                <option value="Communication">Communication</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Difficulty</label>
              <select
                {...register('difficulty')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Save to Library
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBank;
