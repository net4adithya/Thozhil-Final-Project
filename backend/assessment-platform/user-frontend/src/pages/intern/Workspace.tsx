import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { assessmentsService, AssessmentResponse } from '../../services/assessments';

interface RunResult {
  testCaseId?: string;
  isHidden?: boolean;
  passed: boolean;
  stdout?: string;
  stderr?: string;
  timeMs?: number;
}

const STARTER_TEMPLATES: Record<string, string> = {
  python: `# Write your solution in Python 3\nimport sys\n\ndef main():\n    input_data = sys.stdin.read().strip()\n    if not input_data:\n        return\n    # Example: Check if odd or even\n    try:\n        val = int(input_data)\n        print("Even" if val % 2 == 0 else "Odd")\n    except ValueError:\n        print(input_data)\n\nif __name__ == '__main__':\n    main()\n`,
  javascript: `// Write your solution in JavaScript (Node.js)\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (!input) process.exit(0);\n\nconst val = parseInt(input, 10);\nif (!isNaN(val)) {\n  console.log(val % 2 === 0 ? "Even" : "Odd");\n} else {\n  console.log(input);\n}\n`,
  java: `// Write your solution in Java\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int val = sc.nextInt();\n            System.out.println(val % 2 == 0 ? "Even" : "Odd");\n        } else if (sc.hasNext()) {\n            System.out.println(sc.next());\n        }\n    }\n}\n`,
  cpp: `// Write your solution in C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int val;\n    if (cin >> val) {\n        if (val % 2 == 0) {\n            cout << "Even" << endl;\n        } else {\n            cout << "Odd" << endl;\n        }\n    } else {\n        string s;\n        if (cin >> s) cout << s << endl;\n    }\n    return 0;\n}\n`
};

