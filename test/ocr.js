'use strict';
const assert = require('node:assert/strict');
const { parseOccupancyGrid, coursesFromOcrSpace } = require('../src/ocr');
const { detect, detectAuto, coloredCell, match } = require('../occupancy');

function word(text, x, y, width = 35, height = 12) {
  return { WordText: text, Left: x - width / 2, Top: y - height / 2, Width: width, Height: height };
}
function line(...words) {
  return { LineText: words.map(w => w.WordText).join(' '), Words: words };
}
function payload(lines, text = '课表文字') {
  return { ParsedResults: [{ ParsedText: text, TextOverlay: { Lines: lines } }] };
}
const headers = line(word('星', 120, 20, 12), word('期', 134, 20, 12), word('一', 148, 20, 12), word('星期三', 334, 20, 45));
const labels = [line(word('第1节', 35, 70)), line(word('第2节', 35, 110)), line(word('第三节', 35, 250)), line(word('第4节', 35, 290))];
const lines = [headers, ...labels, line(word('数学', 134, 70)), line(word('物理', 234, 110)), line(word('英语', 334, 250)), line(word('08:00-08:45', 134, 290, 65))];
const parsed = parseOccupancyGrid(lines);
assert.deepEqual(parsed.columns.map(c => c.day), ['周一', '周二', '周三']);
assert.deepEqual(parsed.busy.map(b => [b.day, b.startPeriod, b.endPeriod]).sort(), [['周一', 1, 1], ['周二', 2, 2], ['周三', 3, 3]].sort());
assert.equal(parsed.periods.find(p => p.period === 3).center, 250);
assert.equal(parsed.periods.some(p => p.top < 180 && p.bottom > 180), false, 'Lunch must not become a class row');
assert.ok(coursesFromOcrSpace(payload(lines)).busy.length);
assert.throws(() => coursesFromOcrSpace(payload([line(word('普通通知', 100, 80))])), /未能定位/);
assert.deepEqual(coursesFromOcrSpace(payload([headers, ...labels])).busy, [], 'Valid geometry can still be supplemented by image pixels');
const paired = parseOccupancyGrid([
  line(word('周一', 134, 20)), line(word('周二', 234, 20)),
  line(word('第1-2节', 35, 90, 55)), line(word('3～4节', 35, 170, 55)),
  line(word('高等数学', 134, 80))
]);
assert.deepEqual(paired.busy, [{ day: '周一', startPeriod: 1, endPeriod: 2 }]);
const singleLabels = [
  line(word('星期1', 134, 20)), line(word('周2', 234, 20)),
  ...[1, 2, 3, 4].map(p => line(word(`第${p}节`, 35, 30 + p * 40)))
];
assert.deepEqual(parseOccupancyGrid([
  ...singleLabels, line(word('高等数学', 134, 70)), line(word('[1-2节]', 134, 85, 60))
]).busy, [{ day: '周一', startPeriod: 1, endPeriod: 2 }], 'Explicit merged-cell period annotations expand beyond the text row');
assert.deepEqual(parseOccupancyGrid([
  ...singleLabels, line(word('物理', 134, 70)), line(word('1-16周', 134, 85, 60)), line(word('[3-4节]', 234, 70, 60))
]).busy, [
  { day: '周二', startPeriod: 1, endPeriod: 1 },
  { day: '周一', startPeriod: 1, endPeriod: 1 }
].sort((a, b) => a.day.localeCompare(b.day, 'zh-CN')), 'Weeks and ranges inconsistent with physical rows must not expand periods');
const noWords = lines.map(l => {
  if (l.Words.length !== 1) return l;
  const w = l.Words[0];
  return { LineText: l.LineText, Left: w.Left, Top: w.Top, Width: w.Width, Height: w.Height };
});
assert.deepEqual(parseOccupancyGrid(noWords).busy, parsed.busy);

function fixture(rowCount, dayCount = 7, background = [255, 255, 255]) {
  const width = 70 + dayCount * 60 + 20, height = 50 + rowCount * 30 + 20;
  const data = new Uint8Array(width * height * 4);
  function rect(left, top, right, bottom, rgb) {
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const i = (y * width + x) * 4;
      data.set([...rgb, 255], i);
    }
  }
  rect(0, 0, width, height, background);
  for (let r = 0; r <= rowCount; r++) rect(50, 50 + r * 30, 71 + dayCount * 60, 51 + r * 30, [200, 200, 200]);
  for (let d = 0; d <= dayCount; d++) rect(70 + d * 60, 50, 71 + d * 60, 51 + rowCount * 30, [200, 200, 200]);
  return { data, width, height, course(day, start, end, rgb = [224, 238, 252]) {
    rect(72 + day * 60, 52 + start * 30, 69 + (day + 1) * 60, 49 + (end + 1) * 30, rgb);
  }, rect };
}
for (const count of [12, 13, 14]) {
  for (const days of [5, 7]) {
    const f = fixture(count, days);
    f.course(0, 0, 1);
    f.course(days - 1, count - 1, count - 1, [244, 224, 239]);
    const result = detect(f.data, f.width, f.height, { periods: Array.from({ length: count }, (_, i) => i + 1), dayCount: days });
    assert.deepEqual(result?.busy, [
      { day: '周一', startPeriod: 1, endPeriod: 2 },
      { day: days === 5 ? '周五' : '周日', startPeriod: count, endPeriod: count }
    ], `${count} periods, ${days} days, pale courses and outer margins`);
    const automatic = detectAuto(f.data, f.width, f.height);
    assert.deepEqual(automatic?.layout, { rowCount: count, dayCount: days }, 'Auto mode must detect the full grid rather than a 12-row subset');
    assert.deepEqual(automatic.busy, result.busy);
  }
}
const noon = fixture(15);
noon.course(1, 7, 8);
assert.equal(detectAuto(noon.data, noon.width, noon.height), null, 'Never guess how 15 rows map across a lunch break');
assert.deepEqual(detect(noon.data, noon.width, noon.height)?.busy, [{ day: '周二', startPeriod: 6, endPeriod: 7 }]);
noon.course(0, 5, 5);
assert.equal(detect(noon.data, noon.width, noon.height), null, 'Content in a lunch row contradicts the template');
const gray = fixture(12, 7, [180, 180, 180]);
assert.equal(coloredCell(gray.data, gray.width, gray.height, 70, 130, 50, 80), false);
assert.equal(detect(gray.data, gray.width, gray.height, { periods: Array.from({ length: 12 }, (_, i) => i + 1) }), null);
const extra = fixture(14);
extra.course(0, 1, 1);
assert.equal(detect(extra.data, extra.width, extra.height, {
  periods: Array.from({ length: 12 }, (_, i) => i + 1), dayCount: 7, strict: true
}), null, 'An explicitly selected 12-period layout must not crop a 14-period table');
extra.rect(50, 65, extra.width - 19, 66, [200, 200, 200]);
assert.equal(detectAuto(extra.data, extra.width, extra.height), null, 'Extra internal grid lines are ambiguous');
assert.equal(match({ busy: [], emptyWeek: false }, [], { day: '周一', start: 480, end: 540 }), 'unknown');
assert.equal(match({ busy: [], emptyWeek: true }, [], { day: '周一', start: 480, end: 540 }), 'free');
console.log('PASS: grouped weekday headers, missing weekdays, period labels/ranges, lunch gaps, invalid OCR, pale blocks, 12/13/14-period layouts, 5/7 days and explicit empty weeks');
