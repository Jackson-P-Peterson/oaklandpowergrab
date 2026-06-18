/**
 * Oakland Power Grab — Google Sheets form handler
 *
 * SETUP (one time):
 * 1. Open your sheet: https://docs.google.com/spreadsheets/d/1pTLL2Rv6Vk2TYml8VvcoQYN1LoSh4yZrWd6Rj1TdssE/edit
 * 2. Extensions → Apps Script
 * 3. Delete any default code and paste this entire file
 * 4. Click Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL and paste it into index.html (GOOGLE_SCRIPT_URL)
 * 6. Re-deploy after any future edits to this script
 */

var SHEET_ID = '1pTLL2Rv6Vk2TYml8VvcoQYN1LoSh4yZrWd6Rj1TdssE';

function doGet() {
  return jsonResponse({ success: true, message: 'Oakland Power Grab form endpoint is live.' });
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    var params = e.parameter || {};

    var name = (params.name || '').toString().trim();
    var email = (params.email || '').toString().trim();
    var phone = (params.phone || '').toString().trim();

    if (!email && !name && !phone) {
      return jsonResponse({ success: false, error: 'No data received' });
    }

    // Columns: A = Name, B = Email, C = Phone
    sheet.appendRow([name, email, phone]);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
