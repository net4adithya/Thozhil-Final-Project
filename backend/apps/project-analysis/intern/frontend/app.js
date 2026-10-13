/* ==========================================
   ReviewAI - Application Frontend JavaScript
   Handles State, API Integration & Dynamic Views
   ========================================== */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Current State
let currentAnalysis = null;
let chatHistory = [];
let activeInputTab = 'paste';
let currentUser = null;
let activeLoginRole = 'intern';

// Login Modal Handlers
window.openLoginModal = function(role = 'intern') {
  window.selectLoginRole(role);
  const modal = document.getElementById('modal-login');
  if (modal) modal.classList.remove('hidden');
};

window.closeLoginModal = function() {
  const modal = document.getElementById('modal-login');
  if (modal) modal.classList.add('hidden');
};

window.selectLoginRole = function(role) {
  activeLoginRole = role;
  const tabIntern = document.getElementById('login-tab-intern');
  const tabManager = document.getElementById('login-tab-manager');
  const authTabIntern = document.getElementById('authview-tab-intern');
  const authTabManager = document.getElementById('authview-tab-manager');

  const emailInput = document.getElementById('login-email-input');
  const authEmailInput = document.getElementById('authview-email-input');

  const activeTabClass = 'flex-1 py-2.5 text-xs font-bold rounded-lg bg-primary text-white shadow transition-all flex items-center justify-center gap-1';
  const inactiveTabClass = 'flex-1 py-2.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1';

  if (role === 'intern') {
    if (tabIntern) tabIntern.className = activeTabClass;
    if (tabManager) tabManager.className = inactiveTabClass;
    if (authTabIntern) authTabIntern.className = activeTabClass;
    if (authTabManager) authTabManager.className = inactiveTabClass;

    if (emailInput) emailInput.value = 'alex.smith@thozhil.com';
    if (authEmailInput) authEmailInput.value = 'alex.smith@thozhil.com';
  } else {
    if (tabManager) tabManager.className = activeTabClass;
    if (tabIntern) tabIntern.className = inactiveTabClass;
    if (authTabManager) authTabManager.className = activeTabClass;
    if (authTabIntern) authTabIntern.className = inactiveTabClass;

    if (emailInput) emailInput.value = 'jane.doe@thozhil.com';
    if (authEmailInput) authEmailInput.value = 'jane.doe@thozhil.com';
  }
};

window.quickDemoLogin = function(role) {
  window.selectLoginRole(role);
  window.submitLoginForm();
};

window.submitLoginForm = function() {
  const targetRole = activeLoginRole || 'intern';
  const email = document.getElementById('authview-email-input')?.value || document.getElementById('login-email-input')?.value;

  if (targetRole === 'intern') {
    currentUser = {
      name: 'Alex Smith',
      role: 'intern',
      initials: 'AS',
      email: email || 'alex.smith@thozhil.com'
    };
  } else {
    currentUser = {
      name: 'Jane Doe',
      role: 'manager',
      initials: 'JD',
      email: email || 'jane.doe@thozhil.com'
    };
  }

  updateAuthUI();
  window.closeLoginModal();
  switchView(targetRole);
  showToast(`Welcome ${currentUser.name}! Logged in as ${currentUser.role.toUpperCase()}`);
};

window.handleLogout = function() {
  currentUser = null;
  updateAuthUI();
  switchView('auth');
  showToast(`Logged out successfully.`);
};

function updateAuthUI() {
  const loggedOutContainer = document.getElementById('auth-logged-out');
  const loggedInContainer = document.getElementById('auth-logged-in');
  const nameElem = document.getElementById('user-display-name');
  const avatarElem = document.getElementById('user-avatar-badge');
  const roleBadge = document.getElementById('user-role-badge');

  const btnInternNav = document.getElementById('nav-btn-intern');
  const btnManagerNav = document.getElementById('nav-btn-manager');

  if (currentUser) {
    if (loggedOutContainer) loggedOutContainer.classList.add('hidden');
    if (loggedInContainer) loggedInContainer.classList.remove('hidden');
    if (nameElem) nameElem.innerText = currentUser.name;
    if (avatarElem) avatarElem.innerText = currentUser.initials;
    if (roleBadge) roleBadge.innerText = currentUser.role;

    if (currentUser.role === 'intern') {
      if (btnInternNav) btnInternNav.classList.remove('hidden');
      if (btnManagerNav) btnManagerNav.classList.add('hidden');
    } else if (currentUser.role === 'manager') {
      if (btnManagerNav) btnManagerNav.classList.remove('hidden');
      if (btnInternNav) btnInternNav.classList.add('hidden');
    }
  } else {
    if (loggedOutContainer) loggedOutContainer.classList.remove('hidden');
    if (loggedInContainer) loggedInContainer.classList.add('hidden');

    if (btnInternNav) btnInternNav.classList.add('hidden');
    if (btnManagerNav) btnManagerNav.classList.add('hidden');
  }
}

