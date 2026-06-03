function sendEmail(to, subject, htmlBody, attachments) {
  try {
    GmailApp.sendEmail(to, subject, stripHtml(htmlBody), {
      htmlBody: htmlBody,
      attachments: attachments || []
    });
    appendRow('EmailLogs', { id: newId('EMAIL'), to: to, subject: subject, status: 'sent', error: '', createdAt: nowIso() });
    return true;
  } catch (err) {
    appendRow('EmailLogs', { id: newId('EMAIL'), to: to, subject: subject, status: 'failed', error: err.message, createdAt: nowIso() });
    console.error('Email failed:', err);
    return false;
  }
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function emailShell(title, body) {
  return '<div style="font-family:Arial,Noto Sans Thai,sans-serif;color:#10233f;line-height:1.7">' +
    '<img src="' + APP.logoUrl + '" style="height:64px;margin-bottom:16px">' +
    '<h2 style="color:#0b5cab">' + escapeHtml(title) + '</h2>' + body +
    '<p style="margin-top:24px;color:#64748b">ONLINE LEARNING<br>' + escapeHtml(APP.subtitle) + '</p></div>';
}

function sendAdminPaymentNotice(type, ref, userEmail, amount) {
  let secret = getSetting('adminSecret');
  if (!secret) {
    secret = Utilities.getUuid();
    setSetting('adminSecret', secret);
  }
  const app = getAppSettings();
  const approveUrl = app.publishedUrl + '?action=approve_payment&id=' + ref + '&secret=' + secret;
  const btn = '<div style="margin-top:24px;text-align:center;"><a href="' + approveUrl + '" style="display:inline-block;padding:12px 24px;background:#004b93;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">✅ กดที่นี่เพื่อ อนุมัติสลิป ให้เข้าเรียนได้ทันที</a></div>';
  const html = emailShell('แจ้งตรวจสอบการชำระเงิน', '<p>มีรายการชำระเงินใหม่</p><ul><li>ประเภท: ' + escapeHtml(type) + '</li><li>อ้างอิง: ' + escapeHtml(ref) + '</li><li>ผู้ใช้: ' + escapeHtml(userEmail) + '</li><li>จำนวนเงิน: <b>' + escapeHtml(amount) + ' บาท</b></li></ul>' + btn);
  sendEmail(APP.superAdminEmail, '[ONLINE LEARNING] ตรวจสอบการชำระเงิน (' + ref + ')', html);
}

function sendPaymentApprovedEmail(to, message) {
  sendEmail(to, '[ONLINE LEARNING] อนุมัติการชำระเงินแล้ว', emailShell('อนุมัติการชำระเงินแล้ว', '<p>' + escapeHtml(message) + '</p>'));
}

function sendAdminVipNotice(request) {
  const html = emailShell('คำขอ VIP ใหม่', '<p>' + escapeHtml(request.name) + ' ส่งคำขอสมาชิก VIP</p><p>หน่วยงาน: ' + escapeHtml(request.organization) + '</p>');
  sendEmail(APP.superAdminEmail, '[ONLINE LEARNING] คำขอ VIP ใหม่', html);
}

function sendVipReviewedEmail(to, status, note) {
  const label = status === 'approved' ? 'อนุมัติสมาชิก VIP แล้ว' : 'ไม่อนุมัติคำขอ VIP';
  sendEmail(to, '[ONLINE LEARNING] ' + label, emailShell(label, '<p>' + escapeHtml(note || '') + '</p>'));
}
