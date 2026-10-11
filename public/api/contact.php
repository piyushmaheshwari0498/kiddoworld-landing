<?php
/**
 * Kiddo World – enquiry form handler.
 * Receives the Contact form (POST), saves a backup copy, emails the sales inbox
 * and (optionally) appends a row to a Google Sheet. Always answers with JSON.
 *
 * Setup: copy config.sample.php to config.php and fill it in (see README).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// Config lives next to this file, or one level above the web root (preferred on shared hosting).
$configFile = null;
foreach ([dirname(__DIR__, 2) . '/kiddoworld-config.php', __DIR__ . '/config.php'] as $candidate) {
    if (is_file($candidate)) { $configFile = $candidate; break; }
}
if ($configFile === null) {
    error_log('[kiddoworld] contact.php: config.php is missing');
    respond(500, ['ok' => false, 'error' => 'Form is not configured yet']);
}
$config = require $configFile;

/** Single-line text: strip tags/control characters, collapse whitespace, cap length. */
function clean(string $key, int $max, bool $multiline = false): string
{
    $v = (string)($_POST[$key] ?? '');
    $v = strip_tags($v);
    $v = preg_replace($multiline ? '/[^\P{C}\n]+/u' : '/[\p{C}]+/u', ' ', $v) ?? '';
    $v = $multiline ? trim(preg_replace("/\n{3,}/", "\n\n", $v) ?? '') : trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

// Bot traps: a hidden field humans never fill, and a form that was submitted impossibly fast.
$started = (int)($_POST['started'] ?? 0) / 1000;
if (clean('website', 100) !== '' || ($started > 0 && time() - $started < 2)) {
    respond(200, ['ok' => true]); // pretend success so bots learn nothing
}

$data = [
    'name'     => clean('name', 80),
    'business' => clean('business', 120),
    'phone'    => clean('phone', 20),
    'email'    => clean('email', 120),
    'interest' => clean('interest', 80),
    'age'      => clean('age', 40),
    'message'  => clean('message', 2000, true),
];

if ($data['name'] === '' || $data['business'] === '' || !preg_match('/^[0-9+\s\-]{8,15}$/', $data['phone'])) {
    respond(422, ['ok' => false, 'error' => 'Please fill in your name, business and a valid phone number']);
}
if ($data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Please enter a valid email address']);
}

// Storage folder for the backup log + rate limit (blocked from the web by its own .htaccess).
$dataDir = __DIR__ . '/_data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
    @file_put_contents($dataDir . '/.htaccess', "Require all denied\n");
}

// Simple rate limit: 5 enquiries per IP per 10 minutes.
$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . ($config['salt'] ?? 'kiddoworld'));
$rateFile = $dataDir . '/rate.json';
$fh = @fopen($rateFile, 'c+');
if ($fh && flock($fh, LOCK_EX)) {
    $rates = json_decode(stream_get_contents($fh) ?: '[]', true) ?: [];
    $now = time();
    foreach ($rates as $k => $times) {
        $rates[$k] = array_values(array_filter($times, fn($t) => $now - $t < 600));
        if (!$rates[$k]) unset($rates[$k]);
    }
    if (count($rates[$ipHash] ?? []) >= 5) {
        flock($fh, LOCK_UN); fclose($fh);
        respond(429, ['ok' => false, 'error' => 'Too many enquiries — please try again in a few minutes']);
    }
    $rates[$ipHash][] = $now;
    ftruncate($fh, 0); rewind($fh);
    fwrite($fh, json_encode($rates));
    flock($fh, LOCK_UN);
}
if ($fh) fclose($fh);

$record = ['time' => date('c')] + $data;

// 1) Backup copy — so no lead is ever lost, even if email fails.
$logged = (bool)@file_put_contents($dataDir . '/enquiries.jsonl', json_encode($record, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

// 2) Email to the sales inbox.
$mailed = false;
if (($config['mode'] ?? 'live') === 'live' && !empty($config['to'])) {
    $subject = trim(($config['subject_prefix'] ?? '[Kiddo World]') . ' New enquiry from ' . $data['business']);
    $body = "New website enquiry\n\n"
        . "Name: {$data['name']}\nBusiness: {$data['business']}\nPhone: {$data['phone']}\n"
        . 'Email: ' . ($data['email'] ?: '-') . "\nToy type: {$data['interest']}\nAge group: {$data['age']}\n\n"
        . "Message:\n" . ($data['message'] ?: '-') . "\n\nSent " . $record['time'] . "\n";
    $headers = [
        'From: ' . ($config['from'] ?? 'no-reply@localhost'),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    if ($data['email'] !== '') $headers[] = 'Reply-To: ' . $data['email'];
    $mailed = @mail($config['to'], mb_encode_mimeheader($subject, 'UTF-8'), $body, implode("\r\n", $headers));
    if (!$mailed) error_log('[kiddoworld] contact.php: mail() failed');
}

// 3) Google Sheet (Apps Script web app) — optional.
$sheeted = false;
if (!empty($config['sheet_webhook'])) {
    $ctx = stream_context_create(['http' => [
        'method' => 'POST', 'timeout' => 6, 'ignore_errors' => true,
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($record, JSON_UNESCAPED_UNICODE),
    ]]);
    $res = @file_get_contents($config['sheet_webhook'], false, $ctx);
    $status = $http_response_header[0] ?? '';
    $sheeted = $res !== false && str_contains($status, ' 200');
    if (!$sheeted) error_log('[kiddoworld] contact.php: sheet webhook failed');
}

$ok = $mailed || $sheeted || (($config['mode'] ?? 'live') === 'log' && $logged);
respond($ok ? 200 : 500, $ok ? ['ok' => true] : ['ok' => false, 'error' => 'Could not deliver your enquiry']);
