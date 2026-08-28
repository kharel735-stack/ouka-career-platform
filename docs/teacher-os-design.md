# OUKA Teacher OS 設計書 v0.2（Phase1簡素化版）

> **本書のステータス**: 設計のみ。実装コードなし。
> **変更禁止範囲**: 既存 School OS（`apps-script/*.gs`）、128日教材本体、既存ホームページ機能は本書では一切変更しません。
> **v0.1からの変更**: Phase1で「毎日教師が使えること」を最優先に、画面・入力・評価項目・新規シートを大幅に簡素化した。v0.1で設計したTeacher Level（T0〜T5）・診断テスト・Skill Matrixの考え方は維持しつつ、日次運用から切り離し、Phase1では最小限の骨組みだけを実装対象とする。

---

## 1. Phase1 最小構成（サマリー）

これがPhase1の全体像。詳細は各章を参照。

| 区分 | 内容 |
|---|---|
| **教師が毎日触る画面（最大4つ）** | ①今日の授業　②授業前確認　③授業後Daily Report　④自分の研修 |
| **日次評価項目（最大5つ）** | 教案準拠度／時間管理／生徒の理解度・反応／クラス運営／自己学習達成度（すべて0〜5） |
| **新規シート（4つ以内）** | `Teacher_Master` / `Teacher_Lesson_Status` / `Teacher_Training_Log` / `Teacher_Daily_Log` |
| **共通キー** | `teacherId` / `studentId` / `lessonId` / `classId` / `sessionId` / `date` |
| **Teacher Level** | 総合能力の目安（T0〜T5）。日次では更新しない。四半期〜半期など節目で確定評価 |
| **Lesson Authorization** | Lesson単位の担当許可。日々の「今日の授業」に出せるかどうかを直接決める |
| **二重入力** | 出席・生徒成績・授業実施時間は既存School OSにあるものを再入力させない。`sessionId`等のキーで参照連携のみ |
| **Phase1で作らないもの** | Skill Matrix全項目（25項目）の常設シート、Teacher Level History専用シート、Assessment Records専用シート、Teacher Development Plan専用シート（すべて `Teacher_Training_Log` に統合、または将来Phase） |

---

## 2. Teacher OS 全体構造（Phase1の位置づけ）

全体パイプライン自体はv0.1のまま維持する（Profile→診断→Level→研修→教案学習→模擬授業→Lesson Authorization→実授業→生徒到達評価→再評価→資格成長）。**Phase1が実装するのは図の中の「教師が毎日触る部分」だけ**であり、Level判定・診断テストの制度設計は据え置いたまま、運用の入り口を小さく作る。

```mermaid
flowchart LR
    subgraph Phase1（今回実装対象）
        D1[今日の授業] --> D2[授業前確認]
        D2 --> D3[実授業]
        D3 --> D4[授業後 Daily Report]
        D5[自分の研修] -.並行して実施.-> D3
    end
    subgraph Phase2以降（今回は設計据え置き）
        P1[Skill Matrix 確定評価]
        P2[Teacher Level 昇格判定]
        P3[診断テスト運用]
        P4[Lesson Authorization
        自動状態遷移]
    end
    D4 --> P1
    D5 --> P1
    P1 --> P2
    P1 --> P4
```

Phase1では、Level判定やLesson Authorizationの状態変更自体は**人（研修責任者）が手動で確定・更新する**運用にとどめ、自動化・厳密な状態機械の実装は行わない。日々のログ（Daily Log / Training Log）はその判断材料として溜まっていく、という位置づけ。

---

## 3. 教師が毎日触る画面（最大4つ）

| # | 画面 | 目的 | 入力/操作 | 表示元データ |
|---|---|---|---|---|
| ① 今日の授業 | 本日担当するLesson・クラスを確認 | なし（表示のみ） | `Teacher_Lesson_Status`（担当可能のみ）＋ School OS側の時間割/クラス編成（参照） |
| ② 授業前確認 | 教案・研修動画の確認完了を記録 | チェック（完了/未完了）1タップ | `Teacher_Lesson_Status` の現在ステータスに応じて「教案確認」または「研修動画視聴」のどちらを出すかを自動判定 |
| ③ 授業後Daily Report | 本日の授業実績・所感を記録（3分想定） | 5項目のうち授業に関する4項目をタップ評価＋自由記述コメント | `Teacher_Daily_Log` に書き込み |
| ④ 自分の研修 | 教師自身の学習タスクを確認・完了報告 | 完了チェック＋学習時間（自己申告） | `Teacher_Training_Log` に書き込み |

