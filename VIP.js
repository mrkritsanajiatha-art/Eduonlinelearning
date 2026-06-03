function requestVipRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['firstName', 'lastName', 'email', 'phone', 'organization', 'facebookName']);
  const existing = listRows('VIPRequests', function(row) {
    return normalizeEmail(row.userEmail) === normalizeEmail(user.email) && row.status === 'pending';
  })[0];
  if (existing) return existing;
  const fullName = (payload.title || '') + payload.firstName + ' ' + payload.lastName;
  const request = {
    id: newId('VIP'),
    userEmail: user.email,
    title: payload.title || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: fullName,
    phone: payload.phone,
    facebookName: payload.facebookName,
    organization: payload.organization,
    status: 'pending',
    paymentId: '',
    adminNote: '',
    createdAt: nowIso(),
    reviewedBy: '',
    reviewedAt: ''
  };
  appendRow('VIPRequests', request);
  updateRow('Users', user.id, { 
    title: payload.title || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: fullName, 
    phone: payload.phone, 
    facebookName: payload.facebookName,
    organization: payload.organization, 
    vipStatus: 'pending' 
  });
  sendAdminVipNotice(request);
  logActivity('request_vip', 'VIPRequests', request.id, request.organization);
  return request;
}

function reviewVipRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['id', 'status']);
  if (['approved', 'rejected'].indexOf(payload.status) === -1) throw new Error('สถานะ VIP ไม่ถูกต้อง');
  const request = updateRow('VIPRequests', payload.id, {
    status: payload.status,
    adminNote: payload.adminNote || '',
    reviewedBy: admin.email,
    reviewedAt: nowIso()
  });
  const user = listRows('Users', function(row) { return normalizeEmail(row.email) === normalizeEmail(request.userEmail); })[0];
  if (user) updateRow('Users', user.id, { vipStatus: payload.status === 'approved' ? 'approved' : 'rejected' });
  sendVipReviewedEmail(request.userEmail, payload.status, payload.adminNote || '');
  logActivity(payload.status === 'approved' ? 'approve_vip' : 'reject_vip', 'VIPRequests', request.id, payload.adminNote || '');
  return request;
}

function listVipRequestsRaw(payload) {
  requireAdmin();
  payload = payload || {};
  return listRows('VIPRequests', function(row) {
    return !payload.status || row.status === payload.status;
  }).sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
}
