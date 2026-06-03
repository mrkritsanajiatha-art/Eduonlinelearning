function loginRaw(payload) {
  requireFields(payload, ['username', 'password']);
  const users = readRows('Users');
  const user = users.find(function(u) { return u.email === payload.username; });
  if (!user) throw new Error('ไม่พบบัญชีผู้ใช้นี้');
  if (user.password !== payload.password) throw new Error('รหัสผ่านไม่ถูกต้อง');
  const token = Utilities.getUuid();
  const patch = { token: token, lastLoginAt: nowIso() };
  updateRow('Users', user.id, patch);
  logActivity('login', 'Users', user.id, user.email);
  return { token: token, user: Object.assign({}, user, patch) };
}

function registerRaw(payload) {
  requireFields(payload, ['email', 'password', 'firstName', 'lastName']);
  const users = readRows('Users');
  if (users.find(function(u) { return u.email === payload.email; })) {
    throw new Error('Email นี้มีในระบบแล้ว');
  }
  const token = Utilities.getUuid();
  const now = nowIso();
  const fullName = (payload.title || '') + payload.firstName + ' ' + payload.lastName;
  const user = {
    id: newId('USR'),
    email: payload.email,
    password: payload.password,
    token: token,
    title: payload.title || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: fullName,
    profileUrl: '',
    role: APP.roles.student,
    vipStatus: 'none',
    phone: payload.phone || '',
    facebookName: '',
    source: payload.source || '',
    organization: '',
    createdAt: now,
    lastLoginAt: now,
    updatedAt: now
  };
  appendRow('Users', user);
  logActivity('register', 'Users', user.id, user.email);
  return { token: token, user: user };
}

function ensureCurrentUser() {
  if (!GLOBAL_TOKEN) throw new Error('กรุณาเข้าสู่ระบบ (No token)');
  const users = readRows('Users');
  const user = users.find(function(u) { return u.token === GLOBAL_TOKEN; });
  if (!user) throw new Error('กรุณาเข้าสู่ระบบใหม่ (Invalid token)');
  return user;
}

function ensureSuperAdmin() {
  const users = readRows('Users');
  if (!users.find(function(u) { return u.email === 'Kimzabig11'; })) {
    appendRow('Users', {
      id: newId('USR'),
      email: 'Kimzabig11',
      password: 'Kimzabig11',
      token: '',
      name: 'Super Admin',
      profileUrl: '',
      role: APP.roles.superAdmin,
      vipStatus: 'approved',
      phone: '',
      organization: '',
      createdAt: nowIso(),
      lastLoginAt: '',
      updatedAt: nowIso()
    });
  }
}

function ensureNormalAdmin() {
  const users = readRows('Users');
  if (!users.find(function(u) { return u.email === 'Admin1122334455'; })) {
    appendRow('Users', {
      id: newId('USR'),
      email: 'Admin1122334455',
      password: 'Admin1122334455',
      token: '',
      name: 'Course Admin',
      profileUrl: '',
      role: APP.roles.admin,
      vipStatus: 'approved',
      phone: '',
      organization: '',
      createdAt: nowIso(),
      lastLoginAt: '',
      updatedAt: nowIso()
    });
  }
}

function getCurrentUser() {
  try {
    return ok(ensureCurrentUser());
  } catch (err) {
    return fail(err.message);
  }
}

function updateMyProfileRaw(payload) {
  const user = ensureCurrentUser();
  const patch = {
    name: payload.name || user.name,
    phone: payload.phone || '',
    organization: payload.organization || '',
    profileUrl: payload.profileUrl || user.profileUrl || ''
  };
  if (payload.password && payload.password.trim() !== '') {
    patch.password = payload.password;
  }
  return updateRow('Users', user.id, patch);
}

function forgotPasswordRaw(payload) {
  requireFields(payload, ['email']);
  const users = readRows('Users');
  const user = users.find(function(u) { return u.email === payload.email; });
  if (!user) throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
  
  const newPassword = Utilities.getUuid().slice(0, 8);
  updateRow('Users', user.id, { password: newPassword });
  
  try {
    MailApp.sendEmail({
      to: user.email,
      subject: 'รีเซ็ตรหัสผ่าน (ONLINE LEARNING)',
      body: 'คุณได้ขอรีเซ็ตรหัสผ่านใหม่\n\nรหัสผ่านใหม่ของคุณคือ: ' + newPassword + '\n\nกรุณาเข้าสู่ระบบด้วยรหัสผ่านนี้และไปที่หน้าโปรไฟล์เพื่อเปลี่ยนรหัสผ่านทันที'
    });
  } catch (err) {
    throw new Error('ไม่สามารถส่งอีเมลได้: ' + err.message);
  }
  
  logActivity('forgot_password', 'Users', user.id, user.email);
  return { success: true };
}

function setupDatabaseLight() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  if (!sheet || sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].indexOf('password') === -1) {
    setupDatabase();
  }
}
