/**
 * Lead capture for the Token Station Enterprise landing page.
 *
 * The site is static (GitHub Pages), so this Apps Script web app is the whole
 * backend: it appends one row per pilot signup to the spreadsheet it is bound
 * to, and emails a notification so the "we'll be in touch within 48 hours"
 * promise on the page stays keepable.
 *
 * ── Setup (about two minutes, once) ─────────────────────────────────────────
 *  1. Create a Google Sheet (any name). Keep it in a Drive folder your team
 *     can reach.
 *  2. In that Sheet: Extensions → Apps Script. Delete the placeholder code and
 *     paste this file in. The script must be created from the Sheet, so that
 *     SpreadsheetApp.getActive() below resolves without an ID.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as:      Me
 *       Who has access:  Anyone            ← required; "Anyone with Google
 *                                             account" blocks the landing page
 *  4. Authorize when prompted (it needs Sheets + Gmail scopes for the notify
 *     mail). Copy the /exec URL it hands back.
 *  5. Put that URL in LEAD_ENDPOINT in enterprise.html. Until it is set, the
 *     page's forms fall back to a prefilled mailto so no lead is lost.
 *
 * Re-deploying after an edit: Deploy → Manage deployments → edit the existing
 * deployment and pick a new version, which keeps the same /exec URL. Creating
 * a *new* deployment mints a different URL and the page would keep posting to
 * the old one.
 *
 * ── Notes ───────────────────────────────────────────────────────────────────
 *  - The page posts as text/plain on purpose. It is a CORS-safelisted content
 *    type, so the browser sends no preflight, which Apps Script cannot answer.
 *    The body is still JSON; doPost parses it out of e.postData.contents.
 *  - Two posts make up one lead: the email form appends a row, then the
 *    second-step form on /enterprise-thanks.html posts mode:'update', which
 *    fills the blank qualification cells on that same row. Running an older
 *    copy of this file is harmless, just untidy: it ignores mode and the
 *    second step lands as its own row.
 *  - Every row is appended, including repeat submissions from the same address.
 *    A resubmit is signal, not noise; dedupe when you read the sheet.
 *  - The endpoint URL is public in the page source, so treat this as an
 *    untrusted input: PAYLOAD_LIMIT, the honeypot and the email check below are
 *    the whole spam story. If it does get abused, the cheap fix is to rotate
 *    the deployment URL.
 */

const SHEET_NAME = 'leads';

/** Where to send the "new pilot signup" notice. Set to '' to stop the emails. */
const NOTIFY_EMAIL = 'team@bytefuture.ai';

/** Reject bodies larger than this many characters before doing any work. */
const PAYLOAD_LIMIT = 8000;

/** Column order in the sheet. Append new fields at the end, never reorder. */
const COLUMNS = [
  'timestamp',
  'email',
  'plan',          // on-prem | cloud | '' (which pricing card, if any)
  'form',          // hero | pricing | final | thanks
  'company_size',
  'role',
  'vendors',
  'seats',
  'company',
  'notes',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'li_fat_id',
  'page',
  'referrer',
  'user_agent',
  'updated_at',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > PAYLOAD_LIMIT) {
      return json({ ok: false, error: 'bad_request' });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      return json({ ok: false, error: 'bad_json' });
    }

    // Honeypot: a real person never fills this, bots fill every field.
    if (body._gotcha) {
      return json({ ok: true, skipped: true });
    }

    const email = String(body.email || '').trim();
    if (!isEmail(email)) {
      return json({ ok: false, error: 'bad_email' });
    }

    lock.waitLock(20000);

    const sheet = getSheet();
    const record = {
      timestamp: new Date(),
      email: email,
      plan: str(body.plan),
      form: str(body.form),
      company_size: str(body.company_size),
      role: str(body.role),
      vendors: Array.isArray(body.vendors) ? body.vendors.join(', ') : str(body.vendors),
      seats: str(body.seats),
      company: str(body.company),
      notes: str(body.notes),
      utm_source: str(body.utm_source),
      utm_medium: str(body.utm_medium),
      utm_campaign: str(body.utm_campaign),
      utm_content: str(body.utm_content),
      li_fat_id: str(body.li_fat_id),
      page: str(body.page),
      referrer: str(body.referrer),
      user_agent: str(body.user_agent),
      updated_at: '',
    };

    // The landing page posts twice per lead: the email form appends a row, then
    // the second-step form on the thank-you page sends mode:'update' to fill in
    // the qualification fields on that same row.
    const result = body.mode === 'update' ? upsert(sheet, record) : append(sheet, record);
    notify(record, result);

    return json({ ok: true, updated: result.updated });
  } catch (err) {
    // Log to the Apps Script execution log; never leak internals to the page.
    console.error(err);
    return json({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function append(sheet, record) {
  sheet.appendRow(COLUMNS.map(function (key) { return record[key]; }));
  return { row: sheet.getLastRow(), updated: false };
}

/**
 * Fill blanks on this address's most recent row instead of adding a second one,
 * so one lead stays one row. Falls back to appending when the address has no
 * row yet, which is what happens if someone opens the thank-you page directly.
 * Only blank cells are written, so a second step can never erase step one.
 */
function upsert(sheet, record) {
  const lastRow = sheet.getLastRow();
  const emailCol = COLUMNS.indexOf('email') + 1;
  if (lastRow > 1) {
    const emails = sheet.getRange(2, emailCol, lastRow - 1, 1).getValues();
    const target = record.email.toLowerCase();
    for (let i = emails.length - 1; i >= 0; i--) {
      if (String(emails[i][0]).trim().toLowerCase() !== target) continue;
      const rowIndex = i + 2;
      const range = sheet.getRange(rowIndex, 1, 1, COLUMNS.length);
      const existing = range.getValues()[0];
      const merged = COLUMNS.map(function (key, c) {
        if (key === 'timestamp') return existing[c];
        if (key === 'updated_at') return new Date();
        const incoming = record[key];
        if (incoming === '' || incoming === null || incoming === undefined) return existing[c];
        return incoming;
      });
      range.setValues([merged]);
      return { row: rowIndex, updated: true };
    }
  }
  return append(sheet, record);
}

/** Liveness check, so the deployment can be verified without writing a row. */
function doGet() {
  return json({ ok: true, service: 'bytefuture-leads' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    return sheet;
  }
  // A sheet created by an older version of this script is missing any columns
  // added since. Extend the header rather than rewrite it, so existing data
  // stays put.
  const width = sheet.getLastColumn();
  if (width < COLUMNS.length) {
    const missing = COLUMNS.slice(width);
    sheet.getRange(1, width + 1, 1, missing.length)
      .setValues([missing])
      .setFontWeight('bold');
  }
  return sheet;
}

function notify(record, result) {
  if (!NOTIFY_EMAIL) return;
  try {
    const lines = COLUMNS.map(function (key) {
      return key + ': ' + (record[key] || '');
    });
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: (result && result.updated ? 'Pilot signup details: ' : 'Pilot signup: ') + record.email,
      body: lines.join('\n')
        + '\n\nRow ' + (result ? result.row : '?')
        + ' in ' + SpreadsheetApp.getActive().getUrl(),
    });
  } catch (err) {
    // A blocked or over-quota notification must never fail the signup itself.
    console.error(err);
  }
}

function isEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function str(value) {
  if (value === null || value === undefined) return '';
  return String(value).slice(0, 500);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
