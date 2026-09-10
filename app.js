/**
 * Neko的AI白嫖指南 - 主应用逻辑
 */

// 状态管理
const state = {
  currentCategory: 'all',
  activeTag: null,
  searchQuery: '',
  showFavoritesOnly: false,
  favorites: JSON.parse(localStorage.getItem('neko_fav_sites') || '[]'),
  theme: localStorage.getItem('neko_theme') || 'dark',
  sakuraEnabled: localStorage.getItem('neko_sakura') !== 'false',
};

// DOM 元素引用
const dom = {
  cardsGrid: document.getElementById('cards-grid'),
  categoryTabs: document.getElementById('category-tabs'),
  tagsCloud: document.getElementById('tags-cloud'),
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  resultCount: document.getElementById('result-count'),
  resetFilterBtn: document.getElementById('reset-filter-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  sakuraToggleBtn: document.getElementById('sakura-toggle-btn'),
  luckyBtn: document.getElementById('lucky-btn'),
  clientGuideBtn: document.getElementById('client-guide-btn'),
  guideModal: document.getElementById('guide-modal'),
  luckyModal: document.getElementById('lucky-modal'),
  toastContainer: document.getElementById('toast-container'),
  sakuraCanvas: document.getElementById('sakura-canvas'),
  controlsPanel: document.getElementById('controls-panel'),
};

// 类别图标映射
const CATEGORY_AVATARS = {
  api: '⚡',
  featured: '🎁',
  coding: '💻',
  chat: '💬',
  drawing: '🎨',
  fast: '🚀'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSakuraCanvas();
  renderCategoryTabs();
  renderTagsCloud();
  bindEvents();
  renderCards();
});

// 主题初始化
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('neko_theme', state.theme);
  updateThemeIcon();
  showToast(state.theme === 'dark' ? '已切换至 暗夜霓虹粉 🌸' : '已切换至 甜美日光粉 🍓');
}

function updateThemeIcon() {
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.innerHTML = state.theme === 'dark' ? '🌙 模式' : '☀️ 模式';
  }
}

// 樱花飘落画布动画
let sakuraAnimationId = null;
const sakuraPetals = [];

function initSakuraCanvas() {
  if (!dom.sakuraCanvas) return;
  const ctx = dom.sakuraCanvas.getContext('2d');
  
  function resizeCanvas() {
    dom.sakuraCanvas.width = window.innerWidth;
    dom.sakuraCanvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const petalCount = window.innerWidth < 768 ? 24 : 45;
  sakuraPetals.length = 0;

  for (let i = 0; i < petalCount; i++) {
    sakuraPetals.push({
      x: Math.random() * dom.sakuraCanvas.width,
      y: Math.random() * dom.sakuraCanvas.height,
      size: Math.random() * 8 + 6,
      speedX: Math.random() * 1.5 - 0.5,
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 2 - 1,
      opacity: Math.random() * 0.5 + 0.35,
      color: Math.random() > 0.4 ? '#ffb7d2' : '#ff7aa8',
    });
  }

  function render() {
    ctx.clearRect(0, 0, dom.sakuraCanvas.width, dom.sakuraCanvas.height);

    if (state.sakuraEnabled) {
      for (const petal of sakuraPetals) {
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate((petal.rotation * Math.PI) / 180);
        ctx.globalAlpha = petal.opacity;

        // 绘制花瓣图形
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-petal.size / 2, -petal.size / 2, -petal.size / 2, petal.size / 2, 0, petal.size);
        ctx.bezierCurveTo(petal.size / 2, petal.size / 2, petal.size / 2, -petal.size / 2, 0, 0);
        ctx.fillStyle = petal.color;
        ctx.fill();
        ctx.restore();

        petal.x += petal.speedX;
        petal.y += petal.speedY;
        petal.rotation += petal.rotationSpeed;

        if (petal.y > dom.sakuraCanvas.height + 20) {
          petal.y = -20;
          petal.x = Math.random() * dom.sakuraCanvas.width;
        }
        if (petal.x > dom.sakuraCanvas.width + 20) {
          petal.x = -20;
        }
      }
    }

    sakuraAnimationId = requestAnimationFrame(render);
  }

  if (sakuraAnimationId) cancelAnimationFrame(sakuraAnimationId);
  render();
}

function toggleSakura() {
  state.sakuraEnabled = !state.sakuraEnabled;
  localStorage.setItem('neko_sakura', state.sakuraEnabled);
  if (dom.sakuraToggleBtn) {
    dom.sakuraToggleBtn.innerHTML = state.sakuraEnabled ? '🌸 樱花: 开' : '🌸 樱花: 关';
  }
  showToast(state.sakuraEnabled ? '已开启浪漫樱花特效 🌸' : '已关闭樱花特效 🍃');
}