**設計原則**

- 4画面以外の「常設の入力画面」はPhase1では作らない。Skill Matrix全体の編集画面、Teacher Level申請画面などはPhase1の対象外（研修責任者が別途手動でシートを更新する運用でカバー）。
- ①は完全に表示のみ（教師の入力ゼロ）。教師が能動的に入力するのは②③④の3箇所、合計でも数タップ＋3分程度のレポート記入に収める。

---

## 4. Teacher LevelとLesson Authorizationの分離

| | Teacher Level（総合能力） | Lesson Authorization（個別授業の担当許可） |
|---|---|---|
| 単位 | 教師1人につき1つ（T0〜T5） | 教師×Lessonの組ごとに1つ |
| 更新頻度 | 節目（四半期〜半期目安）。日次では変えない | 研修進捗に応じて随時（週内でも変わりうる） |
| 何を決めるか | 担当してよい**範囲の上限**（例: T1はN5・初級まで） | その**特定のLesson**を単独で教えてよいかどうか |
| 更新方法 | 研修責任者が診断テスト・実績（Training Log）を見て手動確定 | 研修責任者が動画研修/教案理解度テスト/模擬授業の結果を見て手動更新 |
| Phase1での実装 | `Teacher_Master.currentLevel` フィールド（手動更新） | `Teacher_Lesson_Status` シート（手動更新） |

**ルール（明文化）**

- Teacher Levelが高くても、その教師の`Teacher_Lesson_Status`が該当Lessonで「担当可能」でなければ、「今日の授業」には出さない（一括許可はしない）。
- Lesson Authorizationの状態変化（1つのLessonが担当可能になった等）が、自動的にTeacher Levelを変えることはない。Level変更は別途、研修責任者が総合的に判断する。

---

## 5. 日次評価項目（最大5つ）

Skill Matrix全項目（25項目）を毎日入力させることはしない。教師が③④の画面で日々つける／自動的に記録される評価は次の5項目のみに絞る（すべて0〜5、簡易タップ入力）。

| # | 項目 | 記録元画面 | 対応する能力領域（将来のSkill Matrix集計用） |
|---|---|---|---|
| 1 | 教案準拠度 | ②授業前確認（完了度から自動算出）／③でも補正可 | Teaching Ability（教案理解） |
| 2 | 時間管理 | ③授業後Daily Report | Japan Work Education（時間管理） |
| 3 | 生徒の理解度・反応 | ③授業後Daily Report | Teaching Ability（会話授業・生徒への質問） |
| 4 | クラス運営 | ③授業後Daily Report | Teaching Ability（クラス管理） |
| 5 | 自己学習達成度 | ④自分の研修（完了チェック→スコア化） | 教師自身の成長（資格学習） |

**運用ルール**

- この5項目は**簡易な傾向把握用**。Teacher LevelやLesson Authorizationの正式判定には使わない（正式判定は診断テスト・模擬授業などの公式イベントを使う。v0.1 §7の位置づけを維持し、実施記録は `Teacher_Training_Log` にTEST/MOCK_LESSON種別として記録する）。
- 週次・月次で5項目を単純平均し、研修責任者が「気になる教師」を早期発見するためのシグナルとして使う（自動判定・自動降格などのロジックはPhase1では作らない）。

---

## 6. キー設計（統一）

| キー | 発行元 | 形式（案） | 役割 |
|---|---|---|---|
| `teacherId` | Teacher OS | `OUKA-TCH-0001` | 教師を一意に識別 |
| `studentId` | 既存School OS（Apps Script） | `OUKA-202607-0001` | 生徒を一意に識別。Teacher OSでは**参照のみ**、発行・編集はしない |
| `lessonId` | 128日教材マッピング（Teacher OS側で定義） | `LESSON-D021-02`（Day21のLesson2） | 教材上の1コマを一意に識別 |
| `classId` | 既存School OS側（未整備なら暫定でTeacher OS側発行、要確認） | `CLASS-2026H1-A` | 生徒のクラス（コホート）を一意に識別 |
| `sessionId` | Teacher OS（生成規則） | `SESSION-{classId}-{date}-{lessonId}` | 「いつ・どのクラスに・どのLessonを・誰が教えたか」という**1回の授業実施**を一意に識別。Daily Log/出席参照/成績参照の結節点 |
| `date` | 共通 | `YYYY-MM-DD` | 日次ログの基準日 |