// Initial Mock Submissions for Manager Dashboard
let submissionsData = [
  {
    id: 'sub-1',
    internName: 'Alex Smith',
    internInitials: 'AS',
    avatarBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    project: 'React Component Refactor',
    riskLevel: 'Low Risk',
    riskClass: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
    riskIcon: 'check_circle',
    score: 92,
    scoreClass: 'text-primary',
    summary: 'Excellent code structure. Minor improvements suggested for error boundary handling.',
    code: `import React, { useState, useEffect } from 'react';\n\nexport const ProductList = () => {\n  const [products, setProducts] = useState([]);\n  useEffect(() => {\n    fetch('/api/products').then(res => res.json()).then(data => setProducts(data));\n  }, []);\n  return <div>{products.map(p => <div key={p.id}>{p.name}</div>)}</div>;\n};`,
    findings: {
      strengths: ['Clean component separation', 'Good use of hooks', 'Responsive CSS'],
      missing: ['Empty list state handler missing'],
      bugs: ['Missing loading indicator during fetch'],
      suggestions: ['Wrap fetch logic in try-catch block']
    }
  },
  {
    id: 'sub-2',
    internName: 'Maya Johnson',
    internInitials: 'MJ',
    avatarBg: 'bg-secondary-fixed text-on-secondary-fixed',
    project: 'API Endpoint Optimization',
    riskLevel: 'Medium Risk',
    riskClass: 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]',
    riskIcon: 'warning',
    score: 74,
    scoreClass: 'text-[#B06000]',
    summary: 'Logic is sound, but significant performance bottleneck detected in nested loops. Requires manual review.',
    code: `def get_user_orders(user_id):\n    users = db.query("SELECT * FROM users")\n    orders = []\n    for u in users:\n        if u.id == user_id:\n            user_orders = db.query(f"SELECT * FROM orders WHERE user_id = {u.id}")\n            orders.extend(user_orders)\n    return orders`,
    findings: {
      strengths: ['Clear function N+1 problem identification', 'Valid DB queries'],
      missing: ['Missing indexing on user_id'],
      bugs: ['N+1 database query vulnerability inside loop', 'Potential SQL injection vulnerability'],
      suggestions: ['Use parameterized query: SELECT * FROM orders WHERE user_id = %s']
    }
  },
  {
    id: 'sub-3',
    internName: 'Ryan Lee',
    internInitials: 'RL',
    avatarBg: 'bg-error-container text-on-error-container',
    project: 'Authentication Middleware',
    riskLevel: 'High Risk',
    riskClass: 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]',
    riskIcon: 'error',
    score: 45,
    scoreClass: 'text-error',
    summary: 'AI Alert: Potential security vulnerability identified. Hardcoded credentials detected in testing environment scope.',
    code: `const jwt = require('jsonwebtoken');\nconst SECRET_KEY = "super_secret_admin_key_12345"; // Hardcoded secret!\n\nfunction authenticate(req, res, next) {\n  const token = req.headers['authorization'];\n  if (!token) return res.status(401).send('Access Denied');\n  try {\n    const verified = jwt.verify(token, SECRET_KEY);\n    req.user = verified;\n    next();\n  } catch (err) {\n    res.status(400).send('Invalid Token');\n  }\n}`,
    findings: {
      strengths: ['Middleware pattern implemented'],
      missing: ['Missing Token Expiry validation check'],
      bugs: ['HARDCODED JWT SECRET KEY in source code', 'Insecure fallback handling'],
      suggestions: ['Move SECRET_KEY into process.env.JWT_SECRET environment variable']
    }
  }
];

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupInputTabs();
  setupFormHandlers();
  setupChatbot();
  renderManagerSubmissions();
});

// View Navigation Switcher
function setupNavigation() {
  const navLinks = document.querySelectorAll('[data-view-target]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view-target');
      switchView(targetView);
    });
  });
}

