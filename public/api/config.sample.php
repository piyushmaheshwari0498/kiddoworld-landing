<?php
/**
 * Copy this file to config.php (same folder) and fill it in.
 * Even better on shared hosting: save it ONE LEVEL ABOVE your web root as
 * kiddoworld-config.php so it can never be reached from a browser.
 * Never commit the real config — it is git-ignored.
 */
return [
    // Where enquiry emails are delivered.
    'to' => 'sales@yourdomain.com',

    // Sender shown on the email. Use an address on YOUR domain, or mail may land in spam.
    'from' => 'Kiddo World Website <no-reply@yourdomain.com>',

    'subject_prefix' => '[Kiddo World]',

    // Optional: Google Apps Script web-app URL that appends each enquiry to a Sheet.
    // See docs/GOOGLE_SHEET.md. Leave '' to skip.
    'sheet_webhook' => '',

    // 'live' = send email. 'log' = only save to api/_data/enquiries.jsonl (for local testing).
    'mode' => 'live',

    // Any random text — used to anonymise IPs in the rate limiter.
    'salt' => 'change-me',
];