**キーの使い方**

- `sessionId` が Teacher OS と School OS をつなぐ**結節点**になる。Teacher_Daily_Logは`sessionId`をPKにして持ち、School OS側の出席・成績データも同じ`sessionId`（または`classId`+`date`）で引けることを前提にする。
- `classId` が現状School OS側に明文化されていない場合は、Phase1着手前に「クラス編成データがどこにあるか」を確認する必要がある（§9の未確定事項）。

---

## 7. Student OS（既存School OS）との二重入力禁止

| データ項目 | 既存School OSにある想定の場所 | Teacher OSでの扱い |
|---|---|---|
| 出席 | School OS（クラス運営データ、要確認） | Teacher OSでは**入力させない**。`sessionId`で参照表示のみ |
| 生徒成績・到達度 | School OS（Journey等） | 同上。参照表示のみ |
| 授業実施時間（実施有無・時間） | School OS（クラス運営データ、要確認） | 同上。参照表示のみ |
| 生徒の様子・所感（自由記述） | Teacher OS固有 | ③Daily Reportで**新規記録**（School OS側にはない情報のため二重入力にはあたらない） |
| 教師の研修実績・自己学習 | Teacher OS固有 | ④で記録（School OS側にはない） |

**原則**: Teacher OSはSchool OSに**書き込まない**。School OS側のデータは`sessionId`/`classId`/`studentId`/`date`をキーに**参照するだけ**。もし出席・成績・授業実施時間を管理する仕組みが現状School OSに存在しない場合、Phase1ではその項目を「未接続（表示なし）」として空けておき、**Teacher OS側で代わりに入力させることはしない**（存在しないからといって二重入力の抜け道を作らない）。存在箇所の確認は §9 未確定事項。

---

## 8. Phase1 新規シート設計（4つ）

### 8.1 `Teacher_Master`（PK: `teacherId`）

v0.1のTeacher Master項目をそのまま採用し、Teacher Levelを1フィールドとして持たせる（Level履歴の専用シートはPhase1では作らない。Level変更イベントは `Teacher_Training_Log` に記録して代替する）。

| 列 | 内容 |
|---|---|
| `teacherId` | PK |
| 氏名／日本滞在年数／日本での学校／専攻／日本での職歴／日本語教師経験年数／最大担当人数／指導経験レベル／JLPT／JFT／その他資格／得意分野（仮）／現在の目標資格／入社日 | v0.1 §2と同一 |
| `currentLevel` | T0〜T5（現在の確定レベル） |
| `levelUpdatedDate` | 直近のLevel更新日 |

### 8.2 `Teacher_Lesson_Status`（PK: `teacherId` + `lessonId`）

| 列 | 内容 |
|---|---|
| `teacherId` / `lessonId` | PK |
| `status` | `未研修` / `動画研修済` / `テスト合格` / `模擬授業合格` / `担当可能` / `再研修` |
| `statusUpdatedDate` | 更新日 |
| `updatedBy` | 更新した研修責任者 |

### 8.3 `Teacher_Training_Log`（PK: `teacherId` + `logId`）

教師自身の学習実績・診断テスト結果・模擬授業結果・Level変更イベントをすべてこの1シートに集約する（v0.1のDevelopment Plan／Assessment RecordsをPhase1では統合）。

| 列 | 内容 |
|---|---|
| `logId` | 連番 |
| `teacherId` / `date` | 対象教師・日付 |
| `logType` | `STUDY`（自己学習）／`TEST`（診断テスト）／`MOCK_LESSON`（模擬授業）／`LEVEL_CHANGE`（Level変更）／`RETRAINING`（再研修指示） |
| `item` | 内容（例: `JLPT N2文法`, `教案理解度テスト D021-02`, `T1→T2`） |
| `durationMinutes` | 学習時間（STUDYの場合） |
| `result` | 合格/不合格・スコア等（TEST/MOCK_LESSONの場合） |
| `note` | 自由記述 |

### 8.4 `Teacher_Daily_Log`（PK: `teacherId` + `sessionId`）

