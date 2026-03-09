// ─────────────────────────────────────────────
//  Main book app — index.html
// ─────────────────────────────────────────────

const db = getSupabase();

// ── State ──────────────────────────────────────
let blessings  = [];   // all loaded blessings
let currentPage = 0;   // which spread we're viewing (0 = cover spread)
let isFlipping  = false;

// ── DOM refs ───────────────────────────────────
const pagesWrapper   = document.getElementById('pagesWrapper');
const prevBtn        = document.getElementById('prevBtn');
const nextBtn        = document.getElementById('nextBtn');
const pageIndicator  = document.getElementById('pageIndicator');
const loadingScreen  = document.getElementById('loadingScreen');
const emptyState     = document.getElementById('emptyState');
const cornerNext     = document.getElementById('cornerNext');
const cornerPrev     = document.getElementById('cornerPrev');

// ── Boot ───────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  spawnPetals();
  await loadBlessings();
  hideLoading();
});

// ── Load data ──────────────────────────────────
async function loadBlessings() {
  try {
    const { data, error } = await db
      .from('blessings')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    blessings = data || [];
  } catch (err) {
    console.error('Could not load blessings:', err.message);
    blessings = [];
  }
  renderBook();
}

// ── Render ─────────────────────────────────────
function renderBook() {
  // Remove only page spreads — preserve corner hotspots and other children
  pagesWrapper.querySelectorAll('.page-spread').forEach(el => el.remove());

  if (blessings.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  // Build page elements: [cover-spread, blessing-spread-0, blessing-spread-1, …, back-spread]
  // Each "spread" = left page + right page, rendered as a pair.
  // We show one spread at a time.

  const spreads = buildSpreads(blessings);

  spreads.forEach((spread, i) => {
    const el = document.createElement('div');
    el.className = 'page-spread';
    el.dataset.index = i;
    if (i === currentPage) el.classList.add('active');
    el.innerHTML = spread;
    pagesWrapper.appendChild(el);
  });

  updateNav(spreads.length);
}

// Build an array of HTML strings, one per spread
function buildSpreads(blessings) {
  const spreads = [];

  // ── Spread 0: Cover ───────────────────────────
  spreads.push(`
    <div class="page page--left page--cover-left">
      <div class="page-inner">
        <div class="cover-decoration cover-decoration--left">
          <div class="cover-flowers">✿ ❀ ✿</div>
          <div class="cover-rule"></div>
        </div>
      </div>
    </div>
    <div class="page page--right page--cover-right">
      <div class="page-inner">
        <div class="cover-content">
          <p class="cover-label">A Book of Blessings for</p>
          <h1 class="cover-name">Larrissa</h1>
          <p class="cover-ampersand">&amp; her little one</p>
          <div class="cover-flowers cover-flowers--big">✿ ❀ ✾</div>
          <p class="cover-date">${new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  `);

  // ── Spreads 1…n: Blessings (2 per spread) ────
  for (let i = 0; i < blessings.length; i += 2) {
    const left  = blessings[i];
    const right = blessings[i + 1] || null;

    spreads.push(`
      <div class="page page--left">
        <div class="page-inner">
          ${blessingPageHTML(left, i + 1)}
        </div>
      </div>
      <div class="page page--right">
        <div class="page-inner">
          ${right ? blessingPageHTML(right, i + 2) : blankPageHTML()}
        </div>
      </div>
    `);
  }

  // ── Last spread: Back cover ───────────────────
  spreads.push(`
    <div class="page page--left page--back-cover">
      <div class="page-inner">
        <div class="back-cover-content">
          <p class="back-quote">"Every child begins the world again."</p>
          <p class="back-quote-attr">— Henry David Thoreau</p>
          <div class="cover-flowers">✿ ❀ ✿</div>
        </div>
      </div>
    </div>
    <div class="page page--right page--back-cover-right">
      <div class="page-inner"></div>
    </div>
  `);

  return spreads;
}

function blessingPageHTML(b, pageNum) {
  const photoHTML = b.photo_url
    ? `<div class="blessing-photo-wrap"><img src="${escapeAttr(b.photo_url)}" alt="Photo from ${escapeHtml(b.name)}" class="blessing-photo" loading="lazy" /></div>`
    : '';

  return `
    <div class="blessing-page">
      ${photoHTML}
      <div class="blessing-flourish">✦</div>
      <blockquote class="blessing-text">${escapeHtml(b.blessing)}</blockquote>
      <div class="blessing-sig">
        <span class="blessing-name">${escapeHtml(b.name)}</span>
        ${b.relationship ? `<span class="blessing-rel">${escapeHtml(b.relationship)}</span>` : ''}
      </div>
      <div class="page-number">${pageNum}</div>
    </div>
  `;
}

function blankPageHTML() {
  return `<div class="blank-page"><span class="blank-ornament">✿</span></div>`;
}

// ── Navigation ─────────────────────────────────
function updateNav(total) {
  const atStart = currentPage === 0;
  const atEnd   = currentPage === total - 1;
  prevBtn.disabled = atStart;
  nextBtn.disabled = atEnd;
  pageIndicator.textContent = `${currentPage + 1} / ${total}`;
  cornerPrev.style.opacity = atStart ? '0' : '1';
  cornerPrev.style.pointerEvents = atStart ? 'none' : 'auto';
  cornerNext.style.opacity = atEnd   ? '0' : '1';
  cornerNext.style.pointerEvents = atEnd   ? 'none' : 'auto';
}

function goTo(index) {
  if (isFlipping) return;
  const spreads = [...pagesWrapper.querySelectorAll('.page-spread')];
  if (index < 0 || index >= spreads.length) return;

  isFlipping = true;
  const forward = index > currentPage;
  const fromSpread = spreads[currentPage];
  const toSpread   = spreads[index];

  // Stack: from-spread on top, to-spread underneath
  fromSpread.style.zIndex = '3';
  toSpread.classList.add('active');
  toSpread.style.zIndex = '1';

  // Create a single flipping half-page (the turning side)
  const flipper = document.createElement('div');
  flipper.className = `page-flipper page-flipper--${forward ? 'forward' : 'backward'}`;
  pagesWrapper.appendChild(flipper);

  // At the halfway point the flipper is edge-on — swap the spread content
  // without the user noticing (classic book-flip trick)
  const swapTimer = setTimeout(() => {
    fromSpread.classList.remove('active');
    fromSpread.style.zIndex = '';
    toSpread.style.zIndex = '';
    currentPage = index;
    updateNav(spreads.length);
  }, 260); // ~half of 520ms animation

  flipper.addEventListener('animationend', () => {
    flipper.remove();
    isFlipping = false;
  }, { once: true });
}

prevBtn.addEventListener('click', () => goTo(currentPage - 1));
nextBtn.addEventListener('click', () => goTo(currentPage + 1));
cornerNext.addEventListener('click', () => goTo(currentPage + 1));
cornerPrev.addEventListener('click', () => goTo(currentPage - 1));

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentPage - 1);
});

// Swipe navigation
let touchStartX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) dx < 0 ? goTo(currentPage + 1) : goTo(currentPage - 1);
});

// ── Utilities ──────────────────────────────────
function hideLoading() {
  loadingScreen.style.opacity = '0';
  setTimeout(() => loadingScreen.style.display = 'none', 500);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str = '') {
  return String(str).replace(/"/g, '%22');
}

function spawnPetals() {
  const container = document.getElementById('petals');
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (7 + Math.random() * 9) + 's';
    p.style.animationDelay    = (Math.random() * 12) + 's';
    p.style.fontSize = (10 + Math.random() * 16) + 'px';
    p.style.opacity  = (0.3 + Math.random() * 0.5).toString();
    p.textContent = ['✿', '❀', '✾', '❁', '✽'][Math.floor(Math.random() * 5)];
    container.appendChild(p);
  }
}
