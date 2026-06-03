function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return (prefix || 'ID') + '-' + Utilities.getUuid().slice(0, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function activeEmail() {
  const email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('กรุณาเข้าสู่ระบบด้วยบัญชี Google');
  return normalizeEmail(email);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseJson(value, fallback) {
  try {
    if (value === '' || value == null) return fallback;
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function ok(data) {
  return { ok: true, data: data == null ? null : data };
}

function fail(message) {
  return { ok: false, message: String(message || 'เกิดข้อผิดพลาด') };
}

function requireFields(payload, fields) {
  payload = payload || {};
  fields.forEach(function(field) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      throw new Error('กรุณากรอกข้อมูล: ' + field);
    }
  });
}

function currentUserOrCreate() {
  return ensureCurrentUser();
}

function isAdminRole(role) {
  return role === APP.roles.admin || role === APP.roles.superAdmin;
}

function requireAdmin() {
  const user = currentUserOrCreate();
  if (!isAdminRole(user.role)) throw new Error('ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
  return user;
}

function requireSuperAdmin() {
  const user = currentUserOrCreate();
  if (user.role !== APP.roles.superAdmin) throw new Error('ต้องใช้สิทธิ์ super_admin');
  return user;
}

function toBool(value) {
  return value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1';
}

function toNumber(value) {
  const n = Number(value || 0);
  return isNaN(n) ? 0 : n;
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl() || getSetting('publishedUrl') || '';
}

function makePageUrl(page, params) {
  const base = getWebAppUrl();
  const query = Object.keys(params || {}).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  return base + '?page=' + encodeURIComponent(page || 'home') + (query ? '&' + query : '');
}

function logActivity(action, entityType, entityId, detail) {
  try {
    appendRow('ActivityLogs', {
      id: newId('LOG'),
      actorEmail: normalizeEmail(Session.getActiveUser().getEmail() || 'system'),
      action: action,
      entityType: entityType || '',
      entityId: entityId || '',
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {}),
      createdAt: nowIso()
    });
  } catch (err) {
    console.warn(err);
  }
}
