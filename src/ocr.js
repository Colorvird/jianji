'use strict';

const DEMO_COURSES = [
  { name: '高等数学', day: '周一', start: '08:00', end: '09:40', location: 'A-101', teacher: '张明', confidence: 0.96 },
  { name: '大学英语', day: '周一', start: '14:00', end: '15:40', location: 'B-203', teacher: '李静', confidence: 0.94 },
  { name: '数据结构', day: '周二', start: '10:00', end: '11:40', location: 'C-305', teacher: '王强', confidence: 0.92 },
  { name: '线性代数', day: '周三', start: '08:00', end: '09:40', location: 'A-210', teacher: '陈立', confidence: 0.95 },
  { name: '摄影基础', day: '周四', start: '14:00', end: '15:40', location: '艺术楼-201', teacher: '周岚', confidence: 0.9 },
  { name: '体育', day: '周五', start: '10:00', end: '11:40', location: '体育馆', teacher: '赵峰', confidence: 0.93 }
];

const DAY_RE = /^(?:周|星期)\s*([一二三四五六日天])$/;
const DAY_HEADER_RE = /^(?:周|星期|礼拜)([一二三四五六日天1-7])$/;
const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_RE = /(\d{1,2})\s*:\s*(\d{2})\s*(?:-|–|—|~|～|至|到)\s*(\d{1,2})\s*:\s*(\d{2})/;
const DAY_MAP = { 一: '周一', 二: '周二', 三: '周三', 四: '周四', 五: '周五', 六: '周六', 日: '周日', 天: '周日' };
const CN_NUMBERS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const DEMO_BUSY = [
  { day: '周一', startPeriod: 1, endPeriod: 2 },
  { day: '周三', startPeriod: 3, endPeriod: 4 },
  { day: '周五', startPeriod: 6, endPeriod: 7 }
];

function normalizeCourse(item) {
  const name = String(item.name || item.course || item.title || '').trim();
  if (!name) return null;
  return {
    name: name.slice(0, 80),
    day: String(item.day || item.weekday || '').trim().slice(0, 20),
    start: String(item.start || item.start_time || '').trim().slice(0, 10),
    end: String(item.end || item.end_time || '').trim().slice(0, 10),
    location: String(item.location || item.room || '').trim().slice(0, 80),
    teacher: String(item.teacher || '').trim().slice(0, 40),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0))
  };
}

function coursesToText(courses) {
  return courses.map((course) => {
    const time = course.start && course.end ? `${course.start}–${course.end}` : course.start || course.end || '';
    return [course.day, time, course.name, course.location ? `@${course.location}` : ''].filter(Boolean).join(' ');
  }).join('\n');
}

function timeRange(text) {
  const match = TIME_RE.exec(String(text || ''));
  if (!match) return null;
  const start = `${match[1].padStart(2, '0')}:${match[2]}`;
  const end = `${match[3].padStart(2, '0')}:${match[4]}`;
  return { start, end };
}

function dayFromText(text) {
  const match = DAY_RE.exec(String(text || '').trim());
  return match ? DAY_MAP[match[1]] : '';
}

function lineText(line) {
  return String(line.LineText || line.lineText || '').trim();
}

