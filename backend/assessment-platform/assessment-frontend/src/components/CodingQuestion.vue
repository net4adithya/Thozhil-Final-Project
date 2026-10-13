<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import examApi from '../api/examApi';

// monaco-editor is loaded here instead of a plain <textarea> so candidates get real
// syntax highlighting, bracket matching, and autocomplete for the languages the
// question allows — the "styled textarea" trade-off flagged in the README.
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

if (!self.MonacoEnvironment) {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') return new JsonWorker();
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
      if (label === 'typescript' || label === 'javascript') return new TsWorker();
      return new EditorWorker();
    },
  };
}

// Maps our compiler-service language keys to Monaco's built-in language ids for
// highlighting/autocomplete. Unrecognized languages still work, just as plain text.
const MONACO_LANGUAGE_MAP = {
  python: 'python',
  python3: 'python',
  javascript: 'javascript',
  nodejs: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  csharp: 'csharp',
  'c#': 'csharp',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  kotlin: 'kotlin',
  swift: 'swift',
};

const props = defineProps({
  token: { type: String, required: true },
  question: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({ code: '', language: '' }) },
});
const emit = defineEmits(['update:modelValue']);

const languages = computed(() => {
  const allowed = props.question.allowedLanguages || [];
  const starters = (props.question.starterCode || []).map((s) => s.language);
  const combined = Array.from(new Set([...allowed, ...starters]));
  return combined.length > 0 ? combined : ['python', 'javascript', 'java', 'cpp'];
});

const language = ref(
  props.modelValue.language || props.question.allowedLanguages?.[0] || languages.value[0] || 'python'
);

function starterFor(lang) {
  const entry = (props.question.starterCode || []).find((s) => s.language === lang);
  if (entry && entry.code) return entry.code;

  if (lang === 'python' || lang === 'python3') {
    return `# Write your code here\n`;
  }
  if (lang === 'javascript' || lang === 'nodejs') {
    return `// Write your code here\n`;
  }
  if (lang === 'java') {
    return `public class Main {\n    // Write your code here\n}\n`;
  }
  if (lang === 'cpp' || lang === 'c++') {
    return `// Write your code here\n`;
  }
  return '';
}

const code = ref(props.modelValue.code || starterFor(language.value));

function monacoLangFor(lang) {
  return MONACO_LANGUAGE_MAP[(lang || '').toLowerCase()] || 'plaintext';
}

const editorContainer = ref(null);
let editor = null;
const editorReady = shallowRef(false);

onMounted(() => {
  editor = monaco.editor.create(editorContainer.value, {
    value: code.value,
    language: monacoLangFor(language.value),
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    tabSize: 2,
    scrollBeyondLastLine: false,
    contextmenu: false,
  });
  editor.onDidChangeModelContent(() => {
    code.value = editor.getValue();
  });
  editorReady.value = true;
});

onBeforeUnmount(() => {
  editor?.dispose();
});

function onLanguageChange(lang) {
  const prevLang = language.value;
  const prevStarter = starterFor(prevLang);
  language.value = lang;

  const isUntouched = !code.value.trim() || code.value.trim() === prevStarter.trim();
  if (isUntouched) {
    code.value = starterFor(lang);
    editor?.setValue(code.value);
  } else if (window.confirm(`Switch to ${lang} and load starter template? Your current code in ${prevLang} will be replaced.`)) {
    code.value = starterFor(lang);
    editor?.setValue(code.value);
  }

  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel(), monacoLangFor(lang));
  }
}

watch(
  [code, language],
  ([c, l]) => emit('update:modelValue', { code: c, language: l }),
  { immediate: true }
);

const running = ref(false);
const runResults = ref(null);
const runError = ref('');

function versionFor(lang) {
  return (props.question.starterCode || []).find((s) => s.language === lang)?.version || 'latest';
}

