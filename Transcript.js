function appendTranscript(userEmail, sourceType, sourceId, sourceTitle, hours, certificateId) {
  appendRow('Transcript', {
    id: newId('TRN'),
    userEmail: normalizeEmail(userEmail),
    sourceType: sourceType,
    sourceId: sourceId,
    sourceTitle: sourceTitle,
    hours: toNumber(hours),
    certificateId: certificateId || '',
    completedAt: nowIso()
  });
}

function getTranscriptRaw(payload) {
  const user = ensureCurrentUser();
  const email = payload && payload.userEmail && isAdminRole(user.role) ? normalizeEmail(payload.userEmail) : normalizeEmail(user.email);
  const rows = listRows('Transcript', function(row) { return normalizeEmail(row.userEmail) === email; });
  return {
    userEmail: email,
    totalHours: rows.reduce(function(sum, row) { return sum + toNumber(row.hours); }, 0),
    items: rows.sort(function(a, b) { return String(b.completedAt).localeCompare(String(a.completedAt)); })
  };
}

function exportTranscriptPdfRaw(payload) {
  const transcript = getTranscriptRaw(payload || {});
  const htmlRows = transcript.items.map(function(item) {
    return '<tr><td>' + escapeHtml(item.sourceType) + '</td><td>' + escapeHtml(item.sourceTitle) + '</td><td>' + escapeHtml(item.hours) + '</td><td>' + escapeHtml(item.certificateId) + '</td><td>' + escapeHtml(item.completedAt) + '</td></tr>';
  }).join('');
  const html = '<html><head><style>body{font-family:Arial,Noto Sans Thai,sans-serif;color:#10233f}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d8e2ef;padding:8px}th{background:#eaf3ff}</style></head><body>' +
    '<img src="' + APP.logoUrl + '" style="height:72px"><h1>Transcript</h1><p>' + escapeHtml(transcript.userEmail) + '</p><p>ชั่วโมงสะสมรวม ' + transcript.totalHours + ' ชั่วโมง</p>' +
    '<table><thead><tr><th>ประเภท</th><th>รายการ</th><th>ชั่วโมง</th><th>เกียรติบัตร</th><th>วันที่สำเร็จ</th></tr></thead><tbody>' + htmlRows + '</tbody></table></body></html>';
  const blob = Utilities.newBlob(html, 'text/html', 'transcript.html').getAs('application/pdf');
  const file = getOrCreateSubFolder('Transcript').createFile(blob).setName('Transcript-' + transcript.userEmail + '.pdf');
  return { fileId: file.getId(), url: file.getUrl() };
}