export function Workspace() {
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [language, setLanguage] = useState<string>('python');
  const [codeMap, setCodeMap] = useState<Record<string, Record<string, string>>>({}); // { qId: { lang: code } }
  const [code, setCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testResults, setTestResults] = useState<RunResult[] | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(true);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const myAss = await assessmentsService.getMyAssessment();
        setAssessment(myAss);
        
        const qList = await assessmentsService.getAssessmentQuestions(myAss.id);
        setQuestions(qList);

        if (qList.length > 0) {
          const firstQ = qList[0];
          const defaultLang = firstQ.allowedLanguages?.[0] || 'python';
          setLanguage(defaultLang);
          const initialCode = STARTER_TEMPLATES[defaultLang] || STARTER_TEMPLATES.python;
          setCode(initialCode);
          setCodeMap({ [firstQ.id || firstQ._id]: { [defaultLang]: initialCode } });
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, []);

  const currentQ = questions[currentQuestionIdx];
  const qId = currentQ?.id || currentQ?._id;

  const loadQuestion = (idx: number) => {
    if (!questions[idx]) return;
    setTestResults(null);
    setCurrentQuestionIdx(idx);
    const targetQ = questions[idx];
    const targetQId = targetQ.id || targetQ._id;
    const currentLang = language;
    const savedCode = codeMap[targetQId]?.[currentLang];
    setCode(savedCode || STARTER_TEMPLATES[currentLang] || STARTER_TEMPLATES.python);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setTestResults(null);
    if (qId) {
      const existing = codeMap[qId]?.[newLang];
      const newCode = existing || STARTER_TEMPLATES[newLang] || STARTER_TEMPLATES.python;
      setCode(newCode);
      setCodeMap(prev => ({
        ...prev,
        [qId]: { ...(prev[qId] || {}), [newLang]: newCode }
      }));
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);
    
    if (qId) {
      setCodeMap(prev => ({
        ...prev,
        [qId]: { ...(prev[qId] || {}), [language]: value }
      }));
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (qId) {
          await assessmentsService.saveCandidateAnswer(qId, value, language);
        }
      } catch (e) {
        console.error("Autosave failed", e);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  const handleRunCode = async () => {
    if (!qId) return;
    setIsExecuting(true);
    setTestResults(null);
    setShowConsole(true);
    try {
      // Autosave answer first
      await assessmentsService.saveCandidateAnswer(qId, code, language);

      // Trigger candidate visible test case execution
      const data = await assessmentsService.runCandidateCode(qId, code, language);
      if (data && data.results) {
        setTestResults(data.results);
      }
    } catch (e: any) {
      console.error("Failed to execute code:", e);
      const msg = e.response?.data?.message || e.message || "Failed to run code.";
      alert(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit your final assessment? Once submitted, you cannot edit your answers.")) {
      return;
    }
    try {
      setIsLoading(true);
      await assessmentsService.submitCandidateExam();
      navigate('/intern/interview/completed');
    } catch (e: any) {
      console.error("Failed to submit exam:", e);
      const msg = e.response?.data?.message || e.message || "Failed to submit assessment.";
      alert(msg);
      setIsLoading(false);
    }
  };

  if (isLoading && !assessment) {
    return <div className="p-xl text-secondary">Loading Workspace...</div>;
  }

  // Public test cases for display
  const publicCases = currentQ?.public_test_cases || (currentQ?.testCases || []).filter((tc: any) => !tc.isHidden);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col font-body-main text-on-surface overflow-hidden">
      {/* Header / TopNav */}
      <header className="bg-surface border-b border-outline-variant w-full h-[60px] flex-shrink-0 flex items-center justify-between px-md md:px-lg z-10">
        <div className="flex items-center gap-md">
          <Link to="/intern/interview/overview" className="text-primary flex items-center">
            <span className="font-bold text-xl tracking-tight text-primary">THOZHIL</span>
          </Link>
          <div className="w-[1px] h-lg bg-outline-variant hidden md:block"></div>
          <span className="font-card-title text-card-title hidden md:block">{assessment?.title || "Technical Coding Interview"}</span>
        </div>
        <div className="flex items-center gap-xl">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">dns</span>
            <span className="font-navigation text-navigation text-secondary">Question {currentQuestionIdx + 1} of {questions.length}</span>
          </div>
          <div className="flex items-center gap-sm bg-surface-container py-xs px-sm rounded">
            <span className="material-symbols-outlined text-error text-[20px]">timer</span>
            <span className="font-code-snippet text-code-snippet text-error font-bold">{assessment?.duration_minutes || 60}:00</span>
          </div>
          <div className="flex items-center gap-xs hidden md:flex min-w-[80px]">
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-secondary text-[18px] animate-spin">sync</span>
                <span className="font-metadata text-metadata text-secondary">Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-primary-container text-[18px]">cloud_done</span>
                <span className="font-metadata text-metadata text-secondary">Saved</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Description & Public Test Cases */}
        <section className="w-[38%] h-full flex flex-col border-r border-outline-variant bg-surface-container-lowest overflow-y-auto">
          {currentQ ? (
            <div className="p-lg flex flex-col gap-lg">
              {/* Problem Header */}
              <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
                <h1 className="font-page-title text-page-title">{String(currentQuestionIdx + 1).padStart(2, '0')} {currentQ.title}</h1>
                <div className="flex items-center gap-sm">
                  <span className="bg-surface-container text-primary-container px-sm py-[2px] rounded text-metadata font-medium border border-primary-fixed-dim">
                    {currentQ.difficulty || "MEDIUM"}
                  </span>
                  <span className="bg-surface-variant text-on-surface-variant px-sm py-[2px] rounded text-metadata">
                    {currentQ.topic || "Coding"}
                  </span>
                </div>
              </div>

              {/* Problem Statement */}
              <div className="flex flex-col gap-sm">
                <h2 className="font-section-heading text-section-heading">Problem Description</h2>
                <p className="font-body-main text-body-main text-on-surface-variant whitespace-pre-wrap">
                  {currentQ.problem_statement || currentQ.description}
                </p>
              </div>

              {/* Examples */}
              {currentQ.examples && currentQ.examples.length > 0 && (
                <div className="flex flex-col gap-sm">
                  <h2 className="font-section-heading text-section-heading">Examples</h2>
                  {currentQ.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col gap-xs">
                      <span className="font-card-title text-card-title font-semibold">Example {i + 1}:</span>
                      <div className="font-code-snippet text-code-snippet bg-surface-container p-sm rounded text-on-surface whitespace-pre-wrap">
                        <strong>Input:</strong> {ex.input}<br />
                        <strong>Output:</strong> {ex.output}
                        {ex.explanation && <><br /><strong>Explanation:</strong> {ex.explanation}</>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Public Test Cases Section */}
              {publicCases.length > 0 && (
                <div className="flex flex-col gap-sm">
                  <h2 className="font-section-heading text-section-heading">Public Test Cases</h2>
                  {publicCases.map((tc: any, i: number) => (
                    <div key={i} className="bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col gap-xs">
                      <span className="font-card-title text-card-title font-semibold text-primary">
                        Case {i + 1} {tc.description ? `- ${tc.description}` : ''}
                      </span>
                      <div className="font-code-snippet text-code-snippet bg-surface-container p-sm rounded text-on-surface whitespace-pre-wrap">
                        <strong>Input:</strong> {tc.input || tc.inputData || '(empty)'}<br />
                        <strong>Expected Output:</strong> {tc.expected_output || tc.expectedOutput || ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {currentQ.constraints && (
                <div className="flex flex-col gap-sm mb-xl">
                  <h2 className="font-section-heading text-section-heading">Constraints</h2>
                  <div className="font-code-snippet text-code-snippet text-on-surface-variant bg-surface-container-low p-md rounded-lg border border-outline-variant whitespace-pre-wrap">
                    {currentQ.constraints}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-lg text-secondary">No question selected.</div>
          )}
        </section>

        {/* Right Panel: Editor & Output */}
        <section className="w-[62%] h-full flex flex-col bg-[#1e1e1e]">
          {/* Editor Header */}
          <div className="h-[48px] bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-md flex-shrink-0">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-[#569cd6] text-[18px]">code</span>
              <span className="font-navigation text-navigation text-[#cccccc]">
                solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}
              </span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="text-[#888888] text-xs">Language:</span>
              <select 
                className="bg-[#3c3c3c] text-[#cccccc] border border-[#555555] font-code-snippet text-code-snippet py-xs px-sm rounded cursor-pointer focus:ring-1 focus:ring-primary-container outline-none"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ (GCC 11)</option>
              </select>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 overflow-hidden relative">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
          </div>

          {/* Editor Footer / Actions */}
          <div className="h-[60px] bg-[#252526] border-t border-[#3c3c3c] flex items-center justify-between px-md flex-shrink-0">
            <button 
              onClick={() => setShowConsole(!showConsole)}
              className="bg-[#3c3c3c] hover:bg-[#4f4f4f] text-[#cccccc] border border-[#555555] font-navigation text-navigation py-[6px] px-md rounded transition-colors flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              Console {testResults ? `(${testResults.filter(r => r.passed).length}/${testResults.length} Passed)` : ''}
            </button>
            <div className="flex gap-sm">
              <button 
                onClick={handleRunCode}
                disabled={isExecuting}
                className="bg-transparent hover:bg-[#3c3c3c] text-[#cccccc] border border-[#555555] font-navigation text-navigation py-[6px] px-md rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
              <button 
                onClick={handleSubmit} 
                className="bg-primary-container hover:bg-primary text-on-primary font-navigation text-navigation py-[6px] px-md rounded transition-colors inline-block text-center cursor-pointer font-bold"
              >
                Submit Assessment
              </button>
            </div>
          </div>

          {/* Output Panel / Test Case Results */}
          {showConsole && testResults && (
            <div className="bg-[#1e1e1e] border-t border-[#3c3c3c] h-[200px] flex flex-col flex-shrink-0 overflow-hidden">
              <div className="px-md py-xs border-b border-[#3c3c3c] flex items-center justify-between bg-[#252526]">
                <span className="font-navigation text-navigation text-[#cccccc] flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">checklist</span> Test Case Execution Results
                </span>
                <span className={`font-code-snippet text-metadata font-bold ${testResults.every(r => r.passed) ? 'text-[#89d185]' : 'text-[#f48771]'}`}>
                  {testResults.filter(r => r.passed).length}/{testResults.length} Passed
                </span>
              </div>
              <div className="p-md overflow-auto flex flex-col gap-md">
                {testResults.map((r, i) => {
                  const pc = publicCases[i] || {};
                  return (
                    <div key={i} className="bg-[#252526] border border-[#3c3c3c] rounded p-sm flex flex-col gap-xs font-code-snippet text-metadata">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#cccccc] flex items-center gap-xs">
                          {r.passed ? (
                            <span className="material-symbols-outlined text-[#89d185] text-[18px]">check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined text-[#f48771] text-[18px]">cancel</span>
                          )}
                          Case {i + 1}
                        </span>
                        <span className={`px-sm py-[2px] rounded text-xs font-bold ${r.passed ? 'bg-[#89d185]/20 text-[#89d185]' : 'bg-[#f48771]/20 text-[#f48771]'}`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <div className="text-[#aaaaaa] pl-md border-l-2 border-[#3c3c3c] flex flex-col gap-xs">
                        {pc.input && <div><strong>Input:</strong> {pc.input}</div>}
                        {pc.expected_output && <div><strong>Expected Output:</strong> {pc.expected_output}</div>}
                        <div><strong>Actual Output:</strong> <span className={r.passed ? 'text-[#89d185]' : 'text-[#f48771]'}>{r.stdout?.trim() || r.stderr?.trim() || '(no output)'}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Question Navigator */}
      <footer className="h-[50px] bg-surface-container border-t border-outline-variant flex items-center justify-center px-lg flex-shrink-0">
        <div className="flex items-center gap-md">
          {questions.map((q, idx) => (
            <div key={q.id || q._id} className="flex items-center gap-md">
              {idx > 0 && <div className="w-md h-[1px] bg-outline-variant"></div>}
              <button 
                onClick={() => loadQuestion(idx)}
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center font-navigation text-navigation transition-colors cursor-pointer ${
                  idx === currentQuestionIdx 
                    ? 'bg-primary-container text-on-primary ring-2 ring-primary-container ring-offset-2 ring-offset-surface-container shadow-sm'
                    : 'bg-surface-container-lowest text-secondary border border-outline-variant hover:bg-surface-variant'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </button>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
