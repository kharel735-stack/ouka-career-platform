/* workflow.js — Teacher Daily Workflow のロジック（画面から独立）
 *
 * CEO決定 2026-09-08（第4回）:
 *   3画面に分けず「今日の授業確認 → 出席 → 授業結果 → 日報 → 確認 → 送信 → 完了」を1画面で。
 *   開発中は TEST データのみ。実学生への LIVE Write は禁止。
 *
 * ここには DOM もネットワークも入れない。だから node でそのまま検証できる。
 * ブラウザでは window.OukaWorkflow、node では module.exports で使う。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OukaWorkflow = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* School OS の実際の列名。★1文字でも違うと Write Layer が落とす。 */
  var COL = {
    att:  { date: '日付', id: '生徒ID', name: '氏名',
            am: '午前(出/遅/欠)', pm: '午後(出/遅/欠)', late: '遅刻分',
            reason: '欠席理由', contact: '連絡有無', handler: '対応者', note: '備考' },
    les:  { date: '日付', dow: '曜日', klass: 'クラス', subject: '科目', teacher: '担当教師',
            range: '範囲(課/テーマ)', present: '出席人数', absentIds: '欠席者ID',
            lateIds: '遅刻者ID', homework: '宿題提出数', quiz: '小テスト平均', note: '特記事項' },
    rep:  { date: '日付', type: '種別', name: '氏名', role: '役割',
            what: '①何をした', why: '②なぜそうした', result: '③結果',
            reflect: '④反省', improve: '⑤改善案' }
  };

  var STEPS = ['today', 'attendance', 'lesson', 'report', 'confirm', 'send', 'done'];
  var MARK = { present: '出', late: '遅', absent: '欠' };
  var ATT_VALUES = ['出', '遅', '欠'];
  var DOW = ['日', '月', '火', '水', '木', '金', '土'];
  var TEST_PREFIX = 'TEST-';

  /* 教師の日報（紙25番）にあって School OS の列に無い項目は、
     ①機械が読む正本＝TEACHER_DAILY（OUKA_APP_OPERATION）に構造化して入れ、
     ②School OS の自由記述欄にも人が読める形で残す。
     ★School OS に列を足さない（CEO決定 F-1）／自由記述だけに依存しない（P-2）。 */
  var TAG = { steps: '未実施9ステップ:', action: 'ACTION達成:', over: '時間超過(分):',
              day: 'Day:', rounds: '発話ラウンド:' };

  /* TEACHER_DAILY（OUKA_APP_OPERATION）＝ Web App 固有の
     Teacher Daily Operational Data の Source of Truth。
     ★1文字でも違うと Operation Layer が落とす。 */
  var DAILY = ['date', 'teacher_id', 'class', 'planned_day', 'actual_day',
               'action_completed', 'uncompleted_steps', 'overtime_minutes',
               'speaking_rounds', 'note', 'write_id', 'created_at'];

  /* ------------------------------------------------------------ 小道具 */

  function trim(v) { return String(v === undefined || v === null ? '' : v).replace(/^\s+|\s+$/g, ''); }
  function isDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(trim(v)); }
  function isNum(v) { var s = trim(v); return s !== '' && !isNaN(Number(s)); }
  function isTest(v) { return trim(v).indexOf(TEST_PREFIX) === 0; }

  function dowOf(ymd) {
    if (!isDate(ymd)) return '';
    var p = ymd.split('-');
    return DOW[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()];
  }

  /* S-0001 のような書き方を見つけたら、正しい形を教える（勝手に直さない）。 */
  function idHint(id) {
    var s = trim(id);
    var m = /^[Ss][-_ ]0*(\d+)$/.exec(s);
    if (!m) return '';
    return s + ' は School OS の書き方ではありません。S' + ('00' + m[1]).slice(-3) + ' が正です。';
  }

  /* ------------------------------------------------------------ 名簿 */

  /* 名簿の正本は APP_CLASS_ROSTER（OUKA_APP_OPERATION）＝
     Phase1 Teacher Assignment / Display Source of Truth。
     ★Student Master ではない。生徒情報の Source of Truth は School OS のまま。
     ★端末に持つのは、通信できないときの下書きだけ（CEO決定 P-1）。 */
  function rosterFromServer(list) {
    var out = [];
    (list || []).forEach(function (x) {
      var id = trim(x && x.student_id);
      if (id) out.push({ id: id, name: trim(x.display_name) });
    });
    return out;
  }
  function addToRoster(roster, entry) {
    var id = trim(entry && entry.id);
    if (!id) return { ok: false, error: '生徒IDを入れてください' };
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].id === id) return { ok: false, error: id + ' はすでにあります' };
    }
    var next = roster.concat([{ id: id, name: trim(entry.name) }]);
    return { ok: true, roster: next, hint: idHint(id) };
  }

  function removeFromRoster(roster, id) {
    return roster.filter(function (r) { return r.id !== trim(id); });
  }

  /* ------------------------------------------------------------ 検証 */

  function validateToday(s) {
    var e = [];
    if (!isDate(s.date)) e.push('日付が YYYY-MM-DD ではありません');
    if (!trim(s.klass)) e.push('クラスを入れてください');
    if (!trim(s.actualDay)) e.push('今日どのDayを実施したかを入れてください');
    return e;
  }

  function validateAttendance(s) {
    var e = [], seen = {};
    if (!s.roster.length) return ['出席をとる生徒が1人もいません'];
    for (var i = 0; i < s.roster.length; i++) {
      var id = s.roster[i].id, a = s.attendance[id] || {};
      if (seen[id]) e.push(id + ' が重複しています');
      seen[id] = true;
      if (ATT_VALUES.indexOf(trim(a.am)) < 0) e.push(id + ' の午前が未入力です');
      if (ATT_VALUES.indexOf(trim(a.pm)) < 0) e.push(id + ' の午後が未入力です');
      if (trim(a.late) !== '' && !isNum(a.late)) e.push(id + ' の遅刻分が数字ではありません');
      if ((trim(a.am) === MARK.absent || trim(a.pm) === MARK.absent) && !trim(a.reason)) {
        e.push(id + ' は欠席の理由が要ります');
      }
    }
    return e;
  }

  function validateLesson(s) {
    var e = [];
    if (!trim(s.lesson.subject)) e.push('科目を入れてください');
    /* ★発話は1人ずつ数えない。「全員が最低1回話した」を1ラウンドとして整数1つだけ。 */
    if (trim(s.lesson.speakingRounds) === '') e.push('発話ラウンドを入れてください（全員が1回ずつ話せたら1）');
    else if (!/^\d+$/.test(trim(s.lesson.speakingRounds))) e.push('発話ラウンドは0以上の整数です');
    if (trim(s.lesson.homework) !== '' && !isNum(s.lesson.homework)) e.push('宿題提出数が数字ではありません');
    if (trim(s.lesson.quiz) !== '' && !isNum(s.lesson.quiz)) e.push('小テスト平均が数字ではありません');
    if (trim(s.lesson.overtime) !== '' && !isNum(s.lesson.overtime)) e.push('時間超過が数字ではありません');
    return e;
  }

  function validateReport(s) {
    var e = [];
    if (!trim(s.report.teacherName)) e.push('日報の氏名を入れてください');
    if (!trim(s.report.what)) e.push('①何をした を書いてください');
    if (!trim(s.report.result)) e.push('③結果 を書いてください');
    if (s.report.actionAchieved !== true && s.report.actionAchieved !== false) {
      e.push('ACTION（その日のうちに日本語を使わせたか）を選んでください');
    }
    return e;
  }

  var VALIDATORS = { today: validateToday, attendance: validateAttendance,
                     lesson: validateLesson, report: validateReport };

  function validateStep(step, s) {
    var f = VALIDATORS[step];
    return f ? f(s) : [];
  }

  /* 送信できるのは、入力4段がすべて通ったときだけ。 */
  function validateAll(s) {
    var out = [];
    ['today', 'attendance', 'lesson', 'report'].forEach(function (k) {
      validateStep(k, s).forEach(function (m) { out.push(m); });
    });
    modeErrors(s).forEach(function (m) { out.push(m); });
    return out;
  }

  /* ------------------------------------------------------- TEST / LIVE */

  /* Write Layer と同じ規則をクライアントでも先に当てて、往復する前に気づけるようにする。
     ★サーバー側の判定が本番。ここは早く教えるためだけのもの。 */
  function modeErrors(s) {
    var e = [], mode = s.mode === 'TEST' ? 'TEST' : 'LIVE';
    var ids = s.roster.map(function (r) { return r.id; });
    var marked = ids.filter(isTest), plain = ids.filter(function (x) { return !isTest(x); });

    if (mode === 'TEST') {
      if (plain.length) e.push('TESTモードでは生徒IDを ' + TEST_PREFIX + ' で始めてください: ' + plain.join(' , '));
      if (!isTest(s.klass)) e.push('TESTモードではクラスも ' + TEST_PREFIX + ' で始めてください');
      if (!isTest(s.report.teacherName)) e.push('TESTモードでは日報の氏名も ' + TEST_PREFIX + ' で始めてください');
    } else {
      if (marked.length) e.push('LIVEモードに ' + TEST_PREFIX + ' の生徒が混ざっています: ' + marked.join(' , '));
      if (isTest(s.klass)) e.push('LIVEモードのクラス名が ' + TEST_PREFIX + ' で始まっています');
      if (isTest(s.report.teacherName)) e.push('LIVEモードの日報氏名が ' + TEST_PREFIX + ' で始まっています');
    }
    return e;
  }

  /* ------------------------------------------------------------ 集計 */

  function tally(s) {
    var present = 0, absent = [], late = [];
    s.roster.forEach(function (r) {
      var a = s.attendance[r.id] || {};
      var am = trim(a.am), pm = trim(a.pm);
      if (am !== MARK.absent || pm !== MARK.absent) present++;
      if (am === MARK.absent && pm === MARK.absent) absent.push(r.id);
      if (am === MARK.late || pm === MARK.late) late.push(r.id);
    });
    return { total: s.roster.length, present: present, absent: absent, late: late };
  }

  /* ------------------------------------------------------------ 送信物 */

  function buildAttendanceRows(s) {
    return s.roster.map(function (r) {
      var a = s.attendance[r.id] || {}, row = {};
      row[COL.att.date] = trim(s.date);
      row[COL.att.id] = r.id;
      if (trim(r.name)) row[COL.att.name] = trim(r.name);
      row[COL.att.am] = trim(a.am);
      row[COL.att.pm] = trim(a.pm);
      if (trim(a.late) !== '') row[COL.att.late] = Number(trim(a.late));
      if (trim(a.reason)) row[COL.att.reason] = trim(a.reason);
      if (trim(a.contact)) row[COL.att.contact] = trim(a.contact);
      if (trim(s.report.teacherName)) row[COL.att.handler] = trim(s.report.teacherName);
      if (trim(a.note)) row[COL.att.note] = trim(a.note);
      return row;
    });
  }

  function buildLessonRow(s) {
    var t = tally(s), row = {};
    var notes = [];
    if (trim(s.lesson.overtime) !== '') notes.push(TAG.over + trim(s.lesson.overtime));
    if (trim(s.lesson.speakingRounds) !== '') notes.push(TAG.rounds + trim(s.lesson.speakingRounds));
    if (s.lesson.missingSteps && s.lesson.missingSteps.length) {
      notes.push(TAG.steps + s.lesson.missingSteps.join('/'));
    }
    if (trim(s.lesson.note)) notes.push(trim(s.lesson.note));

    row[COL.les.date] = trim(s.date);
    row[COL.les.dow] = dowOf(s.date);
    row[COL.les.klass] = trim(s.klass);
    row[COL.les.subject] = trim(s.lesson.subject);
    if (trim(s.report.teacherName)) row[COL.les.teacher] = trim(s.report.teacherName);
    row[COL.les.range] = TAG.day + trim(s.actualDay) +
      (trim(s.lesson.range) ? ' ' + trim(s.lesson.range) : '');
    row[COL.les.present] = t.present;
    if (t.absent.length) row[COL.les.absentIds] = t.absent.join(',');
    if (t.late.length) row[COL.les.lateIds] = t.late.join(',');
    if (trim(s.lesson.homework) !== '') row[COL.les.homework] = Number(trim(s.lesson.homework));
    if (trim(s.lesson.quiz) !== '') row[COL.les.quiz] = Number(trim(s.lesson.quiz));
    if (notes.length) row[COL.les.note] = notes.join(' / ');
    return row;
  }

  function buildReportRow(s) {
    var row = {};
    row[COL.rep.date] = trim(s.date);
    row[COL.rep.type] = '日次';
    row[COL.rep.name] = trim(s.report.teacherName);
    row[COL.rep.role] = trim(s.report.role) || '教師';
    row[COL.rep.what] = TAG.day + trim(s.actualDay) + ' ' + trim(s.report.what);
    if (trim(s.report.why)) row[COL.rep.why] = trim(s.report.why);
    row[COL.rep.result] = TAG.action + (s.report.actionAchieved ? 'はい' : 'いいえ') +
      ' ' + trim(s.report.result);
    if (trim(s.report.reflect)) row[COL.rep.reflect] = trim(s.report.reflect);
    if (trim(s.report.improve)) row[COL.rep.improve] = trim(s.report.improve);
    return row;
  }

  /* 何度送り直しても同じ値になる。APP_WRITE_LOG のクライアント欄にも入るので、
     School OS 側の3行と TEACHER_DAILY の1行を後から突き合わせられる。 */
  function writeId(s) {
    return 'W-' + trim(s.date) + '-' + trim(s.klass);
  }

  /* 機械が読む正本。9ステップ・ACTION・時間超過・発話ラウンドはここに構造化して入る。 */
  function buildDailyRow(s) {
    return {
      date: trim(s.date),
      teacher_id: trim(s.teacherId),
      'class': trim(s.klass),
      planned_day: trim(s.plannedDay),
      actual_day: trim(s.actualDay),
      action_completed: s.report.actionAchieved === true,
      uncompleted_steps: (s.lesson.missingSteps || []).slice(),
      overtime_minutes: trim(s.lesson.overtime),
      speaking_rounds: trim(s.lesson.speakingRounds),
      note: trim(s.lesson.note),
      write_id: writeId(s)
    };
  }

  /* 送る順番は 出席 → 授業結果 → 日報 → 教師日次。前が失敗したら次へ進まない。 */
  function buildBatches(s) {
    var mode = s.mode === 'TEST' ? 'TEST' : 'LIVE';
    return [
      { op: 'attendance',    mode: mode, rows: buildAttendanceRows(s), label: '出席' },
      { op: 'lesson_log',    mode: mode, rows: [buildLessonRow(s)],    label: '授業結果' },
      { op: 'daily_report',  mode: mode, rows: [buildReportRow(s)],    label: '日報' },
      { op: 'teacher_daily', mode: mode, rows: [buildDailyRow(s)],     label: '記録（集計用）' }
    ];
  }

  /* ------------------------------------------------------------ 手順 */

  function canAdvance(step, s) {
    if (STEPS.indexOf(step) < 0) return { ok: false, errors: ['不明な手順です'] };
    var e = validateStep(step, s);
    if (step === 'confirm') e = validateAll(s);
    return { ok: e.length === 0, errors: e };
  }

  function nextStep(step) {
    var i = STEPS.indexOf(step);
    return (i < 0 || i === STEPS.length - 1) ? step : STEPS[i + 1];
  }
  function prevStep(step) {
    var i = STEPS.indexOf(step);
    return i <= 0 ? STEPS[0] : STEPS[i - 1];
  }

  /* 確認画面に出す要約。ここで初めて教師が全部を一度に見る。 */
  function summary(s) {
    var t = tally(s);
    return {
      mode: s.mode === 'TEST' ? 'TEST' : 'LIVE',
      date: trim(s.date), dow: dowOf(s.date), klass: trim(s.klass),
      actual_day: trim(s.actualDay), planned_day: trim(s.plannedDay),
      day_gap: (trim(s.actualDay) && trim(s.plannedDay) && trim(s.actualDay) !== trim(s.plannedDay)),
      students: t.total, present: t.present,
      absent: t.absent.length, late: t.late.length,
      subject: trim(s.lesson.subject),
      homework: trim(s.lesson.homework), quiz: trim(s.lesson.quiz),
      overtime: trim(s.lesson.overtime),
      speaking_rounds: trim(s.lesson.speakingRounds),
      missing_steps: (s.lesson.missingSteps || []).slice(),
      action_achieved: s.report.actionAchieved === true,
      write_id: writeId(s),
      rows: { attendance: t.total, lesson_log: 1, daily_report: 1, teacher_daily: 1 }
    };
  }

  /* 送信結果のまとめ。DUPLICATE は失敗ではない（もう入っている）。 */
  function digest(results) {
    var n = { APPENDED: 0, DUPLICATE: 0, REJECTED: 0 }, failed = [];
    results.forEach(function (r) {
      if (!r.ok) { failed.push({ label: r.label, error: r.error, message: r.message }); return; }
      (r.results || []).forEach(function (x) { n[x.status] = (n[x.status] || 0) + 1; });
    });
    return {
      ok: failed.length === 0 && n.REJECTED === 0,
      appended: n.APPENDED, duplicate: n.DUPLICATE, rejected: n.REJECTED,
      failed: failed,
      message: failed.length ? '送信できなかったものがあります'
        : n.REJECTED ? '受け付けられなかった行があります'
        : n.APPENDED ? '今日の記録を保存しました'
        : '同じ内容がすでに入っています'
    };
  }

  function emptyState(today) {
    return {
      mode: 'LIVE', date: today || '', klass: '', actualDay: '', plannedDay: '', teacherId: '',
      roster: [], rosterSource: 'none', attendance: {},
      lesson: { subject: '日本語', range: '', homework: '', quiz: '', overtime: '',
                speakingRounds: '', note: '', missingSteps: [] },
      report: { teacherName: '', role: '教師', what: '', why: '', result: '',
                reflect: '', improve: '', actionAchieved: null }
    };
  }

  return {
    COL: COL, STEPS: STEPS, MARK: MARK, ATT_VALUES: ATT_VALUES, TEST_PREFIX: TEST_PREFIX, TAG: TAG,
    DAILY: DAILY,
    trim: trim, isDate: isDate, isTest: isTest, dowOf: dowOf, idHint: idHint,
    rosterFromServer: rosterFromServer,
    addToRoster: addToRoster, removeFromRoster: removeFromRoster,
    writeId: writeId, buildDailyRow: buildDailyRow,
    validateStep: validateStep, validateAll: validateAll, modeErrors: modeErrors,
    tally: tally, buildAttendanceRows: buildAttendanceRows, buildLessonRow: buildLessonRow,
    buildReportRow: buildReportRow, buildBatches: buildBatches,
    canAdvance: canAdvance, nextStep: nextStep, prevStep: prevStep,
    summary: summary, digest: digest, emptyState: emptyState
  };
}));