| 列 | 内容 |
|---|---|
| `teacherId` / `sessionId` | PK |
| `date` / `classId` / `lessonId` | セッション特定用（`sessionId`から導出可能だが検索性のため列としても保持） |
| `preCheckDone` | 授業前確認の完了（Y/N・完了時刻） |
| `score_lessonPrep` | 日次評価①教案準拠度（0〜5） |
| `score_timeManagement` | 日次評価②時間管理（0〜5） |
| `score_studentUnderstanding` | 日次評価③生徒の理解度・反応（0〜5） |
| `score_classManagement` | 日次評価④クラス運営（0〜5） |
| `score_selfStudy` | 日次評価⑤自己学習達成度（0〜5） |
| `dailyReportText` | 自由記述（生徒の様子・困りごと・申し送り） |
| `attendanceRef` / `gradeRef` | School OS側データへの参照キー（`sessionId`等）。Teacher OSでは値を持たず参照のみ |

**Phase1で作らないシート（将来Phase行き）**: `Teacher_Skill_Matrix`（25項目常設シート）、`Teacher_Level_History`（専用履歴）、`Assessment_Records`（専用シート）、`Teacher_Development_Plan`（専用シート）。これらの情報は当面 `Teacher_Training_Log` の `logType`/`item`/`note` で代替する。

---

## 9. Madhu・Shanti 1週間運用例

Teacher Levelは週内では変更しない（節目でのみ確定）。一方でLesson Authorizationは週内でも進捗する、という分離が伝わる例にしている。

### 9.1 Madhu（T2候補、目標 JLPT N2→N1）

| 曜日 | 今日の授業 | 授業前確認 | 自分の研修 | 授業後Daily Report |
|---|---|---|---|---|
| 月 | Day21 Lesson2 | 教案確認 10分 | JLPT N2文法 20分 | 記入3分（理解度◎、時間管理○） |
| 火 | Day21 Lesson3 | 教案確認 10分 | N2語彙 20分 | 記入3分 |
| 水 | Day22 Lesson1（新規Lesson） | Teacher Training Video 15分（D022-01が動画研修済に更新） | N2読解 20分 | 記入3分。放課後、日本語能力確認テスト（§v0.1 7-A）受験→`Teacher_Training_Log`にTEST記録 |
| 木 | Day22 Lesson1（研修責任者同席可） | 教案確認 10分 | N2聴解 20分 | 記入3分。D022-01が教案理解度テスト合格→`テスト合格`に更新 |
| 金 | Day22 Lesson2 | 教案確認 10分 | 模擬授業練習 30分（社内） | 記入3分。水曜のテスト結果を踏まえ、研修責任者がJLPT相当N4以上を確認→**T2confirmed**（`Teacher_Master.currentLevel`更新、`LEVEL_CHANGE`ログ追加） |

### 9.2 Shanti（T1候補、目標 JLPT N2）

| 曜日 | 今日の授業 | 授業前確認 | 自分の研修 | 授業後Daily Report |
|---|---|---|---|---|
| 月 | Day8 Lesson1（担当可能） | 教案確認 10分 | N2語彙 20分 | 記入3分 |
| 火 | Day8 Lesson2（担当可能） | 教案確認 10分 | N2文法 20分 | 記入3分。放課後、Day9 Lesson1の研修動画15分視聴（D009-01が`動画研修済`に更新） |
| 水 | Day9 Lesson1（研修責任者同席・単独不可） | 教案理解度テスト受験（D009-01が`テスト合格`に更新） | N2聴解 20分 | 記入3分（同席者所見も記録） |
| 木 | Day9 Lesson1（模擬授業実施） | 模擬授業評価 | N2読解 20分 | 記入3分。合格によりD009-01が`模擬授業合格`→研修責任者承認で`担当可能`に更新 |
| 金 | Day9 Lesson1（初の単独担当） | 教案確認 10分 | JFT/N2総復習 20分 | 記入3分 |

**この例で示していること**

- Madhuは既存Lessonの継続＋新規Lessonの研修が並行して進み、週末にTeacher Levelが確定する（Lesson Authorizationの進捗とLevel確定は別イベント）。
- Shantiは1つのLesson（D009-01）が「未研修→動画研修済→テスト合格→模擬授業合格→担当可能」と1週間で状態遷移する様子を示している。Teacher Level（T1候補のまま）はこの週では変えていない。
- 出席・生徒成績はどちらの例にも登場しない＝School OS参照のみで、Teacher OS側では入力させていない。

---

## 10. Teacher Master 初期Profile（v0.1から変更なし・再掲）

### Madhu

