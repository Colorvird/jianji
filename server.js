'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
// Load configuration before modules that open the database. Explicit environment wins.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
const store = require('./src/store');
const { DB_PATH, UPLOAD_DIR } = require('./src/db');
const { recognizeTimetable, coursesToText } = require('./src/ocr');
const { qrSvg } = require('./src/qr');

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const JSON_LIMIT = 15 * 1024 * 1024;
const IMAGE_LIMIT = 8 * 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

const eventClients = new Set();

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
}

function send(res, status, body, headers = {}) {
  securityHeaders(res);
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, { 'Content-Length': payload.length, ...headers });
  res.end(payload);
}

function sendJson(res, status, value, headers = {}) {
  send(res, status, JSON.stringify(value), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
}

function sendError(res, error) {
  const status = error instanceof store.AppError ? error.status : error.status || 500;
  const code = error instanceof store.AppError ? error.code : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR';
  const message = status >= 500 ? '服务器暂时无法处理该请求，请稍后再试。' : error.message;
  if (status >= 500) console.error(error);
  sendJson(res, status, { error: code, message });
}

async function readBody(req, limit = JSON_LIMIT) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) {
      const error = new Error('请求内容过大。');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req, limit = JSON_LIMIT) {
  const buffer = await readBody(req, limit);
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (error) {
    const bad = new Error('请求数据格式不正确。');
    bad.status = 400;
    throw bad;
  }
}

function checkOrigin(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const allowed = new Set([String(req.headers.host || ''), String(req.headers['x-forwarded-host'] || '').split(',')[0].trim()]);
    return allowed.has(originHost);
  } catch (error) {
    return false;
  }
}

function lanAddress() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) return entry.address;
    }
  }
  return '';
}

function publicBase(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto || (req.socket?.encrypted ? 'https' : 'http');
  if (host) return `${proto}://${host}`;
  const lan = lanAddress();
  return lan ? `http://${lan}:${PORT}` : `http://localhost:${PORT}`;
}

function decorateAdmin(data, req) {
  const base = publicBase(req);
  return {
    ...data,
    urls: {
      base,
      fill: `${base}${data.links.fillPath}`,
      result: `${base}${data.links.resultPath}`
    }
  };
}

function respondentToken(req) {
  return String(req.headers['x-respondent-token'] || '').slice(0, 300);
}

function serveFile(res, filePath, options = {}) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  const body = fs.readFileSync(filePath);
  send(res, 200, body, {
    'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': options.cache || 'no-cache'
  });
}

function broadcast(surveyId, reason, detail = {}) {
  if (!surveyId) return;
  const packet = `event: refresh\ndata: ${JSON.stringify({ reason, at: new Date().toISOString(), ...detail })}\n\n`;
  for (const client of eventClients) {
    if (client.surveyId !== surveyId || client.res.writableEnded) continue;
    try {
      client.res.write(packet);
    } catch (error) {
      eventClients.delete(client);
      clearInterval(client.heartbeat);
    }
  }
}

function openEvents(req, res, surveyId, channel) {
  securityHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(`retry: 3000\n\n: connected ${channel}\n\n`);
  const client = { res, surveyId, channel, heartbeat: null };
  client.heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    try {
      res.write(': ping\n\n');
    } catch (error) {}
  }, 20000);
  eventClients.add(client);
  const cleanup = () => {
    clearInterval(client.heartbeat);
    eventClients.delete(client);
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);
}

function parseImageDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > IMAGE_LIMIT) return null;
  const valid = (mime === 'image/png' && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    || (mime === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8)
    || (mime === 'image/gif' && buffer.slice(0, 3).toString() === 'GIF')
    || (mime === 'image/webp' && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP');
  return valid ? { buffer, mime } : null;
}

async function routeApi(req, res, url) {
  const pathname = decodeURIComponent(url.pathname);
  const method = req.method;

  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
  }

  if (pathname === '/api/runtime' && method === 'GET') {
    const base = publicBase(req);
    return sendJson(res, 200, {
      baseUrl: base,
      lanUrl: lanAddress() ? `http://${lanAddress()}:${PORT}` : '',
      publicBaseConfigured: Boolean(process.env.PUBLIC_BASE_URL),
      ocrProvider: process.env.OCR_PROVIDER || 'ocrspace',
      ocrDemo: (process.env.OCR_PROVIDER || 'ocrspace').toLowerCase() === 'mock'
    });
  }

  if (pathname === '/api/surveys' && method === 'POST') {
    const body = await readJson(req);
    const created = store.createSurvey(body);
    return sendJson(res, 201, {
      ...created,
      survey: decorateAdmin(created.survey, req),
      urls: {
        manage: `${publicBase(req)}${created.adminPath}`,
        fill: `${publicBase(req)}${created.fillPath}`,
        result: `${publicBase(req)}${created.resultPath}`
      }
    });
  }

  let match = /^\/api\/surveys\/admin\/([^/]+)$/.exec(pathname);
  if (match && method === 'GET') {
    const data = store.getAdminSurvey(match[1]);
    return sendJson(res, 200, decorateAdmin(data, req));
  }
  if (match && method === 'PUT') {
    const body = await readJson(req);
    const before = store.findSurveyByAdminToken(match[1]);
    const data = store.updateSurvey(match[1], body);
    broadcast(before.id, 'survey-update', { published: data.survey.resultsPublished });
    return sendJson(res, 200, decorateAdmin(data, req));
  }

  match = /^\/api\/surveys\/admin\/([^/]+)\/export\.csv$/.exec(pathname);
  if (match && method === 'GET') {
    const survey = store.findSurveyByAdminToken(match[1]);
    const csv = store.csvFor(match[1], url.searchParams.get('view') === 'raw' ? 'raw' : 'summary');
    const filename = encodeURIComponent(`${survey.title}-汇总-${new Date().toISOString().slice(0, 10)}.csv`);
    return send(res, 200, csv, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="export.csv"; filename*=UTF-8''${filename}`,
      'Cache-Control': 'no-store'
    });
  }

  match = /^\/api\/surveys\/admin\/([^/]+)\/qr\/(fill|result)$/.exec(pathname);
  if (match && method === 'GET') {
    const data = store.getAdminSurvey(match[1]);
    const link = match[2] === 'fill' ? data.links.fillPath : data.links.resultPath;
    try {
      return send(res, 200, qrSvg(`${publicBase(req)}${link}`, { width: 330 }), {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store'
      });
    } catch (error) {
      return sendJson(res, 400, { error: 'QR_TOO_LONG', message: '链接过长，无法生成二维码，请缩短域名或直接复制链接。' });
    }
  }

  match = /^\/api\/surveys\/admin\/([^/]+)\/events$/.exec(pathname);
  if (match && method === 'GET') {
    const survey = store.findSurveyByAdminToken(match[1]);
    return openEvents(req, res, survey.id, 'admin');
  }

  match = /^\/api\/surveys\/admin\/([^/]+)\/edit-requests\/([^/]+)\/(approve|reject)$/.exec(pathname);
  if (match && method === 'POST') {
    const request = store.reviewEditRequest(match[1], match[2], match[3]);
    const survey = store.findSurveyByAdminToken(match[1]);
    broadcast(survey.id, 'request-reviewed', { requestId: request.id, status: request.status });
    return sendJson(res, 200, { request });
  }

  match = /^\/api\/surveys\/fill\/([^/]+)$/.exec(pathname);
  if (match && method === 'GET') {
    const data = store.getFillSurvey(match[1], respondentToken(req));
    return sendJson(res, 200, data);
  }

  match = /^\/api\/surveys\/fill\/([^/]+)\/submissions$/.exec(pathname);
  if (match && method === 'POST') {
    const survey = store.findSurveyByFillToken(match[1]);
    const body = await readJson(req);
    const submission = store.createSubmission(match[1], respondentToken(req), body);
    broadcast(survey.id, 'submission-created', { submissionId: submission.id });
    return sendJson(res, 201, submission);
  }

  match = /^\/api\/surveys\/fill\/([^/]+)\/ocr$/.exec(pathname);
  if (match && method === 'POST') {
    const survey = store.findSurveyByFillToken(match[1]);
    if (survey.status !== 'active') return sendJson(res, 409, { error: 'NOT_ACCEPTING', message: '表格当前没有开放填写。' });
    const token = respondentToken(req);
    if (token.length < 16) return sendJson(res, 400, { error: 'NO_RESPONDENT_TOKEN', message: '填写身份缺失。' });
    const body = await readJson(req);
    const image = parseImageDataUrl(body.dataUrl);
    if (!image) return sendJson(res, 400, { error: 'BAD_IMAGE', message: '请上传 JPG / PNG / WebP / GIF 图片，且不超过 8 MB。' });
    const ext = image.mime === 'image/png' ? 'png' : image.mime === 'image/webp' ? 'webp' : image.mime === 'image/gif' ? 'gif' : 'jpg';
    const filename = `ocr_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const diskPath = path.join(UPLOAD_DIR, filename);
    const filePath = `/api/uploads/${filename}`;
    fs.writeFileSync(diskPath, image.buffer);
    try {
      const result = await recognizeTimetable(image.buffer, image.mime);
      const text = String(result.text || coursesToText(result.courses)).trim();
      const questions = store.questionsFor(survey.id);
      const question = questions.find((item) => item.id === body.questionId && item.type === 'timetable');
      const saved = store.saveTimetableImport({
        surveyId: survey.id,
        respondentHash: store.hashToken(token),
        questionId: question ? question.id : null,
        provider: result.provider,
        originalName: body.filename || '课程表截图',
        filePath,
        mimeType: image.mime,
        confidence: result.confidence,
        raw: result.raw,
        courses: result.courses,
        text
      });
      return sendJson(res, 200, {
        id: saved.id,
        provider: result.provider,
        demo: Boolean(result.demo),
        confidence: result.confidence,
        courses: result.courses,
        busy: result.busy || [],
        grid: result.grid || { days: [], columns: [], periods: [], busy: [] },
        text,
        imageUrl: filePath
      });
    } catch (error) {
      try { fs.rmSync(diskPath, { force: true }); } catch (ignored) {}
      return sendJson(res, 502, { error: 'OCR_FAILED', message: `课程表识别失败：${error.message}` });
    }
  }

  match = /^\/api\/surveys\/result\/([^/]+)$/.exec(pathname);
  if (match && method === 'GET') {
    const data = store.getResultSurvey(match[1], respondentToken(req));
    return sendJson(res, 200, data);
  }

  match = /^\/api\/surveys\/result\/([^/]+)\/events$/.exec(pathname);
  if (match && method === 'GET') {
    const survey = store.findSurveyByResultToken(match[1]);
    return openEvents(req, res, survey.id, 'result');
  }

  match = /^\/api\/surveys\/result\/([^/]+)\/edit-requests$/.exec(pathname);
  if (match && method === 'POST') {
    const survey = store.findSurveyByResultToken(match[1]);
    const body = await readJson(req);
    const request = store.createEditRequest(match[1], respondentToken(req), body);
    broadcast(survey.id, 'edit-request-created', { requestId: request.id });
    return sendJson(res, 201, { request });
  }

  match = /^\/api\/submissions\/([^/]+)$/.exec(pathname);
  if (match && (method === 'PUT' || method === 'PATCH')) {
    const body = await readJson(req);
    const surveyId = store.getSubmissionSurveyId(match[1]);
    const result = store.updateSubmissionByRespondent(match[1], respondentToken(req), body);
    broadcast(surveyId, 'submission-edited', { submissionId: match[1] });
    return sendJson(res, 200, result);
  }

  match = /^\/api\/uploads\/([A-Za-z0-9._-]+)$/.exec(pathname);
  if (match && method === 'GET') {
    const token = url.searchParams.get('token') || '';
    const storedPath = `/api/uploads/${match[1]}`;
    if (!store.canAccessUpload(token, storedPath)) {
      return sendJson(res, 403, { error: 'FORBIDDEN', message: '没有权限查看这张图片。' });
    }
    return serveFile(res, path.join(UPLOAD_DIR, path.basename(match[1])), { cache: 'private, max-age=300' });
  }

  return sendJson(res, 404, { error: 'NOT_FOUND', message: '接口不存在。' });
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'OPTIONS') {
      securityHeaders(res);
      res.writeHead(204, { Allow: 'GET, HEAD, POST, PUT, PATCH, OPTIONS' });
      return res.end();
    }

    if (pathname.startsWith('/api/')) {
      if (!checkOrigin(req)) {
        return sendJson(res, 403, { error: 'BAD_ORIGIN', message: '请求来源不受信任。' });
      }
      return await routeApi(req, res, url);
    }

    const isAppRoute = pathname === '/'
      || pathname === '/index.html'
      || /^\/(?:manage|f|r)\/[A-Za-z0-9_-]+\/?$/.test(pathname);
    if (isAppRoute) return serveFile(res, path.join(ROOT, 'index.html'), { cache: 'no-cache' });
    if (pathname === '/styles.css') return serveFile(res, path.join(ROOT, 'styles.css'), { cache: 'no-cache' });
    if (pathname === '/occupancy.js') return serveFile(res, path.join(ROOT, 'occupancy.js'), { cache: 'no-cache' });
    if (pathname === '/app.js') return serveFile(res, path.join(ROOT, 'app.js'), { cache: 'no-cache' });
    if (pathname === '/favicon.svg') return serveFile(res, path.join(ROOT, 'favicon.svg'), { cache: 'public, max-age=86400' });
    if (pathname === '/manifest.webmanifest') return serveFile(res, path.join(ROOT, 'manifest.webmanifest'), { cache: 'public, max-age=86400' });

    return send(res, 404, '页面不存在', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (error) {
    return sendError(res, error);
  }
}

const server = http.createServer(handler);

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`简集已启动：http://localhost:${PORT}`);
    if (lanAddress()) console.log(`手机同网访问：http://${lanAddress()}:${PORT}`);
    console.log(`数据库：${DB_PATH}`);
    console.log(`课表识别：${process.env.OCR_PROVIDER || 'ocrspace'}`);
  });
  const shutdown = () => {
    for (const client of eventClients) {
      clearInterval(client.heartbeat);
      try { client.res.end(); } catch (error) {}
    }
    eventClients.clear();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { server, handler, publicBase, broadcast, lanAddress };
