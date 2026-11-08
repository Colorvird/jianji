'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowRight: '<path d="m9 18 6-6-6-6"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><path d="M13.5 13.5h3v3h-3zM18.5 13.5h2v2M13.5 18.5h2v2M17.5 18.5h3v2"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17M9 9v10.5M15 9v10.5"/>',
  users: '<path d="M16 20v-1.8a3.7 3.7 0 0 0-3.7-3.7H7.7A3.7 3.7 0 0 0 4 18.2V20"/><circle cx="10" cy="8" r="3.2"/><path d="M17 9a3.2 3.2 0 0 0 0-6.3M20 20v-1.8a3.7 3.7 0 0 0-2.8-3.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.2" cy="9.3" r="1.6"/><path d="m4 17 5-4 3.5 2.8 2.5-2 5 4"/>',
  sparkles: '<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3ZM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14ZM5 14l.6 1.4 1.4.6-1.4.6L5 18l-.6-1.4L3 16l1.4-.6L5 14Z"/>',
  edit: '<path d="m14.5 5.5 4 4M5 19l1-5L16.5 3.5a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L10 18l-5 1Z"/><path d="M13 6.5 17.5 11"/>',
  check: '<path d="m5 12.5 4.2 4L19 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  refresh: '<path d="M20 5v5h-5M4 19v-5h5"/><path d="M5.2 9A7.5 7.5 0 0 1 19.7 7M18.8 15A7.5 7.5 0 0 1 4.3 17"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M5 20h14"/>',
  link: '<path d="m9.5 14.5 5-5M7.5 17.5l-1.2 1.2a3.3 3.3 0 0 1-4.7-4.7l3-3a3.3 3.3 0 0 1 4.7 0M16.5 6.5l1.2-1.2a3.3 3.3 0 0 1 4.7 4.7l-3 3a3.3 3.3 0 0 1-4.7 0"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  eye: '<path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2"/>',
  message: '<path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.7-5.2a7.5 7.5 0 1 1 14.8-3.3Z"/><path d="M8.5 10.5h7M8.5 14h4.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  shield: '<path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z"/><path d="m9.2 12 1.9 1.9 3.9-4.2"/>',
  upload: '<path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 16v3h14v-3"/>',
  file: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h4M9 13h6M9 17h6"/>',
  alert: '<path d="M12 3.5 21 20H3L12 3.5Z"/><path d="M12 9v5M12 17.2v.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5M9 11h6M9 15h4"/>',
  text: '<path d="M5 6h14M12 6v13M8 19h8"/>',
  radio: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  checkbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.8 2.8L16.5 9"/>',
  paragraph: '<path d="M5 6h14M5 11h14M5 16h9"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6"/>'
};

function icon(name, className = '') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
}

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function uid(prefix = 'id') {
  const random = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${Date.now().toString(36)}_${[...random].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function fmtDate(value, withTime = true) {
  if (!value) return '未设置';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未设置';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric', day: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {})
  }).format(date);
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function deadlineInfo(deadline) {
  if (!deadline) return { text: '不设截止', expired: false };
  const expired = new Date(deadline).getTime() < Date.now();
  return { text: `${fmtDate(deadline)}${expired ? '（已截止）' : ' 截止'}`, expired };
}

function statusInfo(survey) {
  if (survey.status === 'draft') return { label: '草稿', className: 'badge-amber' };
  if (survey.status === 'closed') return { label: '已停止', className: 'badge-gray' };
  return { label: '收集中', className: 'badge-green' };
}

function accessInfo(access) {
  if (access === 'readonly') return { label: '只读汇总', detail: '填写人只能查看汇总，不能申请修改。' };
  if (access === 'open') return { label: '本人自由修改', detail: '填写人随时可以修改自己的那一行。' };
  return { label: '申请后修改', detail: '填写人提交申请，创建人通过后可修改一次自己的数据。' };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIOD_COUNT = 14;
const DEFAULT_PERIOD_TIMES = [
  ['08:00', '08:45'], ['08:55', '09:40'], ['10:00', '10:45'], ['10:55', '11:40'],
  ['14:00', '14:45'], ['14:55', '15:40'], ['16:00', '16:45'], ['16:55', '17:40'],
  ['19:00', '19:45'], ['19:55', '20:40'], ['20:50', '21:35'], ['21:45', '22:30'],
  ['22:35', '23:20']
];

function normalizePeriodTimes(value) {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: PERIOD_COUNT }, (_, index) => {
    const item = source[index] && typeof source[index] === 'object' ? source[index] : {};
    const start = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(item.start || '')) ? item.start : '';
    const end = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(item.end || '')) ? item.end : '';
    return { start, end };
  });
}

function defaultPeriodTimes() {
  return normalizePeriodTimes(DEFAULT_PERIOD_TIMES.map(([start, end]) => ({ start, end })));
}

function periodSpanText(startPeriod, endPeriod, periodTimes) {
  const start = periodTimes && periodTimes[startPeriod - 1] ? periodTimes[startPeriod - 1].start : '';
  const end = periodTimes && periodTimes[endPeriod - 1] ? periodTimes[endPeriod - 1].end : '';
  if (start && end) return `${start}–${end}`;
  return '';
}

function minutesText(total) {
  const minutes = Math.max(0, Math.min(24 * 60, Number(total) || 0));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function busyBlockText(block, periodTimes) {
  const range = block.startPeriod === block.endPeriod ? `第${block.startPeriod}节` : `第${block.startPeriod}–${block.endPeriod}节`;
  const time = periodSpanText(block.startPeriod, block.endPeriod, periodTimes);
  return [block.day, range, time].filter(Boolean).join(' ');
}

function busyCell(block, periodTimes) {
  const range = block.startPeriod === block.endPeriod ? `第${block.startPeriod}节` : `第${block.startPeriod}–${block.endPeriod}节`;
  const time = periodSpanText(block.startPeriod, block.endPeriod, periodTimes);
  return `<span class="course-chip busy-chip"><strong>${esc(block.day || '未标注')} · ${esc(range)}</strong><small>${esc(time || '未设置节次时间')}</small></span>`;
}

function formatValue(question, value) {
  if (value === undefined || value === null || value === '') return '<span class="muted-dash">—</span>';
  if (question.type === 'timetable') {
    if (!value.busy || !value.busy.length) return `<span class="text-wrap">${esc(value.emptyWeek ? '已确认本周无课' : value.text || '待确认课表')}</span>`;
    const periodTimes = state.manageData?.survey?.periodTimes || state.resultData?.survey?.periodTimes || [];
    return `<div class="course-list compact">${value.busy.slice(0, 4).map((block) => busyCell(block, periodTimes)).join('')}${value.busy.length > 4 ? `<span class="more-chip">+${value.busy.length - 4} 段</span>` : ''}</div>`;
  }
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="muted-dash">—</span>';
    return `<div class="value-chips">${value.map((item) => `<span class="value-chip">${esc(item)}</span>`).join('')}</div>`;
  }
  return `<span class="text-wrap">${esc(value)}</span>`;
}

const STORAGE_KEYS = {
  respondent: 'jianji.respondent.v1',
  created: 'jianji.created.v1',
  periodTimes: 'jianji.periodTimes.v1'
};

function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
}

function getRespondentToken() {
  let token = '';
  try { token = localStorage.getItem(STORAGE_KEYS.respondent) || ''; } catch (error) {}
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    token = uid('person').replace('person_', '') + uid('x').replace('x_', '');
    try { localStorage.setItem(STORAGE_KEYS.respondent, token); } catch (error) {}
  }
  return token;
}

let respondentToken = getRespondentToken();

function getCreatedRecords() {
  const list = readJsonStorage(STORAGE_KEYS.created, []);
  return Array.isArray(list) ? list.filter((item) => item && item.adminToken) : [];
}

function rememberCreated(adminToken, title) {
  if (!adminToken) return;
  const list = getCreatedRecords().filter((item) => item.adminToken !== adminToken);
  list.unshift({ adminToken, title: title || '未命名表格', updatedAt: new Date().toISOString() });
  writeStorage(STORAGE_KEYS.created, list.slice(0, 50));
}