async function runCode() {
  running.value = true;
  runError.value = '';
  runResults.value = null;
  try {
    const { results } = await examApi.runCode(props.token, {
      questionId: props.question._id,
      code: code.value,
      language: language.value,
      version: versionFor(language.value),
    });
    runResults.value = results;
  } catch (err) {
    runError.value = err.response?.data?.message || 'Could not run your code. Try again.';
  } finally {
    running.value = false;
  }
}
function resultFor(tcId) {
  if (!runResults.value) return null;
  return runResults.value.find((r) => String(r.testCaseId) === String(tcId));
}
</script>

<template>
  <div class="coding-panel">
    <!-- Visible Test Cases Display -->
    <div class="testcases-container">
      <div class="results-title">Public Test Cases</div>
      <div v-if="question.testCases && question.testCases.length" class="tc-grid">
        <div v-for="(tc, i) in question.testCases" :key="tc._id || i" class="tc-card" :class="{ pass: resultFor(tc._id)?.passed, fail: resultFor(tc._id) && !resultFor(tc._id).passed }">
          <div class="tc-header">
            <span class="case-label">Case {{ i + 1 }}</span>
            <span v-if="resultFor(tc._id)" class="badge" :class="resultFor(tc._id).passed ? 'pass-badge' : 'fail-badge'">
              Status: {{ resultFor(tc._id).passed ? 'Passed' : 'Failed' }}
            </span>
          </div>
          <div class="tc-body">
            <div class="tc-field">
              <span class="field-title">Input</span>
              <pre class="field-value">{{ tc.input || '(empty)' }}</pre>
            </div>
            <div v-if="resultFor(tc._id)" class="tc-field">
              <span class="field-title">Your Output</span>
              <pre class="field-value">{{ resultFor(tc._id).stdout || resultFor(tc._id).stderr || '(no output)' }}</pre>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-tc">No public test cases available for preview.</div>
    </div>

    <div class="toolbar">
      <select class="lang-select" :value="language" @change="onLanguageChange($event.target.value)">
        <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
      </select>
      <button class="run-btn" :disabled="running" @click="runCode">
        {{ running ? 'Running…' : 'Run code' }}
      </button>
    </div>

    <div ref="editorContainer" class="editor"></div>

    <div v-if="runError" class="run-error">{{ runError }}</div>

    <div v-if="runResults" class="results-summary">
      <p class="hint">Hidden test cases will be run automatically when you submit the exam.</p>
    </div>
  </div>
</template>

<style scoped>
.coding-panel {
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--panel);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-raised);
}

.lang-select {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.run-btn {
  background: var(--accent);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 18px;
  font-weight: 600;
  font-size: 0.85rem;
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.editor {
  width: 100%;
  height: 340px;
}

.run-error {
  padding: 12px 16px;
  color: var(--signal-red);
  font-size: 0.85rem;
  border-top: 1px solid var(--border);
}

.testcases-container {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-raised);
}

.results-title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.tc-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tc-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  transition: border-color 0.2s;
}

.tc-card.pass {
  border-color: var(--signal-green);
}

.tc-card.fail {
  border-color: var(--signal-red);
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.case-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}

.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pass-badge {
  background: rgba(63, 182, 139, 0.15);
  color: var(--signal-green);
}

.fail-badge {
  background: rgba(232, 93, 93, 0.15);
  color: var(--signal-red);
}

.tc-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.tc-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--text-faint);
  font-weight: 600;
}

.field-value {
  margin: 0;
  padding: 8px;
  background: var(--ink);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  white-space: pre-wrap;
  color: var(--text-muted);
}

.no-tc {
  font-size: 0.85rem;
  color: var(--text-faint);
  font-style: italic;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-raised);
}

.lang-select {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.run-btn {
  background: var(--accent);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 18px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.editor {
  width: 100%;
  height: 340px;
}

.run-error {
  padding: 12px 16px;
  color: var(--signal-red);
  font-size: 0.85rem;
  border-top: 1px solid var(--border);
}

.results-summary {
  border-top: 1px solid var(--border);
  padding: 10px 16px;
  background: var(--panel-raised);
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-faint);
}
</style>
