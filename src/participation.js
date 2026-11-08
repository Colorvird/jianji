'use strict';
const { match } = require('../occupancy');
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function parseSlot(label) {
  const day = /(?:周|星期)\s*([一二三四五六日天])/.exec(label);
  const time = /(\d{1,2})[:：](\d{2})\s*[-–—~～至到]\s*(\d{1,2})[:：](\d{2})/.exec(label);
  if (!day || !time) return null;
  const [, h1, m1, h2, m2] = time.map(Number);
  if (h1 > 23 || h2 > 23 || m1 > 59 || m2 > 59) return null;
  const start = h1 * 60 + m1, end = h2 * 60 + m2;
  if (end <= start) return null;
  return { day: `周${day[1] === '天' ? '日' : day[1]}`, start, end };
}

function buildParticipation(questions, submissions, survey) {
  const timetables = questions.filter(q => q.type === 'timetable');
  return questions.filter(q => q.type === 'timeslots').map(question => {
    const options = question.options.map((label, index) => ({ label, index, window: parseSlot(label) }));
    options.sort((a, b) => a.window && b.window
      ? DAYS.indexOf(a.window.day) - DAYS.indexOf(b.window.day) || a.window.start - b.window.start || a.index - b.index
      : Number(!a.window) - Number(!b.window) || a.index - b.index);
    return {
      questionId: question.id, label: question.label,
      options: options.map(({ label, window }) => {
        const participants = [], conflicts = [], unknown = [];
        let notSelected = 0;
        for (const submission of submissions) {
          const answers = submission.answers || {};
          const selected = Array.isArray(answers[question.id]) ? answers[question.id] : [];
          const supplied = timetables.filter(q => answers[q.id] && Array.isArray(answers[q.id].busy));
          // Explicit choices express willingness; otherwise infer from a supplied timetable.
          if ((selected.length && !selected.includes(label)) || (!selected.length && !supplied.length)) {
            notSelected++;
            continue;
          }
          const member = { id: submission.id, name: submission.name, source: supplied.length ? 'timetable' : 'selected' };
          const checks = timetables.filter(q => q.required || supplied.includes(q)).map(q =>
            survey.timetableMode === 'clock' ? 'unknown' : match(answers[q.id], survey.periodTimes || [], window));
          if (checks.includes('conflict')) conflicts.push(member);
          else if (checks.includes('unknown')) unknown.push(member);
          else participants.push(member);
        }
        return { label, participants, conflicts, unknown, count: participants.length, total: submissions.length, notSelected };
      })
    };
  });
}
module.exports = { buildParticipation, parseSlot };