function lineGeometry(line) {
  const words = Array.isArray(line.Words) ? line.Words : [];
  const lefts = words.map((word) => Number(word.Left)).filter(Number.isFinite);
  const rights = words.map((word) => Number(word.Left) + Number(word.Width || 0)).filter(Number.isFinite);
  const tops = words.map((word) => Number(word.Top)).filter(Number.isFinite);
  const bottoms = words.map((word) => Number(word.Top) + Number(word.Height || 0)).filter(Number.isFinite);
  const left = lefts.length ? Math.min(...lefts) : Number(line.Left) || 0;
  const right = rights.length ? Math.max(...rights) : left + (Number(line.Width) || 0);
  const top = tops.length ? Math.min(...tops) : Number(line.Top) || 0;
  const bottom = bottoms.length ? Math.max(...bottoms) : top + (Number(line.Height) || 0);
  return { x: (left + right) / 2, y: (top + bottom) / 2, top, bottom, left, right };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function integerLabel(text) {
  const compact = String(text || '').trim().replace(/\s+/g, '').replace(/^第/, '').replace(/节$/, '');
  if (/^\d{1,2}$/.test(compact)) {
    const value = Number(compact);
    return value >= 1 && value <= 24 ? value : 0;
  }
  if (/^[一二三四五六七八九十]{1,3}$/.test(compact)) {
    if (compact === '十') return 10;
    if (compact.length === 1) return CN_NUMBERS[compact] || 0;
    if (compact[0] === '十') return 10 + (CN_NUMBERS[compact[1]] || 0);
    if (compact[1] === '十') return (CN_NUMBERS[compact[0]] || 0) * 10 + (CN_NUMBERS[compact[2]] || 0);
  }
  return 0;
}

function periodLabel(text) {
  const compact = String(text || '').replace(/\s+/g, '').replace(/^第/, '').replace(/节$/, '');
  const parts = compact.split(/[-–—~～至、,，]/);
  const start = integerLabel(parts[0]), end = integerLabel(parts.at(-1));
  if (!start || !end || end < start || end > 24 || parts.length > 2) return null;
  return { start, end, period: (start + end) / 2 };
}

function isGridNoise(text) {
  const value = String(text || '').replace(/\s+/g, '');
  return !value
    || Boolean(periodLabel(value))
    || /^\d{1,2}[:：]\d{2}(?:[-–—~～至到]\d{1,2}[:：]\d{2})?$/.test(value)
    || /^\d{1,2}[-/]\d{1,2}$/.test(value)
    || /^(?:上午|下午|中午|晚上|节次|周[一二三四五六日天]|星期[一二三四五六日天])$/.test(value)
    || /^(?:我的课表|长按格子添加备注|点空白格子.*|首页|我课表|消息|备注.*)$/.test(value)
    || /^\d{1,2}月?$/.test(value);
}

function mergeBusyCells(cells) {
  const grouped = new Map();
  for (const cell of cells) {
    if (!grouped.has(cell.day)) grouped.set(cell.day, []);
    grouped.get(cell.day).push(cell.period);
  }
  const busy = [];
  for (const [day, values] of grouped) {
    const periods = [...new Set(values)].sort((a, b) => a - b);
    let start = periods[0];
    let previous = periods[0];
    for (let index = 1; index <= periods.length; index += 1) {
      const current = periods[index];
      if (current === previous + 1) {
        previous = current;
        continue;
      }
      busy.push({ day, startPeriod: start, endPeriod: previous });
      start = current;
      previous = current;
    }
  }
  return busy.sort((a, b) => a.day.localeCompare(b.day, 'zh-CN') || a.startPeriod - b.startPeriod);
}

function parseOccupancyGrid(lines) {
  const geometry = lines.map((line) => ({ text: lineText(line), words: Array.isArray(line.Words) ? line.Words : [], ...lineGeometry(line) })).filter((line) => line.text);
  // OCR often combines the header row, or splits "星期一" into separate words.
  const labels = [...geometry];
  for (const line of geometry) {
    for (let index = 0; index < line.words.length; index++) {
      for (let length = 1; length <= 4 && index + length <= line.words.length; length++) {
        const words = line.words.slice(index, index + length);
        if (words.some((word, i) => i && (
          Number(word.Left) - Number(words[i - 1].Left) - Number(words[i - 1].Width) > Math.max(8, Number(word.Height) * 1.5)
          || Math.abs(Number(word.Top) - Number(words[i - 1].Top)) > Math.max(8, Number(word.Height))
        ))) break;
        labels.push({ text: words.map(word => word.WordText || '').join(''), ...lineGeometry({ Words: words }) });
      }
    }
  }
  const dayHeaders = [];
  for (const line of labels) {
    const match = DAY_HEADER_RE.exec(line.text.replace(/\s+/g, ''));
    if (!match) continue;
    const day = DAY_MAP[match[1]] || WEEK_DAYS[Number(match[1]) - 1];
    if (!dayHeaders.some((item) => item.day === day)) {
      dayHeaders.push({ day, x: line.x, y: line.y });
    }
  }
  dayHeaders.sort((a, b) => a.x - b.x);
  if (dayHeaders.length < 2) return { days: [], columns: [], periods: [], busy: [] };

  const steps = dayHeaders.slice(1).map((item, index) =>
    (item.x - dayHeaders[index].x) / (WEEK_DAYS.indexOf(item.day) - WEEK_DAYS.indexOf(dayHeaders[index].day)));
  if (steps.some(step => step <= 0)) return { days: [], columns: [], periods: [], busy: [] };
  const dayStep = median(steps);
  const origin = median(dayHeaders.map(item => item.x - WEEK_DAYS.indexOf(item.day) * dayStep));
  // Infer gaps between recognized weekdays, without inventing weekend columns.
  const columns = WEEK_DAYS.slice(WEEK_DAYS.indexOf(dayHeaders[0].day), WEEK_DAYS.indexOf(dayHeaders.at(-1).day) + 1).map(day => {
    const center = origin + WEEK_DAYS.indexOf(day) * dayStep;
    return { day, center, left: center - dayStep / 2, right: center + dayStep / 2 };
  });
  const leftLimit = columns[0].left + 8;
  const tableTop = dayHeaders[0].y;
  const candidates = labels
    .map((line) => ({ ...line, label: periodLabel(line.text) }))
    .filter((line) => line.label && line.right < leftLimit && line.y > tableTop + 10)
    .sort((a, b) => a.y - b.y);
  const known = [];
  for (const item of candidates) {
    if (!known.some((row) => row.label.start <= item.label.end && row.label.end >= item.label.start)) known.push(item);
  }
  if (known.length < 2) return { days: dayHeaders.map((item) => item.day), columns, periods: [], busy: [] };

  const stepCandidates = [];
  for (let index = 1; index < known.length; index += 1) {
    const gap = known[index].y - known[index - 1].y;
    const periodGap = known[index].label.period - known[index - 1].label.period;
    if (gap > 0 && periodGap > 0) stepCandidates.push(gap / periodGap);
  }
  let rowStep = median(stepCandidates);
  if (!rowStep) rowStep = median(known.slice(1).map((item, index) => item.y - known[index].y)) || 80;

  const rowMap = new Map();
  for (const item of known) {
    for (let period = item.label.start; period <= item.label.end; period++) {
      rowMap.set(period, item.y + (period - item.label.period) * rowStep);
    }
  }
  for (let index = 1; index < known.length; index += 1) {
    const previous = known[index - 1];
    const next = known[index];
    const gap = next.label.start - previous.label.end;
    if (gap <= 1) continue;
    const previousY = rowMap.get(previous.label.end), nextY = rowMap.get(next.label.start);
    // Do not place missing periods across a lunch break of unknown length.
    if (Math.abs((nextY - previousY) / gap - rowStep) > rowStep * .2) continue;
    for (let period = previous.label.end + 1; period < next.label.start; period += 1) {
      rowMap.set(period, previousY + (nextY - previousY) * (period - previous.label.end) / gap);
    }
  }
  const periods = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([period, y]) => ({ period, center: y, top: y - rowStep / 2, bottom: y + rowStep / 2 }));
  const marked = new Set();
  for (const line of geometry) {
    const words = line.words.length ? line.words : [{ WordText: line.text, Left: line.left, Top: line.top, Width: line.right - line.left, Height: line.bottom - line.top }];
    for (const word of words) {
      const text = String(word.WordText || '').trim();
      if (isGridNoise(text)) continue;
      const x = Number(word.Left) + Number(word.Width || 0) / 2;
      const y = Number(word.Top) + Number(word.Height || 0) / 2;
      const column = columns.find((item) => x >= item.left && x <= item.right);
      const row = periods.find((item) => y >= item.top && y < item.bottom);
      if (column && row) {
        const grouped = known.find(item => row.period >= item.label.start && row.period <= item.label.end);
        const start = grouped ? grouped.label.start : row.period;
        const end = grouped ? grouped.label.end : row.period;
        for (let period = start; period <= end; period++) marked.add(`${column.day}|${period}`);
      }
    }
  }
  // A merged course cell can put all of its text in just one of its periods.
  // Expand only explicit "1-2节" annotations that agree with that text's row.
  for (const line of labels) {
    const range = /(?:^|[([【（\s])第?(\d{1,2})\s*[-–—~～至、,，]\s*(\d{1,2})\s*节(?:$|[)\]】）\s])/.exec(line.text);
    if (!range) continue;
    const start = Number(range[1]), end = Number(range[2]);
    if (end <= start || end > 24) continue;
    const column = columns.find(item => line.x >= item.left && line.x < item.right);
    const row = periods.find(item => line.y >= item.top && line.y < item.bottom);
    if (!column || !row || row.period < start || row.period > end) continue;
    if (!Array.from({ length: end - start + 1 }, (_, i) => start + i).every(period => rowMap.has(period))) continue;
    for (let period = start; period <= end; period++) marked.add(`${column.day}|${period}`);
  }
  const cells = [...marked].map((key) => {
    const [day, period] = key.split('|');
    return { day, period: Number(period) };
  });
  return {
    days: columns.map((item) => item.day),
    columns,
    periods,
    busy: mergeBusyCells(cells)
  };
}

