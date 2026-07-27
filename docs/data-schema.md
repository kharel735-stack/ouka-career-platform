# データスキーマ（ホームページ → School OS）

ホームページが Apps Script（または Googleフォーム）へ送るデータの一覧です。
職種コードは **英語固定値** を使い、表示名だけ言語で切り替えます。

## 学生申込（formType = `STUDENT_APPLICATION`）

| キー | 例 | 説明 | 発行元 |
|------|----|------|--------|
| `studentId` | `OUKA-202607-0001` | 学生ID | **Apps Script側で発行**（ブラウザでは空） |
| `applicationDate` | `2026-07-17` | 受付日 | ブラウザ |
| `fullName` | ネパール語/英字氏名 | 氏名 | 必須 |
| `fullNameRoman` | `SITA SHARMA` | ローマ字氏名 | |
| `dateOfBirth` | `2004-05-01` | 生年月日 | |
| `age` | `21` | 年齢（生年月日から自動計算） | |
| `gender` | `MALE`/`FEMALE`/`OTHER` | 性別 | |
| `nationality` | `ネパール` | 国籍 | |
| `address` | | 現住所（Slackには送らない） | |
| `phone` | `98…` | 電話 | 必須 |
| `whatsapp` | `977…` | WhatsApp | |
| `email` | | メール | |
| `guardianName` / `guardianPhone` | | 保護者 | |
| `passportStatus` | `HAVE`/`APPLYING`/`NONE` | パスポート（Slackには送らない） | |
| `maritalStatus` | `SINGLE`/`MARRIED`/`OTHER` | 結婚状況 | |
| `education` | `BACHELOR` 等 | 最終学歴 | |
| `major` / `currentJob` / `workExperience` | | 学歴職歴 | |
| `japaneseLevel` | `N5_LEVEL` 等 | 日本語レベル | |
| `jlptStatus` / `jftStatus` | `N4` / `PASSED` 等 | 試験 | |
| `studyHoursPerDay` | `1_2` 等 | 学習時間 | |
| `course` | `CONSTRUCTION_COURSE` 等 | 希望コース | |
| `preferredJob1..3` | 職種コード | 希望職種 | |
| `recommendedJob1..3` | 職種コード | 診断の上位3職種 | 診断結果から |
| `recommendedJob1..3Score` | `82` 等 | 上記スコア（0–100） | 診断結果から |
| `desiredDepartureDate` | `6M` 等 | 希望渡航時期 | |
| `familyConsent` | `YES`/`DISCUSSING`/`NO` | 家族同意 | |
| `interviewRequested` | `YES` | 面談希望 | |
| `interviewMethod` | `VISIT`/`ONLINE` | 面談方法 | |
| `interviewDate` | 自由文 | 希望日時 | |
| `guardianJoin` | `YES`/`NO` | 保護者同席 | |
| `freeNote` | 自由文 | 備考 | |
| `privacyConsent` | `YES` | 個人情報同意 | 必須 |
| `assessmentVersion` | `v1.0` | 診断バージョン | |
| `applicationSource` | `OUKA_WEBSITE` | 流入経路 | |
| `status` | `NEW_APPLICATION` | 初期ステータス | |

## 企業問い合わせ（formType = `COMPANY_INQUIRY`）
`companyName`(必須) / `contactPerson` / `email`(必須) / `phone` / `headcount` / `timing` /
`jobType` / `location` / `jobDescription` / `requiredJapanese` / `requiredSkills` /
`dorm`(YES/NO) / `wantInterview`(YES/NO) / `wantPartnership`(YES/NO) / `message` /
`status`=`NEW_INQUIRY`

## お問い合わせ（formType = `CONTACT`）
`name`(必須) / `email` / `phone` / `inquiryType`(STUDENT/COMPANY/OTHER) /
`message`(必須) / `status`=`NEW_CONTACT`

## 職種コード（固定値）
`CONSTRUCTION` 建設 / `CAREGIVING` 介護 / `AGRICULTURE` 農業 / `FOOD_SERVICE` 外食 /
`HOSPITALITY` 宿泊 / `MANUFACTURING` 製造 / `AUTO_MAINTENANCE` 自動車整備 /
`IT_ENGINEERING` IT・エンジニア / `OFFICE_INTERPRETATION` 事務・通訳 /
`OTHER_CONSULT` その他・要相談

## Slackへ送る項目（安全のため限定）
氏名 / 日本語レベル / 第1希望職種 / 診断第1候補（＋点数）/ 希望渡航時期 /
面談希望 / 電話 / WhatsApp / 受付日時 / Student ID。
**住所・健康情報・パスポート情報は送らない。**