function switchView(viewId) {
  if (viewId === 'manager') viewId = 'authority';

  const views = document.querySelectorAll('.view-section');
  views.forEach(v => v.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update active nav links state
  document.querySelectorAll('[data-view-target]').forEach(link => {
    const target = link.getAttribute('data-view-target');
    if (target === viewId || (target === 'manager' && viewId === 'authority')) {
      link.classList.add('text-primary', 'font-bold');
      link.classList.remove('text-on-surface-variant', 'text-on-primary/80');
    } else {
      link.classList.remove('text-primary', 'font-bold');
    }
  });

  showToast(`Switched to ${viewId === 'authority' ? 'AUTHORITY PANEL' : viewId.toUpperCase()} view`);
}

// Input Mode Tabs (Paste, File Upload, GitHub URL)
function setupInputTabs() {
  const tabs = document.querySelectorAll('.input-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('bg-primary', 'text-white', 'shadow'));
      tabs.forEach(t => t.classList.add('bg-surface-container-low', 'text-on-surface-variant'));
      
      tab.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      tab.classList.add('bg-primary', 'text-white', 'shadow');

      activeInputTab = tab.getAttribute('data-tab');
      
      document.querySelectorAll('.input-tab-content').forEach(c => c.classList.add('hidden'));
      const activeContent = document.getElementById(`tab-content-${activeInputTab}`);
      if (activeContent) activeContent.classList.remove('hidden');
    });
  });
}

// Code Analysis Submission
function setupFormHandlers() {
  const submitBtn = document.getElementById('btn-submit-review');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleCodeSubmit);
  }

  // Manager Create Task
  const btnCreateTask = document.getElementById('btn-create-task');
  if (btnCreateTask) {
    btnCreateTask.addEventListener('click', handleCreateTask);
  }

  // NL Generator Submit
  const btnNlSubmit = document.getElementById('btn-nl-submit');
  if (btnNlSubmit) {
    btnNlSubmit.addEventListener('click', handleNLGenerator);
  }

  // Drift Check Submit
  const btnDriftSubmit = document.getElementById('btn-drift-submit');
  if (btnDriftSubmit) {
    btnDriftSubmit.addEventListener('click', handleDriftCheck);
  }
}

