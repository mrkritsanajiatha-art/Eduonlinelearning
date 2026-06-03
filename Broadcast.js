function sendBroadcastRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['subject', 'body', 'targetGroup']);
  const recipients = getBroadcastRecipients(payload.targetGroup);
  const attachments = [];
  if (payload.attachmentFileId) attachments.push(DriveApp.getFileById(payload.attachmentFileId).getBlob());
  const imageHtml = payload.imageFileId ? '<p><img src="' + DriveApp.getFileById(payload.imageFileId).getUrl() + '" style="max-width:640px;width:100%"></p>' : '';
  const linkHtml = payload.linkUrl ? '<p><a href="' + escapeHtml(payload.linkUrl) + '">เปิดลิงก์</a></p>' : '';
  const record = {
    id: newId('BRC'),
    subject: payload.subject,
    body: payload.body,
    targetGroup: payload.targetGroup,
    imageFileId: payload.imageFileId || '',
    attachmentFileId: payload.attachmentFileId || '',
    linkUrl: payload.linkUrl || '',
    status: 'sending',
    sentBy: admin.email,
    createdAt: nowIso(),
    sentAt: ''
  };
  appendRow('BroadcastEmails', record);
  recipients.forEach(function(email) {
    sendEmail(email, payload.subject, emailShell(payload.subject, '<div>' + payload.body + '</div>' + imageHtml + linkHtml), attachments);
  });
  updateRow('BroadcastEmails', record.id, { status: 'sent', sentAt: nowIso() });
  logActivity('send_email', 'BroadcastEmails', record.id, recipients.length + ' recipients');
  return { broadcast: record, sent: recipients.length };
}

function getBroadcastRecipients(group) {
  const users = listRows('Users');
  if (group === 'vip') return users.filter(function(u) { return u.vipStatus === 'approved'; }).map(function(u) { return u.email; });
  if (group === 'learners') {
    const emails = {};
    listRows('Enrollments').forEach(function(e) { emails[normalizeEmail(e.userEmail)] = true; });
    return Object.keys(emails);
  }
  if (group === 'event_participants') {
    const emails = {};
    listRows('EventRegistrations').forEach(function(e) { emails[normalizeEmail(e.userEmail)] = true; });
    return Object.keys(emails);
  }
  return users.map(function(u) { return u.email; });
}
