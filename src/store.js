'use strict';
const { match: matchActivity } = require('../occupancy');

const crypto = require('node:crypto');
const { db, uid, tx } = require('./db');

const QUESTION_TYPES = new Set(['short', 'textarea', 'radio', 'checkbox', 'timeslots', 'timetable']);
const CHOICE_TYPES = new Set(['radio', 'checkbox', 'timeslots']);
const ACCESS_MODES = new Set(['readonly', 'approval', 'open']);
const SURVEY_STATUS = new Set(['draft', 'active', 'closed']);
const TIMETABLE_MODES = new Set(['period', 'clock']);
const NAME_PATTERN = /姓名|名字|称呼|联系人|填报人/;

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function randomToken(bytes = 20) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function cleanText(value, max = 500) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

function toBool(value) {
  return value === true || value === 1 || value === '1';
}

function fmtDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace(/\//g, '月').replace(',', '日');
}

function normalizeDeadline(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'BAD_DEADLINE', '截止时间格式不正确。');
  return date.toISOString();
}

function normalizePeriodTimes(value) {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: 13 }, (_, index) => {
    const item = source[index] && typeof source[index] === 'object' ? source[index] : {};
    const start = cleanText(item.start, 5);
    const end = cleanText(item.end, 5);
    const validStart = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) ? start : '';
    const validEnd = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end) ? end : '';
    return { start: validStart, end: validEnd };
  });
}

function normalizeSurveyFields(payload, current = {}) {
  const title = cleanText(payload.title === undefined ? current.title : payload.title, 120);
  if (!title) throw new AppError(400, 'BAD_TITLE', '请填写表格标题。');
  const description = cleanText(payload.description === undefined ? current.description : payload.description, 2000);
  const type = payload.type === undefined ? current.type || 'short' : payload.type;
  if (!['short', 'long'].includes(type)) throw new AppError(400, 'BAD_TYPE', '表格类型不正确。');
  const status = payload.status === undefined ? current.status || 'active' : payload.status;
  if (!SURVEY_STATUS.has(status)) throw new AppError(400, 'BAD_STATUS', '表格状态不正确。');
  const access = payload.access === undefined ? current.access || 'approval' : payload.access;
  if (!ACCESS_MODES.has(access)) throw new AppError(400, 'BAD_ACCESS', '修改权限不正确。');
  const targetValue = payload.target === undefined ? current.target || 20 : Number(payload.target);
  const target = Math.max(1, Math.min(100000, Number.isFinite(targetValue) ? Math.round(targetValue) : 20));
  const deadline = payload.deadline === undefined ? current.deadline || null : normalizeDeadline(payload.deadline);
  const icon = cleanText(payload.icon === undefined ? current.icon || 'clipboard' : payload.icon, 40) || 'clipboard';
  const timetableMode = payload.timetableMode === undefined ? current.timetable_mode || 'period' : payload.timetableMode;
  if (!TIMETABLE_MODES.has(timetableMode)) throw new AppError(400, 'BAD_TIMETABLE_MODE', '课表时间模式不正确。');
  const periodTimes = payload.periodTimes === undefined
    ? normalizePeriodTimes(parseJson(current.period_times_json, []))
    : normalizePeriodTimes(payload.periodTimes);
  return { title, description, type, status, access, target, deadline, icon, timetableMode, periodTimes };
}

function getSurveyRow(id) {
  return db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
}

function findSurveyByAdminToken(rawToken) {
  const row = db.prepare('SELECT * FROM surveys WHERE admin_token_hash = ?').get(hashToken(rawToken));
  if (!row) throw new AppError(404, 'SURVEY_NOT_FOUND', '管理链接无效，或表格已经被删除。');
  return row;
}

function findSurveyByFillToken(rawToken) {
  const row = db.prepare('SELECT * FROM surveys WHERE fill_token = ?').get(String(rawToken || ''));
  if (!row) throw new AppError(404, 'SURVEY_NOT_FOUND', '填写链接无效，或表格已经被删除。');
  return row;
}

function findSurveyByResultToken(rawToken) {
  const row = db.prepare('SELECT * FROM surveys WHERE result_token = ?').get(String(rawToken || ''));
  if (!row) throw new AppError(404, 'SURVEY_NOT_FOUND', '汇总链接无效，或表格已经被删除。');
  return row;
}

function questionsFor(surveyId) {
  const rows = db.prepare('SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order, rowid').all(surveyId);
  const optionRows = db.prepare(`
    SELECT o.* FROM question_options o
    JOIN questions q ON q.id = o.question_id
    WHERE q.survey_id = ?
    ORDER BY o.sort_order, o.id
  `).all(surveyId);
  const options = new Map();
  for (const option of optionRows) {
    if (!options.has(option.question_id)) options.set(option.question_id, []);
    options.get(option.question_id).push(option.label);
  }
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    required: Boolean(row.required),
    placeholder: row.placeholder,
    help: row.help,
    options: options.get(row.id) || []
  }));
}