async function handleCodeSubmit() {
  const submitBtn = document.getElementById('btn-submit-review');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Analyzing Code...`;

  let codeText = '';
  let project = document.getElementById('project')?.value || 'Assignment Submission';
  let notes = document.getElementById('notes')?.value || '';

  if (activeInputTab === 'paste') {
    codeText = document.getElementById('code-paste-input')?.value || '';
  }

  let requestBody = {
    input_type: activeInputTab,
    code: codeText,
    notes: notes,
    framework: 'fastapi'
  };

  let responseData = null;

  try {
    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (res.ok) {
      responseData = await res.json();
      showToast('Live analysis completed from backend API!');
    } else {
      throw new Error(`API returned ${res.status}`);
    }
  } catch (err) {
    console.warn('Backend API connection offline or error. Using simulated AI analysis engine:', err);
    responseData = generateSimulatedAnalysis(codeText || githubUrl || 'Sample Code', framework);
    showToast('Analysis completed (AI Studio Simulation Engine)');
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalText;

  currentAnalysis = responseData;
  renderAssessmentReport(responseData, project);
  
  // Add to manager submissions feed dynamically
  addSubmissionToFeed(responseData, project);
}

// Generate Simulated AI Analysis Report if backend is offline
function generateSimulatedAnalysis(codeSample, framework) {
  const isPython = codeSample.includes('def ') || framework === 'fastapi' || framework === 'flask';
  
  return {
    project_id: 'prj-' + Math.random().toString(36).substring(2, 8),
    framework: framework,
    language: isPython ? 'python' : 'javascript',
    score: 88,
    summary: 'The code demonstrates high cohesion and solid REST principles. Error handling covers standard HTTP status codes.',
    endpoints: [
      {
        path: '/api/v1/items',
        method: 'GET',
        summary: 'List items with pagination',
        auth_required: true,
        missing_auth: false,
        is_undocumented: false,
        error_codes: { '400': 'Bad parameters', '500': 'Internal Error' }
      },
      {
        path: '/api/v1/items/{id}',
        method: 'POST',
        summary: 'Create or update item',
        auth_required: false,
        missing_auth: true,
        is_undocumented: true,
        error_codes: { '401': 'Unauthorized', '404': 'Not Found' }
      }
    ],
    strengths: [
      'Clean modular endpoint structure',
      'Effective request parameter validation',
      'Consistent JSON output formatting'
    ],
    missing_features: [
      'Rate limiting middleware missing on POST endpoint',
      'Pagination page size upper bound check absent'
    ],
    bugs: [
      'Missing try-catch wrapper around database query execution',
      'Potential unhandled null dereference when payload item is empty'
    ],
    suggestions: [
      'Implement Pydantic or Joi schema validation for request payload',
      'Add structured logging for internal server errors'
    ],
    openapi_yaml: `openapi: 3.0.3\ninfo:\n  title: ReviewAI Generated API\n  version: 1.0.0\npaths:\n  /api/v1/items:\n    get:\n      summary: List items\n      responses:\n        '200':\n          description: Success`
  };
}

// Render Assessment Report Card in Intern View
function renderAssessmentReport(data, projectName) {
  const score = data.score || 85;
  const scoreElem = document.getElementById('report-score');
  const scoreCircle = document.getElementById('report-score-circle');
  const scoreTitle = document.getElementById('report-score-title');
  const scoreDesc = document.getElementById('report-score-desc');

  if (scoreElem) scoreElem.innerText = score;
  
  if (scoreCircle) {
    const strokeDash = `${score}, 100`;
    scoreCircle.setAttribute('stroke-dasharray', strokeDash);
  }

  if (scoreTitle) {
    if (score >= 85) scoreTitle.innerText = 'Solid Architecture';
    else if (score >= 70) scoreTitle.innerText = 'Good Implementation';
    else scoreTitle.innerText = 'Attention Required';
  }

  if (scoreDesc) {
    scoreDesc.innerText = data.summary || 'Code analysis ready. Review key findings and suggestions below.';
  }

  // Populate Strengths
  const strengthsList = document.getElementById('report-strengths-list');
  if (strengthsList) {
    const list = data.strengths || ['Clean code structure', 'Valid syntax and routing'];
    strengthsList.innerHTML = list.map(s => `<li>• ${s}</li>`).join('');
  }

  // Populate Missing Features
  const missingList = document.getElementById('report-missing-list');
  if (missingList) {
    const list = data.missing_features || ['Empty payload validation', 'Pagination limit caps'];
    missingList.innerHTML = list.map(m => `<li>• ${m}</li>`).join('');
  }

  // Populate Bugs
  const bugsList = document.getElementById('report-bugs-list');
  if (bugsList) {
    const list = data.bugs || ['Potential uncaught exception on db connection failure'];
    bugsList.innerHTML = list.map(b => `<li>• ${b}</li>`).join('');
  }

  // Populate Suggestions
  const suggestionsList = document.getElementById('report-suggestions-list');
  if (suggestionsList) {
    const list = data.suggestions || ['Use async/await for asynchronous db queries'];
    suggestionsList.innerHTML = list.map(sg => `<li>• ${sg}</li>`).join('');
  }

  // Render OpenAPI YAML
  const yamlBlock = document.getElementById('openapi-yaml-block');
  if (yamlBlock) {
    yamlBlock.innerText = data.openapi_yaml || `# OpenAPI Spec\nopenapi: 3.0.0`;
  }
}

// Manager View: Render Submissions
function renderManagerSubmissions() {
  const container = document.getElementById('manager-submissions-container');
  if (!container) return;

  container.innerHTML = submissionsData.map(sub => `
    <div class="p-4 rounded-lg border border-border-subtle bg-surface hover:bg-surface-container-low transition-colors group">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full ${sub.avatarBg} flex items-center justify-center font-bold">
            ${sub.internInitials}
          </div>
          <div>
            <h3 class="font-label-bold text-on-surface text-lg">${sub.internName}</h3>
            <p class="text-sm text-on-surface-variant">${sub.project}</p>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div class="px-3 py-1 rounded-full ${sub.riskClass} font-label-bold text-xs flex items-center gap-1 border">
            <span class="material-symbols-outlined text-[14px]">${sub.riskIcon}</span>
            ${sub.riskLevel}
          </div>

          <div class="flex flex-col items-end">
            <span class="text-xs text-on-surface-variant mb-1">AI Score</span>
            <div class="flex items-baseline gap-1">
              <span class="font-title-lg ${sub.scoreClass} font-black">${sub.score}</span>
              <span class="text-sm text-outline">/100</span>
            </div>
          </div>

          <button onclick="openReviewModal('${sub.id}')" class="px-4 py-2 bg-white border border-outline-variant text-on-surface font-label-bold rounded-lg hover:bg-surface-container-lowest hover:border-primary transition-colors flex items-center gap-2 shadow-sm">
            Review <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
          </button>
        </div>
      </div>
      
      <div class="mt-3 text-sm text-on-surface-variant border-t border-border-subtle pt-3">
        <span class="font-semibold text-on-surface">AI Summary:</span> ${sub.summary}
      </div>
    </div>
  `).join('');
}

