import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FolderLock, Plus, Search, BookOpen, User, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { mockApi } from '../services/mockApi';

export const QuestionBank = () => {
  const { addQuestionToBank, loading } = useApp();
  const [questions, setQuestions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchLocalQuestions = async () => {
    try {
      setLocalLoading(true);
      const list = await mockApi.getQuestions();
      setQuestions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalQuestions();
  }, [loading]);

  const handleAddQuestion = async (data) => {
    try {
      setSubmitting(true);
      await addQuestionToBank({
        text: data.text,
        category: data.category,
        difficulty: data.difficulty
      });
      setModalOpen(false);
      reset();
      await fetchLocalQuestions();
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

  const categories = ['ALL', 'React', 'System Design', 'JavaScript', 'Web Performance', 'Security', 'Product Strategy', 'Communication'];

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Question Bank</h1>
          <p className="text-sm text-brandBody">Maintain standard technical evaluation questions categorized by skills.</p>
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
      <div className="bg-white border border-brandBorder rounded-xl p-5 space-y-4 select-none">
        {/* Categories scroll wrapper */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                cat === categoryFilter
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-brandBorder text-brandBody hover:text-brandHeading hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty and search box */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:max-w-xs relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brandBody">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search prompt contents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white text-brandHeading border border-brandBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 py-2.5 pl-9 pr-3.5"
            />
          </div>

          <div className="flex items-center space-x-3.5 w-full sm:w-auto">
            <span className="text-xs text-brandBody shrink-0">Difficulty:</span>
            <div className="flex space-x-1.5">
              {['ALL', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors border ${
                    diff === difficultyFilter
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-gray-50 text-brandBody border-brandBorder hover:bg-gray-150'
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
      <div className="flex-grow flex flex-col">
        <Table
          headers={['Question Prompt', 'Skill Vector', 'Difficulty Rating']}
          data={filteredQuestions}
          loading={localLoading}
          emptyMessage="No questions matched the filters configured."
          renderRow={(q) => (
            <tr key={q.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-4 text-left font-medium text-brandHeading max-w-lg truncate md:max-w-xl">
                {q.text}
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap">
                <Badge variant="primary">{q.category}</Badge>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap">
                <Badge variant={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>
                  {q.difficulty}
                </Badge>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Add question modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Question to Bank"
      >
        <form onSubmit={handleSubmit(handleAddQuestion)} className="space-y-4 text-left">
          <Input
            label="Question Prompt"
            placeholder="Explain the event delegation model in JS..."
            required
            error={errors.text}
            {...register('text', { required: 'Question prompt text is required.' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Skill Category"
              options={[
                { value: 'React', label: 'React' },
                { value: 'System Design', label: 'System Design' },
                { value: 'JavaScript', label: 'JavaScript' },
                { value: 'Web Performance', label: 'Web Performance' },
                { value: 'Security', label: 'Security' },
                { value: 'Product Strategy', label: 'Product Strategy' },
                { value: 'Communication', label: 'Communication' }
              ]}
              {...register('category')}
            />
            <Select
              label="Difficulty Rating"
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' }
              ]}
              {...register('difficulty')}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-brandBorder">
            <Button onClick={() => setModalOpen(false)} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Save Question
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
