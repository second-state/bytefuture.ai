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
 *  - COLUMNS already carries the qualification fields (company size, role,
 *    vendors, seats). They stay blank until the second-step form is added, and
 *    adding it then needs no change here.
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
    };

    sheet.appendRow(COLUMNS.map(function (key) { return record[key]; }));
    notify(record);

    return json({ ok: true });
  } catch (err) {
    // Log to the Apps Script execution log; never leak internals to the page.
    console.error(err);
    return json({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
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
  }
  return sheet;
}

function notify(record) {
  if (!NOTIFY_EMAIL) return;
  try {
    const lines = COLUMNS.map(function (key) {
      return key + ': ' + (record[key] || '');
    });
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Pilot signup: ' + record.email,
      body: lines.join('\n') + '\n\nSheet: ' + SpreadsheetApp.getActive().getUrl(),
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
