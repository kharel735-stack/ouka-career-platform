/*******************************************************************************
 * SheetMapper.gs  ―  受信データ → Google Sheets の列マッピング
 * -----------------------------------------------------------------------------
 * ・「桜花_管理表」の実際の列名が違っても、ここの map を直すだけで対応できます。
 * ・各シートは headers（列の並び）を持ちます。シートが空なら1行目に自動で書きます。
 * ・map(data, ctx) は { 列名: 値 } を返します（ctx.studentId など）。
 *******************************************************************************/

/* Student Master（学生マスタ） */
var MAP_STUDENT_MASTER = {
  sheet: SHEET_NAMES.studentMaster,
  headers: [
    'Student ID','受付日','氏名','ローマ字氏名','生年月日','年齢','性別',
    '電話','WhatsApp','メール','住所','保護者','日本語レベル','学歴','職歴',
    '希望職種','推薦職種','適性スコア','希望渡航時期','面談希望','ステータス',
    '流入経路','担当者','次回対応日','備考'
  ],
  map: function (d, ctx) {
    return {
      'Student ID': ctx.studentId,
      '受付日': d.applicationDate || ctx.today,
      '氏名': d.fullName || '',
      'ローマ字氏名': d.fullNameRoman || '',
      '生年月日': d.dateOfBirth || '',
      '年齢': d.age || '',
      '性別': d.gender || '',
      '電話': d.phone || '',
      'WhatsApp': d.whatsapp || '',
      'メール': d.email || '',
      '住所': d.address || '',
      '保護者': [d.guardianName, d.guardianPhone].filter(String).join(' / '),
      '日本語レベル': d.japaneseLevel || '',
      '学歴': d.education || '',
      '職歴': d.workExperience || d.currentJob || '',
      '希望職種': [d.preferredJob1, d.preferredJob2, d.preferredJob3].filter(String).join(', '),
      '推薦職種': [d.recommendedJob1, d.recommendedJob2, d.recommendedJob3].filter(String).join(', '),
      '適性スコア': [d.recommendedJob1Score, d.recommendedJob2Score, d.recommendedJob3Score].filter(function(x){return x!=='';}).join(', '),
      '希望渡航時期': d.desiredDepartureDate || '',
      '面談希望': d.interviewRequested || '',
      'ステータス': d.status || 'NEW_APPLICATION',
      '流入経路': d.applicationSource || 'OUKA_WEBSITE',
      '担当者': '',
      '次回対応日': '',
      '備考': d.freeNote || ''
    };
  }
};

/* Journey（学生の進捗ステージ） */
var MAP_JOURNEY = {
  sheet: SHEET_NAMES.journey,
  headers: ['Student ID','氏名','ステージ','更新日','メモ'],
  map: function (d, ctx) {
    return {
      'Student ID': ctx.studentId,
      '氏名': d.fullName || '',
      'ステージ': 'APPLICATION',
      '更新日': ctx.today,
      'メモ': 'Webサイトから申込 / ' + (d.course || '')
    };
  }
};

/* Interview & Matching（面談・マッチング） */
var MAP_INTERVIEW = {
  sheet: SHEET_NAMES.interviewMatching,
  headers: ['Student ID','氏名','面談希望','面談方法','希望日時','保護者同席','第1希望職種','推薦職種1','ステータス','担当者'],
  map: function (d, ctx) {
    return {
      'Student ID': ctx.studentId,
      '氏名': d.fullName || '',
      '面談希望': d.interviewRequested || '',
      '面談方法': d.interviewMethod || '',
      '希望日時': d.interviewDate || '',
      '保護者同席': d.guardianJoin || '',
      '第1希望職種': d.preferredJob1 || '',
      '推薦職種1': d.recommendedJob1 || '',
      'ステータス': 'TO_CONTACT',
      '担当者': ''
    };
  }
};

/* Company Inquiries（企業問い合わせ） */
var MAP_COMPANY = {
  sheet: SHEET_NAMES.companyInquiry,
  headers: ['受付日','会社名','担当者','メール','電話','採用予定人数','採用時期','職種','勤務地','仕事内容','必要日本語','必要技能','寮','面接希望','提携希望','要望','ステータス'],
  map: function (d, ctx) {
    return {
      '受付日': d.applicationDate || ctx.today,
      '会社名': d.companyName || '',
      '担当者': d.contactPerson || '',
      'メール': d.email || '',
      '電話': d.phone || '',
      '採用予定人数': d.headcount || '',
      '採用時期': d.timing || '',
      '職種': d.jobType || '',
      '勤務地': d.location || '',
      '仕事内容': d.jobDescription || '',
      '必要日本語': d.requiredJapanese || '',
      '必要技能': d.requiredSkills || '',
      '寮': d.dorm || '',
      '面接希望': d.wantInterview || '',
      '提携希望': d.wantPartnership || '',
      '要望': d.message || '',
      'ステータス': d.status || 'NEW_INQUIRY'
    };
  }
};

/* Contacts（お問い合わせ） */
var MAP_CONTACT = {
  sheet: SHEET_NAMES.contact,
  headers: ['受付日','お名前','メール','電話','種別','内容','ステータス'],
  map: function (d, ctx) {
    return {
      '受付日': d.applicationDate || ctx.today,
      'お名前': d.name || '',
      'メール': d.email || '',
      '電話': d.phone || '',
      '種別': d.inquiryType || '',
      '内容': d.message || '',
      'ステータス': d.status || 'NEW_CONTACT'
    };
  }
};

/* Partner Inquiries（提携・送り出し機関の連携相談） */
var MAP_PARTNER = {
  sheet: SHEET_NAMES.partnerInquiry,
  headers: ['受付日','機関・会社名','国・地域','担当者','種別','メール','電話','内容','ステータス'],
  map: function (d, ctx) {
    return {
      '受付日': d.applicationDate || ctx.today,
      '機関・会社名': d.orgName || '',
      '国・地域': d.country || '',
      '担当者': d.contactPerson || '',
      '種別': d.partnerType || '',
      'メール': d.email || '',
      '電話': d.phone || '',
      '内容': d.message || '',
      'ステータス': d.status || 'NEW_PARTNER'
    };
  }
};

/* 共通：1件を該当シートへ追記（ヘッダーが無ければ作る） */
function appendToSheet_(spreadsheet, mapping, data, ctx) {
  var sheet = spreadsheet.getSheetByName(mapping.sheet);
  if (!sheet) sheet = spreadsheet.insertSheet(mapping.sheet);

  // ヘッダー行を用意
  var lastCol = sheet.getLastColumn();
  var headers;
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    headers = mapping.headers.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    // マッピングに有るが見出しに無い列は末尾に追加
    mapping.headers.forEach(function (h) {
      if (headers.indexOf(h) < 0) { headers.push(h); sheet.getRange(1, headers.length).setValue(h); }
    });
  }

  var rowObj = mapping.map(data, ctx);
  var row = headers.map(function (h) { return (rowObj[h] !== undefined ? rowObj[h] : ''); });
  sheet.appendRow(row);
  return true;
}
