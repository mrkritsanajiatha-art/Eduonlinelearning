function doGet(e) {
  if (e && e.parameter && e.parameter.method) {
    // API Support via GET
    try {
      const method = e.parameter.method;
      const payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
      const result = api(method, payload);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, message: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  if (e && e.parameter && e.parameter.action === 'approve_payment') {
    const secret = getSetting('adminSecret');
    if (!secret || e.parameter.secret !== secret) {
      return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;padding:40px;text-align:center;"><h1 style="color:#d32f2f">❌ ปฏิเสธการเข้าถึง (Unauthorized)</h1><p>ลิงก์อนุมัติไม่ถูกต้อง หรือไม่ได้รับสิทธิ์</p></div>');
    }
    try {
      const paymentId = e.parameter.id;
      const payment = updateRow('Payments', paymentId, {
        status: 'approved',
        reviewedBy: 'Email (Auto)',
        reviewedAt: nowIso()
      });
      unlockPaidItem(payment, 'Email (Auto)');
      logActivity('approve_slip', 'Payments', payment.id, 'Approved via email link');
      return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;padding:40px;text-align:center;"><h1 style="color:#2e7d32">✅ อนุมัติสำเร็จ!</h1><p>ระบบได้อนุมัติสลิปชำระเงิน <b>' + payment.id + '</b> เรียบร้อยแล้ว<br>ผู้เรียนสามารถเข้าเรียนได้ทันที</p></div>');
    } catch (err) {
      return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;padding:40px;text-align:center;"><h1 style="color:#d32f2f">❌ เกิดข้อผิดพลาด</h1><p>' + err.message + '</p></div>');
    }
  }

  const page = (e && e.parameter && e.parameter.page) || 'home';
  const routes = getRoutes();
  const route = routes[page] || routes.home;
  // Let frontend handle auth redirects based on token
  const template = HtmlService.createTemplateFromFile(route.file);
  template.app = getAppSettings();
  template.page = page;
  template.params = (e && e.parameter) || {};
  let html = template.evaluate().getContent();
  const scriptTag = '<script>window.SERVER_PARAMS = ' + JSON.stringify(template.params) + ';</script>';
  html = html.replace('</head>', scriptTag + '</head>');
  return HtmlService.createHtmlOutput(html)
    .setTitle(route.title + ' | ' + APP.browserTitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

let GLOBAL_TOKEN = '';

function api(method, payload) {
  try {
    payload = payload || {};
    if (payload.token) GLOBAL_TOKEN = payload.token;
    const handlers = {
      login: loginRaw,
      register: registerRaw,
      forgotPassword: forgotPasswordRaw,
      setupDatabase: setupDatabase,
      getBootstrap: getBootstrap,
      getHomeData: getHomeDataRaw,
      getCurrentUser: function() { return ensureCurrentUser(); },
      updateMyProfile: updateMyProfileRaw,
      checkVip: checkVipRaw,
      claimVip: claimVipRaw,
      listCourses: listCoursesRaw,
      getCourse: getCourseRaw,
      saveCourse: saveCourseRaw,
      deleteCourse: deleteCourseRaw,
      enrollCourse: enrollCourseRaw,
      unenrollCourse: unenrollCourseRaw,
      completeCourse: completeCourseRaw,
      submitPaymentSlip: submitPaymentSlipRaw,
      reviewPayment: reviewPaymentRaw,
      requestVip: requestVipRaw,
      reviewVip: reviewVipRaw,
      listVipRequests: listVipRequestsRaw,
      listNews: listNewsRaw,
      saveNews: saveNewsRaw,
      deleteNews: deleteNewsRaw,
      listEvents: listEventsRaw,
      getEvent: getEventRaw,
      saveEvent: saveEventRaw,
      registerEvent: registerEventRaw,
      listEventRegistrations: listEventRegistrationsRaw,
      issueEventCertificate: issueEventCertificateRaw,
      verifyCertificate: verifyCertificateRaw,
      issueCertificate: issueCertificateRaw,
      myDashboard: myDashboardRaw,
      getTranscript: getTranscriptRaw,
      exportTranscriptPdf: exportTranscriptPdfRaw,
      adminDashboard: adminDashboardRaw,
      listUsers: listUsersRaw,
      updateUserRole: updateUserRoleRaw,
      listPayments: listPaymentsRaw,
      uploadMedia: uploadMediaRaw,
      listMedia: listMediaRaw,
      saveForm: saveFormRaw,
      listForms: listFormsRaw,
      submitFormResponse: submitFormResponseRaw,
      sendBroadcast: sendBroadcastRaw,
      listActivityLogs: listActivityLogsRaw
    };
    if (!handlers[method]) throw new Error('ไม่พบ API method: ' + method);
    return ok(handlers[method](payload || {}));
  } catch (err) {
    return fail(err.message);
  }
}

function getBootstrap() {
  return {
    app: getAppSettings(),
    user: ensureCurrentUser(),
    ticker: getTickerNewsRaw(),
    stats: getPublicStats()
  };
}

function getHomeDataRaw() {
  const users = readRows('Users');
  const enrollments = readRows('Enrollments');
  
  const userHours = {};
  enrollments.forEach(function(e) {
    if (e.status === 'completed' && e.hoursEarned) {
      if (!userHours[e.userEmail]) userHours[e.userEmail] = 0;
      userHours[e.userEmail] += Number(e.hoursEarned);
    }
  });

  const leaderboard = Object.keys(userHours).map(function(email) {
    const user = users.find(function(u) { return u.email === email; });
    return {
      name: user ? (user.name || user.email) : email,
      hours: userHours[email]
    };
  }).sort(function(a, b) { return b.hours - a.hours; }).slice(0, 5);

  return {
    courses: listCoursesRaw({}),
    news: listNewsRaw({}),
    events: listEventsRaw({}),
    leaderboard: leaderboard
  };
}

function checkVipRaw(payload) {
  try {
    const extSheet = SpreadsheetApp.openById('1ZeRewvbnbi6Wrn8wRJM21W7c21BLtP7cNWOoa6TnI1s').getSheetByName('Sheet1');
    if (!extSheet) throw new Error('ไม่พบฐานข้อมูล VIP');
    const values = extSheet.getRange('D:D').getValues();
    const lastNameQuery = String(payload.lastName || '').trim();
    if (!lastNameQuery) throw new Error('กรุณากรอกนามสกุล');
    const isVip = values.some(row => String(row[0]).trim() === lastNameQuery);
    return { isVip: isVip };
  } catch(e) {
    throw new Error(e.message);
  }
}

function claimVipRaw(payload) {
  const user = ensureCurrentUser();
  if (user.vipStatus === 'approved') return { success: true };
  try {
    const extSheet = SpreadsheetApp.openById('1ZeRewvbnbi6Wrn8wRJM21W7c21BLtP7cNWOoa6TnI1s').getSheetByName('Sheet1');
    if (!extSheet) throw new Error('ไม่พบฐานข้อมูล VIP');
    const values = extSheet.getRange('D:D').getValues();
    const lastNameQuery = String(payload.lastName || '').trim();
    if (!lastNameQuery) throw new Error('กรุณากรอกนามสกุล');
    const isVip = values.some(row => String(row[0]).trim() === lastNameQuery);
    if (!isVip) throw new Error('ไม่พบรายชื่อในระบบ VIP หรือนามสกุลไม่ตรงกัน');
    updateRow('Users', user.id, { vipStatus: 'approved' });
    clearDBCache('Users');
    return { success: true };
  } catch(e) {
    throw new Error(e.message);
  }
}
