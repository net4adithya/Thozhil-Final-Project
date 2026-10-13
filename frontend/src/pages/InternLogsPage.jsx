import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Send,
  UploadCloud,
  Layers,
  Award,
  History,
  Info,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';

export const InternLogsPage = () => {
  const { showToast } = useApp();
  const [workDescription, setWorkDescription] = useState(
    '### Sprint Objective\nImplement idempotent payment webhook handler and client-side retry logic in Express.'
  );
  const [codeSnippet, setCodeSnippet] = useState(
`// Sample Submission: paymentWebhook.js
const express = require('express');
const router = express.Router();

router.post('/webhook', async (req, res) => {
  const event = req.body;
  if (!event || !event.id) {
    return res.status(400).send('Invalid event structure');
  }

  // Idempotency verification
  const isProcessed = await checkEventProcessed(event.id);
  if (isProcessed) {
    return res.status(200).json({ received: true, note: 'Duplicate skipped' });
  }

  await recordEvent(event);
  return res.status(200).json({ received: true });
});

module.exports = router;`
  );
  const [fileName, setFileName] = useState('paymentWebhook.js');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  const handleRunReview = async () => {
    if (!workDescription.trim()) {
      showToast('Please specify the work description or task deliverables', 'warning');
      return;
    }
    if (!codeSnippet.trim()) {
      showToast('Please supply code files or snippets to review', 'warning');
      return;
    }

    try {
      setIsReviewing(true);
      const payload = {
        work_description: workDescription,
        program_files: [
          {
            name: fileName || 'submission.js',
            content: codeSnippet
          }
        ]
      };

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Review generation failed');
      }

      const data = await res.json();
      setReviewResult(data);
      showToast('AI Code Review generated successfully!', 'success');
    } catch (err) {
      console.error('Review failed:', err);
      showToast(err.message || 'Error communicating with LogLense review engine', 'danger');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast('Playing voice summary...', 'primary');
    } else {
      showToast('Browser Speech API not supported on this browser', 'warning');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Thozhil Product Module 1</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          LogLense: AI Internship Log Management & Code Review
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          First-level automated audit of work submissions, line-level code reviews, and structured manager progress reporting.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6 flex-1">
        {/* Left: Input Specification and Code Editor */}
        <div className="space-y-5 flex flex-col">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Deliverable Specification / Work Description
            </label>
            <textarea
              rows={4}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 bg-slate-50/50"
              placeholder="Outline tasks, criteria, and requirements..."
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Code Submission File
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded font-mono w-44"
                placeholder="filename.js"
              />
            </div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="w-full flex-1 min-h-[280px] p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 bg-slate-900 text-slate-100 leading-relaxed resize-none"
              placeholder="Paste code or implementation here..."
            />

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Processed via FastAPI Multi-Provider LLM Engine
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunReview}
                disabled={isReviewing}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isReviewing ? 'Analyzing Code...' : 'Trigger AI Review'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: AI Review Output and Scorecard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          {!reviewResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Code2 className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Review Generated Yet</h3>
              <p className="text-xs max-w-sm mt-1 text-slate-400">
                Configure your deliverable description and code on the left, then click "Trigger AI Review" to generate an automated review.
              </p>
            </div>
          ) : (
            <div className="space-y-5 flex-1 overflow-y-auto">
              {/* Score Header */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Technical Score</div>
                  <div className="text-3xl font-extrabold text-blue-600 mt-0.5">
                    {reviewResult.intern_review?.score || reviewResult.manager_summary?.overall_score || 85}/100
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Risk Assessment</div>
                  <Badge
                    variant={reviewResult.manager_summary?.risk_level === 'low' ? 'success' : 'warning'}
                    className="mt-1"
                  >
                    {reviewResult.manager_summary?.risk_level || 'Normal Risk'}
                  </Badge>
                </div>
              </div>

              {/* Feedback Summary & Audio Button */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Feedback & Synthesis
                  </h4>
                  <button
                    onClick={() => handleSpeak(reviewResult.intern_review?.speech_text || reviewResult.intern_review?.feedback)}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
                    title="Play Audio Explanation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {reviewResult.intern_review?.feedback || reviewResult.manager_summary?.summary}
                </p>
              </div>

              {/* Strengths & Bugs Lists */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Strengths
                  </h5>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {(reviewResult.intern_review?.strengths || ['Clean function modularity', 'Consistent error handling']).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                  <h5 className="font-bold text-amber-800 text-xs flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Detected Gaps & Suggestions
                  </h5>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {(reviewResult.intern_review?.suggestions || reviewResult.intern_review?.bugs || ['Add integration test suite coverage']).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Manager Summary */}
              {reviewResult.manager_summary?.recommendation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h5 className="font-bold text-slate-800 mb-1">Supervisor Recommendation:</h5>
                  <p className="text-slate-600">{reviewResult.manager_summary.recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