function isRoom(text) {
  return /\d|^[A-Za-z][-A-Za-z0-9]*$|楼|室|馆|区|校区|实验|中心|教室|机房|操场|体育场/.test(text);
}

function isTeacher(text) {
  return /^[\u4e00-\u9fa5·]{2,6}$/.test(text) && !/周[一二三四五六日天]/.test(text);
}

function looksLikeMarker(text) {
  return !text || DAY_RE.test(text) || /^(节次|上午|下午|晚上|中午|课程|时间|地点|教师|老师|星期一|星期二|星期三|星期四|星期五|星期六|星期日)$/.test(text);
}

function parseOverlayLines(lines) {
  const geometry = lines.map((line) => ({ text: lineText(line), ...lineGeometry(line) })).filter((line) => line.text);
  const headers = geometry
    .map((line) => ({ day: dayFromText(line.text), x: line.x, y: line.y }))
    .filter((line) => line.day);
  const uniqueHeaders = [];
  for (const header of headers) {
    if (!uniqueHeaders.some((item) => item.day === header.day && Math.abs(item.x - header.x) < 80)) uniqueHeaders.push(header);
  }
  uniqueHeaders.sort((a, b) => a.x - b.x);
  const spacing = uniqueHeaders.length > 1
    ? median(uniqueHeaders.slice(1).map((header, index) => header.x - uniqueHeaders[index].x))
    : 220;
  const nearestDay = (x) => {
    if (!uniqueHeaders.length) return '';
    const nearest = uniqueHeaders.reduce((best, header) => (
      !best || Math.abs(header.x - x) < Math.abs(best.x - x) ? header : best
    ), null);
    return nearest && Math.abs(nearest.x - x) <= Math.max(90, spacing * 0.72) ? nearest.day : '';
  };
  const timeLines = geometry.filter((line) => timeRange(line.text));
  const courses = [];
  for (const timeLine of timeLines) {
    const range = timeRange(timeLine.text);
    if (!range) continue;
    const tolerance = Math.max(65, spacing * 0.46);
    const nearby = geometry.filter((line) => {
      if (line === timeLine || dayFromText(line.text)) return false;
      if (Math.abs(line.x - timeLine.x) > tolerance) return false;
      return line.y >= timeLine.y - 95 && line.y <= timeLine.y + 125;
    });
    const above = nearby.filter((line) => line.y < timeLine.y - 2 && !looksLikeMarker(line.text)).sort((a, b) => b.y - a.y);
    const below = nearby.filter((line) => line.y > timeLine.y + 2 && !looksLikeMarker(line.text) && !timeRange(line.text)).sort((a, b) => a.y - b.y);
    let name = above.length ? above[0].text : '';
    if (!name) name = below.find((line) => !isRoom(line.text) && !isTeacher(line.text))?.text || '';
    const locationLine = below.find((line) => isRoom(line.text));
    const teacherLine = below.find((line) => isTeacher(line.text) && line !== locationLine);
    const course = normalizeCourse({
      name,
      day: nearestDay(timeLine.x),
      start: range.start,
      end: range.end,
      location: locationLine ? locationLine.text : '',
      teacher: teacherLine ? teacherLine.text : '',
      confidence: name ? 0.82 : 0.58
    });
    if (course && course.name) courses.push(course);
  }
  return courses;
}

