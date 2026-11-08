'use strict';
const assert = require('node:assert/strict');
const { buildParticipation, parseSlot } = require('../src/participation');
const mon = '周一 08:00-09:00', sat = '周六 10:00-11:00';
const slot = { id: 'slot', label: '活动', type: 'timeslots', options: [sat, mon, '待定'] };
const timetable = { id: 'tt', type: 'timetable', required: false };
const settings = { periodTimes: [{ start: '08:00', end: '08:45' }] };
const busy = { busy: [{ day: '周一', startPeriod: 1, endPeriod: 1 }] };
const person = (id, name, answers) => ({ id, name, answers });
const records = [
  person('a', '张三', { slot: [mon, mon, sat] }),
  person('b', '李四', { slot: [mon], tt: busy }),
  person('c', '王五', { tt: { busy: [] } }),
  person('d', '张三', { slot: [sat] }), // Same name, different people.
  person('e', '待补全', { tt: { busy: [{ day: '周一', startPeriod: 2, endPeriod: 2 }] } }),
  person('f', '未填写', {}),
];
const rows = buildParticipation([slot, timetable], records, settings)[0].options;
assert.deepEqual(rows.map(row => row.label), [mon, sat, '待定']);
assert.deepEqual(rows[0].participants.map(m => m.id), ['a', 'c']);
assert.deepEqual(rows[0].conflicts.map(m => m.id), ['b']);
assert.deepEqual(rows[0].unknown.map(m => m.id), ['e']);
assert.equal(rows[1].count, 4); // b did not select Saturday, even though no class.
assert.equal(rows[1].participants.filter(m => m.name === '张三').length, 2);
assert.equal(rows[2].participants.length, 0);
assert.equal(rows[2].unknown.length, 2); // Cannot map timetable to an unparseable label.
assert.deepEqual(buildParticipation([slot], [], settings)[0].options.map(r => r.count), [0, 0, 0]);
assert.equal(buildParticipation([slot, { ...timetable, required: true }], [records[0]], settings)[0].options[0].unknown.length, 1);
assert.equal(buildParticipation([slot, timetable], [records[2]], { timetableMode: 'clock' })[0].options[0].unknown.length, 1);
assert.equal(buildParticipation([slot, timetable, { id: 'tt2', type: 'timetable' }], [person('g', '多课表', { tt: { busy: [] }, tt2: busy })], settings)[0].options[0].conflicts.length, 1);
assert.equal(parseSlot('周一 08:70-09:00'), null);
assert.equal(parseSlot('周一 09:00-08:00'), null);
assert.deepEqual(parseSlot('星期天 8：00 至 9：00'), { day: '周日', start: 480, end: 540 });
console.log('PASS: time-first rosters, choices, inferred availability, conflicts, missing data, same names and multiple timetables');
