function adminDashboardRaw() {
  requireSuperAdmin();
  const payments = listRows('Payments');
  const approvedPayments = payments.filter(function(p) { return p.status === 'approved'; });
  const thisMonth = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM');
  return {
    publicStats: getPublicStats(),
    events: listRows('Events').length,
    eventRegistrations: listRows('EventRegistrations').length,
    revenueTotal: approvedPayments.reduce(function(sum, p) { return sum + toNumber(p.amount); }, 0),
    revenueMonth: approvedPayments.filter(function(p) { return String(p.reviewedAt || p.createdAt).indexOf(thisMonth) === 0; }).reduce(function(sum, p) { return sum + toNumber(p.amount); }, 0),
    pendingPayments: payments.filter(function(p) { return p.status === 'pending'; }).length,
    pendingVip: listRows('VIPRequests', function(v) { return v.status === 'pending'; }).length
  };
}

function listUsersRaw(payload) {
  requireSuperAdmin();
  payload = payload || {};
  return listRows('Users', function(row) {
    if (payload.role && row.role !== payload.role) return false;
    if (payload.q) return (row.email + row.name + row.organization).toLowerCase().indexOf(String(payload.q).toLowerCase()) !== -1;
    return true;
  });
}

function updateUserRoleRaw(payload) {
  requireSuperAdmin();
  requireFields(payload, ['id', 'role']);
  if ([APP.roles.student, APP.roles.admin, APP.roles.superAdmin].indexOf(payload.role) === -1) throw new Error('บทบาทไม่ถูกต้อง');
  const updated = updateRow('Users', payload.id, { role: payload.role });
  logActivity('update_user_role', 'Users', payload.id, payload.role);
  return updated;
}

function listActivityLogsRaw(payload) {
  requireSuperAdmin();
  return listRows('ActivityLogs').sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).slice(0, (payload && payload.limit) || 100);
}

function myDashboardRaw() {
  const user = ensureCurrentUser();
  const enrollments = listRows('Enrollments', function(e) { return normalizeEmail(e.userEmail) === normalizeEmail(user.email); });
  const registrations = listRows('EventRegistrations', function(e) { return normalizeEmail(e.userEmail) === normalizeEmail(user.email); });
  const certificates = listRows('Certificates', function(c) { return normalizeEmail(c.userEmail) === normalizeEmail(user.email); });
  const courses = listRows('Courses');
  const courseMap = {};
  courses.forEach(function(course) { courseMap[course.id] = course; });
  return {
    user: user,
    enrollments: enrollments.map(function(e) { return Object.assign({}, e, { course: courseMap[e.courseId] || null }); }),
    registrations: registrations,
    certificates: certificates,
    hours: certificates.reduce(function(sum, c) { return sum + toNumber(c.hours); }, 0)
  };
}

function updateMyProfileRaw(payload) {
  const result = updateMyProfile(payload);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}
