const fallbackReports = [
  { title: '', category: '', summary: '', time: '', tone: '' },
  { title: '', category: '', summary: '', time: '', tone: '' },
  { title: '', category: '', summary: '', time: '', tone: '' },
  { title: '', category: '', summary: '', time: '', tone: '' },
  { title: '', category: '', summary: '', time: '', tone: '' },
  { title: '', category: '', summary: '', time: '', tone: '' },
];

const grid = document.getElementById('reportGrid');
const filterButtons = document.querySelectorAll('.filter-button');
const clock = document.getElementById('liveClock');
const year = document.getElementById('year');
const reportsUrl = 'content/reports.json';
const EDITOR_STORAGE_KEY = 'verdo-editor-edits';

function loadEdits() {
  try {
    const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // sanitize some stored fields to remove accidental inline tags
    Object.keys(parsed).forEach((k) => {
      if (/^report\d+(Category|Title|MetaLabel|Time)$/.test(k)) {
        parsed[k] = stripTags(parsed[k]);
      }
    });
    return parsed;
  } catch {
    return {};
  }
}

function stripTags(input) {
  if (!input) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = input;
  return tmp.textContent || tmp.innerText || '';
}

function applyEdits(edits) {
  document.querySelectorAll('[data-edit-key]').forEach((element) => {
    const key = element.dataset.editKey;
    if (!Object.prototype.hasOwnProperty.call(edits, key)) return;
    const value = edits[key];

    // For small UI labels where HTML would break layout, apply as text only
    const forceTextKeys = /report\d+(Category|Title|MetaLabel|Time)$|^(siteTitle|reportsTitle|featuredTitle|heroTitle)$/;
    if (forceTextKeys.test(key) || element.classList.contains('tag')) {
      element.textContent = stripTags(value);
    } else {
      element.innerHTML = value;
    }
  });
}

function formatTime(date) {
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function renderReports(reports, filter = 'all') {
  const visibleReports =
    filter === 'all' ? reports : reports.filter((report) => report.category === filter);

  grid.innerHTML = visibleReports
    .map((report, i) => {
      // create a simple slug/term for per-article discussions
      const makeTerm = (s) => {
        if (!s) return `article-${i}`;
        return s
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '')
          .slice(0, 60);
      };
      const term = makeTerm(report.title || `article-${i}`);
      const idx = i + 1;
      return `
        <article class="report-card" data-tone="${report.tone}">
          <span class="tag" data-edit-key="report${idx}Category">${report.category}</span>
          <h4 data-edit-key="report${idx}Title">${report.title}</h4>
          <p data-edit-key="report${idx}Summary">${report.summary}</p>
          <div class="report-meta">
            <span data-edit-key="report${idx}MetaLabel">更新時間</span>
            <strong data-edit-key="report${idx}Time">${report.time}</strong>
          </div>
          <button class="report-comment-button" data-title="${report.title}" data-term="${term}">留言</button>
        </article>
      `;
    })
    .join('');
}

// Handle comment button clicks (delegation) -> open modal
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.report-comment-button');
  if (!btn) return;
  const title = btn.dataset.title || '';
  const term = btn.dataset.term || '';
  openComments(title, term);
});

const commentsModal = document.getElementById('commentsModal');

// Comments storage key
const COMMENTS_STORAGE_KEY = 'verdo-comments';

// Load comments from localStorage
function loadComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save comments to localStorage
function saveComments(commentsObj) {
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsObj));
  } catch (err) {
    console.error('Failed to save comments:', err);
  }
}

// Get comments for a specific article
function getCommentsByTerm(term) {
  const allComments = loadComments();
  return allComments[term] || [];
}

// Add a new comment
function addComment(term, name, text) {
  if (!text.trim()) return false;
  
  const allComments = loadComments();
  if (!allComments[term]) {
    allComments[term] = [];
  }
  
  const comment = {
    id: Date.now(),
    name: name.trim() || '匿名',
    text: text.trim(),
    time: new Date().toLocaleString('zh-TW'),
  };
  
  allComments[term].push(comment);
  saveComments(allComments);
  return true;
}

