/* student.js -- Student READ-ONLY view model. No network, storage, or write path. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OukaStudent = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var MISSING = '未記録';

  function present(v) { return v !== undefined && v !== null && v !== ''; }
  function rate(v) {
    if (!present(v) || isNaN(Number(v))) return MISSING;
    var n = Number(v);
    if (n >= 0 && n <= 1) n *= 100;
    return Math.round(n) + '%';
  }
  function latestTest(tests) {
    if (!Array.isArray(tests) || !tests.length) return MISSING;
    var t = tests.slice().sort(function (a, b) {
      return String((b || {}).date || '').localeCompare(String((a || {}).date || ''));
    })[0] || {};
    var parts = [];
    if (present(t.date)) parts.push(String(t.date));
    if (present(t.name || t.test_name)) parts.push(String(t.name || t.test_name));
    if (present(t.score)) parts.push(String(t.score) + '点');
    return parts.length ? parts.join(' / ') : MISSING;
  }
  function viewModel(student) {
    var s = student || {};
    var task = s.today_task || {};
    var att = s.attendance_recent || {};
    var hw = s.homework_recent || {};
    var weak = s.weakness || {};
    return {
      todayTask: present(task.lesson_unit) ? String(task.lesson_unit) : MISSING,
      level: present(s.overall_level) ? String(s.overall_level) : MISSING,
      currentDay: MISSING,
      attendance: present(att.rate) ? rate(att.rate) + (present(att.status) ? ' / ' + att.status : '') : MISSING,
      homework: present(hw.last_score) ? '週次宿題スコア ' + String(hw.last_score) + '点' : MISSING,
      latestTest: latestTest(s.tests),
      weakness: present(weak.skill) ? String(weak.skill) : 'まだ判定できる記録がありません',
      learningTime: MISSING,
      nextGoal: present(s.route_track) ? 'ルート ' + String(s.route_track) : MISSING
    };
  }
  return { MISSING: MISSING, viewModel: viewModel, latestTest: latestTest };
});