function addSubmissionToFeed(analysisData, projectName) {
  const newSub = {
    id: 'sub-' + Date.now(),
    internName: 'Current Intern (You)',
    internInitials: 'YO',
    avatarBg: 'bg-primary-container text-on-primary-container',
    project: projectName || 'Recent Code Submission',
    riskLevel: analysisData.score >= 80 ? 'Low Risk' : (analysisData.score >= 60 ? 'Medium Risk' : 'High Risk'),
    riskClass: analysisData.score >= 80 ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]' : (analysisData.score >= 60 ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]' : 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]'),
    riskIcon: analysisData.score >= 80 ? 'check_circle' : (analysisData.score >= 60 ? 'warning' : 'error'),
    score: analysisData.score || 85,
    scoreClass: analysisData.score >= 80 ? 'text-primary' : (analysisData.score >= 60 ? 'text-[#B06000]' : 'text-error'),
    summary: analysisData.summary || 'Code submission uploaded and reviewed.',
    code: analysisData.code || '# Code submitted for AI review',
    findings: {
      strengths: analysisData.strengths || [],
      missing: analysisData.missing_features || [],
      bugs: analysisData.bugs || [],
      suggestions: analysisData.suggestions || []
    }
  };

  submissionsData.unshift(newSub);
  renderManagerSubmissions();
}

// Manager Task Creation
function handleCreateTask() {
  const projectId = document.getElementById('projectId')?.value || 'REA-Task-New';
  const taskDesc = document.getElementById('taskDesc')?.value;

  if (!taskDesc) {
    showToast('Please enter a task description');
    return;
  }

  showToast(`Task ${projectId} successfully assigned!`);
  if (document.getElementById('taskDesc')) document.getElementById('taskDesc').value = '';
}

// Open Detailed Review Modal for Manager View
window.openReviewModal = function(subId) {
  const sub = submissionsData.find(s => s.id === subId);
  if (!sub) return;

  const modal = document.getElementById('modal-submission-review');
  if (!modal) return;

  document.getElementById('modal-intern-name').innerText = sub.internName;
  document.getElementById('modal-project-title').innerText = sub.project;
  document.getElementById('modal-score-display').innerText = `${sub.score}/100`;
  document.getElementById('modal-summary-text').innerText = sub.summary;
  document.getElementById('modal-code-snippet').innerText = sub.code || '// Code snippet unavailable';

  modal.classList.remove('hidden');
};

window.closeReviewModal = function() {
  const modal = document.getElementById('modal-submission-review');
  if (modal) modal.classList.add('hidden');
};