// 渲染分类 Tab 按钮
function renderCategoryTabs() {
  if (!dom.categoryTabs) return;
  dom.categoryTabs.innerHTML = '';

  // 计算各分类站点数
  const counts = { all: SITES_DATA.length };
  SITES_DATA.forEach(site => {
    counts[site.category] = (counts[site.category] || 0) + 1;
  });

  Object.entries(SITE_CATEGORIES).forEach(([key, meta]) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${state.currentCategory === key ? 'active' : ''}`;
    btn.innerHTML = `
      <span>${meta.icon}</span>
      <span>${meta.name}</span>
      <span class="tab-count">${counts[key] || 0}</span>
    `;
    btn.onclick = () => {
      state.currentCategory = key;
      renderCategoryTabs();
      renderCards();
    };
    dom.categoryTabs.appendChild(btn);
  });
}

// 渲染热门标签
function renderTagsCloud() {
  if (!dom.tagsCloud) return;
  dom.tagsCloud.innerHTML = '';

  HOT_TAGS.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = `tag-chip ${state.activeTag === tag ? 'active' : ''}`;
    chip.innerText = `# ${tag}`;
    chip.onclick = () => {
      state.activeTag = state.activeTag === tag ? null : tag;
      renderTagsCloud();
      renderCards();
    };
    dom.tagsCloud.appendChild(chip);
  });
}

// 过滤站点
function getFilteredSites() {
  return SITES_DATA.filter(site => {
    // 类别过滤
    if (state.currentCategory !== 'all' && site.category !== state.currentCategory) {
      return false;
    }

    // 标签过滤
    if (state.activeTag && !site.tags.includes(state.activeTag)) {
      return false;
    }

    // 仅看收藏
    if (state.showFavoritesOnly && !state.favorites.includes(site.id)) {
      return false;
    }

    // 搜索词过滤
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      const matchName = site.name.toLowerCase().includes(q);
      const matchDesc = site.desc.toLowerCase().includes(q);
      const matchPerk = (site.freePerk || '').toLowerCase().includes(q);
      const matchTags = site.tags.some(t => t.toLowerCase().includes(q));
      const matchUrl = site.url.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchPerk && !matchTags && !matchUrl) {
        return false;
      }
    }

    return true;
  });
}

// 渲染站点卡片
function renderCards() {
  if (!dom.cardsGrid) return;
  const filtered = getFilteredSites();

  // 更新计数
  if (dom.resultCount) {
    dom.resultCount.innerText = `已展示 ${filtered.length} 个站点`;
  }

  // 是否显示重置按钮
  const hasFilter = state.currentCategory !== 'all' || state.activeTag || state.searchQuery.trim() || state.showFavoritesOnly;
  if (dom.resetFilterBtn) {
    dom.resetFilterBtn.style.display = hasFilter ? 'inline-block' : 'none';
  }

  if (filtered.length === 0) {
    dom.cardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🐱💦</div>
        <div class="empty-text">喵呜~ 没有找到符合条件的站点呢！</div>
        <button class="nav-btn primary-btn" onclick="resetFilters()">清空所有筛选条件</button>
      </div>
    `;
    return;
  }

  dom.cardsGrid.innerHTML = filtered.map(site => {
    const isFav = state.favorites.includes(site.id);
    const avatarIcon = CATEGORY_AVATARS[site.category] || '✨';
    const categoryName = SITE_CATEGORIES[site.category]?.name || '其他分类';

    return `
      <div class="site-card" data-id="${site.id}">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-avatar">${avatarIcon}</div>
            <div>
              <div class="card-name">${escapeHtml(site.name)}</div>
              <div class="card-category-tag">${categoryName}</div>
            </div>
          </div>
          <span class="card-badge badge-${site.badgeType || 'hot'}">${site.badge}</span>
        </div>

        <div class="card-desc">${escapeHtml(site.desc)}</div>

        <div class="perk-banner">
          <span>🎁</span>
          <div><strong>白嫖福利:</strong> ${escapeHtml(site.freePerk)}</div>
        </div>

        <div class="card-tags">
          ${site.tags.map(t => `<span class="mini-tag" onclick="filterByTag('${escapeHtml(t)}')">#${escapeHtml(t)}</span>`).join('')}
        </div>

        <div class="card-actions">
          <a href="${site.url}" target="_blank" rel="noopener noreferrer" class="action-btn primary">
            <span>立即直达</span>
            <span>🚀</span>
          </a>
          <button class="action-btn ghost" title="复制邀请链接" onclick="copyText('${site.url}', '已复制 ${escapeHtml(site.name)} 邀请链接到剪贴板 🐾')">
            <span>🔗</span>
          </button>
          <button class="action-btn ghost" title="复制接口 Base URL" onclick="copyText('${site.baseUrl}', '已复制 Base URL: ${site.baseUrl}')">
            <span>⚡</span>
          </button>
          <button class="action-btn ghost favorite-btn ${isFav ? 'active' : ''}" title="${isFav ? '取消收藏' : '加入收藏'}" onclick="toggleFavorite(${site.id})">
            <span>${isFav ? '★' : '☆'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 绑定事件
function bindEvents() {
  // 搜索输入
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (dom.searchClearBtn) {
        dom.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      }
      renderCards();
    });

    // 快捷键 Ctrl+K 聚焦搜索
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dom.searchInput.focus();
      }
    });
  }

  // 清除搜索
  if (dom.searchClearBtn) {
    dom.searchClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      dom.searchInput.value = '';
      dom.searchClearBtn.style.display = 'none';
      renderCards();
      dom.searchInput.focus();
    });
  }

  // 重置所有筛选
  if (dom.resetFilterBtn) {
    dom.resetFilterBtn.addEventListener('click', resetFilters);
  }

  // 主题切换
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // 樱花特效切换
  if (dom.sakuraToggleBtn) {
    dom.sakuraToggleBtn.addEventListener('click', toggleSakura);
  }

  // 客户端教程弹窗
  if (dom.clientGuideBtn && dom.guideModal) {
    dom.clientGuideBtn.addEventListener('click', () => openModal(dom.guideModal));
  }

  // 抽签手气不错
  if (dom.luckyBtn && dom.luckyModal) {
    dom.luckyBtn.addEventListener('click', triggerLuckyPick);
  }

  // 弹窗关闭控制
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.modal-close-btn')) {
        closeModal(overlay);
      }
    });
  });

  // ESC 键关闭弹窗
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
    }
  });
}

