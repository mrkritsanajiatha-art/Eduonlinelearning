function nextCertificateId() {
  const count = listRows('Certificates').length + 1;
  return 'TECF-' + new Date().getFullYear() + '-' + ('000000' + count).slice(-6);
}

function issueCertificateRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['userEmail', 'recipientName', 'sourceType', 'sourceId', 'sourceTitle']);
  payload.issuedBy = admin.email;
  const cert = issueCertificateInternal(payload);
  logActivity('issue_certificate', 'Certificates', cert.certificateId, cert.recipientName);
  return cert;
}

function issueCertificateInternal(payload) {
  const certificateId = payload.certificateId || nextCertificateId();
  const verifyUrl = makePageUrl('verify', { id: certificateId });
  const qrFile = createQrFile(verifyUrl, certificateId);
  const pdfFile = createCertificatePdf({
    certificateId: certificateId,
    recipientName: payload.recipientName,
    sourceTitle: payload.sourceTitle,
    hours: payload.hours || '',
    verifyUrl: verifyUrl,
    qrFileId: qrFile.getId()
  });
  const cert = {
    id: newId('CERT'),
    certificateId: certificateId,
    userEmail: normalizeEmail(payload.userEmail),
    recipientName: payload.recipientName,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
    sourceTitle: payload.sourceTitle,
    hours: payload.hours || '',
    pdfFileId: pdfFile.getId(),
    qrFileId: qrFile.getId(),
    status: 'valid',
    issuedBy: payload.issuedBy || normalizeEmail(Session.getActiveUser().getEmail() || 'system'),
    issuedAt: nowIso(),
    revokedAt: ''
  };
  appendRow('Certificates', cert);
  return cert;
}

function createCertificatePdf(data) {
  const signatureUrl = 'https://img2.pic.in.th/908db862883c808ebc8f7d7723e38482.png';
  let signatureBase64 = '';
  try {
    const sigBlob = UrlFetchApp.fetch(signatureUrl, {muteHttpExceptions:true}).getBlob();
    signatureBase64 = 'data:image/png;base64,' + Utilities.base64Encode(sigBlob.getBytes());
  } catch(e) {}

  let qrBase64 = '';
  try {
    const qrBlob = DriveApp.getFileById(data.qrFileId).getBlob();
    qrBase64 = 'data:image/png;base64,' + Utilities.base64Encode(qrBlob.getBytes());
  } catch(e) {}

  const dateStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy');

  const html = `<html><head>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 0; }
    body { 
      margin: 0; padding: 0; 
      width: 1123px; height: 794px; 
      font-family: 'Sarabun', sans-serif; 
      position: relative;
    }
    .bg-fallback {
      position: absolute; top: 0; left: 0; width: 1123px; height: 794px;
      background: #f8fafc; border: 15px solid #0b5cab; box-sizing: border-box;
      z-index: -1;
    }
    .cert-no { position: absolute; top: 50px; left: 80px; font-size: 16px; color: #333; }
    .title-org { position: absolute; top: 100px; width: 100%; text-align: center; font-size: 32px; font-weight: bold; color: #0b5cab; }
    .subtitle { position: absolute; top: 160px; width: 100%; text-align: center; font-size: 20px; color: #555; }
    
    .name { position: absolute; top: 270px; width: 100%; text-align: center; font-size: 48px; font-weight: bold; color: #000; }
    
    .course-label { position: absolute; top: 380px; width: 100%; text-align: center; font-size: 22px; color: #333; }
    .course-title { position: absolute; top: 420px; width: 100%; text-align: center; font-size: 28px; font-weight: bold; color: #b98919; }
    .hours { position: absolute; top: 480px; width: 100%; text-align: center; font-size: 26px; font-weight: bold; color: #b98919; }
    
    .date { position: absolute; top: 560px; width: 100%; text-align: center; font-size: 20px; color: #333; }
    
    .signature-img { position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%); height: 80px; }
    .signature-name { position: absolute; bottom: 60px; width: 100%; text-align: center; font-size: 20px; font-weight: bold; color:#0b5cab; }
    .signature-pos { position: absolute; bottom: 40px; width: 100%; text-align: center; font-size: 16px; color: #555; }
    
    .qr { position: absolute; right: 60px; bottom: 60px; width: 120px; }
    .qr-text { position: absolute; right: 80px; bottom: 45px; font-size: 12px; color: #555; }
  </style>
  </head><body>
    <div class="bg-fallback"></div>
    <div class="cert-no">No. ${escapeHtml(data.certificateId)}</div>
    <div class="title-org">สมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย</div>
    <div class="subtitle">ขอมอบวุฒิบัตรนี้เพื่อแสดงว่า</div>
    
    <div class="name">${escapeHtml(data.recipientName)}</div>
    
    <div class="course-label">ผ่านการอบรมหลักสูตร</div>
    <div class="course-title">${escapeHtml(data.sourceTitle)}</div>
    <div class="hours">จำนวน ${escapeHtml(data.hours || '-')} ชั่วโมง</div>
    
    <div class="date">ให้ไว้ ณ วันที่ ${dateStr}</div>
    
    ${signatureBase64 ? `<img src="${signatureBase64}" class="signature-img">` : ''}
    <div class="signature-name">นายยุทธ อัครางกูร</div>
    <div class="signature-pos">เลขาธิการสมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย</div>
    
    ${qrBase64 ? `<img src="${qrBase64}" class="qr"><div class="qr-text">สแกนตรวจสอบ</div>` : ''}
  </body></html>`;

  const blob = Utilities.newBlob(html, 'text/html', data.certificateId + '.html').getAs('application/pdf');
  return getOrCreateSubFolder('Certificates').createFile(blob).setName(data.certificateId + '.pdf');
}

function createQrFile(text, name) {
  const url = 'https://quickchart.io/qr?size=220&text=' + encodeURIComponent(text);
  let blob;
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    blob = response.getBlob().setName(name + '-qr.png');
  } catch(e) {
    blob = Utilities.newBlob('', 'image/png', name + '-qr.png'); 
  }
  return getOrCreateSubFolder('CertificateQR').createFile(blob);
}

function verifyCertificateRaw(payload) {
  requireFields(payload, ['certificateId']);
  const id = String(payload.certificateId).trim();
  const cert = listRows('Certificates', function(row) {
    return row.certificateId === id;
  })[0];
  if (!cert) return { status: 'NOT_FOUND' };
  return {
    status: cert.status === 'revoked' ? 'REVOKED' : 'VALID',
    certificate: cert,
    pdfUrl: cert.pdfFileId ? DriveApp.getFileById(cert.pdfFileId).getUrl() : ''
  };
}

function myCertificatesRaw() {
  const user = ensureCurrentUser();
  return listRows('Certificates', function(row) { return normalizeEmail(row.userEmail) === normalizeEmail(user.email); });
}
