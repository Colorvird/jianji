'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { match, detect } = require('../occupancy');

async function main() {
  const times = [{ start: '08:00', end: '08:45' }, { start: '09:00', end: '09:45' }];
  const value = { busy: [{ day: '周一', startPeriod: 1, endPeriod: 2 }] };
  const window = (start, end, day = '周一') => ({ day, start, end });
  assert.equal(match(value, times, window(480, 500)), 'conflict');
  assert.equal(match(value, times, window(525, 540)), 'free'); // Break between periods.
  assert.equal(match(value, times, window(585, 600)), 'free'); // Touching boundary.
  assert.equal(match(value, times.slice(0, 1), window(585, 600)), 'unknown');
  assert.equal(match(value, [], window(480, 500, '周二')), 'free');
  assert.equal(match(null, times, window(480, 500)), 'unknown');
  assert.equal(match(value, times, window(600, 480)), 'unknown');
  assert.equal(detect(new Uint8Array(120 * 200 * 4).fill(255), 120, 200), null);
  let sampleBusy = [{ day: '周一', startPeriod: 11, endPeriod: 13 }];
  if (process.argv[2]) {
    const expected = [['周一',11,13],['周二',1,2],['周二',6,12],['周三',3,5],['周三',9,10],['周四',1,2],['周四',11,12],['周五',1,4],['周五',9,10],['周日',11,13]];
    const result = detect(fs.readFileSync(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]));
    sampleBusy = result.busy;
    assert.deepEqual(result?.busy.map(b => [b.day, b.startPeriod, b.endPeriod]), expected);
    console.log('PASS: supplied screenshot matches all 30 occupied periods');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jianji-regression-'));
  let child, base, localServer;
  // Restricted environments can still verify HTTP behavior and database reopen.
  const inProcess = process.env.JIANJI_TEST_IN_PROCESS === '1';
  async function start(publicBase = 'https://stable.example.com') {
    if (inProcess) {
      process.env.JIANJI_DATA_DIR = dir;
      process.env.PUBLIC_BASE_URL = publicBase;
      localServer = require('../server').server;
      await new Promise(resolve => localServer.listen(0, '127.0.0.1', resolve));
      base = `http://127.0.0.1:${localServer.address().port}`;
      return;
    }
    child = spawn(process.execPath, ['-e', "const {server}=require('./server');server.listen(0,'127.0.0.1',()=>console.log(server.address().port));"], {
      cwd: path.resolve(__dirname, '..'), env: { ...process.env, JIANJI_DATA_DIR: dir, PUBLIC_BASE_URL: publicBase }, stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stderr.on('data', () => {});
    const port = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', data => { output += data; if (/\d+\n/.test(output)) resolve(Number(output.trim())); });
      child.on('error', reject);
      child.on('exit', code => reject(new Error(`Server exited early: ${code}`)));
    });
    base = `http://127.0.0.1:${port}`;
  }
  async function stop() {
    if (localServer) {
      await new Promise(resolve => localServer.close(resolve));
      require('../src/db').db.close();
      for (const file of ['../server', '../src/store', '../src/db']) delete require.cache[require.resolve(file)];
      localServer = null;
    }
    if (child && child.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
  }
  try {
    await start();
    const response = await fetch(base + '/api/surveys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '回归测试', questions: [{ type: 'timetable', label: '课表', required: true }, { type: 'timeslots', label: '活动', options: ['周一 08:00-09:00', '周六 08:00-09:00'] }] }) });
    const created = await response.json();
    assert.equal(response.status, 201, JSON.stringify(created));
    assert.ok(created.urls.fill.startsWith('https://stable.example.com/f/'));
    for (const asset of ['/occupancy.js', '/app.js', '/']) assert.equal((await fetch(base + asset)).status, 200);
    assert.equal((await fetch(base + `/api/surveys/admin/${created.adminToken}/qr/fill`)).status, 200);
    const qid = created.survey.questions.find(q => q.type === 'timetable').id;
    const submitEmpty = async (value, suffix) => fetch(base + `/api/surveys/fill/${created.fillToken}/submissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Respondent-Token': `empty-week-regression-${suffix}-123456` },
      body: JSON.stringify({ answers: { [qid]: value } })
    });
    assert.equal((await submitEmpty({ busy: [], text: 'OCR found some text' }, 'invalid')).status, 400);
    const submitted = await fetch(base + `/api/surveys/fill/${created.fillToken}/submissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Respondent-Token': 'regression-respondent-token-123456' },
      body: JSON.stringify({ answers: { [qid]: { busy: sampleBusy, provider: 'local', text: '', imageUrl: '', demo: false } } })
    });
    assert.equal(submitted.status, 201, await submitted.text());
    await stop(); await start();
    const loaded = await (await fetch(base + `/api/surveys/admin/${created.adminToken}`)).json();
    assert.equal(loaded.urls.fill, created.urls.fill);
    assert.deepEqual(loaded.submissions[0].answers[loaded.questions[0].id].busy, sampleBusy);
    const availability = loaded.stats.timetable.availability[0].options;
    assert.equal(availability[0].unknown, 1);
    assert.equal(availability[0].free, 0);
    assert.equal(availability[1].free, 1);
    assert.equal(loaded.stats.participation[0].options[0].unknown.length, 1);
    assert.equal(loaded.stats.participation[0].options[1].participants.length, 1);
    const emptyResponse = await submitEmpty({ busy: [], emptyWeek: true }, 'valid');
    assert.equal(emptyResponse.status, 201, await emptyResponse.text());
    const withEmpty = await (await fetch(base + `/api/surveys/admin/${created.adminToken}`)).json();
    assert.equal(withEmpty.submissions.find(s => s.answers[qid]?.emptyWeek)?.answers[qid].emptyWeek, true);
    assert.equal(withEmpty.stats.timetable.availability[0].options[0].free, 1);
    assert.equal(withEmpty.stats.timetable.respondents, 2);
    const exportPath = `/api/surveys/admin/${created.adminToken}/export.csv`;
    const summaryCsv = await (await fetch(base + exportPath)).text();
    assert.ok(summaryCsv.startsWith('"时间段","可参与人员","可参与人数"'));
    const rawCsv = await (await fetch(base + exportPath + '?view=raw')).text();
    assert.ok(rawCsv.startsWith('"填写人"'));
    // Published result uses the same grouping, and edits move people between rows.
    const manual = await (await fetch(base + '/api/surveys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '时间与名单', access: 'open', questions: [{ type: 'short', label: '姓名' }, { type: 'timeslots', label: '活动', options: ['周一 08:00-09:00', '周六 08:00-09:00'] }] }) })).json();
    const [nameQ, slotQ] = manual.survey.questions;
    const identity = 'manual-respondent-regression-12345';
    const first = await (await fetch(base + `/api/surveys/fill/${manual.fillToken}/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Respondent-Token': identity }, body: JSON.stringify({ answers: { [nameQ.id]: '张三', [slotQ.id]: [slotQ.options[0]] } }) })).json();
    const hidden = await (await fetch(base + `/api/surveys/result/${manual.resultToken}`)).json();
    assert.equal(hidden.stats.participation[0].options[0].participants.length, 0);
    await fetch(base + `/api/surveys/admin/${manual.adminToken}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resultsPublished: true }) });
    const resultPath = base + `/api/surveys/result/${manual.resultToken}`;
    const before = await (await fetch(resultPath)).json();
    assert.deepEqual(before.stats.participation[0].options[0].participants.map(m => m.name), ['张三']);
    const edited = await fetch(base + `/api/submissions/${first.id || first.submission?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Respondent-Token': identity }, body: JSON.stringify({ answers: { [nameQ.id]: '李四', [slotQ.id]: [slotQ.options[1]] } }) });
    assert.equal(edited.status, 200, await edited.text());
    const after = await (await fetch(resultPath)).json();
    assert.equal(after.stats.participation[0].options[0].count, 0);
    assert.deepEqual(after.stats.participation[0].options[1].participants.map(m => m.name), ['李四']);
    assert.equal((await fetch(base + `/api/surveys/fill/${created.fillToken}`)).status, 200);
    await stop(); await start('');
    const runtime = await (await fetch(base + '/api/runtime')).json();
    assert.equal(runtime.baseUrl, base);
    const forwarded = await (await fetch(base + '/api/runtime', { headers: { 'X-Forwarded-Host': 'fixed.example.com', 'X-Forwarded-Proto': 'https' } })).json();
    assert.equal(forwarded.baseUrl, 'https://fixed.example.com');
    console.log('PASS: activity matching, assets, QR generation, submissions, address inference and persistent links after server restart');
  } finally {
    await stop();
    if (process.env.JIANJI_TEST_KEEP_DATA !== '1') fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
