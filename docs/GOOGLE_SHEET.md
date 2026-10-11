# Log enquiries to a Google Sheet (optional)

1. Create a Google Sheet. In row 1 add headers: `time, name, business, phone, email, interest, age, message`.
2. **Extensions → Apps Script**, replace the code with:

```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([data.time, data.name, data.business, data.phone, data.email, data.interest, data.age, data.message]);
  return ContentService.createTextOutput('ok');
}
```
3. **Deploy → New deployment → type: Web app**. Execute as: *Me*. Who has access: *Anyone*. Deploy and authorise.
4. Copy the **Web app URL** and paste it into `sheet_webhook` in `config.php` on the server.
5. Submit a test enquiry – a new row should appear.

The URL is only stored on your server (never in the website code), so visitors can't see it.