function normalizeQuestion(question, existingIds) {
  const type = String(question.type || '');
  if (!QUESTION_TYPES.has(type)) throw new AppError(400, 'BAD_QUESTION_TYPE', '题目类型不正确。');
  const label = cleanText(question.label, 160);
  if (!label) throw new AppError(400, 'BAD_QUESTION_LABEL', '每道题都需要填写题目。');
  const requestedId = String(question.id || '');
  const id = existingIds && existingIds.has(requestedId) ? requestedId : uid('q');
  let options = [];
  if (CHOICE_TYPES.has(type)) {
    options = (Array.isArray(question.options) ? question.options : [])
      .map((option) => cleanText(option, 100))
      .filter(Boolean);
    options = [...new Set(options)].slice(0, 60);
    if (!options.length) throw new AppError(400, 'NO_OPTIONS', `题目「${label}」至少需要一个选项。`);
  }
  return {
    id,
    type,
    label,
    required: toBool(question.required),
    placeholder: cleanText(question.placeholder, 200),
    help: cleanText(question.help, 300),
    options
  };
}

function saveQuestions(surveyId, rawQuestions) {
  if (!Array.isArray(rawQuestions) || !rawQuestions.length) {
    throw new AppError(400, 'NO_QUESTIONS', '至少保留一道题目。');
  }
  if (rawQuestions.length > 60) throw new AppError(400, 'TOO_MANY_QUESTIONS', '题目数量不能超过 60 道。');
  const existing = new Set(db.prepare('SELECT id FROM questions WHERE survey_id = ?').all(surveyId).map((row) => row.id));
  const questions = rawQuestions.map((question) => normalizeQuestion(question, existing));
  const kept = new Set(questions.map((question) => question.id));
  for (const id of existing) {
    if (!kept.has(id)) db.prepare('DELETE FROM questions WHERE id = ? AND survey_id = ?').run(id, surveyId);
  }
  questions.forEach((question, index) => {
    if (existing.has(question.id)) {
      db.prepare(`
        UPDATE questions SET type = ?, label = ?, required = ?, placeholder = ?, help = ?, sort_order = ?
        WHERE id = ? AND survey_id = ?
      `).run(question.type, question.label, question.required ? 1 : 0, question.placeholder, question.help, index, question.id, surveyId);
      db.prepare('DELETE FROM question_options WHERE question_id = ?').run(question.id);
    } else {
      db.prepare(`
        INSERT INTO questions (id, survey_id, type, label, required, placeholder, help, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(question.id, surveyId, question.type, question.label, question.required ? 1 : 0, question.placeholder, question.help, index);
    }
    question.options.forEach((label, optionIndex) => {
      db.prepare('INSERT INTO question_options (question_id, label, sort_order) VALUES (?, ?, ?)')
        .run(question.id, label, optionIndex);
    });
  });
  return questions;
}

function normalizeCourse(course) {
  const name = cleanText(course && course.name, 80);
  if (!name) return null;
  const periodStart = Number(course.periodStart);
  const periodEnd = Number(course.periodEnd);
  return {
    name,
    day: cleanText(course.day, 20),
    start: cleanText(course.start, 10),
    end: cleanText(course.end, 10),
    periodStart: Number.isFinite(periodStart) && periodStart > 0 ? Math.min(30, Math.round(periodStart)) : null,
    periodEnd: Number.isFinite(periodEnd) && periodEnd > 0 ? Math.min(30, Math.round(periodEnd)) : null,
    location: cleanText(course.location, 80),
    teacher: cleanText(course.teacher, 40),
    confidence: Math.max(0, Math.min(1, Number(course.confidence) || 0))
  };
}

function normalizeTimetable(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    return { busy: [], text: value.slice(0, 4000), imageUrl: '', provider: 'manual', demo: false };
  }
  if (typeof value !== 'object') throw new AppError(400, 'BAD_TIMETABLE', '课程表数据格式不正确。');
  const busy = (Array.isArray(value.busy) ? value.busy : [])
    .map((block) => {
      const day = cleanText(block && block.day, 20);
      const startPeriod = Math.max(1, Math.min(30, Math.round(Number(block && block.startPeriod) || 0)));
      const endPeriod = Math.max(startPeriod, Math.min(30, Math.round(Number(block && block.endPeriod) || startPeriod)));
      return day && startPeriod ? { day, startPeriod, endPeriod } : null;
    })
    .filter(Boolean)
    .slice(0, 100);
  const imageUrl = cleanText(value.imageUrl, 300);
  if (imageUrl && !/^\/api\/uploads\/[A-Za-z0-9._-]+$/.test(imageUrl)) {
    throw new AppError(400, 'BAD_IMAGE_URL', '课程表图片地址不正确。');
  }
  return {
    busy,
    text: cleanText(value.text, 5000),
    imageUrl,
    provider: cleanText(value.provider, 40) || 'manual',
    demo: Boolean(value.demo)
  };
}

function applyPeriodTimes(course, periodTimes) {
  if (!course || !Array.isArray(periodTimes) || !course.periodStart) return course;
  const start = periodTimes[course.periodStart - 1];
  const end = periodTimes[(course.periodEnd || course.periodStart) - 1];
  if (start && start.start) course.start = start.start;
  if (end && end.end) course.end = end.end;
  return course;
}

function validateAnswers(questions, rawAnswers, context = {}) {
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    throw new AppError(400, 'BAD_ANSWERS', '答卷数据格式不正确。');
  }
  const answers = {};
  for (const question of questions) {
    let value = rawAnswers[question.id];
    if (question.type === 'short' || question.type === 'textarea') {
      value = cleanText(value, question.type === 'short' ? 500 : 5000);
      if (question.required && !value) throw new AppError(400, 'REQUIRED', `请填写「${question.label}」。`);
      if (value) answers[question.id] = value;
      continue;
    }
    if (question.type === 'radio') {
      value = cleanText(value, 200);
      if (value && !question.options.includes(value)) {
        throw new AppError(400, 'BAD_OPTION', `「${question.label}」的选项不在可选范围内。`);
      }
      if (question.required && !value) throw new AppError(400, 'REQUIRED', `请选择「${question.label}」。`);
      if (value) answers[question.id] = value;
      continue;
    }
    if (question.type === 'checkbox' || question.type === 'timeslots') {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      const normalized = [...new Set(list.map((item) => cleanText(item, 200)).filter(Boolean))];
      for (const item of normalized) {
        if (!question.options.includes(item)) {
          throw new AppError(400, 'BAD_OPTION', `「${question.label}」包含无效选项。`);
        }
      }
      if (question.required && !normalized.length) throw new AppError(400, 'REQUIRED', `请选择「${question.label}」。`);
      if (normalized.length) answers[question.id] = normalized;
      continue;
    }
    if (question.type === 'timetable') {
      const timetable = normalizeTimetable(value);
      if (question.required && (!timetable || (!timetable.busy.length && !timetable.text))) {
        throw new AppError(400, 'REQUIRED', `请上传或填写「${question.label}」。`);
      }
      if (timetable) {
        if (timetable.imageUrl && context.surveyId && context.respondentHash) {
          const owned = db.prepare(`
            SELECT 1 FROM timetable_imports
            WHERE file_path = ? AND survey_id = ? AND respondent_token_hash = ?
          `).get(timetable.imageUrl, context.surveyId, context.respondentHash);
          if (!owned) throw new AppError(400, 'UNKNOWN_IMAGE', '课程表图片与当前答卷不匹配，请重新上传。');
        }
        answers[question.id] = timetable;
      }
    }
  }
  return answers;
}

function extractName(questions, answers, fallback = '') {
  for (const question of questions) {
    if (question.type !== 'short' || !NAME_PATTERN.test(question.label)) continue;
    const value = answers[question.id];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 60);
  }
  return cleanText(fallback, 60) || '匿名填写';
}

function answerMapFor(surveyId) {
  const rows = db.prepare(`
    SELECT a.submission_id, a.question_id, a.value_json
    FROM answers a JOIN submissions s ON s.id = a.submission_id
    WHERE s.survey_id = ?
  `).all(surveyId);
  const result = new Map();
  for (const row of rows) {
    if (!result.has(row.submission_id)) result.set(row.submission_id, {});
    result.get(row.submission_id)[row.question_id] = parseJson(row.value_json, '');
  }
  return result;
}

function requestRowsFor(surveyId) {
  return db.prepare(`
    SELECT r.*, s.respondent_name AS submission_name
    FROM edit_requests r JOIN submissions s ON s.id = r.submission_id
    WHERE r.survey_id = ?
    ORDER BY r.created_at DESC
  `).all(surveyId);
}

function requestDto(row) {
  return {
    id: row.id,
    surveyId: row.survey_id,
    submissionId: row.submission_id,
    name: row.submission_name || '填写人',
    summary: row.summary,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    createdAtText: fmtDateTime(row.created_at),
    reviewedAt: row.reviewed_at,
    reviewedAtText: fmtDateTime(row.reviewed_at),
    usedAt: row.used_at,
    usedAtText: fmtDateTime(row.used_at)
  };
}

function buildSubmissions(survey, respondentHash = '') {
  const rows = db.prepare('SELECT * FROM submissions WHERE survey_id = ? ORDER BY submitted_at DESC').all(survey.id);
  const answerMap = answerMapFor(survey.id);
  const requests = requestRowsFor(survey.id);
  const requestsBySubmission = new Map();
  const pendingBySubmission = new Set();
  const approvedOpenBySubmission = new Set();
  for (const request of requests) {
    if (!requestsBySubmission.has(request.submission_id)) requestsBySubmission.set(request.submission_id, []);
    requestsBySubmission.get(request.submission_id).push(request);
    if (request.status === 'pending') pendingBySubmission.add(request.submission_id);
    if (request.status === 'approved' && !request.used_at) approvedOpenBySubmission.add(request.submission_id);
  }
  return rows.map((row) => {
    const mine = Boolean(respondentHash) && row.respondent_token_hash === respondentHash;
    const requestList = requestsBySubmission.get(row.id) || [];
    const latestRequest = requestList[0] || null;
    const canEdit = mine && survey.access !== 'readonly' && (
      survey.access === 'open' || approvedOpenBySubmission.has(row.id)
    );
    return {
      id: row.id,
      name: row.respondent_name,
      submittedAt: row.submitted_at,
      submittedAtText: fmtDateTime(row.submitted_at),
      updatedAt: row.updated_at,
      updatedAtText: fmtDateTime(row.updated_at),
      status: row.status,
      answers: answerMap.get(row.id) || {},
      mine,
      canEdit,
      pendingRequest: pendingBySubmission.has(row.id),
      editApproved: approvedOpenBySubmission.has(row.id),
      latestRequest: latestRequest ? requestDto(latestRequest) : null
    };
  });
}

function buildOptionStats(questions, submissions) {
  return questions.filter((question) => CHOICE_TYPES.has(question.type)).map((question) => {
    const counts = new Map(question.options.map((option) => [option, 0]));
    let answered = 0;
    for (const submission of submissions) {
      const value = submission.answers[question.id];
      const values = Array.isArray(value) ? value : value ? [value] : [];
      if (values.length) answered += 1;
      for (const item of values) counts.set(item, (counts.get(item) || 0) + 1);
    }
    return {
      questionId: question.id,
      label: question.label,
      answered,
      options: question.options.map((option) => ({
        label: option,
        count: counts.get(option) || 0,
        percent: answered ? Math.round(((counts.get(option) || 0) / answered) * 100) : 0
      }))
    };
  });
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
      endPeriod: block.endPeriod || block.startPeriod,
      start: startMinutes,
      end: Math.max(endMinutes, startMinutes + 1),
      estimated: !(end && end.end)
    });
  }
  return windows;
}

function buildTimetableStats(questions, submissions, surveyRow) {
  let respondents = 0;
  let busyCount = 0;
  const byDay = new Map();
  const periodTimes = normalizePeriodTimes(parseJson(surveyRow.period_times_json, []));
  for (const question of questions.filter((item) => item.type === 'timetable')) {
    for (const submission of submissions) {
      const value = submission.answers[question.id];
      if (!value || !Array.isArray(value.busy) || !value.busy.length) continue;
      respondents += 1;
      for (const block of value.busy) {
        const periods = Math.max(1, (block.endPeriod || block.startPeriod) - block.startPeriod + 1);
        busyCount += periods;
        byDay.set(block.day || '未标注', (byDay.get(block.day || '未标注') || 0) + periods);
      }
    }
  }
  const availability = [];
  if (surveyRow.timetable_mode !== 'clock') {
  for (const question of questions.filter((item) => item.type === 'timeslots')) {
    const options = question.options.map((label) => ({ label, window: slotWindow(label) })).filter((item) => item.window);
    if (!options.length) continue;
    const timetableQuestion = questions.find((item) => item.type === 'timetable');
    if (!timetableQuestion) continue;
    const relevant = submissions.filter((submission) => {
      const value = submission.answers[timetableQuestion.id];
      return value && Array.isArray(value.busy);
    });
    availability.push({
      questionId: question.id,
      label: question.label,
      options: options.map(({ label, window }) => {
        let free = 0;
        let conflict = 0;
        let unknown = 0;
        for (const submission of relevant) {
          const status = matchActivity(submission.answers[timetableQuestion.id], periodTimes, window);
          if (status === 'conflict') conflict += 1;
          else if (status === 'unknown') unknown += 1;
          else free += 1;
        }
        return { label, free, conflict, unknown, total: relevant.length };
      })
    });
  }
  }
  return {
    respondents,
    courseCount: busyCount,
    busyCount,
    availability,
    byDay: [...byDay.entries()].map(([day, count]) => ({ day, count }))
  };
}

function revisionFor(surveyId, surveyRow) {
  const submission = db.prepare('SELECT COUNT(*) AS count, MAX(updated_at) AS latest FROM submissions WHERE survey_id = ?').get(surveyId);
  const request = db.prepare(`
    SELECT COUNT(*) AS count, MAX(COALESCE(reviewed_at, created_at)) AS latest
    FROM edit_requests WHERE survey_id = ?
  `).get(surveyId);
  return [surveyRow.updated_at, submission.count, submission.latest || '', request.count, request.latest || ''].join('|');
}

function buildStats(questions, submissions, target, surveyId, surveyRow) {
  const latest = submissions.reduce((max, item) => (!max || item.updatedAt > max ? item.updatedAt : max), '');
  return {
    total: submissions.length,
    target,
    percent: target ? Math.min(100, Math.round((submissions.length / target) * 100)) : 0,
    latestAt: latest,
    latestAtText: fmtDateTime(latest),
    optionStats: buildOptionStats(questions, submissions),
    timetable: buildTimetableStats(questions, submissions, surveyRow),
    revision: revisionFor(surveyId, surveyRow)
  };
}

function baseSurveyDto(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    icon: row.icon,
    status: row.status,
    deadline: row.deadline,
    target: row.target,
    access: row.access,
    timetableMode: row.timetable_mode || 'period',
    periodTimes: normalizePeriodTimes(parseJson(row.period_times_json, [])),
    resultsPublished: Boolean(row.results_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedAtText: fmtDateTime(row.updated_at)
  };
}

function getAdminSurvey(rawAdminToken) {
  const row = findSurveyByAdminToken(rawAdminToken);
  const questions = questionsFor(row.id);
  const submissions = buildSubmissions(row, '');
  const requests = requestRowsFor(row.id).map(requestDto);
  return {
    survey: baseSurveyDto(row),
    questions,
    submissions,
    requests,
    stats: buildStats(questions, submissions, row.target, row.id, row),
    links: {
      fillToken: row.fill_token,
      resultToken: row.result_token,
      fillPath: `/f/${row.fill_token}`,
      resultPath: `/r/${row.result_token}`
    }
  };
}

function createSurvey(payload) {
  const fields = normalizeSurveyFields(payload);
  const questionsInput = Array.isArray(payload.questions) ? payload.questions : [];
  if (!questionsInput.length) throw new AppError(400, 'NO_QUESTIONS', '至少添加一道题目。');
  const adminToken = randomToken(24);
  const fillToken = randomToken(18);
  const resultToken = randomToken(18);
  const id = uid('sv');
  const timestamp = nowIso();
  return tx(() => {
    db.prepare(`
      INSERT INTO surveys
        (id, title, description, type, icon, status, deadline, target, access, results_published,
         timetable_mode, period_times_json,
         admin_token_hash, fill_token, result_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, fields.title, fields.description, fields.type, fields.icon, fields.status, fields.deadline,
      fields.target, fields.access, fields.timetableMode, JSON.stringify(fields.periodTimes),
      hashToken(adminToken), fillToken, resultToken, timestamp, timestamp
    );
    saveQuestions(id, questionsInput);
    db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
      .run(id, 'survey.create', JSON.stringify({ title: fields.title }), timestamp);
    const data = getAdminSurvey(adminToken);
    return { adminToken, fillToken, resultToken, adminPath: `/manage/${adminToken}`, fillPath: `/f/${fillToken}`, resultPath: `/r/${resultToken}`, survey: data };
  });
}

function updateSurvey(rawAdminToken, payload) {
  const row = findSurveyByAdminToken(rawAdminToken);
  return tx(() => {
    const fields = normalizeSurveyFields(payload, row);
    const resultsPublished = payload.resultsPublished === undefined
      ? Boolean(row.results_published)
      : toBool(payload.resultsPublished);
    const timestamp = nowIso();
    db.prepare(`
      UPDATE surveys SET title = ?, description = ?, type = ?, icon = ?, status = ?, deadline = ?,
        target = ?, access = ?, results_published = ?, timetable_mode = ?, period_times_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      fields.title, fields.description, fields.type, fields.icon, fields.status, fields.deadline,
      fields.target, fields.access, resultsPublished ? 1 : 0, fields.timetableMode,
      JSON.stringify(fields.periodTimes), timestamp, row.id
    );
    if (Array.isArray(payload.questions) && payload.questions.length) saveQuestions(row.id, payload.questions);
    db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
      .run(row.id, 'survey.update', JSON.stringify({ fields: Object.keys(payload) }), timestamp);
    return getAdminSurvey(rawAdminToken);
  });
}

function createSubmission(rawFillToken, respondentToken, payload) {
  const survey = findSurveyByFillToken(rawFillToken);
  if (survey.status !== 'active') throw new AppError(409, 'NOT_ACCEPTING', '这个表格当前没有开放填写。');
  if (survey.deadline && new Date(survey.deadline).getTime() < Date.now()) {
    throw new AppError(409, 'DEADLINE_PASSED', '这个表格已经过了截止时间。');
  }
  const respondentRaw = String(respondentToken || '');
  if (respondentRaw.length < 16) throw new AppError(400, 'NO_RESPONDENT_TOKEN', '填写身份缺失，请刷新页面后重试。');
  const respondentHash = hashToken(respondentRaw);
  const exists = db.prepare('SELECT id FROM submissions WHERE survey_id = ? AND respondent_token_hash = ?')
    .get(survey.id, respondentHash);
  if (exists) throw new AppError(409, 'ALREADY_SUBMITTED', '这个浏览器已经提交过，请到汇总表申请修改。');
  const questions = questionsFor(survey.id);
  const answers = validateAnswers(questions, payload.answers, { surveyId: survey.id, respondentHash, survey });
  const name = extractName(questions, answers, payload.respondentName);
  const id = uid('sub');
  const timestamp = nowIso();
  tx(() => {
    db.prepare(`
      INSERT INTO submissions (id, survey_id, respondent_name, respondent_token_hash, status, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, 'submitted', ?, ?)
    `).run(id, survey.id, name, respondentHash, timestamp, timestamp);
    for (const [questionId, value] of Object.entries(answers)) {
      db.prepare('INSERT INTO answers (submission_id, question_id, value_json) VALUES (?, ?, ?)')
        .run(id, questionId, JSON.stringify(value));
    }
    db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
      .run(survey.id, 'submission.create', JSON.stringify({ submissionId: id, name }), timestamp);
  });
  return { id, name, submittedAt: timestamp, revision: revisionFor(survey.id, getSurveyRow(survey.id)) };
}

function getFillSurvey(rawFillToken, respondentToken) {
  const row = findSurveyByFillToken(rawFillToken);
  const questions = questionsFor(row.id);
  const respondentHash = respondentToken ? hashToken(respondentToken) : '';
  const mine = respondentHash
    ? db.prepare('SELECT * FROM submissions WHERE survey_id = ? AND respondent_token_hash = ?').get(row.id, respondentHash)
    : null;
  const myAnswers = mine ? (answerMapFor(row.id).get(mine.id) || {}) : {};
  const published = Boolean(row.results_published);
  return {
    survey: {
      ...baseSurveyDto(row),
      accepting: row.status === 'active' && (!row.deadline || new Date(row.deadline).getTime() >= Date.now()),
      resultPath: published ? `/r/${row.result_token}` : ''
    },
    questions,
    alreadySubmitted: Boolean(mine),
    mySubmission: mine ? {
      id: mine.id,
      name: mine.respondent_name,
      submittedAt: mine.submitted_at,
      submittedAtText: fmtDateTime(mine.submitted_at),
      answers: myAnswers
    } : null
  };
}

function getResultSurvey(rawResultToken, respondentToken) {
  const row = findSurveyByResultToken(rawResultToken);
  const questions = questionsFor(row.id);
  const respondentHash = respondentToken ? hashToken(respondentToken) : '';
  const published = Boolean(row.results_published);
  const submissions = published ? buildSubmissions(row, respondentHash) : [];
  const my = respondentHash ? submissions.find((submission) => submission.mine) : null;
  const myRequests = my
    ? requestRowsFor(row.id).filter((request) => request.submission_id === my.id).map(requestDto)
    : [];
  const latestRequest = myRequests[0] || null;
  let editState = 'none';
  if (!my) editState = 'no-submission';
  else if (row.access === 'readonly') editState = 'readonly';
  else if (row.access === 'open') editState = 'open';
  else if (my.editApproved) editState = 'approved';
  else if (my.pendingRequest) editState = 'pending';
  else if (latestRequest && latestRequest.status === 'approved' && latestRequest.usedAt) editState = 'used';
  else if (latestRequest && latestRequest.status === 'rejected') editState = 'rejected';
  else editState = 'request';
  return {
    survey: {
      ...baseSurveyDto(row),
      published,
      statusText: row.status === 'closed' ? '已停止收集' : row.status === 'draft' ? '草稿' : '收集中'
    },
    questions,
    submissions,
    mySubmissionId: my ? my.id : '',
    mySubmission: my || null,
    myRequest: latestRequest,
    myRequests,
    editState,
    canEdit: Boolean(my && my.canEdit),
    stats: buildStats(questions, submissions, row.target, row.id, row),
    updatedAt: row.updated_at
  };
}

function createEditRequest(rawResultToken, respondentToken, payload) {
  const survey = findSurveyByResultToken(rawResultToken);
  if (!survey.results_published) throw new AppError(409, 'NOT_PUBLISHED', '汇总表还没有发布。');
  if (survey.access === 'readonly') throw new AppError(403, 'READONLY', '创建人已把汇总表设为只读。');
  if (survey.access === 'open') throw new AppError(409, 'EDIT_OPEN', '当前允许直接修改，无需提交申请。');
  if (!respondentToken) throw new AppError(401, 'NO_RESPONDENT_TOKEN', '没有找到你的填写身份。');
  const hash = hashToken(respondentToken);
  const submission = db.prepare('SELECT * FROM submissions WHERE survey_id = ? AND respondent_token_hash = ?')
    .get(survey.id, hash);
  if (!submission) throw new AppError(403, 'NOT_YOUR_ROW', '当前浏览器没有找到你填写的记录，请用当时填写的设备打开。');
  const pending = db.prepare("SELECT id FROM edit_requests WHERE submission_id = ? AND status = 'pending'").get(submission.id);
  if (pending) throw new AppError(409, 'REQUEST_PENDING', '已经有一条修改申请在等待处理。');
  const summary = cleanText(payload.summary, 500);
  if (!summary) throw new AppError(400, 'BAD_SUMMARY', '请简单说明要修改什么。');
  const reason = cleanText(payload.reason, 1000);
  const id = uid('req');
  const timestamp = nowIso();
  db.prepare(`
    INSERT INTO edit_requests (id, survey_id, submission_id, summary, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, survey.id, submission.id, summary, reason, timestamp);
  db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
    .run(survey.id, 'edit_request.create', JSON.stringify({ requestId: id, submissionId: submission.id }), timestamp);
  const row = db.prepare(`
    SELECT r.*, s.respondent_name AS submission_name
    FROM edit_requests r JOIN submissions s ON s.id = r.submission_id WHERE r.id = ?
  `).get(id);
  return requestDto(row);
}

function reviewEditRequest(rawAdminToken, requestId, decision) {
  const survey = findSurveyByAdminToken(rawAdminToken);
  if (!['approve', 'reject'].includes(decision)) throw new AppError(400, 'BAD_DECISION', '审批动作不正确。');
  const row = db.prepare('SELECT * FROM edit_requests WHERE id = ? AND survey_id = ?').get(requestId, survey.id);
  if (!row) throw new AppError(404, 'REQUEST_NOT_FOUND', '修改申请不存在。');
  if (row.status !== 'pending') throw new AppError(409, 'ALREADY_REVIEWED', '这条申请已经处理过了。');
  const timestamp = nowIso();
  const status = decision === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE edit_requests SET status = ?, reviewed_at = ? WHERE id = ?').run(status, timestamp, requestId);
  db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
    .run(survey.id, `edit_request.${status}`, JSON.stringify({ requestId }), timestamp);
  const updated = db.prepare(`
    SELECT r.*, s.respondent_name AS submission_name
    FROM edit_requests r JOIN submissions s ON s.id = r.submission_id WHERE r.id = ?
  `).get(requestId);
  return requestDto(updated);
}

function updateSubmissionByRespondent(submissionId, respondentToken, payload) {
  if (!respondentToken) throw new AppError(401, 'NO_RESPONDENT_TOKEN', '没有找到你的填写身份。');
  const row = db.prepare(`
    SELECT s.*, sv.access, sv.results_published, sv.id AS survey_id
    FROM submissions s JOIN surveys sv ON sv.id = s.survey_id
    WHERE s.id = ?
  `).get(submissionId);
  if (!row) throw new AppError(404, 'SUBMISSION_NOT_FOUND', '这份答卷不存在。');
  const hash = hashToken(respondentToken);
  if (row.respondent_token_hash !== hash) throw new AppError(403, 'NOT_YOUR_ROW', '只能修改自己提交的那一行。');
  if (!row.results_published) throw new AppError(409, 'NOT_PUBLISHED', '汇总表还没有发布。');
  if (row.access === 'readonly') throw new AppError(403, 'READONLY', '创建人已把汇总表设为只读。');
  let approvedRequest = null;
  if (row.access === 'approval') {
    approvedRequest = db.prepare(`
      SELECT * FROM edit_requests
      WHERE submission_id = ? AND status = 'approved' AND used_at IS NULL
      ORDER BY reviewed_at DESC LIMIT 1
    `).get(submissionId);
    if (!approvedRequest) throw new AppError(403, 'EDIT_NOT_APPROVED', '修改申请尚未通过，或本次修改权限已经使用。');
  }
  const survey = getSurveyRow(row.survey_id);
  const questions = questionsFor(survey.id);
  const answers = validateAnswers(questions, payload.answers, { surveyId: survey.id, respondentHash: hash, survey });
  const name = extractName(questions, answers, payload.respondentName);
  const timestamp = nowIso();
  tx(() => {
    db.prepare("UPDATE submissions SET respondent_name = ?, status = 'edited', updated_at = ? WHERE id = ?")
      .run(name, timestamp, submissionId);
    db.prepare('DELETE FROM answers WHERE submission_id = ?').run(submissionId);
    for (const [questionId, value] of Object.entries(answers)) {
      db.prepare('INSERT INTO answers (submission_id, question_id, value_json) VALUES (?, ?, ?)')
        .run(submissionId, questionId, JSON.stringify(value));
    }
    if (approvedRequest) {
      db.prepare('UPDATE edit_requests SET used_at = ? WHERE id = ?').run(timestamp, approvedRequest.id);
    }
    db.prepare('INSERT INTO audit_logs (survey_id, action, detail_json, created_at) VALUES (?, ?, ?, ?)')
      .run(survey.id, 'submission.update', JSON.stringify({ submissionId, name }), timestamp);
  });
  return { id: submissionId, name, updatedAt: timestamp, revision: revisionFor(survey.id, getSurveyRow(survey.id)) };
}

function getSubmissionSurveyId(submissionId) {
  const row = db.prepare('SELECT survey_id FROM submissions WHERE id = ?').get(submissionId);
  return row ? row.survey_id : '';
}

function saveTimetableImport(input) {
  const id = uid('ocr');
  const timestamp = nowIso();
  db.prepare(`
    INSERT INTO timetable_imports
      (id, survey_id, respondent_token_hash, submission_id, question_id, provider, original_name,
       file_path, mime_type, confidence, raw_json, courses_json, text_result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.surveyId || null, input.respondentHash || '', input.submissionId || null,
    input.questionId || null, input.provider || 'mock', cleanText(input.originalName, 200),
    input.filePath, input.mimeType, Number(input.confidence) || null,
    JSON.stringify(input.raw || {}), JSON.stringify(input.courses || []),
    cleanText(input.text, 5000), timestamp
  );
  return { id, createdAt: timestamp };
}

function getTimetableImportByPath(filePath) {
  return db.prepare('SELECT * FROM timetable_imports WHERE file_path = ? ORDER BY created_at DESC LIMIT 1').get(filePath);
}

function canAccessUpload(rawToken, testPath) {
  const row = getTimetableImportByPath(testPath);
  if (!row || !row.survey_id) return false;
  const survey = getSurveyRow(row.survey_id);
  if (!survey) return false;
  if (rawToken && rawToken === survey.fill_token) return true;
  if (rawToken && rawToken === survey.result_token && survey.results_published) return true;
  if (rawToken && hashToken(rawToken) === survey.admin_token_hash) return true;
  return false;
}

function serializeAnswer(question, value) {
  if (value === undefined || value === null) return '';
  if (question.type === 'timetable') {
    if (!value.busy || !value.busy.length) return value.text || '';
    return value.busy.map((block) => `${block.day} 第${block.startPeriod}-${block.endPeriod}节`).join('；');
  }
  return Array.isArray(value) ? value.join(' / ') : String(value);
}

function csvFor(rawAdminToken) {
  const survey = getAdminSurvey(rawAdminToken);
  const nameQuestion = survey.questions.find((question) => question.type === 'short' && NAME_PATTERN.test(question.label));
  const columns = survey.questions.filter((question) => !nameQuestion || question.id !== nameQuestion.id);
  const header = ['填写人', ...columns.map((question) => question.type === 'timetable' ? `${question.label}（结构化）` : question.label), '首次提交', '最后更新', '状态'];
  const escape = (value) => `"${String(value === undefined || value === null ? '' : value).replace(/"/g, '""')}"`;
  const lines = survey.submissions.map((submission) => {
    const values = columns.map((question) => serializeAnswer(question, submission.answers[question.id]));
    return [
      submission.name,
      ...values,
      submission.submittedAtText,
      submission.updatedAtText,
      submission.status === 'edited' ? '已修改' : '已提交'
    ];
  });
  return '\ufeff' + [header, ...lines].map((line) => line.map(escape).join(',')).join('\r\n');
}

module.exports = {
  AppError,
  ACCESS_MODES,
  QUESTION_TYPES,
  canAccessUpload,
  createEditRequest,
  createSubmission,
  createSurvey,
  csvFor,
  findSurveyByAdminToken,
  findSurveyByFillToken,
  findSurveyByResultToken,
  getAdminSurvey,
  getFillSurvey,
  getResultSurvey,
  getSubmissionSurveyId,
  getSurveyRow,
  getTimetableImportByPath,
  hashToken,
  questionsFor,
  reviewEditRequest,
  saveTimetableImport,
  updateSubmissionByRespondent,
  updateSurvey
};