// Natural Language API Generator Handler
async function handleNLGenerator() {
  const desc = document.getElementById('nl-description-input')?.value;
  const apiName = document.getElementById('nl-apiname-input')?.value || 'Generated API';

  if (!desc || desc.length < 5) {
    showToast('Please enter a valid API description');
    return;
  }

  const resultContainer = document.getElementById('nl-result-container');
  const codeDisplay = document.getElementById('nl-generated-code');
  const yamlDisplay = document.getElementById('nl-generated-yaml');

  showToast('Generating API from Natural Language...');

  try {
    const res = await fetch(`${API_BASE_URL}/nl-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, api_name: apiName })
    });

    if (res.ok) {
      const data = await res.json();
      if (codeDisplay) codeDisplay.innerText = data.code_snippet || '# Code generated';
      if (yamlDisplay) yamlDisplay.innerText = data.openapi_yaml || '# OpenAPI YAML generated';
    } else {
      throw new Error();
    }
  } catch (e) {
    // Simulated NL Generator
    if (codeDisplay) codeDisplay.innerText = `@app.post("/api/v1/orders")\ndef create_order(item_id: int, quantity: int):\n    # Auto-generated from description: "${desc}"\n    return {"order_id": 101, "status": "created"}`;
    if (yamlDisplay) yamlDisplay.innerText = `openapi: 3.0.0\ninfo:\n  title: ${apiName}\npaths:\n  /api/v1/orders:\n    post:\n      summary: Auto-generated endpoint`;
  }

  if (resultContainer) resultContainer.classList.remove('hidden');
}

// Drift Check Handler
async function handleDriftCheck() {
  const code = document.getElementById('drift-code-input')?.value;

  if (!code) {
    showToast('Please provide source code to compare');
    return;
  }

  const resultContainer = document.getElementById('drift-result-container');
  const statusElem = document.getElementById('drift-status-tag');
  const reportElem = document.getElementById('drift-report-details');

  showToast('Running API Drift Detection...');

  try {
    const res = await fetch(`${API_BASE_URL}/drift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        existing_contract: { paths: { '/api/v1/items': {} } },
        framework: 'fastapi'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (statusElem) statusElem.innerText = data.has_drift ? 'Drift Detected' : 'No Drift Detected';
      if (reportElem) reportElem.innerText = JSON.stringify(data, null, 2);
    } else {
      throw new Error();
    }
  } catch (e) {
    if (statusElem) {
      statusElem.className = 'px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs';
      statusElem.innerText = 'Schema Drift Warning (1 Modified Route, 1 New Parameter)';
    }
    if (reportElem) {
      reportElem.innerText = `• Added parameter 'category' (query string) to GET /api/v1/items\n• Return status 201 added to POST /api/v1/items\n• Breaking changes detected: None`;
    }
  }

  if (resultContainer) resultContainer.classList.remove('hidden');
}

// Chatbot Functionality
function setupChatbot() {
  const chatInput = document.getElementById('chatbot-input');
  const chatSendBtn = document.getElementById('btn-chatbot-send');

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', () => sendChatMessage(chatInput.value));
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage(chatInput.value);
    });
  }
}

async function sendChatMessage(text) {
  if (!text || !text.trim()) return;

  const chatContainer = document.getElementById('chatbot-messages');
  const chatInput = document.getElementById('chatbot-input');

  // Append User message
  chatContainer.innerHTML += `
    <div class="flex justify-end mb-3">
      <div class="bg-primary text-white text-sm py-2 px-4 rounded-2xl max-w-xs shadow">
        ${text}
      </div>
    </div>
  `;

  chatInput.value = '';
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // AI Loading message
  const loadingId = 'msg-' + Date.now();
  chatContainer.innerHTML += `
    <div id="${loadingId}" class="flex justify-start mb-3">
      <div class="bg-surface-container-low text-on-surface text-sm py-2 px-4 rounded-2xl max-w-xs border border-border-subtle flex items-center gap-2">
        <span class="material-symbols-outlined animate-spin text-xs">progress_activity</span> ReviewAI thinking...
      </div>
    </div>
  `;
  chatContainer.scrollTop = chatContainer.scrollHeight;

  let botAnswer = '';

  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: text,
        contract: currentAnalysis?.openapi_spec || {},
        history: chatHistory
      })
    });

    if (res.ok) {
      const data = await res.json();
      botAnswer = data.answer;
    } else {
      throw new Error();
    }
  } catch (e) {
    botAnswer = generateSimulatedChatResponse(text);
  }

  // Replace Loading message with bot response
  const loadingElem = document.getElementById(loadingId);
  if (loadingElem) {
    loadingElem.outerHTML = `
      <div class="flex justify-start mb-3">
        <div class="bg-surface-container-lowest text-on-surface text-sm py-3 px-4 rounded-2xl max-w-sm border border-border-subtle shadow-sm">
          <div class="font-bold text-xs text-primary mb-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">smart_toy</span> ReviewAI Assistant
          </div>
          ${botAnswer}
        </div>
      </div>
    `;
  }
  chatContainer.scrollTop = chatContainer.scrollHeight;

  chatHistory.push({ role: 'user', content: text });
  chatHistory.push({ role: 'assistant', content: botAnswer });
}

function generateSimulatedChatResponse(q) {
  const query = q.toLowerCase();
  if (query.includes('bug') || query.includes('error')) {
    return "To resolve the detected bug, wrap your asynchronous database/fetch operations inside a try-catch block and return an HTTP 500 status code with a clean error message.";
  } else if (query.includes('security') || query.includes('auth')) {
    return "Ensure JWT secret keys are never committed directly to your repository. Store them securely in a `.env` file and access them via environment variables.";
  } else if (query.includes('score')) {
    return "Your AI Quality Score is calculated based on code readability, security vulnerability checks, error code completeness, and API documentation coverage.";
  }
  return "ReviewAI analyzes code patterns to bridge junior developer execution with senior-level precision. You can ask me how to fix specific bugs, add missing OpenAPI schemas, or optimize performance!";
}

// Toast Notifications
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="material-symbols-outlined text-primary-fixed">info</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ==========================================
// AUTHORITY PANEL INTERACTIVE HELPERS
// ==========================================
window.switchAuthorityTab = function(tabName) {
  const tabs = ['timeline', 'backlog', 'submissions', 'projects', 'team'];
  tabs.forEach(t => {
    const btn = document.getElementById(`authtab-${t}`);
    const content = document.getElementById(`authview-tab-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'authtab-btn px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white shadow';
      } else {
        btn.className = 'authtab-btn px-5 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-low';
      }
    }
    if (content) {
      if (t === tabName) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
  });
};

