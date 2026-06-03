function getRootFolder() {
  return DriveApp.getFolderById(APP.driveFolderId);
}

function getOrCreateSubFolder(name) {
  const root = getRootFolder();
  const folders = root.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : root.createFolder(name);
}

function saveBase64ToDrive(base64, fileName, mimeType, category) {
  const clean = String(base64).replace(/^data:[^;]+;base64,/, '');
  const bytes = Utilities.base64Decode(clean);
  const blob = Utilities.newBlob(bytes, mimeType || MimeType.BINARY, fileName || (newId('FILE') + '.bin'));
  const file = getOrCreateSubFolder(category || 'MediaLibrary').createFile(blob);
  const media = {
    id: newId('MED'),
    name: file.getName(),
    fileId: file.getId(),
    url: file.getUrl(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    category: category || 'MediaLibrary',
    createdBy: normalizeEmail(Session.getActiveUser().getEmail() || 'system'),
    createdAt: nowIso()
  };
  appendRow('MediaLibrary', media);
  return media;
}

function uploadMediaRaw(payload) {
  requireAdmin();
  requireFields(payload, ['fileName', 'mimeType', 'base64']);
  const saved = saveBase64ToDrive(payload.base64, payload.fileName, payload.mimeType, payload.category || 'MediaLibrary');
  logActivity('upload_media', 'MediaLibrary', saved.id, saved.name);
  return saved;
}

function listMediaRaw(payload) {
  requireAdmin();
  payload = payload || {};
  return listRows('MediaLibrary', function(row) {
    return !payload.category || row.category === payload.category;
  }).sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
}

function installOfficialAssets() {
  const logoId = getSetting('logoFileId');
  const qrId = getSetting('paymentQrFileId');
  if (!logoId) {
    const logo = fetchAndStoreAsset(APP.logoUrl, 'official-logo.png', 'Branding');
    setSetting('logoFileId', logo.getId());
    setSetting('logoDriveUrl', logo.getUrl());
  }
  if (!qrId) {
    const qr = fetchAndStoreAsset(APP.paymentQrUrl, 'official-payment-qr.jpg', 'Payment');
    setSetting('paymentQrFileId', qr.getId());
    setSetting('paymentQrDriveUrl', qr.getUrl());
  }
}

function fetchAndStoreAsset(url, name, category) {
  const blob = UrlFetchApp.fetch(url).getBlob().setName(name);
  return getOrCreateSubFolder(category).createFile(blob);
}

function getOfficialLogoBlob() {
  const fileId = getSetting('logoFileId');
  if (fileId) return DriveApp.getFileById(fileId).getBlob();
  return UrlFetchApp.fetch(APP.logoUrl).getBlob();
}

function getOfficialPaymentQrBlob() {
  const fileId = getSetting('paymentQrFileId');
  if (fileId) return DriveApp.getFileById(fileId).getBlob();
  return UrlFetchApp.fetch(APP.paymentQrUrl).getBlob();
}
