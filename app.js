let allGames = [];
let filteredGames = [];
let allApps = [];
let filteredApps = [];
let currentGameFile = null;
let recentGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
let isPanelOpen = false;

const GAMES_URL = 'https://cdn.jsdelivr.net/gh/greeniYT/gug@latest/json/game.json?v=' + Date.now();
const APPS_URL  = 'https://cdn.jsdelivr.net/gh/greeniYT/gug@latest/json/apps.json?v=' + Date.now();

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById('homeTab').style.display  = tabName === 'home'  ? 'block' : 'none';
  document.getElementById('gamesTab').style.display = tabName === 'games' ? 'block' : 'none';
  document.getElementById('appsTab').style.display  = tabName === 'apps'  ? 'block' : 'none';

  if (tabName === 'games' && allGames.length === 0) loadGames();
  if (tabName === 'apps'  && allApps.length  === 0) loadApps();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ===== GAMES LOADING =====
async function loadGames() {
  try {
    const response = await fetch(GAMES_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allGames = await response.json();
    if (!Array.isArray(allGames) || allGames.length === 0) throw new Error('No games found');
    filteredGames = [...allGames];
    document.getElementById('gameCount').textContent = allGames.length + ' of ' + allGames.length;
    renderGames();
    updateRecentDisplay();
    updateFeaturedTile();
  } catch (error) {
    showError('gamesContent', `Failed to load games: ${error.message}`);
  }
}

function renderGames() {
  const content = document.getElementById('gamesContent');
  if (filteredGames.length === 0) {
    content.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🎮</div>
        <div class="no-results-text">No games found</div>
        <div style="font-size: 13px; color: rgba(255,255,255,0.3);">Try a different search term</div>
      </div>`;
    return;
  }
  content.innerHTML = `
    <div class="games-grid">
      ${filteredGames.map(game => {
        const safeFile = game.file.replace(/'/g, "\\'");
        const safeName = game.name.replace(/'/g, "\\'");
        return `
          <div class="game-cover" onclick="playGame('${safeFile}', '${safeName}')">
            <img src="${game.image}" alt="${game.name}" loading="lazy">
            <div class="game-cover-info">
              <div class="game-cover-title">${game.name}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ===== APPS LOADING =====
async function loadApps() {
  try {
    const response = await fetch(APPS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allApps = await response.json();
    if (!Array.isArray(allApps) || allApps.length === 0) throw new Error('No apps found');
    filteredApps = [...allApps];
    document.getElementById('appCount').textContent = allApps.length + ' of ' + allApps.length;
    renderApps();
  } catch (error) {
    showError('appsContent', `Failed to load apps: ${error.message}`);
  }
}

function renderApps() {
  const content = document.getElementById('appsContent');
  if (filteredApps.length === 0) {
    content.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⬛</div>
        <div class="no-results-text">No apps found</div>
        <div style="font-size: 13px; color: rgba(255,255,255,0.3);">Try a different search term</div>
      </div>`;
    return;
  }
  content.innerHTML = `
    <div class="apps-grid">
      ${filteredApps.map(app => {
        const safeFile = app.file.replace(/'/g, "\\'");
        const safeName = app.name.replace(/'/g, "\\'");
        const desc = app.description || '';
        return `
          <div class="app-card" onclick="playGame('${safeFile}', '${safeName}')">
            <img src="${app.image || ''}" alt="${app.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="app-card-info">
              <div class="app-card-title">${app.name}</div>
              ${desc ? `<div class="app-card-desc">${desc}</div>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ===== FEATURED TILE =====
function updateFeaturedTile() {
  const last = recentGames[0];
  if (!last) return;
  const art = document.getElementById('featuredArt');
  const title = document.getElementById('featuredTitle');
  if (last.image) art.style.backgroundImage = `url('${last.image}')`;
  if (title) title.textContent = last.name;

  document.getElementById('dashFeatured').onclick = () => playGame(last.file, last.name);
}

// ===== RECENT =====
function updateRecentDisplay() {
  const recentRow = document.getElementById('recentRow');
  updateFeaturedTile();

  if (recentGames.length === 0) {
    recentRow.innerHTML = `
      <div class="no-results" style="padding: 40px; flex: 1;">
        <div class="no-results-icon">🕐</div>
        <div class="no-results-text" style="font-size: 14px;">No recent activity</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.3);">Games you play will appear here</div>
      </div>`;
    return;
  }
  recentRow.innerHTML = recentGames.slice(0, 8).map(game => {
    const safeFile = game.file.replace(/'/g, "\\'");
    const safeName = game.name.replace(/'/g, "\\'");
    return `
      <div class="recent-card" onclick="playGame('${safeFile}', '${safeName}')">
        <img src="${game.image || ''}" alt="${game.name}" loading="lazy">
        <div class="recent-card-info">
          <div class="recent-card-title">${game.name}</div>
          <div class="recent-card-meta">Played recently</div>
        </div>
      </div>`;
  }).join('');
}

function addToRecent(game) {
  recentGames = recentGames.filter(g => g.name !== game.name);
  recentGames.unshift(game);
  if (recentGames.length > 10) recentGames.pop();
  localStorage.setItem('recentGames', JSON.stringify(recentGames));
  updateRecentDisplay();
}

// ===== ERROR =====
function showError(containerId, message) {
  document.getElementById(containerId).innerHTML = `
    <div class="error">
      <div class="error-icon">⚠</div>
      <strong style="font-size: 18px; display: block; margin-bottom: 8px;">Error Loading</strong>
      <div>${message}</div>
      <button onclick="location.reload()">Retry</button>
    </div>`;
}

// ===== FILTER =====
function filterGames(query) {
  const lowerQuery = query.toLowerCase().trim();
  filteredGames = lowerQuery === '' ? [...allGames] : allGames.filter(g => g.name.toLowerCase().includes(lowerQuery));
  document.getElementById('gameCount').textContent = filteredGames.length + ' of ' + allGames.length;
  renderGames();
}

function filterApps(query) {
  const lowerQuery = query.toLowerCase().trim();
  filteredApps = lowerQuery === '' ? [...allApps] : allApps.filter(a => a.name.toLowerCase().includes(lowerQuery));
  document.getElementById('appCount').textContent = filteredApps.length + ' of ' + allApps.length;
  renderApps();
}

// ===== OVERLAY CONTROLS =====
const overlay = document.getElementById('gameOverlay');
const topHotspot = document.getElementById('topHotspot');
const dropdownBtn = document.getElementById('dropdownBtn');
const sidePanel = document.getElementById('sidePanel');
const panelBackdrop = document.getElementById('panelBackdrop');

topHotspot.addEventListener('mouseenter', () => dropdownBtn.classList.add('visible'));
dropdownBtn.addEventListener('mouseenter', () => dropdownBtn.classList.add('visible'));

let hideTimeout;
function scheduleHide() {
  hideTimeout = setTimeout(() => {
    if (!sidePanel.classList.contains('open')) dropdownBtn.classList.remove('visible');
  }, 300);
}

topHotspot.addEventListener('mouseleave', scheduleHide);
dropdownBtn.addEventListener('mouseleave', scheduleHide);
topHotspot.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
dropdownBtn.addEventListener('mouseenter', () => clearTimeout(hideTimeout));

dropdownBtn.addEventListener('click', () => {
  isPanelOpen = !isPanelOpen;
  if (isPanelOpen) {
    sidePanel.classList.add('open');
    panelBackdrop.classList.add('active');
    dropdownBtn.classList.add('open');
  } else {
    closePanel();
  }
});

function closePanel() {
  isPanelOpen = false;
  sidePanel.classList.remove('open');
  panelBackdrop.classList.remove('active');
  dropdownBtn.classList.remove('open');
  dropdownBtn.classList.remove('visible');
}

panelBackdrop.addEventListener('click', closePanel);
document.getElementById('sidePanelClose').addEventListener('click', closePanel);

// ===== PLAY GAME =====
async function playGame(file, name) {
  currentGameFile = file;
  const gameData = allGames.find(g => g.file === file) || allApps.find(a => a.file === file) || { name, file };
  addToRecent(gameData);

  overlay.classList.add('active');
  const gameContent = document.getElementById('gameContent');
  gameContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>Loading ${name}...</span></div>`;
  closePanel();

  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (file.includes('drive.google.com')) {
      const iframe = document.createElement('iframe');
      iframe.src = file;
      iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups', 'allow-fullscreen');
      gameContent.innerHTML = '';
      gameContent.appendChild(iframe);
    } else {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load');
      const html = await response.text();
      const iframe = document.createElement('iframe');
      iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups', 'allow-fullscreen', 'allow-modals', 'allow-pointer-lock');
      gameContent.innerHTML = '';
      gameContent.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    }
  } catch (error) {
    gameContent.innerHTML = `
      <div style="color: #ff8888; padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠</div>
        <strong style="font-size: 18px;">Error</strong><br><br>${error.message}
      </div>`;
  }
}

document.getElementById('newTabBtn').addEventListener('click', async () => {
  if (!currentGameFile) return;
  try {
    const response = await fetch(currentGameFile, { cache: 'no-store' });
    const html = await response.text();
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const iframe = document.querySelector('.game-content iframe');
  if (iframe?.requestFullscreen) iframe.requestFullscreen().catch(err => console.log(err));
});

document.getElementById('closeGameBtn').addEventListener('click', () => {
  overlay.classList.remove('active');
  document.getElementById('gameContent').innerHTML = '';
  closePanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isPanelOpen) closePanel();
    else if (overlay.classList.contains('active')) document.getElementById('closeGameBtn').click();
  }
});

document.getElementById('searchInput').addEventListener('input', (e) => filterGames(e.target.value));
document.getElementById('appSearchInput').addEventListener('input', (e) => filterApps(e.target.value));

// ===== INIT =====
updateRecentDisplay();
loadGames();
