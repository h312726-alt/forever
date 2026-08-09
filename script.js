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
const giscusModalContainer = commentsModal ? commentsModal.querySelector('.giscus-container') : null;

function openComments(title, term) {
  if (!commentsModal) return;

  const note = commentsModal.querySelector('.comments-modal__note');
  if (note) note.textContent = title ? `正在留言： ${title}` : '留言區';

  if (giscusModalContainer) {
    const needReload = giscusModalContainer.dataset.loaded !== 'true' || giscusModalContainer.dataset.term !== term;
    if (needReload) {
      giscusModalContainer.innerHTML = '';
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.setAttribute('data-repo', 'YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME');
      s.setAttribute('data-repo-id', 'YOUR_REPO_ID');
      s.setAttribute('data-category', 'General');
      s.setAttribute('data-category-id', 'YOUR_CATEGORY_ID');
      s.setAttribute('data-mapping', 'specific');
      s.setAttribute('data-term', term);
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-emit-metadata', '0');
      s.setAttribute('data-input-position', 'top');
      s.setAttribute('data-theme', document.body.dataset.theme === 'dark' ? 'dark' : 'light');
      s.setAttribute('crossorigin', 'anonymous');
      s.async = true;
      giscusModalContainer.appendChild(s);
      giscusModalContainer.dataset.loaded = 'true';
      giscusModalContainer.dataset.term = term;
    }
  }

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
