/**
 * Google Apps Script: 問い合わせをスプレッドシートに記録し、営業ファネルを可視化する。
 * 使い方:
 *  1. 新しいスプレッドシートを作成 → 拡張機能 → Apps Script → このコードを貼り付け
 *  2. TOKEN を任意の文字列に変更（Vercel の SHEETS_TOKEN と同じ値にする）
 *  3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」/ 実行ユーザー「自分」/ アクセス「全員」→ URLを SHEETS_WEBHOOK_URL に設定
 *  4. 一度 setup() を実行してシートと集計を作る
 */
const TOKEN = 'change-me';
const SHEET = 'リード';
const HEADERS = ['受付日時', '種別', 'お名前', '院名', 'メール', 'TEL', '項目', '診断レベル', 'スコア', '課題', '内容', '希望日時', 'ページ', '参照元', 'ステータス', '担当', 'メモ'];
const STATUSES = ['新規', '連絡済', '相談済', '提案中', '受注', '失注'];

function doPost(e) {
  const d = JSON.parse(e.postData.contents || '{}');
  if (d.token !== TOKEN) return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET) || setup();
  sh.appendRow([d.when, d.type, d.name, d.clinic, d.email, d.tel, d.items, d.level, d.score, d.issue, d.message, d.dates, d.page, d.ref, d.status || '新規', '', '']);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#3b1b1b').setFontColor('#fff'); }
  const col = HEADERS.indexOf('ステータス') + 1;
  sh.getRange(2, col, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
  let f = ss.getSheetByName('ファネル');
  if (!f) {
    f = ss.insertSheet('ファネル');
    const rows = [['ステージ', '件数', '転換率'], ...STATUSES.filter((s) => s !== '失注').map((s, i, arr) => [s, `=COUNTIF(${SHEET}!O:O,"${s}")${i < arr.length - 1 ? `+SUM(B${i + 3}:B${arr.length + 1})` : ''}`, i === 0 ? '' : `=IFERROR(B${i + 2}/B${i + 1},0)`]), ['失注', `=COUNTIF(${SHEET}!O:O,"失注")`, '']];
    f.getRange(1, 1, rows.length, 3).setValues(rows); f.getRange('C2:C7').setNumberFormat('0%');
    f.getRange('E1:G1').setValues([['種別', '件数', '']]);
    f.getRange('E2:F5').setValues([['無料相談', `=COUNTIF(${SHEET}!B:B,"無料相談")`], ['経営力診断', `=COUNTIF(${SHEET}!B:B,"経営力診断")`], ['セミナー申込', `=COUNTIF(${SHEET}!B:B,"セミナー申込")`], ['資料請求', `=COUNTIF(${SHEET}!B:B,"資料請求")`]]);
    f.getRange('I1:J1').setValues([['日付', 'リード数']]);
    f.getRange('I2').setFormula(`=QUERY(ARRAYFORMULA(IF(${SHEET}!A2:A="",,DATEVALUE(LEFT(${SHEET}!A2:A,10)))),"select Col1, count(Col1) where Col1 is not null group by Col1 order by Col1 desc label count(Col1) ''",0)`);
    f.getRange(1, 1, 1, 10).setFontWeight('bold');
  }
  return sh;
}
