/**
 * Think Clear, Decide Well - backend (Google Apps Script + Google Sheets)
 * Endpoints (web app /exec URL):
 *   POST  {action:"subscribe", name, email, goal, consent, website}  -> adds a reader to "Subscribers"
 *   POST  {action:"progress", id, skills:{}, stages:{}}              -> upserts anonymous progress in "Progress"
 *   GET   ?action=stats                                              -> {readers, learners}
 * Emails are never returned by any endpoint.
 */
var SHEETS = {
  Subscribers: ["Timestamp", "Name", "Email", "Goal", "Consent"],
  Progress: ["Reader ID", "Updated", "Skills done", "Stages done", "Skills JSON", "Stages JSON"]
};

function setup() {                       // run once from the editor
  Object.keys(SHEETS).forEach(function (n) { sheet_(n); });
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {                // trim, limit length, block spreadsheet formulas
  v = String(v == null ? "" : v).trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse(e.postData.contents);
    if (d.website) return json_({ ok: true });           // honeypot: bots fill this field

    if (d.action === "subscribe") {
      var email = clean_(d.email, 120).toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json_({ ok: false, error: "Invalid email" });
      if (!d.consent) return json_({ ok: false, error: "Consent required" });
      var sh = sheet_("Subscribers");
      var emails = sh.getLastRow() > 1 ? sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues().flat() : [];
      if (emails.indexOf(email) === -1) {
        sh.appendRow([new Date(), clean_(d.name, 80), email, clean_(d.goal, 40), "yes"]);
      }
      return json_({ ok: true });
    }

    if (d.action === "progress") {
      var id = clean_(d.id, 60);
      if (!/^[A-Za-z0-9-]{8,60}$/.test(id)) return json_({ ok: false, error: "Bad id" });
      var skills = d.skills && typeof d.skills === "object" ? d.skills : {};
      var stages = d.stages && typeof d.stages === "object" ? d.stages : {};
      var nS = Object.keys(skills).filter(function (k) { return skills[k]; }).length;
      var nR = Object.keys(stages).filter(function (k) { return stages[k]; }).length;
      var p = sheet_("Progress");
      var ids = p.getLastRow() > 1 ? p.getRange(2, 1, p.getLastRow() - 1, 1).getValues().flat() : [];
      var row = [id, new Date(), nS, nR, JSON.stringify(skills).slice(0, 2000), JSON.stringify(stages).slice(0, 2000)];
      var i = ids.indexOf(id);
      if (i === -1) p.appendRow(row); else p.getRange(i + 2, 1, 1, row.length).setValues([row]);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: "Server error" });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "stats") {
    var s = sheet_("Subscribers"), p = sheet_("Progress");
    return json_({ ok: true, readers: Math.max(0, s.getLastRow() - 1), learners: Math.max(0, p.getLastRow() - 1) });
  }
  return json_({ ok: true, service: "think-clear-decide-well" });
}
