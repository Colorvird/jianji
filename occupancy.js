'use strict';

// Browser and Node share the exact same pixel analysis for regression testing.
(function (root) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  function groups(values) {
    const result = [];
    for (const value of values) {
      if (!result.length || value > result[result.length - 1].at(-1) + 2) result.push([]);
      result.at(-1).push(value);
    }
    return result.filter(g => g.length < 8).map(g => g[Math.floor(g.length / 2)]);
  }
  function detect(data, width, height) {
    const neutral = (x, y) => {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const light = (r + g + b) / 3;
      return Math.max(r, g, b) - Math.min(r, g, b) < 12 && light > 160 && light < 244;
    };
    const candidates = [];
    for (let y = 0; y < height; y++) {
      let hit = 0, count = 0;
      for (let x = Math.floor(width * .08); x < width; x += 3) { count++; if (neutral(x, y)) hit++; }
      if (hit / count > .35) candidates.push(y);
    }
    const lines = groups(candidates);
    // Supported layout: 13 periods, with two noon rows after period 5.
    // Refuse other layouts rather than assigning arbitrary period numbers.
    let rows = null;
    for (let i = 0; i < lines.length && !rows; i++) {
      for (let j = i + 1; j < lines.length && !rows; j++) {
        const step = (lines[j] - lines[i]) / 15;
        if (step < height / 30 || step > height / 12) continue;
        const sequence = Array.from({ length: 16 }, (_, k) => lines.find(y => Math.abs(y - lines[i] - k * step) < step * .025));
        if (sequence.every(y => y !== undefined)) rows = sequence;
      }
    }
    if (!rows) return null;
    const xs = [];
    for (let x = 0; x < width; x++) {
      let hit = 0, count = 0;
      for (let y = rows[0]; y <= rows[15]; y += 5) { count++; if (neutral(x, y)) hit++; }
      if (hit / count > .55) xs.push(x);
    }
    const vertical = groups(xs);
    let edges = null;
    for (const left of vertical) {
      if (left < width * .04 || left > width * .15) continue;
      const step = (width - left) / 7;
      const sequence = Array.from({ length: 7 }, (_, k) => vertical.find(x => Math.abs(x - left - k * step) < step * .04));
      if (sequence.every(x => x !== undefined)) { edges = [...sequence, width]; break; }
    }
    if (!edges) return null;
    const periods = [1, 2, 3, 4, 5, 0, 0, 6, 7, 8, 9, 10, 11, 12, 13];
    const cells = [];
    for (let d = 0; d < 7; d++) {
      for (let row = 0; row < 15; row++) {
        let hit = 0, count = 0;
        const dx = edges[d + 1] - edges[d], dy = rows[row + 1] - rows[row];
        for (let y = Math.ceil(rows[row] + dy * .15); y < rows[row + 1] - dy * .15; y += 3) {
          for (let x = Math.ceil(edges[d] + dx * .15); x < edges[d + 1] - dx * .15; x += 3) {
            const i = (y * width + x) * 4;
            count++;
            if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 45) hit++;
          }
        }
        if (count && hit / count > .2) {
          if (!periods[row]) return null; // Noon content contradicts this template.
          cells.push({ day: days[d], period: periods[row] });
        }
      }
    }
    if (!cells.length) return null;
    const busy = [];
    for (const cell of cells) {
      const previous = busy.at(-1);
      if (previous && previous.day === cell.day && previous.endPeriod + 1 === cell.period) previous.endPeriod = cell.period;
      else busy.push({ day: cell.day, startPeriod: cell.period, endPeriod: cell.period });
    }
    return { busy, provider: '本地彩色网格（13节＋两行午休，请核对）', demo: false, text: '', imageUrl: '' };
  }
  function match(value, times, window) {
    if (!window || window.start < 0 || window.end > 1440 || window.start >= window.end) return 'unknown';
    if (!value || !Array.isArray(value.busy)) return 'unknown';
    let missing = false;
    const minutes = text => /^([01]\d|2[0-3]):[0-5]\d$/.test(text || '') ? Number(text.slice(0, 2)) * 60 + Number(text.slice(3)) : null;
    for (const block of value.busy.filter(b => b.day === window.day)) {
      for (let p = block.startPeriod; p <= (block.endPeriod || block.startPeriod); p++) {
        const time = times[p - 1] || {};
        const start = minutes(time.start), end = minutes(time.end);
        if (start === null || end === null || end <= start) { missing = true; continue; }
        if (start < window.end && end > window.start) return 'conflict';
      }
    }
    return missing ? 'unknown' : 'free';
  }
  const api = { detect, match };
  if (typeof module !== 'undefined') module.exports = api;
  else root.TimetableOccupancy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