window.handleAuthProjectSelect = function(projId) {
  const subtitle = document.getElementById('auth-project-subtitle');
  const selectElem = document.getElementById('auth-project-select');
  if (selectElem) selectElem.value = projId;

  const names = {
    'PRJ-8812': 'Stripe Billing & Subscription Engine',
    'PRJ-4091': 'Linear Core Sync Architecture',
    'PRJ-1029': 'Notion Block Editor Refactoring'
  };

  if (subtitle) {
    subtitle.innerText = `Currently viewing ${projId} : ${names[projId] || 'Microservice Architecture'}`;
  }
  showToast(`Switched active project focus to ${projId}`);
};

window.applyAuthTemplate = function(templateType) {
  const title = document.getElementById('auth-task-title');
  const desc = document.getElementById('auth-task-desc');
  if (templateType === 'Stripe Webhooks') {
    if (title) title.value = 'Implement Stripe Webhook HMAC Verification & Retry';
    if (desc) desc.value = `### Deliverables\n- [ ] Add HMAC signature verification\n- [ ] Implement exponential retry queue with Redis`;
  } else if (templateType === 'OAuth2 Flow') {
    if (title) title.value = 'Refactor OAuth2 Refresh Token Rotation';
    if (desc) desc.value = `### Deliverables\n- [ ] Silent refresh token rotation before TTL expiry\n- [ ] Store token in HttpOnly secure cookie`;
  } else if (templateType === 'Redis Caching') {
    if (title) title.value = 'User Session Cache Invalidation Engine';
    if (desc) desc.value = `### Deliverables\n- [ ] Write-through caching pattern\n- [ ] 15-minute TTL setting for session tokens`;
  }
  showToast(`Applied preset: ${templateType}`);
};

window.publishAuthBacklog = function() {
  const title = document.getElementById('auth-task-title')?.value || 'New Sprint Task';
  showToast(`Published Sprint Backlog: ${title}`);
};

window.addAuthMember = function() {
  const name = document.getElementById('new-mem-name')?.value;
  const role = document.getElementById('new-mem-role')?.value;
  const email = document.getElementById('new-mem-email')?.value;

  if (!name || !role || !email) {
    showToast('Please complete all member fields.');
    return;
  }

  const list = document.getElementById('auth-team-directory-list');
  if (list) {
    const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase();
    const div = document.createElement('div');
    div.className = 'py-3 flex justify-between items-center';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">${initials}</div>
        <div><div class="font-bold text-sm">${name}</div><div class="text-xs text-on-surface-variant">${role} • ${email}</div></div>
      </div>
      <button onclick="deleteAuthMember(this, '${name}')" class="p-2 text-red-500 hover:bg-red-50 rounded-xl"><span class="material-symbols-outlined text-lg">delete</span></button>
    `;
    list.appendChild(div);
  }
  showToast(`Added ${name} to team group!`);
  document.getElementById('new-mem-name').value = '';
  document.getElementById('new-mem-role').value = '';
  document.getElementById('new-mem-email').value = '';
};

window.deleteAuthMember = function(btnElem, name) {
  const row = btnElem.closest('.py-3');
  if (row) row.remove();
  showToast(`Removed ${name} from team directory.`);
};

