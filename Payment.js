function getPaymentInfo() {
  return Object.assign({}, APP.payment, {
    qrUrl: getSetting('paymentQrDriveUrl') || APP.paymentQrUrl,
    qrFileId: getSetting('paymentQrFileId') || ''
  });
}

function submitPaymentSlipRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['amount', 'type', 'slipBase64', 'fileName', 'mimeType']);
  const upload = saveBase64ToDrive(payload.slipBase64, payload.fileName, payload.mimeType, 'PaymentSlips');
  const payment = {
    id: newId('PAY'),
    userEmail: user.email,
    courseId: payload.courseId || '',
    eventId: payload.eventId || '',
    vipRequestId: payload.vipRequestId || '',
    amount: toNumber(payload.amount),
    type: payload.type,
    slipFileId: upload.fileId,
    status: 'pending',
    adminNote: '',
    createdAt: nowIso(),
    reviewedBy: '',
    reviewedAt: ''
  };
  appendRow('Payments', payment);
  if (payload.courseId) {
    const courseIds = payload.courseId.split(',').filter(function(v, i, a) { return a.indexOf(v) === i && v !== ''; });
    courseIds.forEach(function(cId) {
      if (!cId) return;
      const enrollment = listRows('Enrollments', function(row) {
        return row.courseId === cId && normalizeEmail(row.userEmail) === normalizeEmail(user.email);
      })[0];
      if (enrollment) {
        updateRow('Enrollments', enrollment.id, { paymentId: payment.id, status: 'pending_payment' });
      } else {
        appendRow('Enrollments', {
          id: newId('ENR'),
          userEmail: user.email,
          courseId: cId,
          status: 'pending_payment',
          progress: 0,
          hoursEarned: 0,
          paymentId: payment.id,
          certificateId: '',
          enrolledAt: nowIso(),
          completedAt: '',
          updatedAt: nowIso(),
          finalPrice: toNumber(payload.amount)
        });
      }
    });
  }
  
  if (payload.applyVip) {
    const existing = listRows('VIPRequests', function(r) { return normalizeEmail(r.userEmail) === normalizeEmail(user.email); })[0];
    let vipReqId = existing ? existing.id : '';
    if (!existing) {
      const newVip = appendRow('VIPRequests', {
        id: newId('VIP'),
        userEmail: user.email,
        title: user.title || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        phone: user.phone || '',
        facebookName: user.facebookName || '',
        organization: user.organization || '',
        status: 'pending',
        paymentId: payment.id,
        adminNote: '',
        createdAt: nowIso()
      });
      vipReqId = newVip.id;
    } else {
       updateRow('VIPRequests', vipReqId, { paymentId: payment.id, status: 'pending' });
    }
    updateRow('Payments', payment.id, { vipRequestId: vipReqId });
  }
  if (payload.vipRequestId) updateRow('VIPRequests', payload.vipRequestId, { paymentId: payment.id });
  sendAdminPaymentNotice(payment.type, payment.id, user.email, payment.amount);
  logActivity('submit_payment_slip', 'Payments', payment.id, payment.type);
  return payment;
}

function reviewPaymentRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['id', 'status']);
  if (['approved', 'rejected'].indexOf(payload.status) === -1) throw new Error('สถานะไม่ถูกต้อง');
  const payment = updateRow('Payments', payload.id, {
    status: payload.status,
    adminNote: payload.adminNote || '',
    reviewedBy: admin.email,
    reviewedAt: nowIso()
  });
  if (payload.status === 'approved') unlockPaidItem(payment, admin.email);
  logActivity(payload.status === 'approved' ? 'approve_slip' : 'reject_slip', 'Payments', payload.id, payload.adminNote || '');
  return payment;
}

function unlockPaidItem(payment, adminEmail) {
  if (payment.courseId) {
    const enrollments = listRows('Enrollments', function(row) { return row.paymentId === payment.id; });
    enrollments.forEach(function(enrollment) {
      updateRow('Enrollments', enrollment.id, { status: 'active' });
    });
    sendPaymentApprovedEmail(payment.userEmail, 'หลักสูตรของคุณได้รับการอนุมัติแล้ว สามารถเข้าเรียนได้ทันที');
  }
  if (payment.vipRequestId) {
    reviewVipRaw({ id: payment.vipRequestId, status: 'approved', adminNote: 'อนุมัติจากสลิปชำระเงิน ' + payment.id });
  }
  if (payment.eventId) {
    const registration = listRows('EventRegistrations', function(row) { return row.paymentId === payment.id; })[0];
    if (registration) updateRow('EventRegistrations', registration.id, { status: 'confirmed' });
  }
}

function listPaymentsRaw(payload) {
  requireAdmin();
  payload = payload || {};
  return listRows('Payments', function(row) {
    return !payload.status || row.status === payload.status;
  }).sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
}
