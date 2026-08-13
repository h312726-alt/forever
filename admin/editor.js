// Supabase 配置
const SUPABASE_URL = 'https://ohxfigyfndsbdrdaobjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_thOWpBPmw188fTMFLkmD7g_HogvWmaN';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY = 'verdo-editor-edits';
const THEME_STORAGE_KEY = 'verdo-theme';
const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');

const defaults = {};

document.querySelectorAll('[data-edit-key]').forEach((element) => {
  defaults[element.dataset.editKey] = stripTags(element.innerHTML || element.textContent || '');
});

function stripTags(input) {
  if (!input) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = input;
  return tmp.textContent || tmp.innerText || '';
}

async function loadEdits() {
  try {
    const { data, error } = await supabase.from('edits').select('*');
    if (error) {
      console.warn('Supabase load error:', error);
      return {};
    }
    const edits = {};
    data.forEach((row) => {
      edits[row.key] = row.value;
    });
    return edits;
  } catch (err) {
    console.warn('Failed to load edits:', err);
    return {};
  }
}

function applyEdits(edits) {
  document.querySelectorAll('[data-edit-key]').forEach((element) => {
    const key = element.dataset.editKey;
    if (Object.prototype.hasOwnProperty.call(edits, key)) {
      element.textContent = stripTags(edits[key]);
    }
  });
}

function collectEdits() {
  const edits = {};
  document.querySelectorAll('[data-edit-key]').forEach((element) => {
    edits[element.dataset.editKey] = stripTags(element.innerHTML || element.textContent || '');
  });
  return edits;
}

async function persistEdits() {
  const edits = collectEdits();
  try {
    for (const [key, value] of Object.entries(edits)) {
      await supabase.from('edits').upsert(
        { key, value },
        { onConflict: 'key' }
      );
    }
    console.log('Edits saved to Supabase');
  } catch (err) {
    console.error('Failed to save edits:', err);
  }
}

async function resetEdits() {
  try {
    await supabase.from('edits').delete().gte('id', 0);
    applyEdits(defaults);
    console.log('Edits reset');
  } catch (err) {
    console.error('Failed to reset edits:', err);
  }
}

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

function formatTime(date) {
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function updateClock() {
  const clock = document.getElementById('liveClock');
  const year = document.getElementById('year');
  const now = new Date();

  if (clock) {
    clock.textContent = formatTime(now);
  }

  if (year) {
    year.textContent = String(now.getFullYear());
  }
}

// Initialize on page load
(async () => {
  const edits = await loadEdits();
  applyEdits(edits);
})();

applyTheme(getPreferredTheme());
updateClock();
setInterval(updateClock, 30000);

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

document.querySelectorAll('[contenteditable="true"]').forEach((element) => {
  // Force paste as plain text to avoid bringing attributes or inline tags
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    // Insert as plain text at cursor
    document.execCommand('insertText', false, text);
  });

  element.addEventListener('blur', () => persistEdits());
});

document.getElementById('editorSave').addEventListener('click', () => persistEdits());
document.getElementById('editorReset').addEventListener('click', () => resetEdits());