function parseTextLines(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const courses = [];
  for (let index = 0; index < lines.length; index += 1) {
    const range = timeRange(lines[index]);
    if (!range) continue;
    const nearby = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 4));
    const day = nearby.map(dayFromText).find(Boolean) || '';
    const name = nearby.slice().reverse().find((line) => (
      !timeRange(line) && !dayFromText(line) && !looksLikeMarker(line) && !isRoom(line) && !isTeacher(line)
    )) || '';
    if (!name) continue;
    const course = normalizeCourse({ name, day, start: range.start, end: range.end, confidence: 0.52 });
    if (course) courses.push(course);
  }
  return courses;
}

function dedupeCourses(courses) {
  const seen = new Set();
  return courses.filter((course) => {
    const key = [course.name, course.day, course.start, course.end].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function coursesFromOcrSpace(payload) {
  const result = payload && Array.isArray(payload.ParsedResults) ? payload.ParsedResults[0] : null;
  const text = result && result.ParsedText ? String(result.ParsedText) : '';
  const lines = result && result.TextOverlay && Array.isArray(result.TextOverlay.Lines) ? result.TextOverlay.Lines : [];
  const overlayCourses = lines.length ? parseOverlayLines(lines) : [];
  const courses = dedupeCourses(overlayCourses.length ? overlayCourses : parseTextLines(text));
  const grid = lines.length ? parseOccupancyGrid(lines) : { days: [], columns: [], periods: [], busy: [] };
  if (!courses.length && !text.trim() && !lines.some(lineText)) {
    const message = payload && payload.ErrorMessage ? String(Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage.join(' ') : payload.ErrorMessage) : '没有识别到文字';
    throw new Error(message);
  }
  if (grid.columns.length < 2 || grid.periods.length < 2) {
    throw new Error('未能定位星期和节次，请裁剪出完整课表，或选择课表版式后重试。也可以对照原图手动标记。');
  }
  // A valid empty geometry still lets the browser find colored course blocks.
  // The browser requires occupied cells or explicit empty-week confirmation.
  return { courses, busy: grid.busy, grid, text: text.trim() || lines.map(lineText).join('\n') };
}

async function recognizeWithOcrSpace(buffer, mimeType) {
  const endpoint = process.env.OCR_SPACE_ENDPOINT || 'https://api.ocr.space/parse/image';
  const key = process.env.OCR_SPACE_API_KEY || 'helloworld';
  const form = new FormData();
  form.append('language', process.env.OCR_SPACE_LANGUAGE || 'chs');
  form.append('isOverlayRequired', 'true');
  form.append('isTable', 'true');
  form.append('OCREngine', '2');
  // Pixel analysis uses the uploaded image's coordinates.
  form.append('scale', 'false');
  form.append('detectOrientation', 'false');
  form.append('base64Image', `data:${mimeType};base64,${buffer.toString('base64')}`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { apikey: key },
    body: form,
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`OCR 服务返回 ${response.status}`);
  const payload = await response.json();
  if (payload.IsErroredOnProcessing) {
    const message = payload.ErrorMessage || payload.ErrorDetails || 'OCR 服务处理失败';
    throw new Error(Array.isArray(message) ? message.join(' ') : String(message));
  }
  const parsed = coursesFromOcrSpace(payload);
  const confidence = parsed.courses.length
    ? parsed.courses.reduce((sum, course) => sum + course.confidence, 0) / parsed.courses.length
    : 0;
  return {
    provider: 'ocrspace',
    demo: false,
    confidence: Math.round(confidence * 100) / 100,
    courses: parsed.courses,
    busy: parsed.busy,
    grid: parsed.grid,
    text: parsed.text,
    raw: payload
  };
}

async function recognizeWithHttp(buffer, mimeType) {
  const endpoint = process.env.OCR_ENDPOINT;
  if (!endpoint) throw new Error('OCR_ENDPOINT 未配置，无法调用外部识别服务。');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.OCR_API_KEY ? { Authorization: `Bearer ${process.env.OCR_API_KEY}` } : {})
    },
    body: JSON.stringify({
      image_base64: buffer.toString('base64'),
      mime_type: mimeType,
      schema: 'timetable-occupancy-v1'
    }),
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`OCR 服务返回 ${response.status}`);
  const payload = await response.json();
  const rawCourses = payload.courses || payload.data?.courses || [];
  const courses = dedupeCourses(rawCourses.map(normalizeCourse).filter(Boolean));
  if (!Array.isArray(payload.busy) && !Array.isArray(payload.data?.busy)) throw new Error('OCR 服务必须返回 busy 有课节次数组。');
  return {
    provider: process.env.OCR_PROVIDER || 'http',
    demo: false,
    confidence: Number(payload.confidence) || (courses.length ? courses.reduce((sum, course) => sum + course.confidence, 0) / courses.length : 0),
    courses,
    busy: Array.isArray(payload.busy) ? payload.busy : payload.data?.busy || [],
    grid: payload.grid || payload.data?.grid || { days: [], columns: [], periods: [], busy: [] },
    text: String(payload.text || payload.data?.text || coursesToText(courses)).trim(),
    raw: payload
  };
}

async function recognizeTimetable(buffer, mimeType) {
  const provider = (process.env.OCR_PROVIDER || 'ocrspace').toLowerCase();
  if (provider === 'http') return recognizeWithHttp(buffer, mimeType);
  if (provider === 'ocrspace') return recognizeWithOcrSpace(buffer, mimeType);
  if (provider !== 'mock') throw new Error(`不支持的 OCR_PROVIDER：${provider}`);
  return {
    provider: 'mock',
    demo: true,
    confidence: 0.93,
    courses: DEMO_COURSES,
    busy: DEMO_BUSY,
    grid: {
      days: ['周一', '周二', '周三', '周四', '周五'],
      columns: [],
      periods: Array.from({ length: 8 }, (_, index) => ({ period: index + 1, center: 0, top: 0, bottom: 0 })),
      busy: DEMO_BUSY
    },
    text: coursesToText(DEMO_COURSES),
    raw: { note: 'demo-provider', generatedAt: new Date().toISOString() }
  };
}

module.exports = {
  recognizeTimetable,
  coursesToText,
  coursesFromOcrSpace,
  parseOverlayLines,
  parseTextLines,
  parseOccupancyGrid,
  DEMO_COURSES
};