// 收藏切换
function toggleFavorite(siteId) {
  const index = state.favorites.indexOf(siteId);
  if (index >= 0) {
    state.favorites.splice(index, 1);
    showToast('已取消收藏 💔');
  } else {
    state.favorites.push(siteId);
    showToast('已加入我的心愿单 ⭐');
  }
  localStorage.setItem('neko_fav_sites', JSON.stringify(state.favorites));
  renderCards();
}

// 点击标签快速过滤
function filterByTag(tag) {
  state.activeTag = state.activeTag === tag ? null : tag;
  renderTagsCloud();
  renderCards();
  window.scrollTo({ top: dom.controlsPanel ? dom.controlsPanel.offsetTop - 20 : 400, behavior: 'smooth' });
}

// 重置过滤器
function resetFilters() {
  state.currentCategory = 'all';
  state.activeTag = null;
  state.searchQuery = '';
  state.showFavoritesOnly = false;
  if (dom.searchInput) dom.searchInput.value = '';
  if (dom.searchClearBtn) dom.searchClearBtn.style.display = 'none';
  renderCategoryTabs();
  renderTagsCloud();
  renderCards();
  showToast('已重置所有过滤条件 🌸');
}

// 手气不错盲盒
function triggerLuckyPick() {
  const randomIndex = Math.floor(Math.random() * SITES_DATA.length);
  const picked = SITES_DATA[randomIndex];
  
  const luckyContent = document.getElementById('lucky-content');
  if (luckyContent) {
    luckyContent.innerHTML = `
      <div class="lucky-card">
        <div class="lucky-icon">🎊</div>
        <div class="lucky-title">${escapeHtml(picked.name)}</div>
        <div class="lucky-desc">${escapeHtml(picked.desc)}</div>
        <div class="perk-banner" style="max-width: 480px; margin: 0 auto 20px;">
          <span>🎁</span>
          <div><strong>白嫖福利:</strong> ${escapeHtml(picked.freePerk)}</div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="${picked.url}" target="_blank" rel="noopener noreferrer" class="nav-btn primary-btn" style="padding: 10px 24px; font-size: 1rem;">
            立即直达白嫖 🚀
          </a>
          <button class="nav-btn" onclick="triggerLuckyPick()">
            再抽一次 🎲
          </button>
        </div>
      </div>
    `;
  }
  openModal(dom.luckyModal);
}

// 弹窗辅助
function openModal(el) {
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(el) {
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
}

// 文本复制并提醒
function copyText(text, message = '已复制到剪贴板！') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(message);
    }).catch(() => {
      fallbackCopyText(text, message);
    });
  } else {
    fallbackCopyText(text, message);
  }
}

function fallbackCopyText(text, message) {
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.focus();
  input.select();
  try {
    document.execCommand('copy');
    showToast(message);
  } catch (err) {
    showToast('复制失败，请手动长按复制 😿');
  }
  document.body.removeChild(input);
}

// Toast 提示条
function showToast(message) {
  if (!dom.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🌸</span> <span>${escapeHtml(message)}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2400);
}

// 简单转义
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