// Render comments for display
function renderComments(term) {
  const comments = getCommentsByTerm(term);
  const commentsList = document.getElementById('commentsList');
  
  if (!comments.length) {
    commentsList.innerHTML = '<p class="no-comments" style="text-align: center; color: var(--muted);">還沒有人留言，成為第一個吧！</p>';
    return;
  }
  
  commentsList.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <div class="comment-header">
        <strong class="comment-name">${escapeHtml(comment.name)}</strong>
        <span class="comment-time">${comment.time}</span>
      </div>
      <p class="comment-text">${escapeHtml(comment.text)}</p>
    </div>
  `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open comments modal
let currentCommentTerm = '';
function openComments(title, term) {
  if (!commentsModal) return;
  
  currentCommentTerm = term;
  
  // Update title
  const titleElement = document.getElementById('commentsArticleTitle');
  if (titleElement) {
    titleElement.textContent = title ? `正在留言：${title}` : '留言區';
  }
  
  // Clear form
  document.getElementById('commentName').value = '';
  document.getElementById('commentText').value = '';
  
  // Render existing comments
  renderComments(term);
  
  commentsModal.setAttribute('aria-hidden', 'false');
  commentsModal.classList.add('is-open');
  const closeBtn = commentsModal.querySelector('.comments-modal__close');
  if (closeBtn) closeBtn.focus();
}

function closeComments() {
  if (!commentsModal) return;
  commentsModal.setAttribute('aria-hidden', 'true');
  commentsModal.classList.remove('is-open');
}

// Handle comment submission
function setupCommentHandlers() {
  const submitBtn = document.getElementById('submitCommentBtn');
  const nameInput = document.getElementById('commentName');
  const textInput = document.getElementById('commentText');
  
  if (submitBtn && !submitBtn.dataset.setupDone) {
    submitBtn.dataset.setupDone = 'true';
    submitBtn.addEventListener('click', () => {
      const name = nameInput.value;
      const text = textInput.value;
      
      if (!text.trim()) {
        alert('請輸入留言內容');
        textInput.focus();
        return;
      }
      
      if (addComment(currentCommentTerm, name, text)) {
        renderComments(currentCommentTerm);
        nameInput.value = '';
        textInput.value = '';
        textInput.focus();
      }
    });
    
    // Submit on Ctrl+Enter or Cmd+Enter
    textInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        submitBtn.click();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCommentHandlers);
} else {
  setupCommentHandlers();
}

// Close modal on backdrop click or close button
if (commentsModal) {
  commentsModal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('comments-modal__close')) {
      closeComments();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeComments();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    const currentReports = window.__reportSource || fallbackReports;
    renderReports(currentReports, button.dataset.filter);
    try {
      applyEdits(loadEdits());
    } catch {}
  });
});

function updateClock() {
  const now = new Date();
  clock.textContent = formatTime(now);
  year.textContent = String(now.getFullYear());
}

async function loadReports() {
  try {
    const response = await fetch(reportsUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${reportsUrl}`);
    }

    const data = await response.json();
    window.__reportSource = Array.isArray(data) ? data : data.reports || fallbackReports;
  } catch (error) {
    window.__reportSource = fallbackReports;
  }

  renderReports(window.__reportSource);
  try {
    applyEdits(loadEdits());
  } catch {}
}

loadReports();
updateClock();
setInterval(updateClock, 30000);

const form = document.querySelector('.subscribe-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('email');
    if (input.value.trim()) {
      input.value = '';
      input.placeholder = '已成功訂閱，謝謝你';
    }
  });
}

const editorShortcut = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowRight',
  'ArrowRight',
];
const shortcutBuffer = [];

const THEME_STORAGE_KEY = 'verdo-theme';
const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');

function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  } catch {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeToggleButtons.forEach((button) => {
    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  });
}

applyTheme(getPreferredTheme());

themeToggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures.
    }
  });
});

const adminLink = document.getElementById('adminLink');
const ADMIN_VISIBLE_KEY = 'verdo-admin-visible';
if (adminLink) {
  try {
    const wasVisible = sessionStorage.getItem(ADMIN_VISIBLE_KEY) === '1';
    adminLink.hidden = !wasVisible;
    if (wasVisible) adminLink.classList.add('is-visible');
    else adminLink.classList.remove('is-visible');
  } catch {
    adminLink.hidden = true;
    adminLink.classList.remove('is-visible');
  }
}

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (!editorShortcut.includes(event.key)) {
    return;
  }

  shortcutBuffer.push(event.key);
  if (shortcutBuffer.length > editorShortcut.length) {
    shortcutBuffer.shift();
  }

  const matched = editorShortcut.every((key, index) => shortcutBuffer[index] === key);
  if (matched) {
    if (adminLink) {
      try {
        sessionStorage.setItem(ADMIN_VISIBLE_KEY, '1');
      } catch {}
      adminLink.hidden = false;
      adminLink.classList.add('is-visible');
      adminLink.focus({ preventScroll: true });
    }
    shortcutBuffer.length = 0;
  }
});