function forgetCreated(adminToken) {
  writeStorage(STORAGE_KEYS.created, getCreatedRecords().filter((item) => item.adminToken !== adminToken));
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function api(method, route, body) {
  const response = await fetch(route, {
    method,
    headers: {
      'X-Respondent-Token': respondentToken,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let payload = null;
  const text = await response.text();
  if (text) {
    try { payload = JSON.parse(text); } catch (error) { payload = { message: text }; }
  }
  if (!response.ok) {
    throw new ApiError(response.status, payload && payload.error, (payload && payload.message) || `请求失败（${response.status}）`);
  }
  return payload;
}

const state = {
  route: { page: 'home' },
  routeVersion: 0,
  cleanups: [],
  eventSource: null,
  pollTimer: null,
  manageTab: 'summary',
  manageData: null,
  builder: null,
  fillData: null,
  fillDraft: {},
  timetableBusy: {},
  timetableFiles: {},
  timetablePreviews: {},
  timetableLayouts: {},
  timetableWarnings: {},
  fillSubmitting: false,
  resultData: null,
  resultLastRevision: '',
  editDraft: null,
  editSaving: false,
  lastLiveAt: '',
  retryRoute: null,
  modalOptions: null
};

function registerCleanup(fn) {
  state.cleanups.push(fn);
}

function cleanupRoute() {
  for (const fn of state.cleanups.splice(0)) {
    try { fn(); } catch (error) {}
  }
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

function navigate(path, options = {}) {
  if (options.replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  closeModal();
  window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });
  loadRoute();
}

function parseRoute() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  let match = /^\/manage\/([A-Za-z0-9_-]+)$/.exec(path);
  if (match) return { page: 'manage', token: match[1] };
  match = /^\/f\/([A-Za-z0-9_-]+)$/.exec(path);
  if (match) return { page: 'fill', token: match[1] };
  match = /^\/r\/([A-Za-z0-9_-]+)$/.exec(path);
  if (match) return { page: 'result', token: match[1] };
  return { page: 'home' };
}

function setHeaderForRoute(route) {
  const header = $('#siteHeader');
  header.classList.toggle('compact', route.page !== 'home');
  $$('.nav-link').forEach((link) => link.classList.remove('active'));
  if (route.page === 'home') {
    const homeLink = $('.header-nav a[href="/"]');
    if (homeLink) homeLink.classList.add('active');
  }
}

function renderLoading(message = '正在加载…') {
  $('#app').innerHTML = `<div class="loading-state"><span class="spinner"></span><p>${esc(message)}</p></div>`;
}

function renderError(error, retry) {
  const message = error && error.message ? error.message : '页面暂时无法打开。';
  $('#app').innerHTML = `
    <section class="state-page">
      <div class="state-icon error">${icon('alert')}</div>
      <span class="eyebrow">无法打开</span>
      <h1>${esc(message)}</h1>
      <p>请检查链接是否完整。管理链接只保存在创建人的设备上，如果你的链接来自别人，请联系表格创建人重新获取。</p>
      <div class="state-actions">
        <button class="button button-primary" type="button" data-action="retry-route">${icon('refresh')}重新加载</button>
        <a class="button button-secondary" href="/" data-link>${icon('home')}返回首页</a>
      </div>
    </section>`;
  state.retryRoute = retry;
}

function openModal(html, options = {}) {
  closeModal();
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
    <div class="modal-panel ${options.className || ''}" role="dialog" aria-modal="true" aria-label="${esc(options.label || '对话框')}">
      ${html}
    </div>
  </div>`;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => root.firstElementChild && root.firstElementChild.classList.add('visible'));
  state.modalOptions = options;
  return root.firstElementChild;
}

function closeModal() {
  const root = $('#modalRoot');
  if (!root) return;
  const options = state.modalOptions || {};
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
  state.modalOptions = null;
  if (typeof options.onClose === 'function') options.onClose();
}

function toast(message, type = 'success') {
  const root = $('#toastRoot');
  const item = document.createElement('div');
  item.className = `toast toast-${type}`;
  item.innerHTML = `<span class="toast-icon">${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check')}</span><span>${esc(message)}</span>`;
  root.appendChild(item);
  requestAnimationFrame(() => item.classList.add('visible'));
  setTimeout(() => {
    item.classList.remove('visible');
    setTimeout(() => item.remove(), 220);
  }, 3200);
}

async function copyText(text, label = '链接') {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  toast(`${label}已复制`);
}

function updateLiveIndicator(mode) {
  $$('.live-indicator').forEach((element) => {
    element.dataset.mode = mode;
    const label = $('.live-label', element);
    if (label) label.textContent = mode === 'offline' ? '轮询同步中' : '实时同步中';
  });
}

function startLive(route, onRefresh) {
  if ('EventSource' in window) {
    const source = new EventSource(route);
    state.eventSource = source;
    source.addEventListener('refresh', () => {
      state.lastLiveAt = new Date().toISOString();
      updateLiveIndicator('live');
      onRefresh();
    });
    source.onopen = () => updateLiveIndicator('live');
    source.onerror = () => updateLiveIndicator('offline');
  }
  state.pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') onRefresh();
  }, 5000);
  const refreshOnReturn = () => {
    if (document.visibilityState === 'visible') onRefresh();
  };
  document.addEventListener('visibilitychange', refreshOnReturn);
  window.addEventListener('focus', refreshOnReturn);
  registerCleanup(() => {
    if (state.eventSource) state.eventSource.close();
    if (state.pollTimer) clearInterval(state.pollTimer);
    document.removeEventListener('visibilitychange', refreshOnReturn);
    window.removeEventListener('focus', refreshOnReturn);
    state.eventSource = null;
    state.pollTimer = null;
  });
}

async function loadRoute() {
  cleanupRoute();
  closeModal();
  const version = ++state.routeVersion;
  state.route = parseRoute();
  setHeaderForRoute(state.route);
  state.manageData = null;
  state.fillData = null;
  state.resultData = null;
  state.resultLastRevision = '';

  if (state.route.page === 'home') return showHome(version);
  if (state.route.page === 'manage') return showManage(state.route.token, version);
  if (state.route.page === 'fill') return showFill(state.route.token, version);
  if (state.route.page === 'result') return showResult(state.route.token, version);
}

function homeShell(recordsHtml, summary) {
  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${icon('sparkles')}无需注册 · 发到群里就能填</span>
        <h1>发一个二维码到群里，<br /><em>答案自动变成表格。</em></h1>
        <p>活动报名、时间统计、课程表收集。创建人不用逐个催，填写人不用下载 App，汇总结果还会实时更新。</p>
        <div class="hero-actions">
          <button class="button button-primary button-large" type="button" data-action="create-survey">${icon('plus')}创建一个表格</button>
          <button class="button button-secondary button-large" type="button" data-action="paste-manage-link">${icon('link')}打开管理链接</button>
        </div>
        <div class="hero-points">
          <span>${icon('check')}匿名填写</span>
          <span>${icon('check')}自动汇总</span>
          <span>${icon('check')}审批后修改</span>
          <span>${icon('check')}课表 OCR</span>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="visual-card visual-qr">
          <div class="mini-qr">${miniQrPattern()}</div>
          <span>扫码填写</span>
        </div>
        <div class="visual-card visual-table">
          <div class="visual-table-head"><span>汇总表</span><span class="live-dot"></span></div>
          <div class="visual-row"><span class="avatar-dot a1">周</span><span>周六 14:00–16:00</span><b>✓</b></div>
          <div class="visual-row"><span class="avatar-dot a2">陈</span><span>周三 19:00–21:00</span><b>✓</b></div>
          <div class="visual-row"><span class="avatar-dot a3">李</span><span>周六 09:00–12:00</span><b>✓</b></div>
          <div class="visual-foot"><span>4 人已填写</span><span>刚刚更新</span></div>
        </div>
        <div class="visual-card visual-ocr">
          <span class="ocr-icon">${icon('image')}</span>
          <span><strong>课表识别完成</strong><small>已找出 5 个有课时段</small></span>
        </div>
      </div>
    </section>

    <section class="feature-grid" aria-label="核心能力">
      <article class="feature-card">
        <span class="feature-icon blue">${icon('qr')}</span>
        <h2>二维码发群，匿名填写</h2>
        <p>填写链接和二维码独立生成。成员无需注册，微信、QQ 或浏览器扫码即可填写。</p>
      </article>
      <article class="feature-card">
        <span class="feature-icon teal">${icon('table')}</span>
        <h2>自动整理，实时汇总</h2>
        <p>提交后立即进入汇总表。任何人修改并由创建人通过后，汇总表会实时刷新。</p>
      </article>
      <article class="feature-card">
        <span class="feature-icon amber">${icon('image')}</span>
        <h2>课表图片识别</h2>
        <p>上传课程表截图，只判断星期和节次是否有课，再自动比对创建者设置的活动时间段。</p>
      </article>
    </section>

    <section class="workflow-section">
      <div class="section-heading">
        <span class="eyebrow">三步完成</span>
        <h2>从发布到汇总，只需要一个链接</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card"><span>01</span><h3>创建表格</h3><p>设置题目、截止时间和修改规则，系统生成填写二维码。</p></div>
        <div class="step-card"><span>02</span><h3>发到群里</h3><p>把填写二维码发到微信群或 QQ 群，成员扫码匿名提交。</p></div>
        <div class="step-card"><span>03</span><h3>发布汇总</h3><p>生成汇总二维码。填写人可申请修改，通过后数据实时同步。</p></div>
      </div>
    </section>

    <section class="created-section" id="createdSection">
      <div class="section-heading split">
        <div><span class="eyebrow">本机记录</span><h2>我创建的表格</h2></div>
        <div class="section-actions">
          ${summary}
          <button class="button button-secondary button-small" type="button" data-action="paste-manage-link">${icon('link')}粘贴管理链接</button>
        </div>
      </div>
      ${recordsHtml}
      <p class="local-note">${icon('info')}“我创建的表格”只记录在当前浏览器。换电脑或清理浏览器后，请使用保存下来的管理链接打开。</p>
    </section>`;
}

function miniQrPattern() {
  const cells = [];
  const seed = [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,1,0,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,1,1];
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const finder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      const border = finder && (x === 0 || x === 3 || x === 9 || x === 12 || y === 0 || y === 3 || y === 9 || y === 12);
      const center = finder && ((x >= 1 && x <= 2 && y >= 1 && y <= 2) || (x >= 10 && x <= 11 && y >= 1 && y <= 2) || (x >= 1 && x <= 2 && y >= 10 && y <= 11));
      if (border || center || (!finder && seed[(y * 13 + x) % seed.length] === 1)) cells.push(`<i style="grid-column:${x + 1};grid-row:${y + 1}"></i>`);
    }
  }
  return `<span class="mini-qr-grid">${cells.join('')}</span>`;
}

async function showHome(version) {
  const records = getCreatedRecords();
  renderHomeRecordsLoading(records, version);
  const [runtimeResult, loaded] = await Promise.all([
    api('GET', '/api/runtime').catch(() => null),
    Promise.all(records.map(async (record) => {
      try {
        const data = await api('GET', `/api/surveys/admin/${record.adminToken}`);
        rememberCreated(record.adminToken, data.survey.title);
        return { ...record, title: data.survey.title, data, error: null };
      } catch (error) {
        return { ...record, data: null, error };
      }
    }))
  ]);
  if (version !== state.routeVersion || state.route.page !== 'home') return;
  state.homeRecords = loaded;
  const valid = loaded.filter((record) => record.data);
  const summary = valid.length
    ? `<span class="summary-chip">${valid.length} 个表格 · ${valid.reduce((sum, item) => sum + item.data.stats.total, 0)} 份填写</span>`
    : '';
  const recordsHtml = loaded.length ? renderCreatedCards(loaded) : renderEmptyCreated(runtimeResult);
  $('#app').innerHTML = homeShell(recordsHtml, summary);
}

function renderHomeRecordsLoading(records, version) {
  const placeholder = records.length
    ? `<div class="created-grid">${records.map((record) => `<div class="created-card loading-card"><span class="skeleton skeleton-line"></span><span class="skeleton skeleton-short"></span></div>`).join('')}</div>`
    : `<div class="empty-created"><span class="empty-icon">${icon('clipboard')}</span><h3>还没有创建过表格</h3><p>点击“创建一个表格”，一分钟内就能生成填写二维码。</p><button class="button button-primary" type="button" data-action="create-survey">${icon('plus')}创建第一个表格</button></div>`;
  $('#app').innerHTML = homeShell(placeholder, '');
}

function renderCreatedCards(records) {
  return `<div class="created-grid">${records.map((record) => {
    if (!record.data) {
      return `<article class="created-card invalid">
        <span class="created-icon error">${icon('alert')}</span>
        <div><h3>${esc(record.title || '无法打开的表格')}</h3><p>${record.error?.status === 404 ? '未找到表格，请检查服务地址和数据库。' : '暂时连接失败，请稍后刷新重试。'}</p></div>
        <button class="icon-button danger" type="button" data-action="forget-created" data-token="${esc(record.adminToken)}" aria-label="移除此记录">${icon('trash')}</button>
      </article>`;
    }
    const survey = record.data.survey;
    const status = statusInfo(survey);
    return `<a class="created-card" href="/manage/${esc(record.adminToken)}" data-link>
      <span class="created-icon">${icon(survey.icon === 'monitor' ? 'image' : 'table')}</span>
      <div class="created-copy">
        <div class="created-title-row"><h3>${esc(survey.title)}</h3><span class="badge ${status.className}">${status.label}</span></div>
        <p>${record.data.stats.total} / ${survey.target} 份 · ${survey.resultsPublished ? '汇总已发布' : '汇总未发布'} · ${fmtDate(survey.updatedAt)}</p>
      </div>
      <span class="created-arrow">${icon('arrowRight')}</span>
    </a>`;
  }).join('')}</div>`;
}

function renderEmptyCreated(runtime) {
  return `<div class="empty-created">
    <span class="empty-icon">${icon('clipboard')}</span>
    <h3>还没有创建过表格</h3>
    <p>创建活动报名、时间收集或课程表收集。生成二维码后发到群里，成员扫码就能填写。</p>
    <div class="empty-actions">
      <button class="button button-primary" type="button" data-action="create-survey">${icon('plus')}创建第一个表格</button>
      ${runtime && runtime.ocrDemo ? `<span class="inline-note">课程表识别当前为演示模式</span>` : ''}
    </div>
  </div>`;
}

function openPasteManageDialog() {
  openModal(`
    <div class="modal-head">
      <div><span class="eyebrow">打开已有表格</span><h2>粘贴管理链接</h2><p>管理链接只给创建人使用，其中包含修改权限。</p></div>
      <button class="icon-button" type="button" data-modal-close aria-label="关闭">${icon('close')}</button>
    </div>
    <form id="pasteManageForm" class="modal-body">
      <label class="field"><span>管理链接或令牌</span><textarea class="input" name="link" rows="4" placeholder="https://…/manage/xxxxxxxx 或直接粘贴 xxxxxxxx" required></textarea></label>
      <div class="callout">${icon('info')}<span>如果这是别人发给你的链接，请确认你有权限管理这张表格。</span></div>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>取消</button><button class="button button-primary" type="submit">打开管理页</button></div>
    </form>`, { label: '粘贴管理链接' });
}

const QUESTION_META = {
  short: { label: '填空', icon: 'text' },
  textarea: { label: '多行文本', icon: 'paragraph' },
  radio: { label: '单选', icon: 'radio' },
  checkbox: { label: '多选', icon: 'checkbox' },
  timeslots: { label: '时间段', icon: 'clock' },
  timetable: { label: '课表识别', icon: 'image' }
};

function makeQuestion(type, overrides = {}) {
  const base = {
    key: uid('q'),
    type,
    label: QUESTION_META[type] ? QUESTION_META[type].label : '新题目',
    required: false,
    placeholder: '',
    help: '',
    options: []
  };
  if (type === 'short') Object.assign(base, { label: '姓名', placeholder: '请输入姓名', required: true });
  if (type === 'textarea') Object.assign(base, { label: '备注', placeholder: '请填写补充说明' });
  if (type === 'radio') Object.assign(base, { label: '请选择', options: ['选项一', '选项二'] });
  if (type === 'checkbox') Object.assign(base, { label: '请选择（可多选）', options: ['选项一', '选项二', '选项三'] });
  if (type === 'timeslots') Object.assign(base, { label: '方便的时间', options: ['周六 09:00–12:00', '周六 14:00–17:00', '周日 09:00–12:00'], help: '可多选，按自己方便的时间勾选' });
  if (type === 'timetable') Object.assign(base, { label: '上传课程表截图', help: '支持 JPG / PNG / WebP，识别后可逐条校正' });
  return Object.assign(base, overrides, { key: overrides.key || base.key });
}

function templateQuestions(name) {
  if (name === 'times') return [
    makeQuestion('short', { label: '姓名', placeholder: '请输入你的姓名', required: true }),
    makeQuestion('timeslots', { label: '你方便参加的时间', required: true }),
    makeQuestion('textarea', { label: '补充说明', placeholder: '例如临时课程冲突' })
  ];
  if (name === 'timetable') return [
    makeQuestion('short', { label: '姓名', placeholder: '请输入你的姓名', required: true }),
    makeQuestion('timetable', { label: '上传本学期课程表', required: true }),
    makeQuestion('textarea', { label: '其他说明', placeholder: '例如固定活动、晚自习等' })
  ];
  if (name === 'blank') return [
    makeQuestion('short', { label: '姓名', placeholder: '请输入你的姓名', required: true })
  ];
  return [
    makeQuestion('short', { label: '姓名', placeholder: '请输入你的姓名', required: true }),
    makeQuestion('short', { label: '联系方式', placeholder: '手机号或微信号', required: true }),
    makeQuestion('timeslots', { label: '可参与的时间', required: true }),
    makeQuestion('radio', { label: '是否可以连续参加', options: ['可以', '仅参加一个时段', '需要再确认'] }),
    makeQuestion('textarea', { label: '备注', placeholder: '有其他需要说明的可以写在这里' })
  ];
}

function renderBuilderPeriodSettings() {
  if (!state.builder) return '';
  const periods = normalizePeriodTimes(state.builder.periodTimes);
  const hasTimetable = state.builder.questions.some((question) => question.type === 'timetable');
  const storedPeriodTimes = readJsonStorage(STORAGE_KEYS.periodTimes, null);
  const hasStoredPeriodTimes = Array.isArray(storedPeriodTimes) && storedPeriodTimes.some((item) => item && item.start && item.end);
  return `<section class="builder-section period-builder-section">
    <div class="builder-section-title"><span>03</span><div><h3>课表节次时间</h3><p>创建者只需设置“第几节对应几点”，识别结果会自动换算成具体时间。</p></div></div>
    <div class="period-settings-card ${hasTimetable ? '' : 'is-inactive'}">
      ${hasTimetable ? '' : `<div class="inline-note">当前还没有“课表识别”题；添加后，这些设置会自动用于填写页。</div>`}
      <div class="period-mode-options">
        <label class="period-mode-option ${state.builder.timetableMode === 'period' ? 'active' : ''}">
          <input type="radio" name="builderTimetableMode" value="period" ${state.builder.timetableMode === 'period' ? 'checked' : ''} data-builder-timetable-mode />
          <span><strong>按节次自动换算</strong><small>识别第几节有课，再用下面的时间表换算成 08:00–09:40。</small></span>
        </label>
        <label class="period-mode-option ${state.builder.timetableMode === 'clock' ? 'active' : ''}">
          <input type="radio" name="builderTimetableMode" value="clock" ${state.builder.timetableMode === 'clock' ? 'checked' : ''} data-builder-timetable-mode />
          <span><strong>不自动换算</strong><small>只记录“第几节有课”，不把节次转换成具体时间。</small></span>
        </label>
      </div>
      <div class="period-template-actions">
        <span>${icon('clock')}每节起止时间</span>
        <div>
          ${hasStoredPeriodTimes ? `<button class="text-button" type="button" data-action="builder-period-template" data-template="last">沿用上次设置</button>` : ''}
          <button class="text-button" type="button" data-action="builder-period-template" data-template="default">恢复常见作息</button>
          <button class="text-button muted" type="button" data-action="builder-period-template" data-template="clear">清空</button>
        </div>
      </div>
      <div class="period-time-grid">
        ${periods.map((item, index) => `<div class="period-time-row"><span>第 ${index + 1} 节</span><input class="input" type="time" value="${esc(item.start)}" data-period-start="${index}" aria-label="第${index + 1}节开始时间" /><i>至</i><input class="input" type="time" value="${esc(item.end)}" data-period-end="${index}" aria-label="第${index + 1}节结束时间" /></div>`).join('')}
      </div>
      <p class="period-settings-hint">${icon('info')}例如第 1 节 08:00–08:45、第 2 节 08:55–09:40，那么“第 1–2 节”会自动显示为 08:00–09:40。保存表格时会自动保存这份时间表，下次创建可一键沿用。</p>
    </div>
  </section>`;
}

function openSurveyBuilder(options = {}) {
  const mode = options.mode === 'edit' ? 'edit' : 'create';
  const initialQuestions = mode === 'edit' && Array.isArray(options.questions) && options.questions.length
    ? options.questions.map((question) => ({ ...question, key: question.id || uid('q'), options: [...(question.options || [])] }))
    : templateQuestions('signup');
  const storedPeriodTimes = readJsonStorage(STORAGE_KEYS.periodTimes, null);
  const hasStoredPeriodTimes = Array.isArray(storedPeriodTimes) && storedPeriodTimes.some((item) => item && item.start && item.end);
  const surveyPeriodTimes = options.survey ? normalizePeriodTimes(options.survey.periodTimes) : [];
  const hasSurveyPeriodTimes = surveyPeriodTimes.some((item) => item.start || item.end);
  const periodTimes = hasSurveyPeriodTimes
    ? surveyPeriodTimes
    : hasStoredPeriodTimes ? normalizePeriodTimes(storedPeriodTimes) : defaultPeriodTimes();
  state.builder = {
    mode,
    adminToken: options.adminToken || '',
    survey: options.survey || null,
    template: mode === 'create' ? 'signup' : 'custom',
    title: options.survey ? options.survey.title : '',
    description: options.survey ? options.survey.description : '',
    type: options.survey ? options.survey.type : 'short',
    status: options.survey ? options.survey.status : 'active',
    access: options.survey ? options.survey.access : 'approval',
    target: options.survey ? options.survey.target : 20,
    deadline: options.survey ? toLocalInput(options.survey.deadline) : toLocalInput(new Date(Date.now() + 7 * 86400000)),
    timetableMode: options.survey ? options.survey.timetableMode || 'period' : 'period',
    periodTimes,
    periodSource: hasSurveyPeriodTimes ? 'custom' : hasStoredPeriodTimes ? 'last' : 'default',
    questions: initialQuestions,
    saving: false,
    onSaved: options.onSaved || null
  };
  const html = `
    <div class="modal-head builder-head">
      <div><span class="eyebrow">${mode === 'edit' ? '编辑表格' : '新建表格'}</span><h2>${mode === 'edit' ? '调整内容与规则' : '创建一个收集表格'}</h2><p>填写二维码在创建后立即生成。管理链接只会保存在当前设备。</p></div>
      <button class="icon-button" type="button" data-modal-close aria-label="关闭">${icon('close')}</button>
    </div>
    <div class="builder-scroll">
      <div class="modal-body builder-body">
        ${mode === 'edit' ? `<div class="save-original-note">${icon('check')}<span><strong>这是修改原表，不会新建表格。</strong>保存后沿用原来的填写二维码、汇总链接和已经收到的数据。</span></div>` : ''}
        ${mode === 'create' ? `<div class="template-row"><span>快速模板</span>
          <button type="button" class="template-chip ${state.builder.template === 'signup' ? 'active' : ''}" data-action="builder-template" data-template="signup">活动报名</button>
          <button type="button" class="template-chip ${state.builder.template === 'times' ? 'active' : ''}" data-action="builder-template" data-template="times">时间收集</button>
          <button type="button" class="template-chip ${state.builder.template === 'timetable' ? 'active' : ''}" data-action="builder-template" data-template="timetable">课程表收集</button>
          <button type="button" class="template-chip ${state.builder.template === 'blank' ? 'active' : ''}" data-action="builder-template" data-template="blank">空白</button>
        </div>` : ''}
        <section class="builder-section">
          <div class="builder-section-title"><span>01</span><div><h3>基本信息</h3><p>告诉填写人这张表格用来做什么。</p></div></div>
          <label class="field"><span>表格标题<em>*</em></span><input class="input input-large" id="builderTitle" data-builder-field="title" maxlength="120" value="${esc(state.builder.title)}" placeholder="例如：周末志愿服务值班意向" /></label>
          <label class="field"><span>说明</span><textarea class="input" id="builderDescription" data-builder-field="description" rows="3" maxlength="2000" placeholder="说明用途、填写要求或注意事项">${esc(state.builder.description)}</textarea></label>
          <div class="field-grid three">
            <label class="field"><span>截止时间</span><input class="input" type="datetime-local" id="builderDeadline" data-builder-field="deadline" value="${esc(state.builder.deadline)}" /></label>
            <label class="field"><span>目标人数</span><input class="input" type="number" min="1" max="100000" id="builderTarget" data-builder-field="target" value="${esc(state.builder.target)}" /></label>
            <label class="field"><span>收集类型</span><select class="input" id="builderType" data-builder-field="type"><option value="short" ${state.builder.type === 'short' ? 'selected' : ''}>短表格</option><option value="long" ${state.builder.type === 'long' ? 'selected' : ''}>长期收集</option></select></label>
          </div>
          <div class="field"><span class="field-label">修改权限</span><div class="access-options">
            ${['approval', 'open', 'readonly'].map((modeName) => {
              const info = accessInfo(modeName);
              return `<label class="access-option ${state.builder.access === modeName ? 'active' : ''}"><input type="radio" name="builderAccess" value="${modeName}" ${state.builder.access === modeName ? 'checked' : ''} data-builder-access /><span><strong>${info.label}</strong><small>${info.detail}</small></span></label>`;
            }).join('')}
          </div></div>
        </section>
        <section class="builder-section">
          <div class="builder-section-title"><span>02</span><div><h3>题目设计</h3><p>支持填空、选择、时间段和课程表图片识别。</p></div></div>
          <div id="builderQuestions" class="builder-questions"></div>
          <div class="add-question-palette">
            ${Object.entries(QUESTION_META).map(([type, meta]) => `<button type="button" class="add-type-button" data-action="builder-add-question" data-type="${type}">${icon(meta.icon)}<span>${meta.label}</span></button>`).join('')}
          </div>
        </section>
        ${renderBuilderPeriodSettings()}
      </div>
    </div>
    <div class="modal-actions builder-actions">
      <span class="builder-hint">${icon('lock')}${mode === 'edit' ? '保存修改后原链接保持不变' : '管理链接创建后只显示一次'}</span>
      <button class="button button-secondary" type="button" data-modal-close>取消</button>
      <button class="button button-primary" id="builderSave" type="button" data-action="builder-save">${mode === 'edit' ? '保存修改' : '创建并生成二维码'} ${icon('arrowRight')}</button>
    </div>`;
  openModal(html, { className: 'builder-modal', label: mode === 'edit' ? '编辑表格' : '创建表格' });
  renderBuilderQuestions();
}

function renderBuilderQuestions() {
  const container = $('#builderQuestions');
  if (!container || !state.builder) return;
  const questions = state.builder.questions;
  container.innerHTML = questions.length ? questions.map((question, index) => `
    <article class="builder-question" data-builder-question="${index}">
      <div class="builder-q-head">
        <span class="q-number">${index + 1}</span>
        <span class="q-type-label">${icon(QUESTION_META[question.type].icon)}${QUESTION_META[question.type].label}</span>
        <div class="q-tools">
          <button type="button" class="icon-button tiny" data-action="builder-move-question" data-index="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="上移">${icon('chevronUp')}</button>
          <button type="button" class="icon-button tiny" data-action="builder-move-question" data-index="${index}" data-direction="1" ${index === questions.length - 1 ? 'disabled' : ''} aria-label="下移">${icon('chevronDown')}</button>
          <button type="button" class="icon-button tiny danger" data-action="builder-delete-question" data-index="${index}" aria-label="删除">${icon('trash')}</button>
        </div>
      </div>
      <div class="builder-q-grid">
        <label class="field wide"><span>题目</span><input class="input" value="${esc(question.label)}" data-q-field="label" data-index="${index}" placeholder="请输入题目" /></label>
        <label class="field"><span>题型</span><select class="input" data-q-field="type" data-index="${index}">
          ${Object.entries(QUESTION_META).map(([type, meta]) => `<option value="${type}" ${question.type === type ? 'selected' : ''}>${meta.label}</option>`).join('')}
        </select></label>
        <label class="check-toggle"><input type="checkbox" data-q-field="required" data-index="${index}" ${question.required ? 'checked' : ''} /><span>必填</span></label>
      </div>
      ${['short', 'textarea'].includes(question.type) ? `<label class="field"><span>输入提示</span><input class="input" value="${esc(question.placeholder || '')}" data-q-field="placeholder" data-index="${index}" placeholder="例如：请输入你的姓名" /></label>` : ''}
      ${['radio', 'checkbox', 'timeslots'].includes(question.type) ? `<label class="field"><span>选项 ${question.type === 'timeslots' ? '（每行一个时间段）' : '（每行一个选项）'}</span><textarea class="input option-textarea" data-q-field="optionsText" data-index="${index}" rows="${Math.max(3, question.options.length)}" placeholder="每行一个选项">${esc(question.options.join('\n'))}</textarea></label>` : ''}
      ${question.type === 'timetable' ? `<div class="ocr-builder-note">${icon('image')}<span>填写人上传课程表后，系统只识别“星期几、第几节有课”，再与活动时间段自动比对。无需识别课程名、老师或教室。</span></div>` : ''}
      <label class="field"><span>题目说明（可选）</span><input class="input" value="${esc(question.help || '')}" data-q-field="help" data-index="${index}" placeholder="向填写人解释这道题" /></label>
    </article>`).join('') : `<div class="empty-builder">还没有题目，从下面添加一道。</div>`;
  const periodSection = $('.period-builder-section');
  if (periodSection) periodSection.outerHTML = renderBuilderPeriodSettings();
}

function applyBuilderPeriodTemplate(template) {
  if (!state.builder) return;
  if (template === 'last') {
    const stored = readJsonStorage(STORAGE_KEYS.periodTimes, null);
    state.builder.periodTimes = normalizePeriodTimes(Array.isArray(stored) ? stored : defaultPeriodTimes());
  } else if (template === 'clear') {
    state.builder.periodTimes = normalizePeriodTimes([]);
  } else {
    state.builder.periodTimes = defaultPeriodTimes();
  }
  state.builder.periodSource = template;
  writeStorage(STORAGE_KEYS.periodTimes, state.builder.periodTimes);
  const section = $('.period-builder-section');
  if (section) section.outerHTML = renderBuilderPeriodSettings();
  toast(template === 'last' ? '已沿用上次保存的节次时间' : template === 'clear' ? '已清空节次时间' : '已填入常见作息时间', 'info');
}

function applyBuilderTemplate(template) {
  if (!state.builder) return;
  if (state.builder.questions.length && !window.confirm('应用模板会替换当前题目，继续吗？')) return;
  state.builder.template = template;
  state.builder.questions = templateQuestions(template);
  $$('.template-chip').forEach((button) => button.classList.toggle('active', button.dataset.template === template));
  renderBuilderQuestions();
}

function addBuilderQuestion(type) {
  if (!state.builder) return;
  state.builder.questions.push(makeQuestion(type));
  renderBuilderQuestions();
}

function moveBuilderQuestion(index, direction) {
  if (!state.builder) return;
  const target = index + direction;
  if (target < 0 || target >= state.builder.questions.length) return;
  const [question] = state.builder.questions.splice(index, 1);
  state.builder.questions.splice(target, 0, question);
  renderBuilderQuestions();
}

function deleteBuilderQuestion(index) {
  if (!state.builder) return;
  state.builder.questions.splice(index, 1);
  renderBuilderQuestions();
}

function collectBuilderAnswers() {
  if (!state.builder) return null;
  const title = ($('#builderTitle') && $('#builderTitle').value.trim()) || '';
  const description = ($('#builderDescription') && $('#builderDescription').value.trim()) || '';
  const deadlineValue = $('#builderDeadline') ? $('#builderDeadline').value : '';
  const targetValue = Number($('#builderTarget') ? $('#builderTarget').value : 20);
  const type = $('#builderType') ? $('#builderType').value : 'short';
  const checkedAccess = $('[data-builder-access]:checked');
  const access = checkedAccess ? checkedAccess.value : 'approval';
  if (!title) throw new Error('请填写表格标题。');
  if (!state.builder.questions.length) throw new Error('至少添加一道题目。');
  const questions = state.builder.questions.map((question) => ({
    ...(question.id ? { id: question.id } : {}),
    type: question.type,
    label: String(question.label || '').trim(),
    required: Boolean(question.required),
    placeholder: question.placeholder || '',
    help: question.help || '',
    options: ['radio', 'checkbox', 'timeslots'].includes(question.type)
      ? (question.options || []).map((item) => String(item).trim()).filter(Boolean)
      : []
  }));
  for (const question of questions) {
    if (!question.label) throw new Error('每道题都需要填写题目。');
    if (['radio', 'checkbox', 'timeslots'].includes(question.type) && !question.options.length) throw new Error(`题目「${question.label}」至少需要一个选项。`);
  }
  return {
    title,
    description,
    type,
    status: state.builder.status || 'active',
    access,
    target: Number.isFinite(targetValue) ? targetValue : 20,
    deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null,
    icon: 'clipboard',
    timetableMode: state.builder.timetableMode || 'period',
    periodTimes: normalizePeriodTimes(state.builder.periodTimes),
    questions
  };
}

async function saveBuilder() {
  if (!state.builder || state.builder.saving) return;
  let payload;
  try {
    payload = collectBuilderAnswers();
  } catch (error) {
    toast(error.message, 'error');
    return;
  }
  state.builder.saving = true;
  const button = $('#builderSave');
  if (button) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner small"></span>正在保存`;
  }
  try {
    writeStorage(STORAGE_KEYS.periodTimes, payload.periodTimes);
    if (state.builder.mode === 'edit') {
      const data = await api('PUT', `/api/surveys/admin/${state.builder.adminToken}`, payload);
      rememberCreated(state.builder.adminToken, data.survey.title);
      closeModal();
      toast('修改已保存到原表，原链接和二维码保持不变');
      if (state.builder.onSaved) state.builder.onSaved(data);
      else if (state.route.page === 'manage') showManage(state.route.token, state.routeVersion);
    } else {
      const data = await api('POST', '/api/surveys', payload);
      rememberCreated(data.adminToken, data.survey.survey.title);
      closeModal();
      toast('表格已创建，填写二维码已生成');
      navigate(data.adminPath);
    }
  } catch (error) {
    toast(error.message, 'error');
    state.builder.saving = false;
    if (button) {
      button.disabled = false;
      button.innerHTML = `${state.builder.mode === 'edit' ? '保存修改' : '创建并生成二维码'} ${icon('arrowRight')}`;
    }
  }
}

async function showManage(token, version) {
  renderLoading('正在读取表格…');
  try {
    const data = await api('GET', `/api/surveys/admin/${token}`);
    if (version !== state.routeVersion || state.route.page !== 'manage') return;
    state.manageData = data;
    rememberCreated(token, data.survey.title);
    renderManage();
    startLive(`/api/surveys/admin/${token}/events`, () => refreshManage(true));
  } catch (error) {
    if (version === state.routeVersion) renderError(error, () => showManage(token, version));
  }
}

async function refreshManage(silent = false) {
  const token = state.route.page === 'manage' ? state.route.token : '';
  if (!token) return;
  const previousRevision = state.manageData ? state.manageData.stats.revision : '';
  try {
    const data = await api('GET', `/api/surveys/admin/${token}`);
    if (state.route.page !== 'manage' || state.route.token !== token) return;
    const changed = !previousRevision || previousRevision !== data.stats.revision;
    state.manageData = data;
    state.lastLiveAt = changed ? new Date().toISOString() : state.lastLiveAt;
    if (!silent || changed) renderManage();
  } catch (error) {
    if (!silent) toast(error.message, 'error');
  }
}

function renderManage() {
  const data = state.manageData;
  if (!data) return;
  const survey = data.survey;
  const status = statusInfo(survey);
  const pending = data.requests.filter((request) => request.status === 'pending').length;
  const fillUrl = data.urls.fill;
  const resultUrl = data.urls.result;
  $('#app').innerHTML = `
    <section class="manage-page">
      <div class="manage-breadcrumb"><a href="/" data-link>${icon('arrowLeft')}返回首页</a><span>管理端</span></div>
      <header class="manage-header">
        <div class="manage-title">
          <div class="title-badges"><span class="badge ${status.className}">${status.label}</span><span class="badge badge-blue">${accessInfo(survey.access).label}</span>${survey.resultsPublished ? `<span class="badge badge-teal">汇总已发布</span>` : `<span class="badge badge-gray">汇总未发布</span>`}</div>
          <h1>${esc(survey.title)}</h1>
          <p>${esc(survey.description || '未填写说明')}</p>
          <div class="manage-meta">
            <span>${icon('users')}${data.stats.total} / ${survey.target} 份</span>
            <span>${icon('clock')}${esc(deadlineInfo(survey.deadline).text)}</span>
            <span>${icon('refresh')}${esc(survey.updatedAtText || fmtDate(survey.updatedAt))} 更新</span>
            <span class="live-indicator" data-mode="live"><i></i><span class="live-label">实时同步中</span></span>
          </div>
        </div>
        <div class="manage-actions">
          <button class="button button-secondary" type="button" data-action="edit-survey-content">${icon('edit')}编辑原表</button>
          <a class="button button-secondary" href="/f/${esc(data.links.fillToken)}" target="_blank" rel="noopener">${icon('eye')}预览填写</a>
          <button class="button button-secondary" type="button" data-action="open-share">${icon('qr')}二维码与链接</button>
          ${survey.resultsPublished
            ? `<button class="button button-primary" type="button" data-action="copy-result-link">${icon('copy')}复制汇总链接</button>`
            : `<button class="button button-primary" type="button" data-action="publish-results">${icon('share')}发布汇总表</button>`}
        </div>
      </header>
      <div class="setup-progress">
        <div class="setup-step done"><span>1</span><div><strong>创建表格</strong><small>题目与规则已设置</small></div></div>
        <div class="setup-line done"></div>
        <div class="setup-step done"><span>2</span><div><strong>发布填写</strong><small>${survey.status === 'active' ? '填写二维码可用' : '当前未开放填写'}</small></div></div>
        <div class="setup-line ${survey.resultsPublished ? 'done' : ''}"></div>
        <div class="setup-step ${survey.resultsPublished ? 'done' : ''}"><span>3</span><div><strong>发布汇总</strong><small>${survey.resultsPublished ? '汇总二维码已生成' : '收集后发到群里'}</small></div></div>
      </div>
      <div class="manage-tabs" role="tablist">
        <button type="button" class="manage-tab ${state.manageTab === 'summary' ? 'active' : ''}" data-action="manage-tab" data-tab="summary">${icon('table')}汇总数据 <span>${data.stats.total}</span></button>
        <button type="button" class="manage-tab ${state.manageTab === 'requests' ? 'active' : ''}" data-action="manage-tab" data-tab="requests">${icon('message')}修改申请 ${pending ? `<span class="tab-alert">${pending}</span>` : `<span>${data.requests.length}</span>`}</button>
        <button type="button" class="manage-tab ${state.manageTab === 'settings' ? 'active' : ''}" data-action="manage-tab" data-tab="settings">${icon('settings')}设置</button>
      </div>
      <div id="manageTabContent">${manageTabHtml()}</div>
    </section>`;
}

function manageTabHtml() {
  if (!state.manageData) return '';
  if (state.manageTab === 'requests') return renderRequestsTab();
  if (state.manageTab === 'settings') return renderSettingsTab();
  return renderSummaryTab();
}

function renderSummaryTab() {
  const data = state.manageData;
  const survey = data.survey;
  const stats = data.stats;
  const pending = data.requests.filter((request) => request.status === 'pending').length;
  const timetableQuestion = data.questions.find((question) => question.type === 'timetable');
  const empty = `<div class="panel-empty"><span class="empty-icon">${icon('users')}</span><h3>还没有收到填写</h3><p>把填写二维码发到微信群或 QQ 群，成员扫码提交后会立刻出现在这里。</p><button class="button button-primary" type="button" data-action="open-share">${icon('qr')}查看填写二维码</button></div>`;
  return `
    <section class="summary-panel">
      <div class="stat-grid four">
        <div class="stat-card"><span class="stat-icon blue">${icon('users')}</span><strong>${stats.total}<small>份</small></strong><p>目标 ${survey.target} 份 · ${stats.percent}%</p><div class="progress"><i style="width:${stats.percent}%"></i></div></div>
        <div class="stat-card"><span class="stat-icon teal">${icon('refresh')}</span><strong>${stats.latestAtText || '—'}</strong><p>最近一次更新</p></div>
        <div class="stat-card"><span class="stat-icon amber">${icon('message')}</span><strong>${pending}<small>条</small></strong><p>等待处理的修改申请</p></div>
        <div class="stat-card"><span class="stat-icon blue">${icon('image')}</span><strong>${stats.timetable.respondents}<small>人</small></strong><p>${timetableQuestion ? `已识别课表 · 共 ${stats.timetable.busyCount || 0} 节有课` : '当前表格未包含课程表题'}</p></div>
      </div>
      <div class="summary-toolbar">
        <div><h2>实时汇总表</h2><p>任何人保存修改后，这里会自动更新，无需手动刷新。</p></div>
        <div class="summary-tools">
          <span class="live-indicator" data-mode="live"><i></i><span class="live-label">实时同步中</span></span>
          <button class="button button-secondary button-small" type="button" data-action="refresh-manage">${icon('refresh')}刷新</button>
          <a class="button button-secondary button-small" href="/api/surveys/admin/${esc(state.route.token)}/export.csv">${icon('download')}导出 CSV</a>
        </div>
      </div>
      ${stats.total ? renderSummaryTable(data) : empty}
      ${stats.total ? `<div class="summary-lower">
        <section class="insight-card"><div class="insight-head"><span>${icon('chart')}选项与时段偏好</span><small>按已填写人数计算</small></div>${renderOptionStats(stats.optionStats)}</section>
        <section class="insight-card"><div class="insight-head"><span>${icon('calendar')}空闲时间与活动匹配</span><small>${stats.timetable.busyCount || 0} 节有课</small></div>${renderTimetableStats(stats.timetable)}</section>
      </div>` : ''}
    </section>`;
}

function renderParticipationTable(data) {
  const groups = data.stats.participation || [];
  const names = (members) => members.length
    ? `<div class="value-chips">${members.map(member => `<span class="value-chip">${esc(member.name)}</span>`).join('')}</div>`
    : '<span class="muted-dash">—</span>';
  return `<div class="participation-summary"><p class="participation-note">按时间段整理人员。有勾选时以勾选范围为准；未勾选且有课表时，按课表空闲时段推算。有课冲突或信息不足的人员单列，课表空闲仅表示时间可用。</p>${groups.map(group => `
    <section class="participation-group"><h3>${esc(group.label)}</h3>
      <div class="table-shell"><div class="table-scroll"><table class="data-table participation-table">
        <thead><tr><th class="sticky-col">时间段</th><th>可参与人员</th><th>人数</th><th>有课冲突</th><th>待确认</th></tr></thead>
        <tbody>${group.options.map(option => `<tr>
          <td class="sticky-col"><strong>${esc(option.label)}</strong></td>
          <td>${option.count ? names(option.participants) : '<span class="muted-dash">暂无可参与人员</span>'}</td>
          <td><strong>${option.count}</strong> 人</td>
          <td>${names(option.conflicts)}</td><td>${names(option.unknown)}</td>
        </tr>`).join('')}</tbody>
      </table></div></div>
    </section>`).join('')}</div>`;
}

function renderSummaryTable(data, raw = false) {
  if (!raw && data.stats.participation?.length) {
    return `${renderParticipationTable(data)}<details class="raw-responses"><summary>查看原始答卷明细</summary>
      <p><a class="text-button" href="/api/surveys/admin/${esc(state.route.token)}/export.csv?view=raw">导出原始答卷 CSV</a></p>
      ${renderSummaryTable(data, true)}</details>`;
  }
  const columns = data.questions;
  return `<div class="table-shell"><div class="table-scroll"><table class="data-table summary-table">
    <thead><tr><th class="sticky-col">填写人</th>${columns.map((question) => `<th><span>${esc(question.label)}</span>${question.type === 'timetable' ? '<small class="th-note">有课节次 · 已换算时间</small>' : ''}</th>`).join('')}<th>状态</th><th>最后更新</th></tr></thead>
    <tbody>${data.submissions.map((submission) => `<tr>
      <td class="sticky-col"><div class="person-cell"><span class="avatar">${esc(submission.name.slice(0, 1))}</span><div><strong>${esc(submission.name)}</strong><small>${esc(submission.submittedAtText)}</small></div></div></td>
      ${columns.map((question) => `<td>${formatValue(question, submission.answers[question.id])}</td>`).join('')}
      <td><span class="badge ${submission.status === 'edited' ? 'badge-teal' : 'badge-blue'}">${submission.status === 'edited' ? '已修改' : '已提交'}</span></td>
      <td class="nowrap"><span class="cell-time">${esc(submission.updatedAtText)}</span></td>
    </tr>`).join('')}</tbody>
  </table></div><div class="table-footer"><span>共 ${data.stats.total} 份答卷</span><span>${icon('refresh')}数据实时同步</span></div></div>`;
}

function renderOptionStats(items) {
  if (!items.length) return `<div class="mini-empty">这个表格没有选择题或时间段题。</div>`;
  return items.map((item) => `<div class="option-stat"><div class="option-stat-head"><strong>${esc(item.label)}</strong><span>${item.answered} 人作答</span></div>${item.options.map((option) => `<div class="option-bar-row"><span>${esc(option.label)}</span><div class="option-bar"><i style="width:${option.percent}%"></i></div><b>${option.count}</b></div>`).join('')}</div>`).join('');
}

function renderTimetableStats(timetable) {
  if (!timetable.respondents) return `<div class="mini-empty">暂无课表数据。填写人上传课表后，这里会汇总有课节次和活动时段匹配情况。</div>`;
  const max = Math.max(...timetable.byDay.map((item) => item.count), 1);
  const availability = Array.isArray(timetable.availability) ? timetable.availability : [];
  return `<div class="day-stats">${timetable.byDay.map((item) => `<div class="day-stat"><span>${esc(item.day)}</span><div><i style="width:${Math.round(item.count / max * 100)}%"></i></div><b>${item.count} 节</b></div>`).join('')}</div>
    ${availability.length ? `<div class="availability-stats">${availability.map((group) => `<div class="availability-group"><strong>${esc(group.label)}</strong>${group.options.map((option) => `<div class="availability-row"><span>${esc(option.label)}</span><div class="availability-bar"><i style="width:${option.total ? Math.round(option.free / option.total * 100) : 0}%"></i></div><b>${option.free}/${option.total} 人可用${option.unknown ? ` · ${option.unknown} 人待确认` : ''}</b></div>`).join('')}</div>`).join('')}</div>` : ''}`;
}

function renderRequestsTab() {
  const data = state.manageData;
  const pending = data.requests.filter((request) => request.status === 'pending');
  const history = data.requests.filter((request) => request.status !== 'pending');
  const card = (request) => {
    const statusMap = {
      pending: { label: '待处理', className: 'badge-amber' },
      approved: { label: request.usedAt ? '已修改' : '已通过', className: 'badge-teal' },
      rejected: { label: '已拒绝', className: 'badge-red' }
    };
    const status = statusMap[request.status];
    return `<article class="request-card">
      <span class="avatar">${esc(request.name.slice(0, 1))}</span>
      <div class="request-copy">
        <div class="request-title"><strong>${esc(request.name)}</strong><span class="badge ${status.className}">${status.label}</span></div>
        <p class="request-summary">${esc(request.summary)}</p>
        ${request.reason ? `<p class="request-reason">理由：${esc(request.reason)}</p>` : ''}
        <div class="request-meta"><span>${esc(request.createdAtText)} 提交</span>${request.reviewedAtText ? `<span>${esc(request.reviewedAtText)} 处理</span>` : ''}${request.usedAtText ? `<span>${esc(request.usedAtText)} 修改完成</span>` : ''}</div>
      </div>
      ${request.status === 'pending' ? `<div class="request-actions"><button class="button button-danger button-small" type="button" data-action="review-request" data-id="${esc(request.id)}" data-decision="reject">拒绝</button><button class="button button-primary button-small" type="button" data-action="review-request" data-id="${esc(request.id)}" data-decision="approve">${icon('check')}通过</button></div>` : `<span class="request-done-icon">${icon(request.status === 'rejected' ? 'close' : 'check')}</span>`}
    </article>`;
  };
  return `<section class="requests-panel">
    <div class="panel-heading"><div><h2>修改申请</h2><p>通过后，对方获得一次修改本人数据的权限。保存后汇总表会实时刷新。</p></div><span class="count-badge">${pending.length} 条待处理</span></div>
    ${pending.length ? `<div class="request-group"><h3>待处理</h3>${pending.map(card).join('')}</div>` : `<div class="panel-empty compact"><span class="empty-icon">${icon('check')}</span><h3>没有待处理的申请</h3><p>所有修改申请都已经处理完毕。</p></div>`}
    ${history.length ? `<div class="request-group history"><h3>处理记录</h3>${history.map(card).join('')}</div>` : ''}
  </section>`;
}

function renderSettingsTab() {
  const data = state.manageData;
  const survey = data.survey;
  return `<section class="settings-panel">
    <div class="settings-grid">
      <div class="settings-main">
        <div class="panel-heading"><div><h2>基本设置</h2><p>修改会立即生效，已经提交的答卷不会丢失。</p></div></div>
        <form id="manageSettingsForm" class="settings-form">
          <label class="field"><span>表格标题</span><input class="input input-large" name="title" maxlength="120" value="${esc(survey.title)}" required /></label>
          <label class="field"><span>说明</span><textarea class="input" name="description" rows="3" maxlength="2000">${esc(survey.description)}</textarea></label>
          <div class="field-grid three">
            <label class="field"><span>截止时间</span><input class="input" type="datetime-local" name="deadline" value="${esc(toLocalInput(survey.deadline))}" /></label>
            <label class="field"><span>目标人数</span><input class="input" type="number" min="1" max="100000" name="target" value="${esc(survey.target)}" /></label>
            <label class="field"><span>收集状态</span><select class="input" name="status"><option value="active" ${survey.status === 'active' ? 'selected' : ''}>收集中</option><option value="closed" ${survey.status === 'closed' ? 'selected' : ''}>停止收集</option><option value="draft" ${survey.status === 'draft' ? 'selected' : ''}>草稿</option></select></label>
          </div>
          <div class="field"><span class="field-label">修改权限</span><div class="access-options">
            ${['approval', 'open', 'readonly'].map((modeName) => {
              const info = accessInfo(modeName);
              return `<label class="access-option ${survey.access === modeName ? 'active' : ''}"><input type="radio" name="access" value="${modeName}" ${survey.access === modeName ? 'checked' : ''} data-manage-access /><span><strong>${info.label}</strong><small>${info.detail}</small></span></label>`;
            }).join('')}
          </div></div>
          <div class="form-actions"><button class="button button-primary" type="submit">${icon('check')}保存设置</button></div>
        </form>
        <div class="panel-heading question-settings-head"><div><h2>题目</h2><p>修改题目、选项或添加课表识别题。</p></div><button class="button button-secondary button-small" type="button" data-action="edit-survey-content">${icon('edit')}编辑题目与内容</button></div>
        <div class="settings-question-list">${data.questions.map((question, index) => `<div class="settings-question"><span>${index + 1}</span><div><strong>${esc(question.label)}</strong><small>${QUESTION_META[question.type] ? QUESTION_META[question.type].label : question.type}${question.required ? ' · 必填' : ''}${question.options.length ? ` · ${question.options.length} 个选项` : ''}</small></div>${question.type === 'timetable' ? `<span class="badge badge-teal">OCR</span>` : ''}</div>`).join('')}</div>
      </div>
      <aside class="settings-side">
        <div class="side-card">
          <h3>${icon('lock')}管理链接</h3>
          <p>只有这个链接能进入管理页。不会显示在填写页或汇总页。</p>
          <div class="copy-field"><input class="input" readonly value="${esc(location.href)}" /><button class="icon-button" type="button" data-copy="${esc(location.href)}" data-copy-label="管理链接" aria-label="复制管理链接">${icon('copy')}</button></div>
        </div>
        <div class="side-card">
          <h3>${icon('lock')}数据安全</h3>
          <p>填写人只能修改自己的那一行。审批通过后的修改权限使用一次后自动失效，所有变动都会进入汇总版本。</p>
        </div>
        <div class="side-card accent">
          <h3>${icon('share')}分享给填写人</h3>
          <p>把填写二维码发到群里。收集完成后，再把汇总二维码发到同一个群。</p>
          <button class="button button-primary button-block" type="button" data-action="open-share">${icon('qr')}查看二维码</button>
        </div>
      </aside>
    </div>
  </section>`;
}

async function saveManageSettings() {
  const form = $('#manageSettingsForm');
  if (!form) return;
  const formData = new FormData(form);
  const checkedAccess = $('[data-manage-access]:checked');
  const deadlineValue = String(formData.get('deadline') || '');
  const payload = {
    title: String(formData.get('title') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null,
    target: Number(formData.get('target') || 20),
    status: String(formData.get('status') || 'active'),
    access: checkedAccess ? checkedAccess.value : 'approval'
  };
  const button = $('button[type="submit"]', form);
  if (button) { button.disabled = true; button.textContent = '保存中…'; }
  try {
    const data = await api('PUT', `/api/surveys/admin/${state.route.token}`, payload);
    state.manageData = data;
    rememberCreated(state.route.token, data.survey.title);
    renderManage();
    toast('设置已保存，填写端已同步');
  } catch (error) {
    toast(error.message, 'error');
    if (button) { button.disabled = false; button.innerHTML = `${icon('check')}保存设置`; }
  }
}

async function reviewRequest(id, decision) {
  if (decision === 'approve' && !window.confirm('通过后，对方可以修改一次自己的数据。确认通过？')) return;
  try {
    await api('POST', `/api/surveys/admin/${state.route.token}/edit-requests/${id}/${decision}`, {});
    toast(decision === 'approve' ? '已通过，对方页面会实时出现修改入口' : '已拒绝该申请');
    await refreshManage();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function publishResults() {
  const data = state.manageData;
  if (!data) return;
  if (!data.stats.total && !window.confirm('目前还没有人填写，仍然发布一个空的汇总表吗？')) return;
  try {
    const updated = await api('PUT', `/api/surveys/admin/${state.route.token}`, { resultsPublished: true });
    state.manageData = updated;
    renderManage();
    toast('汇总表已发布，可以发到群里了');
    openShareDialog();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function openShareDialog() {
  const data = state.manageData;
  if (!data) return;
  const fillUrl = data.urls.fill;
  const resultUrl = data.urls.result;
  const resultCard = data.survey.resultsPublished
    ? `<div class="qr-card result-qr">
        <div class="qr-frame"><img src="/api/surveys/admin/${esc(state.route.token)}/qr/result" alt="汇总二维码" /></div>
        <div class="qr-copy"><span class="badge badge-teal">汇总表</span><h3>发到群里看结果</h3><p>填写人打开后可以查看所有人的汇总，并申请修改自己的数据。</p><div class="copy-field"><input class="input" readonly value="${esc(resultUrl)}" /><button class="icon-button" type="button" data-copy="${esc(resultUrl)}" data-copy-label="汇总链接" aria-label="复制汇总链接">${icon('copy')}</button></div><a class="button button-secondary button-block" href="${esc(resultUrl)}" target="_blank" rel="noopener">${icon('external')}打开汇总表</a></div>
      </div>`
    : `<div class="qr-card result-qr pending"><div class="qr-placeholder">${icon('share')}<span>发布后生成</span></div><div class="qr-copy"><span class="badge badge-gray">汇总表</span><h3>还没有发布汇总</h3><p>收集到填写数据后，点击发布。填写人才能通过汇总链接查看结果和申请修改。</p><button class="button button-primary button-block" type="button" data-action="publish-results">${icon('share')}立即发布汇总</button></div></div>`;
  openModal(`
    <div class="modal-head">
      <div><span class="eyebrow">分享给群里</span><h2>二维码与链接</h2><p>填写二维码用于收集，汇总二维码用于查看结果和申请修改。</p></div>
      <button class="icon-button" type="button" data-modal-close aria-label="关闭">${icon('close')}</button>
    </div>
    <div class="modal-body share-modal-body">
      <div class="share-warning">${icon('info')}<span>二维码中的域名是 <strong>${esc(data.urls.base)}</strong>。如果要在微信群里让所有人访问，需要把系统部署到公网域名，或使用公网隧道；仅局域网地址只能同一 Wi-Fi 下扫码。</span></div>
      <div class="qr-card fill-qr">
        <div class="qr-frame"><img src="/api/surveys/admin/${esc(state.route.token)}/qr/fill" alt="填写二维码" /></div>
        <div class="qr-copy"><span class="badge badge-blue">填写问卷</span><h3>先发这个二维码</h3><p>成员扫码匿名填写。同一个浏览器再次打开时会识别本人记录。</p><div class="copy-field"><input class="input" readonly value="${esc(fillUrl)}" /><button class="icon-button" type="button" data-copy="${esc(fillUrl)}" data-copy-label="填写链接" aria-label="复制填写链接">${icon('copy')}</button></div><a class="button button-secondary button-block" href="${esc(fillUrl)}" target="_blank" rel="noopener">${icon('external')}预览填写页</a></div>
      </div>
      ${resultCard}
    </div>`, { className: 'share-modal', label: '二维码与链接' });
}

async function showFill(token, version) {
  renderLoading('正在打开填写页…');
  try {
    const data = await api('GET', `/api/surveys/fill/${token}`);
    if (version !== state.routeVersion || state.route.page !== 'fill') return;
    state.fillData = data;
    if (!data.alreadySubmitted) {
      state.fillDraft = {};
      for (const question of data.questions) {
        state.fillDraft[question.id] = question.type === 'checkbox' || question.type === 'timeslots' ? [] : question.type === 'timetable' ? null : '';
      }
    }
    renderFillPage();
    if (data.alreadySubmitted && !data.survey.resultPath) {
      state.pollTimer = setInterval(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
          const fresh = await api('GET', `/api/surveys/fill/${token}`);
          if (fresh.survey.resultPath && state.route.page === 'fill') {
            state.fillData = fresh;
            renderFillPage();
          }
        } catch (error) {}
      }, 8000);
      registerCleanup(() => clearInterval(state.pollTimer));
    }
  } catch (error) {
    if (version === state.routeVersion) renderError(error, () => showFill(token, version));
  }
}

function renderFillPage() {
  const data = state.fillData;
  if (!data) return;
  if (data.alreadySubmitted) return renderFillSubmitted(data);
  if (!data.survey.accepting) return renderFillUnavailable(data);
  const survey = data.survey;
  const deadline = deadlineInfo(survey.deadline);
  $('#app').innerHTML = `<section class="public-page fill-page">
    <div class="public-topline"><a href="/" data-link class="mini-brand">${icon('clipboard')}简集</a><span class="badge badge-blue">匿名填写</span></div>
    <header class="fill-cover">
      <div class="fill-cover-strip"></div>
      <span class="eyebrow">填写问卷</span>
      <h1>${esc(survey.title)}</h1>
      <p>${esc(survey.description || '请按实际情况填写下面的内容。')}</p>
      <div class="fill-meta"><span>${icon('clock')}${esc(deadline.text)}</span><span>${icon('lock')}仅能修改本人数据</span><span>${icon('file')}${data.questions.length} 道题</span></div>
    </header>
    <form id="fillForm" class="fill-form" novalidate>
      <div class="fill-intro">${icon('info')}<span>提交后信息会进入创建人的汇总表。姓名和联系方式仅用于辨认填写人，请如实填写。</span></div>
      <div id="fillQuestions">${data.questions.map((question, index) => renderFillQuestion(question, index)).join('')}</div>
      <div class="fill-submit-bar"><span>${icon('lock')}数据只会提交给表格创建人</span><button class="button button-primary button-large" type="submit" id="fillSubmit">${icon('check')}提交问卷</button></div>
    </form>
  </section>`;
}

function renderFillSubmitted(data) {
  const survey = data.survey;
  const resultPath = survey.resultPath;
  $('#app').innerHTML = `<section class="public-page state-page submitted-page">
    <div class="success-mark">${icon('check')}</div>
    <span class="eyebrow">提交成功</span>
    <h1>${esc(data.mySubmission.name)}，你的填写已记录</h1>
    <p>提交时间：${esc(data.mySubmission.submittedAtText)}。这份记录保存在当前浏览器中，之后可以申请修改自己填写的内容。</p>
    <div class="submitted-actions">
      ${resultPath ? `<a class="button button-primary button-large" href="${esc(resultPath)}" data-link>${icon('table')}查看实时汇总</a>` : `<span class="waiting-pill">${icon('clock')}汇总表尚未发布，发布后可在这里查看</span>`}
      <button class="button button-secondary" type="button" data-action="refresh-fill-result">${icon('refresh')}刷新状态</button>
    </div>
    <div class="submitted-note">${icon('info')}<span>如果之后需要修改，打开创建人发到群里的汇总链接，点击“申请修改”。创建人通过后即可修改本人数据。</span></div>
  </section>`;
}

function renderFillUnavailable(data) {
  const survey = data.survey;
  const expired = deadlineInfo(survey.deadline).expired;
  $('#app').innerHTML = `<section class="public-page state-page">
    <div class="state-icon">${icon(expired ? 'clock' : 'lock')}</div>
    <span class="eyebrow">${survey.status === 'closed' ? '已停止收集' : expired ? '已截止' : '暂未开放'}</span>
    <h1>${esc(survey.title)}</h1>
    <p>${expired ? '这张表格已经过了截止时间。如需补填，请联系创建人重新开放。' : '创建人当前没有开放填写。你可以稍后再打开这个链接。'}</p>
    <button class="button button-secondary" type="button" data-action="retry-route">${icon('refresh')}重新检查</button>
  </section>`;
}

function renderFillQuestion(question, index) {
  const value = state.fillDraft[question.id];
  const busy = state.timetableBusy && state.timetableBusy[question.id];
  return `<article class="fill-question" data-fill-question="${question.id}">
    <div class="fill-q-head"><span class="q-number">${index + 1}</span><div><h3>${esc(question.label)}${question.required ? '<em>*</em>' : ''}</h3>${question.help ? `<p>${esc(question.help)}</p>` : ''}</div></div>
    <div class="fill-q-body">${renderQuestionInput(question, value, { mode: 'fill', busy, token: state.route.token })}</div>
  </article>`;
}

function renderQuestionInput(question, value, context) {
  const qid = question.id;
  if (question.type === 'short') {
    return `<input class="input" data-fill-q="${qid}" value="${esc(value || '')}" placeholder="${esc(question.placeholder || '请输入')}" ${question.required ? 'data-required="1"' : ''} />`;
  }
  if (question.type === 'textarea') {
    return `<textarea class="input" data-fill-q="${qid}" rows="4" placeholder="${esc(question.placeholder || '请输入')}" ${question.required ? 'data-required="1"' : ''}>${esc(value || '')}</textarea>`;
  }
  if (question.type === 'radio') {
    return `<div class="choice-grid">${question.options.map((option) => `<label class="choice-item ${value === option ? 'selected' : ''}"><input type="radio" name="q_${qid}" value="${esc(option)}" data-fill-q="${qid}" ${value === option ? 'checked' : ''} /><span class="choice-dot"></span><span>${esc(option)}</span></label>`).join('')}</div>`;
  }
  if (question.type === 'checkbox' || question.type === 'timeslots') {
    const values = Array.isArray(value) ? value : [];
    return `<div class="choice-grid ${question.type === 'timeslots' ? 'slot-grid' : ''}">${question.options.map((option) => `<label class="choice-item ${values.includes(option) ? 'selected' : ''}"><input type="checkbox" value="${esc(option)}" data-fill-q="${qid}" data-multi="1" ${values.includes(option) ? 'checked' : ''} /><span class="choice-box"></span><span>${esc(option)}</span></label>`).join('')}</div>`;
  }
  if (question.type === 'timetable') return renderTimetableEditor(question, value, context);
  return '';
}

function imageSrc(url, token) {
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;
}

function renderTimetableEditor(question, value, context) {
  if (context.busy) {
    return `<div class="ocr-working"><span class="spinner"></span><div><strong>正在识别课程表…</strong><p>正在判断星期和节次，请稍候。</p></div></div>`;
  }
  const preview = state.timetablePreviews[question.id] || (value?.imageUrl ? imageSrc(value.imageUrl, context.token) : '');
  const hasImage = Boolean(preview);
  const busy = value && Array.isArray(value.busy) ? value.busy : [];
  const showGrid = Boolean(value);
  const layouts = [['auto', '自动定位星期和节次'], ['12-7', '12节 · 7天（无午休行）'], ['13-7', '13节 · 7天（无午休行）'], ['14-7', '14节 · 7天（无午休行）'], ['12-5', '12节 · 5天（无午休行）'], ['13-5', '13节 · 5天（无午休行）'], ['14-5', '14节 · 5天（无午休行）'], ['noon-7', '13节 · 7天（第5节后两行午休）']];
  return `<div class="timetable-editor">
    <div class="timetable-layout"><label>课表版式<select class="input" data-timetable-layout="${question.id}">${layouts.map(([key, label]) => `<option value="${key}" ${key === (state.timetableLayouts[question.id] || 'auto') ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${state.timetableFiles[question.id] ? `<button class="text-button" type="button" data-action="timetable-retry" data-qid="${question.id}">${icon('refresh')}重新识别</button>` : ''}</div>
    <label class="upload-zone ${hasImage ? 'has-image' : ''}">
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-timetable-file="${question.id}" />
      ${hasImage ? `<img src="${esc(preview)}" alt="课程表截图" />` : `<span class="upload-icon">${icon('upload')}</span><strong>点击上传课程表截图</strong><span>支持 JPG / PNG / WebP，最大 8 MB</span>`}
    </label>
    ${state.timetableWarnings[question.id] ? `<p class="timetable-warning" role="alert">${esc(state.timetableWarnings[question.id])}</p>` : ''}
    ${showGrid ? `<div class="ocr-result-head"><div><strong>有课节次</strong><span>已标记 ${busy.length} 个连续有课时段 · ${esc(value.demo ? '演示识别服务' : value.provider || '手动标记')}</span></div><button class="text-button" type="button" data-action="timetable-clear-busy" data-qid="${question.id}">${icon('refresh')}清空重标</button></div>` : ''}
    ${showGrid ? renderBusyGrid(question.id, value, 'fill') : ''}
    ${showGrid ? renderEmptyWeek(question.id, value, 'fill') : ''}
    ${showGrid ? renderBusyWindows(value) : ''}
    ${showGrid ? renderActivityMatches(value) : ''}
    ${!showGrid ? `<div class="manual-row"><button class="text-button" type="button" data-action="timetable-manual-grid" data-qid="${question.id}">${icon('plus')}没有截图，手动标记有课节次</button></div>` : ''}
    ${showGrid ? `<p class="ocr-hint">${icon('info')}系统只判断“星期几、第几节有课”。如果识别有遗漏，直接点击网格修正；提交后会按创建者设置的节次时间自动比对活动时段。</p>` : ''}
  </div>`;
}

function renderEmptyWeek(qid, value, mode) {
  return `<label class="timetable-empty"><input type="checkbox" data-empty-week="${qid}" data-busy-mode="${mode}" ${value.emptyWeek ? 'checked' : ''} />确认本周无课</label>`;
}

function activeTimetableSurvey() {
  return state.route.page === 'fill' ? state.fillData?.survey : state.resultData?.survey;
}

function activeTimetableMode() {
  return activeTimetableSurvey()?.timetableMode || 'period';
}

function activeTimeslotOptions() {
  const data = state.route.page === 'fill' ? state.fillData : state.resultData;
  if (!data) return [];
  return data.questions.filter((question) => question.type === 'timeslots').flatMap((question) => question.options || []);
}

function slotWindow(text) {
  const value = String(text || '');
  const dayMatch = /(?:周|星期)\s*([一二三四五六日天])/.exec(value);
  const timeMatch = /(\d{1,2})\s*:\s*(\d{2})\s*(?:-|–|—|~|～|至|到)\s*(\d{1,2})\s*:\s*(\d{2})/.exec(value);
  if (!dayMatch || !timeMatch) return null;
  return {
    day: `周${dayMatch[1] === '天' ? '日' : dayMatch[1]}`,
    start: Number(timeMatch[1]) * 60 + Number(timeMatch[2]),
    end: Number(timeMatch[3]) * 60 + Number(timeMatch[4])
  };
}

function busyWindows(value, periodTimes) {
  if (!value || !Array.isArray(value.busy)) return [];
  const windows = [];
  for (const block of value.busy) {
    const start = periodTimes[block.startPeriod - 1];
    const end = periodTimes[(block.endPeriod || block.startPeriod) - 1];
    if (!start || !start.start) continue;
    const startMinutes = Number(start.start.slice(0, 2)) * 60 + Number(start.start.slice(3, 5));
    const endText = end && (end.end || end.start);
    const endMinutes = endText ? Number(endText.slice(0, 2)) * 60 + Number(endText.slice(3, 5)) : startMinutes + 45;
    windows.push({
      day: block.day,
      startPeriod: block.startPeriod,
      endPeriod: block.endPeriod,
      start: startMinutes,
      end: Math.max(endMinutes, startMinutes + 1),
      estimated: !(end && end.end)
    });
  }
  return windows;
}

function renderBusyWindows(value) {
  if (activeTimetableMode() === 'clock') {
    const blocks = value && Array.isArray(value.busy) ? value.busy : [];
    if (!blocks.length) return '';
    return `<div class="busy-window-summary"><strong>${icon('calendar')}识别出的有课节次</strong><div class="busy-window-list">${blocks.map((item) => `<span class="busy-window-chip">${esc(item.day)} 第${item.startPeriod}–${item.endPeriod}节</span>`).join('')}</div></div>`;
  }
  const windows = busyWindows(value, normalizePeriodTimes(activeTimetableSurvey()?.periodTimes));
  if (!windows.length) return '';
  return `<div class="busy-window-summary"><strong>${icon('calendar')}识别出的有课时间段</strong><div class="busy-window-list">${windows.map((item) => `<span class="busy-window-chip">${esc(item.day)} ${minutesText(item.start)}–${minutesText(item.end)}${item.estimated ? '<small>估算</small>' : ''}</span>`).join('')}</div></div>`;
}

function mergeBusyCells(cells) {
  const grouped = new Map();
  for (const cell of cells) {
    if (!WEEK_DAYS.includes(cell.day) || !cell.period) continue;
    if (!grouped.has(cell.day)) grouped.set(cell.day, new Set());
    grouped.get(cell.day).add(Number(cell.period));
  }
  const busy = [];
  for (const day of WEEK_DAYS) {
    const periods = [...(grouped.get(day) || [])].sort((a, b) => a - b);
    if (!periods.length) continue;
    let start = periods[0];
    let previous = periods[0];
    for (let index = 1; index <= periods.length; index += 1) {
      const current = periods[index];
      if (current === previous + 1) { previous = current; continue; }
      busy.push({ day, startPeriod: start, endPeriod: previous });
      start = current;
      previous = current;
    }
  }
  return busy;
}

function busyCells(value) {
  const cells = [];
  for (const block of value && Array.isArray(value.busy) ? value.busy : []) {
    for (let period = block.startPeriod; period <= block.endPeriod; period += 1) cells.push({ day: block.day, period });
  }
  return cells;
}

function isBusyCell(value, day, period) {
  return Boolean(value && Array.isArray(value.busy) && value.busy.some((block) => block.day === day && period >= block.startPeriod && period <= block.endPeriod));
}

function renderBusyGrid(qid, value, mode) {
  const periodTimes = normalizePeriodTimes(activeTimetableSurvey()?.periodTimes);
  const busy = value && Array.isArray(value.busy) ? value.busy : [];
  const mappedEnd = periodTimes.reduce((max, item, index) => item.start || item.end ? index + 1 : max, 0);
  const busyEnd = busy.reduce((max, block) => Math.max(max, block.endPeriod || 0), 0);
  const selectedPeriods = Number((state.timetableLayouts[qid] || '').split('-')[0]) || 0;
  const lastPeriod = Math.max(13, Math.min(30, Math.max(mappedEnd, busyEnd, selectedPeriods)));
  return `<div class="busy-grid-shell"><table class="busy-grid"><thead><tr><th class="busy-period-col">节次</th>${WEEK_DAYS.map((day) => `<th>${day}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({ length: lastPeriod }, (_, index) => {
      const period = index + 1;
      const time = periodTimes[index];
      return `<tr><th class="busy-period-col"><strong>${period}</strong><small>${esc(time && time.start ? `${time.start}–${time.end}` : '未设置')}</small></th>${WEEK_DAYS.map((day) => `<td><label class="busy-check ${isBusyCell(value, day, period) ? 'checked' : ''}" title="${esc(day)} 第${period}节"><input type="checkbox" data-busy-day="${esc(day)}" data-busy-period="${period}" data-busy-qid="${qid}" data-busy-mode="${mode}" ${isBusyCell(value, day, period) ? 'checked' : ''} /><span></span></label></td>`).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
}

function renderActivityMatches(value) {
  const options = activeTimeslotOptions().map((label) => ({ label, window: slotWindow(label) })).filter((item) => item.window);
  if (!options.length) return '';
  if (activeTimetableMode() === 'clock') {
    return `<div class="activity-match-note">${icon('info')}当前表格选择“不自动换算”，只记录有课节次，不按具体时间比对活动时段。</div>`;
  }
  const periodTimes = normalizePeriodTimes(activeTimetableSurvey()?.periodTimes);
  return `<div class="activity-match"><div class="activity-match-head"><strong>与活动时间段比对</strong></div>${options.map(({ label, window }) => {
    const status = TimetableOccupancy.match(value, periodTimes, window);
    const text = { free: '符合', conflict: '有课冲突', unknown: '待确认：请补全当天有课节次时间' }[status];
    return `<div class="activity-match-row ${status === 'free' ? 'free' : 'conflict'}"><span>${esc(label)}</span><b>${text}</b></div>`;
  }).join('')}</div>`;
}

function toggleBusyCell(input) {
  const qid = input.dataset.busyQid;
  const mode = input.dataset.busyMode;
  const holder = mode === 'edit' ? state.editDraft : state.fillDraft;
  let value = holder && holder[qid];
  if (!value || typeof value !== 'object') value = { busy: [], text: '', imageUrl: '', provider: 'manual', demo: false };
  if (!Array.isArray(value.busy)) value.busy = [];
  const cells = busyCells(value);
  const day = input.dataset.busyDay;
  const period = Number(input.dataset.busyPeriod);
  const next = new Map(cells.map((cell) => [`${cell.day}|${cell.period}`, cell]));
  const key = `${day}|${period}`;
  if (input.checked) next.set(key, { day, period });
  else next.delete(key);
  value.busy = mergeBusyCells([...next.values()]);
  value.emptyWeek = false;
  value.provider = value.provider || 'manual';
  holder[qid] = value;
  input.closest('.busy-check')?.classList.toggle('checked', input.checked);

}

function syncFillDraftFromDom() {
  if (!state.fillData) return;
  for (const question of state.fillData.questions) {
    if (question.type === 'short' || question.type === 'textarea') {
      const element = $(`[data-fill-q="${question.id}"]`);
      if (element) state.fillDraft[question.id] = element.value;
    } else if (question.type === 'radio') {
      const checked = $(`[data-fill-q="${question.id}"]:checked`);
      state.fillDraft[question.id] = checked ? checked.value : '';
    } else if (question.type === 'checkbox' || question.type === 'timeslots') {
      state.fillDraft[question.id] = $$(`[data-fill-q="${question.id}"]:checked`).map((input) => input.value);
    }
  }
}

function refreshFillQuestion(questionId) {
  const question = state.fillData && state.fillData.questions.find((item) => item.id === questionId);
  if (!question) return;
  const index = state.fillData.questions.indexOf(question);
  const element = $(`[data-fill-question="${questionId}"]`);
  if (element) element.outerHTML = renderFillQuestion(question, index);
}

async function fileToDataUrl(file) {
  if (file.size <= 900 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  try {
    const bitmap = await createImageBitmap(file);
    let maxSide = 1800;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(0.6, 0.9 - attempt * 0.07);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= 1250000 || attempt === 4) return dataUrl;
      maxSide = Math.round(maxSide * 0.82);
    }
  } catch (error) {}
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleTimetableFile(input) {
  const qid = input.dataset.timetableFile;
  const file = input.files && input.files[0];
  if (!file || !qid) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
    toast('请选择 JPG、PNG、WebP 或 GIF 图片', 'error');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast('图片不能超过 8 MB', 'error');
    return;
  }
  state.timetableFiles[qid] = file;
  await recognizeTimetableFile(qid, file);
}

async function recognizeTimetableFile(qid, file) {
  if (!file || state.timetableBusy[qid]) return;
  const version = state.routeVersion;
  const token = state.route.token;
  const isCurrent = () => version === state.routeVersion && state.route.page === 'fill' && state.route.token === token;
  const previous = state.fillDraft[qid];
  let automatic = null;
  state.timetableBusy[qid] = true;
  state.timetableWarnings[qid] = '';
  refreshFillQuestion(qid);
  try {
    const originalUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    });
    if (!isCurrent()) return;
    state.timetablePreviews[qid] = originalUrl;
    const image = await loadImageElement(originalUrl);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const layout = state.timetableLayouts[qid] || 'auto';
    const [count, days] = layout.split('-');
    const options = {
      periods: count === 'noon' ? [1, 2, 3, 4, 5, 0, 0, 6, 7, 8, 9, 10, 11, 12, 13] : Array.from({ length: Number(count) || 0 }, (_, i) => i + 1),
      dayCount: Number(days),
      strict: true
    };
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    automatic = layout === 'auto' ? TimetableOccupancy.detectAuto(pixels, canvas.width, canvas.height) : null;
    const local = layout === 'auto' ? null : TimetableOccupancy.detect(pixels, canvas.width, canvas.height, options);
    if (!isCurrent()) return;
    if (local) {
      state.fillDraft[qid] = local;
      toast('已按所选版式识别，请对照原图核对节次');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const result = await api('POST', `/api/surveys/fill/${token}/ocr`, {
      dataUrl,
      filename: file.name,
      questionId: qid
    });
    const analysis = await analyzeTimetablePixels(dataUrl, result.grid, result.busy);
    if (!isCurrent()) return;
    if (!analysis.busy.length) throw new Error('没有确认到有课节次，请对照原图标记；本周无课时请单独确认。');
    state.fillDraft[qid] = {
      busy: analysis.busy,
      text: result.text,
      imageUrl: result.imageUrl,
      provider: result.provider,
      demo: result.demo,
      emptyWeek: false
    };
    if (result.grid?.columns?.length && (result.grid.columns.length < 5 || result.grid.periods[0]?.period !== 1)) {
      state.timetableWarnings[qid] = '只定位到部分星期或节次，请对照原图补全遗漏；建议上传包含全部星期和节次的完整截图。';
    }
    toast(result.demo ? '课程表已识别（当前为演示识别服务）' : `识别完成：${analysis.busy.length} 个有课时段，请检查网格`, result.demo ? 'info' : 'success');
  } catch (error) {
    if (!isCurrent()) return;
    if (automatic && !previous?.busy?.length && !previous?.emptyWeek) {
      state.fillDraft[qid] = automatic;
      const { rowCount, dayCount } = automatic.layout;
      state.timetableWarnings[qid] = `文字识别未完成，已按 ${rowCount} 节、${dayCount} 天的彩色网格生成初稿，暂按周一开始、无午休行排列。请核对星期和节次，有午休行时请选择对应版式后重试。`;
      toast('已生成本地识别初稿，请对照原图核对', 'info');
    } else {
      state.fillDraft[qid] = previous || { busy: [], text: '', imageUrl: '', provider: 'manual', demo: false, emptyWeek: false };
      const reason = error.message || '识别失败，请对照原图标记有课节次。';
      state.timetableWarnings[qid] = previous ? `${reason} 已保留重试前的标记；当前预览为本次上传的图片，请核对。` : reason;
      toast(reason, 'error');
    }
  } finally {
    state.timetableBusy[qid] = false;
    if (isCurrent() && state.fillData) refreshFillQuestion(qid);
  }
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function analyzeTimetablePixels(dataUrl, grid, textBusy) {
  const baseBusy = Array.isArray(textBusy) ? textBusy : [];
  if (!grid || !Array.isArray(grid.columns) || !grid.columns.length || !Array.isArray(grid.periods) || !grid.periods.length) {
    return { busy: baseBusy, pixelUsed: false };
  }
  try {
    const image = await loadImageElement(dataUrl);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const cells = busyCells({ busy: baseBusy });
    for (const column of grid.columns) {
      for (const row of grid.periods) {
        if (TimetableOccupancy.coloredCell(pixels, width, height, column.left, column.right, row.top, row.bottom)) cells.push({ day: column.day, period: row.period });
      }
    }
    return { busy: mergeBusyCells(cells), pixelUsed: true };
  } catch (error) {
    return { busy: baseBusy, pixelUsed: false };
  }
}

function openManualBusyGrid(questionId) {
  state.fillDraft[questionId] = {
    busy: [],
    text: '',
    imageUrl: '',
    provider: 'manual',
    demo: false,
    emptyWeek: false
  };
  refreshFillQuestion(questionId);
}

function validateFillDraft() {
  if (!state.fillData) return true;
  for (const question of state.fillData.questions) {
    if (!question.required && !(question.type === 'timetable' && state.fillDraft[question.id])) continue;
    const value = state.fillDraft[question.id];
    let valid = true;
    if (question.type === 'short' || question.type === 'textarea') valid = Boolean(String(value || '').trim());
    else if (question.type === 'radio') valid = Boolean(value);
    else if (question.type === 'checkbox' || question.type === 'timeslots') valid = Array.isArray(value) && value.length > 0;
    else if (question.type === 'timetable') valid = Boolean(value && ((value.busy && value.busy.length) || value.emptyWeek === true));
    if (!valid) {
      const element = $(`[data-fill-question="${question.id}"]`);
      if (element) {
        element.classList.add('has-error');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast(`请完成「${question.label}」`, 'error');
      return false;
    }
  }
  return true;
}

async function submitFill(event) {
  event.preventDefault();
  if (!state.fillData || state.fillSubmitting) return;
  syncFillDraftFromDom();
  if (!validateFillDraft()) return;
  state.fillSubmitting = true;
  const button = $('#fillSubmit');
  if (button) { button.disabled = true; button.innerHTML = `<span class="spinner small"></span>正在提交…`; }
  try {
    await api('POST', `/api/surveys/fill/${state.route.token}/submissions`, { answers: state.fillDraft });
    toast('提交成功');
    await showFill(state.route.token, state.routeVersion);
  } catch (error) {
    toast(error.message, 'error');
    state.fillSubmitting = false;
    if (button) { button.disabled = false; button.innerHTML = `${icon('check')}提交问卷`; }
  }
}

async function refreshFillResult() {
  try {
    const data = await api('GET', `/api/surveys/fill/${state.route.token}`);
    state.fillData = data;
    renderFillPage();
    if (data.survey.resultPath) toast('汇总已发布');
    else toast('创建人还没有发布汇总', 'info');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function showResult(token, version) {
  renderLoading('正在打开汇总表…');
  try {
    const data = await api('GET', `/api/surveys/result/${token}`);
    if (version !== state.routeVersion || state.route.page !== 'result') return;
    state.resultData = data;
    state.resultLastRevision = data.stats.revision;
    renderResultPage();
    startLive(`/api/surveys/result/${token}/events`, () => refreshResult(true));
  } catch (error) {
    if (version === state.routeVersion) renderError(error, () => showResult(token, version));
  }
}

async function refreshResult(silent = false) {
  const token = state.route.page === 'result' ? state.route.token : '';
  if (!token) return;
  try {
    const data = await api('GET', `/api/surveys/result/${token}`);
    if (state.route.page !== 'result' || state.route.token !== token) return;
    const changed = state.resultLastRevision !== data.stats.revision;
    state.resultData = data;
    state.resultLastRevision = data.stats.revision;
    if (!silent || changed) renderResultPage();
  } catch (error) {
    if (!silent) toast(error.message, 'error');
  }
}

function renderResultPage() {
  const data = state.resultData;
  if (!data) return;
  if (!data.survey.published) {
    $('#app').innerHTML = `<section class="public-page state-page">
      <div class="state-icon amber">${icon('clock')}</div>
      <span class="eyebrow">等待发布</span>
      <h1>${esc(data.survey.title)}</h1>
      <p>创建人还没有发布汇总表。发布后刷新这个页面，就能看到所有人的填写结果。</p>
      <button class="button button-primary" type="button" data-action="retry-route">${icon('refresh')}刷新页面</button>
    </section>`;
    return;
  }
  const survey = data.survey;
  $('#app').innerHTML = `<section class="public-page result-page">
    <div class="public-topline"><a href="/" data-link class="mini-brand">${icon('table')}简集 · 汇总表</a><span class="live-indicator" data-mode="live"><i></i><span class="live-label">实时同步中</span></span></div>
    <header class="result-header">
      <div>
        <div class="title-badges"><span class="badge badge-teal">汇总已发布</span><span class="badge badge-blue">${esc(accessInfo(survey.access).label)}</span><span class="badge badge-gray">${esc(survey.statusText)}</span></div>
        <h1>${esc(survey.title)}</h1>
        <p>${esc(survey.description || '所有人提交的内容已经整理在下面的表格中。')}</p>
        <div class="result-meta"><span>${icon('users')}${data.stats.total} 份填写</span><span>${icon('clock')}${esc(deadlineInfo(survey.deadline).text)}</span><span>${icon('refresh')}${esc(state.lastLiveAt ? '刚刚更新' : survey.updatedAtText)}</span></div>
      </div>
      <div class="result-actions">
        <button class="button button-secondary" type="button" data-action="refresh-result">${icon('refresh')}刷新</button>
        <button class="button button-secondary" type="button" data-action="copy-result-page">${icon('link')}复制链接</button>
      </div>
    </header>
    ${renderMyResultStatus(data)}
    <div class="result-table-toolbar"><div><h2>全员汇总</h2><p>修改申请通过并保存后，这一张表会立即更新。</p></div><span class="live-indicator" data-mode="live"><i></i><span class="live-label">实时同步中</span></span></div>
    ${data.submissions.length ? renderResultTable(data) : `<div class="panel-empty"><span class="empty-icon">${icon('users')}</span><h3>还没有填写记录</h3><p>等填写人提交后，这里会自动出现数据。</p></div>`}
        ${data.stats.optionStats.length ? `<div class="result-insights"><section class="insight-card"><div class="insight-head"><span>${icon('chart')}选择与时段分布</span><small>实时统计</small></div>${renderOptionStats(data.stats.optionStats)}</section>${data.stats.timetable.respondents ? `<section class="insight-card"><div class="insight-head"><span>${icon('calendar')}空闲时间与活动匹配</span><small>${data.stats.timetable.busyCount || 0} 节有课</small></div>${renderTimetableStats(data.stats.timetable)}</section>` : ''}</div>` : ''}
  </section>`;
}

function renderMyResultStatus(data) {
  const survey = data.survey;
  if (!data.mySubmission) {
    return `<div class="my-status neutral">${icon('info')}<div><strong>当前浏览器没有找到你的填写记录</strong><p>如果你用另一个浏览器或设备填写，请回到填写时使用的设备打开汇总链接。数据本身仍然会展示在下面的汇总表中。</p></div></div>`;
  }
  if (survey.access === 'readonly') {
    return `<div class="my-status neutral">${icon('lock')}<div><strong>这是你的填写记录，当前汇总表为只读</strong><p>创建人关闭了修改入口，如需更正请联系创建人。</p></div>${receiptButton()}</div>`;
  }
  if (data.editState === 'open') {
    return `<div class="my-status success">${icon('edit')}<div><strong>你可以直接修改自己的填写</strong><p>保存后，所有人看到的汇总表会立即更新。</p></div><button class="button button-primary button-small" type="button" data-action="open-edit-submission">${icon('edit')}修改我的填写</button>${receiptButton()}</div>`;
  }
  if (data.editState === 'approved') {
    return `<div class="my-status success">${icon('check')}<div><strong>修改申请已通过，可以修改一次</strong><p>请一次性完成修改。保存后这条修改权限会自动使用，汇总表实时刷新。</p></div><button class="button button-primary button-small" type="button" data-action="open-edit-submission">${icon('edit')}现在修改</button>${receiptButton()}</div>`;
  }
  if (data.editState === 'pending') {
    return `<div class="my-status warning">${icon('clock')}<div><strong>修改申请正在等待创建人处理</strong><p>申请：${esc(data.myRequest.summary)}</p></div><span class="waiting-pill">等待审批</span>${receiptButton()}</div>`;
  }
  if (data.editState === 'used') {
    return `<div class="my-status neutral">${icon('check')}<div><strong>你上次的修改已经完成</strong><p>汇总表已更新。如需再次更正，可以重新提交修改申请。</p></div><button class="button button-secondary button-small" type="button" data-action="open-edit-request">${icon('message')}再次申请修改</button>${receiptButton()}</div>`;
  }
  if (data.editState === 'rejected') {
    return `<div class="my-status danger">${icon('close')}<div><strong>上次修改申请未通过</strong><p>你可以补充更清楚的理由后重新申请。</p></div><button class="button button-secondary button-small" type="button" data-action="open-edit-request">${icon('message')}重新申请</button>${receiptButton()}</div>`;
  }
  return `<div class="my-status neutral">${icon('message')}<div><strong>需要修改自己填写的内容？</strong><p>提交申请后，创建人通过即可修改本人数据，其他行始终不可修改。</p></div><button class="button button-primary button-small" type="button" data-action="open-edit-request">${icon('message')}申请修改</button>${receiptButton()}</div>`;
}

function receiptButton() {
  return `<button class="text-button subtle" type="button" data-action="copy-receipt" title="在另一台设备上读取本人身份">${icon('link')}复制修改回执</button>`;
}

function renderResultTable(data, raw = false) {
  if (!raw && data.stats.participation?.length) {
    return `${renderParticipationTable(data)}<details class="raw-responses"><summary>查看原始答卷明细</summary>${renderResultTable(data, true)}</details>`;
  }
  return `<div class="table-shell result-table-shell"><div class="table-scroll"><table class="data-table result-table">
    <thead><tr><th class="sticky-col">填写人</th>${data.questions.map((question) => `<th><span>${esc(question.label)}</span>${question.type === 'timetable' ? '<small class="th-note">课表识别</small>' : ''}</th>`).join('')}<th>状态</th><th>更新</th></tr></thead>
    <tbody>${data.submissions.map((submission) => `<tr class="${submission.mine ? 'my-row' : ''}">
      <td class="sticky-col"><div class="person-cell"><span class="avatar">${esc(submission.name.slice(0, 1))}</span><div><strong>${esc(submission.name)}</strong><small>${submission.mine ? '<span class="mine-tag">我</span>' : esc(submission.submittedAtText)}</small></div></div></td>
      ${data.questions.map((question) => `<td>${formatValue(question, submission.answers[question.id])}</td>`).join('')}
      <td><span class="badge ${submission.status === 'edited' ? 'badge-teal' : 'badge-blue'}">${submission.status === 'edited' ? '已修改' : '已提交'}</span></td>
      <td class="nowrap"><span class="cell-time">${esc(submission.updatedAtText)}</span></td>
    </tr>`).join('')}</tbody>
  </table></div><div class="table-footer"><span>共 ${data.stats.total} 份 · 高亮行为你的填写</span><span>${icon('refresh')}修改保存后自动刷新</span></div></div>`;
}

function renderEditQuestion(question, index) {
  const value = state.editDraft ? state.editDraft[question.id] : '';
  const qid = question.id;
  let input = '';
  if (question.type === 'short') input = `<input class="input" data-edit-q="${qid}" value="${esc(value || '')}" placeholder="${esc(question.placeholder || '请输入')}" />`;
  else if (question.type === 'textarea') input = `<textarea class="input" data-edit-q="${qid}" rows="4" placeholder="${esc(question.placeholder || '请输入')}">${esc(value || '')}</textarea>`;
  else if (question.type === 'radio') input = `<div class="choice-grid">${question.options.map((option) => `<label class="choice-item ${value === option ? 'selected' : ''}"><input type="radio" name="edit_${qid}" value="${esc(option)}" data-edit-q="${qid}" ${value === option ? 'checked' : ''} /><span class="choice-dot"></span><span>${esc(option)}</span></label>`).join('')}</div>`;
  else if (question.type === 'checkbox' || question.type === 'timeslots') {
    const values = Array.isArray(value) ? value : [];
    input = `<div class="choice-grid ${question.type === 'timeslots' ? 'slot-grid' : ''}">${question.options.map((option) => `<label class="choice-item ${values.includes(option) ? 'selected' : ''}"><input type="checkbox" value="${esc(option)}" data-edit-q="${qid}" data-multi="1" ${values.includes(option) ? 'checked' : ''} /><span class="choice-box"></span><span>${esc(option)}</span></label>`).join('')}</div>`;
  } else if (question.type === 'timetable') {
    const timetable = value && typeof value === 'object' ? value : { busy: [], text: '', imageUrl: '', provider: 'manual' };
    if (!Array.isArray(timetable.busy)) timetable.busy = [];
    input = `<div class="edit-timetable">
      ${timetable.imageUrl ? `<div class="ocr-image-preview"><img src="${esc(imageSrc(timetable.imageUrl, state.route.token))}" alt="课程表截图" /><span>原图</span></div>` : ''}
      <div class="ocr-result-head"><div><strong>有课节次</strong><span>${timetable.busy.length} 个连续有课时段${timetable.demo ? ' · 演示识别结果' : ''}</span></div></div>
      ${renderBusyGrid(qid, timetable, 'edit')}
      ${renderEmptyWeek(qid, timetable, 'edit')}
      ${renderBusyWindows(timetable)}
      ${renderActivityMatches(timetable)}
    </div>`;
  }
  return `<article class="edit-question" data-edit-question="${qid}">
    <div class="fill-q-head"><span class="q-number">${index + 1}</span><div><h3>${esc(question.label)}${question.required ? '<em>*</em>' : ''}</h3>${question.help ? `<p>${esc(question.help)}</p>` : ''}</div></div>
    <div class="fill-q-body">${input}</div>
  </article>`;
}

function openEditSubmissionModal() {
  const data = state.resultData;
  if (!data || !data.mySubmission || !data.canEdit) {
    toast('当前没有可用的修改权限', 'error');
    return;
  }
  state.editDraft = JSON.parse(JSON.stringify(data.mySubmission.answers || {}));
  for (const question of data.questions) {
    if (state.editDraft[question.id] === undefined) {
      state.editDraft[question.id] = question.type === 'checkbox' || question.type === 'timeslots' ? [] : question.type === 'timetable' ? null : '';
    }
  }
  openModal(`
    <div class="modal-head">
      <div><span class="eyebrow">修改本人数据</span><h2>${esc(data.mySubmission.name)} 的填写</h2><p>保存后，所有人的汇总表会立即更新。你只能修改自己的这一行。</p></div>
      <button class="icon-button" type="button" data-modal-close aria-label="关闭">${icon('close')}</button>
    </div>
    <form id="editSubmissionForm" class="modal-body edit-form-body">
      <div class="callout">${icon('info')}<span>${data.survey.access === 'approval' ? '这次修改使用审批通过后的一次性权限，保存后自动失效。' : '当前允许自由修改本人数据，可以多次保存。'}</span></div>
      ${data.questions.map(renderEditQuestion).join('')}
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>取消</button><button class="button button-primary" type="submit" id="editSubmitButton">${icon('check')}保存并实时更新</button></div>
    </form>`, {
    className: 'edit-modal',
    label: '修改本人填写',
    onClose: () => { state.editDraft = null; state.editSaving = false; }
  });
}

function syncEditDraftFromDom() {
  if (!state.editDraft || !state.resultData) return;
  for (const question of state.resultData.questions) {
    if (question.type === 'short' || question.type === 'textarea') {
      const input = $(`[data-edit-q="${question.id}"]`);
      if (input) state.editDraft[question.id] = input.value;
    } else if (question.type === 'radio') {
      const checked = $(`[data-edit-q="${question.id}"]:checked`);
      state.editDraft[question.id] = checked ? checked.value : '';
    } else if (question.type === 'checkbox' || question.type === 'timeslots') {
      state.editDraft[question.id] = $$(`[data-edit-q="${question.id}"]:checked`).map((input) => input.value);
    }
  }
}

function validateDraftAnswers(questions, draft) {
  for (const question of questions) {
    if (!question.required && !(question.type === 'timetable' && draft[question.id])) continue;
    const value = draft[question.id];
    let valid = true;
    if (question.type === 'short' || question.type === 'textarea') valid = Boolean(String(value || '').trim());
    else if (question.type === 'radio') valid = Boolean(value);
    else if (question.type === 'checkbox' || question.type === 'timeslots') valid = Array.isArray(value) && value.length > 0;
    else if (question.type === 'timetable') valid = Boolean(value && ((value.busy && value.busy.length) || value.emptyWeek === true));
    if (!valid) {
      const element = $(`[data-edit-question="${question.id}"]`);
      if (element) { element.classList.add('has-error'); element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      toast(`请完成「${question.label}」`, 'error');
      return false;
    }
  }
  return true;
}

async function saveSubmissionEdit(event) {
  event.preventDefault();
  if (!state.resultData || !state.resultData.mySubmission || state.editSaving) return;
  syncEditDraftFromDom();
  if (!validateDraftAnswers(state.resultData.questions, state.editDraft)) return;
  state.editSaving = true;
  const button = $('#editSubmitButton');
  if (button) { button.disabled = true; button.innerHTML = `<span class="spinner small"></span>正在保存…`; }
  try {
    await api('PUT', `/api/submissions/${state.resultData.mySubmission.id}`, { answers: state.editDraft });
    closeModal();
    toast('修改已保存，汇总表正在实时更新');
    await refreshResult();
  } catch (error) {
    toast(error.message, 'error');
    state.editSaving = false;
    if (button) { button.disabled = false; button.innerHTML = `${icon('check')}保存并实时更新`; }
  }
}

function openEditRequestModal() {
  if (!state.resultData || !state.resultData.mySubmission) {
    toast('当前浏览器没有找到你的填写记录', 'error');
    return;
  }
  openModal(`
    <div class="modal-head">
      <div><span class="eyebrow">申请修改</span><h2>说明你想修改什么</h2><p>创建人通过后，你只能修改自己的那一行，而且只能修改一次。</p></div>
      <button class="icon-button" type="button" data-modal-close aria-label="关闭">${icon('close')}</button>
    </div>
    <form id="editRequestForm" class="modal-body">
      <label class="field"><span>修改内容<em>*</em></span><textarea class="input" name="summary" rows="4" maxlength="500" placeholder="例如：把周六下午改成周日上午，联系方式换成新号码" required></textarea></label>
      <label class="field"><span>补充理由</span><textarea class="input" name="reason" rows="3" maxlength="1000" placeholder="方便创建人判断，可选填"></textarea></label>
      <div class="callout">${icon('info')}<span>审批通过后，你会在汇总页看到“修改我的填写”按钮。保存修改后，汇总表会立即刷新。</span></div>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>取消</button><button class="button button-primary" type="submit">${icon('message')}提交申请</button></div>
    </form>`, { label: '申请修改' });
}

async function submitEditRequest(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const summary = String(formData.get('summary') || '').trim();
  const reason = String(formData.get('reason') || '').trim();
  if (!summary) { toast('请说明要修改什么', 'error'); return; }
  const button = $('button[type="submit"]', form);
  if (button) { button.disabled = true; button.textContent = '提交中…'; }
  try {
    await api('POST', `/api/surveys/result/${state.route.token}/edit-requests`, { summary, reason });
    closeModal();
    toast('修改申请已提交，等待创建人处理');
    await refreshResult();
  } catch (error) {
    toast(error.message, 'error');
    if (button) { button.disabled = false; button.innerHTML = `${icon('message')}提交申请`; }
  }
}

function copyMyReceipt() {
  const receipt = `${location.origin}/r/${state.route.token}?me=${encodeURIComponent(respondentToken)}`;
  copyText(receipt, '修改回执链接');
}

function rerenderEditQuestion(questionId) {
  if (!state.resultData || !state.editDraft) return;
  const index = state.resultData.questions.findIndex((question) => question.id === questionId);
  if (index < 0) return;
  const element = $(`[data-edit-question="${questionId}"]`);
  if (element) element.outerHTML = renderEditQuestion(state.resultData.questions[index], index);
}

function updateChoiceStyles(questionElement) {
  if (!questionElement) return;
  $$('.choice-item', questionElement).forEach((label) => {
    const input = $('input', label);
    label.classList.toggle('selected', Boolean(input && input.checked));
  });
}

function parseManageLink(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  let match = text.match(/\/manage\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  match = text.match(/^([A-Za-z0-9_-]{20,})$/);
  return match ? match[1] : '';
}

function handleAction(action, element) {
  if (!action) return;
  if (action === 'create-survey') return openSurveyBuilder();
  if (action === 'paste-manage-link') return openPasteManageDialog();
  if (action === 'scroll-created') {
    if (state.route.page !== 'home') return navigate('/');
    const section = $('#createdSection');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (action === 'forget-created') {
    forgetCreated(element.dataset.token);
    showHome(state.routeVersion);
    return;
  }
  if (action === 'retry-route') {
    if (state.retryRoute) state.retryRoute();
    else loadRoute();
    return;
  }
  if (action === 'builder-template') return applyBuilderTemplate(element.dataset.template);
  if (action === 'builder-period-template') return applyBuilderPeriodTemplate(element.dataset.template);
  if (action === 'builder-add-question') return addBuilderQuestion(element.dataset.type);
  if (action === 'builder-move-question') return moveBuilderQuestion(Number(element.dataset.index), Number(element.dataset.direction));
  if (action === 'builder-delete-question') return deleteBuilderQuestion(Number(element.dataset.index));
  if (action === 'builder-save') return saveBuilder();
  if (action === 'manage-tab') {
    state.manageTab = element.dataset.tab || 'summary';
    renderManage();
    return;
  }
  if (action === 'refresh-manage') return refreshManage();
  if (action === 'open-share') return openShareDialog();
  if (action === 'publish-results') return publishResults();
  if (action === 'copy-result-link') {
    const data = state.manageData;
    if (data) copyText(data.urls.result, '汇总链接');
    return;
  }
  if (action === 'review-request') return reviewRequest(element.dataset.id, element.dataset.decision);
  if (action === 'edit-survey-content') {
    const data = state.manageData;
    if (!data) return;
    return openSurveyBuilder({
      mode: 'edit', adminToken: state.route.token, survey: data.survey, questions: data.questions,
      onSaved: async (updated) => { state.manageData = updated; renderManage(); }
    });
  }
  if (action === 'refresh-result') return refreshResult();
  if (action === 'copy-result-page') return copyText(`${location.origin}/r/${state.route.token}`, '汇总链接');
  if (action === 'open-edit-request') return openEditRequestModal();
  if (action === 'open-edit-submission') return openEditSubmissionModal();
  if (action === 'copy-receipt') return copyMyReceipt();
  if (action === 'timetable-manual-grid') return openManualBusyGrid(element.dataset.qid);
  if (action === 'timetable-retry') return recognizeTimetableFile(element.dataset.qid, state.timetableFiles[element.dataset.qid]);
  if (action === 'timetable-clear-busy') {
    const value = state.fillDraft?.[element.dataset.qid];
    if (value) { value.busy = []; value.text = ''; value.emptyWeek = false; }
    if (state.route.page === 'fill' && state.fillData) refreshFillQuestion(element.dataset.qid);
    return;
  }
  if (action === 'refresh-fill-result') return refreshFillResult();
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (link) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin) {
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    }
    return;
  }
  const copyTarget = event.target.closest('[data-copy]');
  if (copyTarget) {
    copyText(copyTarget.dataset.copy, copyTarget.dataset.copyLabel || '内容');
    return;
  }
  if (event.target.closest('[data-modal-close]')) {
    closeModal();
    return;
  }
  if (event.target.matches('[data-modal-backdrop]')) {
    closeModal();
    return;
  }
  const actionElement = event.target.closest('[data-action]');
  if (actionElement) handleAction(actionElement.dataset.action, actionElement);
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (target.matches('[data-builder-field]')) {
    if (state.builder) state.builder[target.dataset.builderField] = target.value;
    return;
  }
  if (target.matches('[data-q-field]') && state.builder) {
    const question = state.builder.questions[Number(target.dataset.index)];
    if (!question) return;
    const field = target.dataset.qField;
    if (field === 'optionsText') {
      question.options = target.value.split('\n').map((line) => line.trim()).filter(Boolean);
    } else if (field === 'required') {
      question.required = target.checked;
    } else {
      question[field] = target.value;
    }
    return;
  }
  if (target.matches('[data-period-start]') && state.builder) {
    const index = Number(target.dataset.periodStart);
    state.builder.periodTimes[index].start = target.value;
    state.builder.periodSource = 'custom';
    return;
  }
  if (target.matches('[data-period-end]') && state.builder) {
    const index = Number(target.dataset.periodEnd);
    state.builder.periodTimes[index].end = target.value;
    state.builder.periodSource = 'custom';
    return;
  }
  if (target.matches('[data-fill-q]') && state.fillData) {
    const qid = target.dataset.fillQ;
    const question = state.fillData.questions.find((item) => item.id === qid);
    if (!question) return;
    if (question.type === 'checkbox' || question.type === 'timeslots') {
      state.fillDraft[qid] = $$(`[data-fill-q="${qid}"]:checked`).map((input) => input.value);
    } else {
      state.fillDraft[qid] = target.value;
    }
    updateChoiceStyles(target.closest('.fill-question'));
    target.closest('.fill-question')?.classList.remove('has-error');
    return;
  }
  if (target.matches('[data-edit-q]') && state.editDraft && state.resultData) {
    const qid = target.dataset.editQ;
    const question = state.resultData.questions.find((item) => item.id === qid);
    if (!question) return;
    if (question.type === 'checkbox' || question.type === 'timeslots') {
      state.editDraft[qid] = $$(`[data-edit-q="${qid}"]:checked`).map((input) => input.value);
    } else {
      state.editDraft[qid] = target.value;
    }
    updateChoiceStyles(target.closest('.edit-question'));
    target.closest('.edit-question')?.classList.remove('has-error');
    return;
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.matches('[data-timetable-layout]')) {
    state.timetableLayouts[target.dataset.timetableLayout] = target.value;
    return;
  }
  if (target.matches('[data-empty-week]')) {
    const qid = target.dataset.emptyWeek;
    const holder = target.dataset.busyMode === 'edit' ? state.editDraft : state.fillDraft;
    const value = holder[qid];
    if (!value) return;
    value.emptyWeek = target.checked;
    if (target.checked) { value.busy = []; value.text = ''; }
    if (target.dataset.busyMode === 'edit') rerenderEditQuestion(qid);
    else refreshFillQuestion(qid);
    return;
  }
  if (target.matches('[data-timetable-file]')) {
    handleTimetableFile(target);
    return;
  }
  if (target.matches('[data-builder-access]')) {
    state.builder.access = target.value;
    $$('.access-option').forEach((label) => label.classList.toggle('active', Boolean($('input', label)?.checked)));
    return;
  }
  if (target.matches('[data-busy-day]')) {
    toggleBusyCell(target);
    if (target.dataset.busyMode === 'edit' && state.resultData) rerenderEditQuestion(target.dataset.busyQid);
    else if (state.fillData) refreshFillQuestion(target.dataset.busyQid);
    return;
  }
  if (target.matches('[data-builder-timetable-mode]') && state.builder) {
    state.builder.timetableMode = target.value;
    $$('.period-mode-option').forEach((label) => label.classList.toggle('active', Boolean($('input', label)?.checked)));
    return;
  }
  if (target.matches('[data-period-start], [data-period-end]') && state.builder) {
    writeStorage(STORAGE_KEYS.periodTimes, state.builder.periodTimes);
    return;
  }
  if (target.matches('[data-q-field="required"]') && state.builder) {
    const question = state.builder.questions[Number(target.dataset.index)];
    if (question) question.required = target.checked;
    return;
  }
  if (target.matches('[data-manage-access]')) {
    $$('.access-option').forEach((label) => label.classList.toggle('active', Boolean($('input', label)?.checked)));
    return;
  }
  if (target.matches('[data-q-field="type"]') && state.builder) {
    const question = state.builder.questions[Number(target.dataset.index)];
    if (!question) return;
    question.type = target.value;
    if (['radio', 'checkbox', 'timeslots'].includes(question.type) && !question.options.length) {
      question.options = question.type === 'timeslots'
        ? ['周六 09:00–12:00', '周六 14:00–17:00', '周日 09:00–12:00']
        : ['选项一', '选项二'];
    }
    renderBuilderQuestions();
    return;
  }
  if (target.matches('[data-fill-q]') && state.fillData) {
    const qid = target.dataset.fillQ;
    const question = state.fillData.questions.find((item) => item.id === qid);
    if (!question) return;
    if (question.type === 'radio') state.fillDraft[qid] = target.value;
    else if (question.type === 'checkbox' || question.type === 'timeslots') state.fillDraft[qid] = $$(`[data-fill-q="${qid}"]:checked`).map((input) => input.value);
    updateChoiceStyles(target.closest('.fill-question'));
    target.closest('.fill-question')?.classList.remove('has-error');
    return;
  }
  if (target.matches('[data-edit-q]') && state.editDraft) {
    const qid = target.dataset.editQ;
    const question = state.resultData?.questions.find((item) => item.id === qid);
    if (!question) return;
    if (question.type === 'radio') state.editDraft[qid] = target.value;
    else if (question.type === 'checkbox' || question.type === 'timeslots') state.editDraft[qid] = $$(`[data-edit-q="${qid}"]:checked`).map((input) => input.value);
    updateChoiceStyles(target.closest('.edit-question'));
    target.closest('.edit-question')?.classList.remove('has-error');
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'fillForm') return submitFill(event);
  if (event.target.id === 'manageSettingsForm') return saveManageSettings(event);
  if (event.target.id === 'editSubmissionForm') return saveSubmissionEdit(event);
  if (event.target.id === 'editRequestForm') return submitEditRequest(event);
  if (event.target.id === 'pasteManageForm') {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = parseManageLink(formData.get('link'));
    if (!token) { toast('没有识别到有效的管理链接', 'error'); return; }
    closeModal();
    navigate(`/manage/${token}`);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('#modalRoot').children.length) closeModal();
});

window.addEventListener('popstate', loadRoute);

(function init() {
  try {
    const url = new URL(location.href);
    const receipt = url.searchParams.get('me');
    if (receipt && /^[A-Za-z0-9_-]{20,}$/.test(receipt)) {
      respondentToken = receipt;
      localStorage.setItem(STORAGE_KEYS.respondent, respondentToken);
      url.searchParams.delete('me');
      history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (error) {}
  loadRoute();
})();