| 項目 | 値 |
|---|---|
| Teacher ID | `OUKA-TCH-0001` |
| 氏名 | Madhu Neupane |
| 日本滞在年数 | 約10年 |
| 日本での学校 | 日本語学校卒業／日本の大学卒業 |
| 専攻 | Business Management |
| 日本での職歴 | ホテル勤務（スタッフマネジメント経験あり） |
| 日本語教師経験年数 | 約3年 |
| 最大担当人数 | 約20名 |
| 指導経験レベル | N4まで |
| JLPT | 未保有（要受験・確定評価は診断テスト後） |
| JFT／その他資格 | 情報なし（要確認） |
| 現在の目標資格 | JLPT N2 → 将来的にN1 |
| 入社日 | 要確認（TBD） |
| `currentLevel`（初期値） | T2候補（確定はテスト後） |

### Shanti

| 項目 | 値 |
|---|---|
| Teacher ID | `OUKA-TCH-0002` |
| 氏名 | Shanti Paudel |
| 日本滞在年数 | 約4年半 |
| 日本での学校／専攻 | 情報なし（要ヒアリング） |
| 日本での職歴 | コンビニ勤務（接客経験） |
| 日本語教師経験年数 | 約1年 |
| 最大担当人数 | 約10名 |
| 指導経験レベル | N5 |
| JLPT | 情報なし（未保有と推定、要確認） |
| JFT | 合格 |
| 現在の目標資格 | JLPT N2 |
| 入社日 | 要確認（TBD） |
| `currentLevel`（初期値） | T1候補 |

---

## 11. Teacher Level 昇格条件（v0.1から変更なし）

| レベル | 定義 | 担当可能範囲 | 昇格条件（すべて満たす） |
|---|---|---|---|
| T0 Training | 研修中 | 単独授業不可 | — |
| T1 Basic Teacher | 基礎教師 | N5・初級（Lesson Authorization合格分のみ） | 教師研修修了＋教案理解度テスト合格＋模擬授業合格（N5） |
| T2 Standard Teacher | 標準教師 | N4まで | 日本語能力確認テストでN4相当以上確定＋実授業実績＋生徒到達評価が基準以上 |
| T3 Career Teacher | キャリア教師 | 職業日本語・日本文化・面接対策も可 | 日本語能力確認テストN3相当以上＋関連実技合格 |
| T4 Senior Teacher | 指導教師 | 他教師指導可 | T3実績＋指導模擬評価合格 |
| T5 Master Trainer | 教案・研修設計者 | 教案・研修設計に関与可 | T4実績＋教案改善提案の採用実績 |

自動昇格は行わない。判定は`Teacher_Training_Log`に蓄積されたTEST/MOCK_LESSON結果と`Teacher_Daily_Log`の週次・月次ロールアップを根拠に、研修責任者が手動で`Teacher_Master.currentLevel`を更新する。

---

## 12. 診断テスト（v0.1から変更なし、記録先のみ変更）

- 7-A 日本語能力確認テスト／7-B 教授力実技試験（教案理解度テスト＋模擬授業）／7-C 日本職場教育理解度テスト、の3本立てはv0.1のまま。
- Phase1では専用シートを作らず、結果はすべて `Teacher_Training_Log`（`logType = TEST` または `MOCK_LESSON`）に記録する。

---

## 13. Phase2以降に先送りする項目（明示）

- Skill Matrix 25項目の常設シート化・確定評価の項目別管理
- Teacher Level History／Assessment Records／Teacher Development Planの専用シート分離
- Lesson Authorizationの状態遷移の自動化（現状は研修責任者の手動更新）
- 生徒到達評価から教師再評価への自動フィードバックロジック
- 教師公開プロフィール（`teachers.html`）への自動反映

---

## 14. 未確定事項（Phase1着手前に確認）

- `classId` の発行元・既存データの有無（School OS側にクラス編成データが現状あるか）
- 出席・生徒成績・授業実施時間の管理場所（School OS側のどのシート/仕組みか。無ければ整備が先か、Phase1では空欄参照のままにするか）
- 128日教材のLesson一覧の実データ所在（`lessonId`マッピングの元データ）
- Madhu/Shantiの入社日、JFT有無、その他資格、学歴詳細
- 研修責任者・承認者の実運用上の担当者

---

*本書はPhase1向け簡素化版（v0.2）。実装（シート作成、Apps Script追加、UI構築）は本書レビュー後の別フェーズで行う。*
