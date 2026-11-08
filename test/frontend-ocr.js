'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const occupancy = require('../occupancy');

function createPage() {
  const width = 510, height = 430;
  const pixels = new Uint8Array(width * height * 4).fill(255);
  function rect(left, top, right, bottom, rgb) {
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      pixels.set([...rgb, 255], (y * width + x) * 4);
    }
  }
  for (let row = 0; row <= 12; row++) rect(50, 50 + row * 30, 491, 51 + row * 30, [200, 200, 200]);
  for (let day = 0; day <= 7; day++) rect(70 + day * 60, 50, 71 + day * 60, 411, [200, 200, 200]);
  rect(72, 52, 129, 109, [224, 238, 252]);
  const canvas = { fillRect() {}, drawImage() {}, getImageData: () => ({ data: pixels }) };
  const context = vm.createContext({
    console, crypto: require('node:crypto').webcrypto,
    localStorage: { getItem: () => null, setItem() {} },
    document: { addEventListener() {}, createElement: () => ({ getContext: () => canvas }) },
    window: { addEventListener() {} },
    FileReader: class {
      readAsDataURL() { this.result = 'data:image/png;base64,fixture'; this.onload(); }
    },
    TimetableOccupancy: occupancy,
    image: { naturalWidth: width, naturalHeight: height },
    fail: true,
    result: {
      provider: 'test', text: '', busy: [{ day: '周一', startPeriod: 1, endPeriod: 1 }],
      grid: {
        columns: Array.from({ length: 7 }, (_, i) => ({ day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i], left: 70 + i * 60, right: 130 + i * 60 })),
        periods: Array.from({ length: 12 }, (_, i) => ({ period: i + 1, top: 50 + i * 30, bottom: 80 + i * 30 }))
      }
    }
  });
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  vm.runInContext(source.slice(0, source.lastIndexOf('(function init()')), context);
  vm.runInContext(`
    state.route = {page: 'fill', token: 'survey-a'};
    state.routeVersion = 1;
    state.fillData = {questions: []};
    refreshFillQuestion = () => {};
    toast = () => {};
    loadImageElement = async () => image;
    fileToDataUrl = async () => 'data:image/png;base64,fixture';
    api = async () => { if (fail) throw new Error('OCR unavailable'); return result; };
  `, context);
  const run = code => vm.runInContext(code, context);
  const read = code => JSON.parse(JSON.stringify(run(code)));
  return { context, run, read };
}

async function main() {
  const page = createPage();
  const recognize = () => page.run("recognizeTimetableFile('q', {name: 'timetable.png'})");
  await recognize();
  assert.deepEqual(page.read('state.fillDraft.q.busy'), [{ day: '周一', startPeriod: 1, endPeriod: 2 }]);
  assert.match(page.run('state.timetableWarnings.q'), /12 节、7 天/);
  assert.equal(page.run('state.timetableBusy.q'), false);

  page.run('fail = false');
  await recognize();
  assert.deepEqual(page.read('state.fillDraft.q.busy'), [{ day: '周一', startPeriod: 1, endPeriod: 2 }], 'Pixels supplement OCR text in merged cells');

  page.run("state.fillDraft.q.busy = [{day: '周三', startPeriod: 4, endPeriod: 4}]; fail = true");
  await recognize();
  assert.deepEqual(page.read('state.fillDraft.q.busy'), [{ day: '周三', startPeriod: 4, endPeriod: 4 }], 'Failed retries preserve manual edits');
  assert.match(page.run('state.timetableWarnings.q'), /已保留/);

  page.run('state.fillDraft.q = {busy: [], emptyWeek: true}');
  await recognize();
  assert.equal(page.run('state.fillDraft.q.emptyWeek'), true, 'Failed retries preserve empty-week confirmation');

  page.run('api = () => new Promise(resolve => { globalThis.finishOcr = resolve; })');
  const pending = recognize();
  // Allow the asynchronous file/image preparation to reach the HTTP request.
  while (!page.context.finishOcr) await new Promise(resolve => setImmediate(resolve));
  page.run("state.routeVersion++; state.route = {page: 'fill', token: 'survey-b'}; state.fillDraft = {q: {busy: [], provider: 'new-survey'}}");
  page.context.finishOcr(page.context.result);
  await pending;
  assert.equal(page.run('state.fillDraft.q.provider'), 'new-survey', 'Late results cannot overwrite a different survey');
  assert.equal(page.run('state.timetableBusy.q'), false);

  const blank = createPage();
  blank.context.image = { naturalWidth: 100, naturalHeight: 100 };
  await blank.run("recognizeTimetableFile('q', {name: 'blank.png'})");
  assert.deepEqual(blank.read('state.fillDraft.q.busy'), []);
  assert.equal(blank.run('state.fillDraft.q.emptyWeek'), false, 'An unrecognized image is never treated as an empty week');
  console.log('PASS: auto fallback, pixel supplement, manual edit/empty-week preservation, late OCR results and unknown images');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
