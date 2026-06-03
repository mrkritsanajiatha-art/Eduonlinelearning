function listCoursesRaw(payload) {
  payload = payload || {};
  const rows = listRows('Courses', function(course) {
    if (!course.title) return false;
    if (course.status && course.status !== 'published' && !payload.includeDrafts) return false;
    if (payload.category && course.category !== payload.category) return false;
    if (payload.type && course.type !== payload.type) return false;
    if (payload.q) {
      const text = (course.title + ' ' + course.description + ' ' + course.instructor).toLowerCase();
      return text.indexOf(String(payload.q).toLowerCase()) !== -1;
    }
    return true;
  });
  return rows.sort(function(a, b) {
    return String(b.featured).localeCompare(String(a.featured)) || String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function getCourseRaw(payload) {
  requireFields(payload, ['id']);
  const course = findById('Courses', payload.id);
  if (!course) throw new Error('ไม่พบหลักสูตร');
  let enrollment = null;
  let user = null;
  try {
    user = ensureCurrentUser();
    enrollment = listRows('Enrollments', function(row) {
      return row.courseId === payload.id && normalizeEmail(row.userEmail) === normalizeEmail(user.email);
    })[0] || null;
    if (!enrollment) {
      const approvedPayment = listRows('Payments', function(row) {
        return row.courseId === payload.id && normalizeEmail(row.userEmail) === normalizeEmail(user.email) && row.status === 'approved';
      })[0];
      if (approvedPayment) {
        enrollment = {
          id: newId('ENR'),
          userEmail: user.email,
          courseId: payload.id,
          status: 'active',
          progress: 0,
          hoursEarned: 0,
          paymentId: approvedPayment.id,
          certificateId: '',
          enrolledAt: approvedPayment.createdAt,
          completedAt: '',
          updatedAt: nowIso(),
          finalPrice: toNumber(approvedPayment.amount)
        };
        appendRow('Enrollments', enrollment);
      }
    }
  } catch (err) {}
  return { course: course, enrollment: enrollment, payment: APP.payment, user: user };
}

function saveCourseRaw(payload) {
  const user = requireAdmin();
  requireFields(payload, ['title', 'description', 'instructor', 'hours', 'type', 'category']);
  const now = nowIso();
  const record = {
    title: payload.title,
    description: payload.description,
    instructor: payload.instructor,
    hours: toNumber(payload.hours),
    price: toNumber(payload.price),
    type: payload.type,
    category: payload.category,
    coverFileId: payload.coverFileId || '',
    coverUrl: payload.coverUrl || '',
    documentFileId: payload.documentFileId || '',
    videoUrl: payload.videoUrl || '',
    status: payload.status || 'published',
    featured: toBool(payload.featured),
    updatedAt: now
  };
  if (payload.id) {
    const updated = updateRow('Courses', payload.id, record);
    logActivity('edit_course', 'Courses', payload.id, record.title);
    return updated;
  }
  record.id = newId('CRS');
  record.createdBy = user.email;
  record.createdAt = now;
  appendRow('Courses', record);
  logActivity('create_course', 'Courses', record.id, record.title);
  return record;
}

function deleteCourseRaw(payload) {
  requireAdmin();
  requireFields(payload, ['id']);
  deleteRow('Courses', payload.id);
  logActivity('delete_course', 'Courses', payload.id, '');
  return true;
}

function enrollCourseRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['courseId']);
  const course = findById('Courses', payload.courseId);
  if (!course) throw new Error('ไม่พบหลักสูตร');
  const existing = listRows('Enrollments', function(row) {
    return row.courseId === payload.courseId && normalizeEmail(row.userEmail) === normalizeEmail(user.email);
  })[0];
  if (existing) return existing;
  
  let finalPrice = toNumber(course.price);
  let vipNoCert = false;

  if (finalPrice > 0 && payload.vipLastName) {
    try {
      const extSheet = SpreadsheetApp.openById('1ZeRewvbnbi6Wrn8wRJM21W7c21BLtP7cNWOoa6TnI1s').getSheetByName('Sheet1');
      if (!extSheet) throw new Error('ไม่พบ Sheet1 ในฐานข้อมูล VIP');
      const values = extSheet.getRange('D:D').getValues();
      const lastNameQuery = payload.vipLastName.trim();
      
      let isVip = false;
      for (let i = 0; i < values.length; i++) {
        if (String(values[i][0]).trim() === lastNameQuery) {
          isVip = true;
          break;
        }
      }
      
      if (isVip) {
        if (payload.vipOption === 'free') {
          finalPrice = 0;
          vipNoCert = true;
          // Send email to admin
          try {
            MailApp.sendEmail({
              to: 'mrkritsanajiatha@gmail.com',
              subject: 'แจ้งเตือน: สมาชิก VIP สมัครเรียนฟรี',
              htmlBody: `
                <h2>มีสมาชิก VIP สมัครเรียนฟรี (ไม่รับวุฒิบัตร)</h2>
                <p><strong>ชื่อ-นามสกุล ผู้ใช้:</strong> ${user.name}</p>
                <p><strong>อีเมล:</strong> ${user.email}</p>
                <p><strong>นามสกุล VIP ที่อ้างอิง:</strong> ${lastNameQuery}</p>
                <p><strong>หลักสูตร:</strong> ${course.title}</p>
              `
            });
          } catch(e) {}
        } else {
          finalPrice = finalPrice * 0.7; // 70% price for cert
        }
      } else {
        throw new Error('ไม่พบนามสกุลในระบบ VIP กรุณาตรวจสอบอีกครั้ง หรือแนบสลิปชำระเงินปกติ');
      }
    } catch(err) {
      throw new Error('ตรวจสอบ VIP ล้มเหลว: ' + err.message);
    }
  }

  const paid = finalPrice > 0;
  const vipOnly = course.type === 'vip';
  if (vipOnly && user.vipStatus !== 'approved' && !isAdminRole(user.role)) {
    throw new Error('หลักสูตรนี้สำหรับสมาชิก VIP');
  }
  const enrollment = {
    id: newId('ENR'),
    userEmail: user.email,
    courseId: course.id,
    status: paid ? 'pending_payment' : 'active',
    progress: 0,
    hoursEarned: 0,
    paymentId: '',
    certificateId: '',
    vipNoCert: vipNoCert,
    enrolledAt: nowIso(),
    completedAt: '',
    updatedAt: nowIso(),
    finalPrice: finalPrice
  };
  appendRow('Enrollments', enrollment);
  logActivity('enroll_course', 'Courses', course.id, course.title);
  if (paid) {
    sendAdminPaymentNotice('course', course.title, user.email, finalPrice);
  }
  return enrollment;
}

function unenrollCourseRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['id']);
  const enrollment = findById('Enrollments', payload.id);
  if (!enrollment) throw new Error('ไม่พบข้อมูลการลงทะเบียน');
  if (normalizeEmail(enrollment.userEmail) !== normalizeEmail(user.email)) throw new Error('ไม่มีสิทธิ์ลบข้อมูลนี้');
  deleteRow('Enrollments', payload.id);
  logActivity('unenroll_course', 'Courses', enrollment.courseId, '');
  return true;
}

function completeCourseRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['courseId']);
  const enrollment = listRows('Enrollments', function(row) {
    return row.courseId === payload.courseId && normalizeEmail(row.userEmail) === normalizeEmail(user.email);
  })[0];
  if (!enrollment) throw new Error('ยังไม่ได้ลงทะเบียนหลักสูตรนี้');
  if (enrollment.status !== 'active') throw new Error('หลักสูตรยังไม่พร้อมเรียนหรือรออนุมัติการชำระเงิน');
  
  if (payload.firstName && payload.lastName) {
    const fullName = (payload.title || '') + payload.firstName + ' ' + payload.lastName;
    updateRow('Users', user.id, {
      title: payload.title || '',
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: fullName
    });
    user.name = fullName;
  }

  const course = findById('Courses', payload.courseId);
  const certId = 'TECF-' + new Date().getFullYear() + '-' + ('000000' + (listRows('Certificates').length + 1)).slice(-6);
  
  const cert = {
    id: newId('CERT'),
    certificateId: certId,
    userEmail: normalizeEmail(user.email),
    recipientName: user.name || user.email,
    sourceType: 'course',
    sourceId: course.id,
    sourceTitle: course.title,
    hours: course.hours,
    pdfFileId: '',
    qrFileId: '',
    status: 'valid',
    issuedBy: user.email,
    issuedAt: nowIso(),
    revokedAt: ''
  };
  appendRow('Certificates', cert);

  updateRow('Enrollments', enrollment.id, {
    status: 'completed',
    progress: 100,
    hoursEarned: course.hours,
    certificateId: certId,
    completedAt: nowIso()
  });
  appendTranscript(user.email, 'course', course.id, course.title, course.hours, certId);
  logActivity('complete_course', 'Courses', course.id, course.title);

  try {
    MailApp.sendEmail({
      to: 'mrkritsanajiatha@gmail.com',
      subject: 'แจ้งขอรับวุฒิบัตรใหม่: ' + certId,
      htmlBody: `
        <h2>มีผู้ขอรับวุฒิบัตรใหม่</h2>
        <p><strong>เลขวุฒิบัตร:</strong> ${certId}</p>
        <p><strong>คำนำหน้า:</strong> ${payload.title || ''}</p>
        <p><strong>ชื่อ:</strong> ${payload.firstName || ''}</p>
        <p><strong>นามสกุล:</strong> ${payload.lastName || ''}</p>
        <p><strong>หลักสูตร:</strong> ${course.title}</p>
        <p><strong>อีเมลผู้ขอ:</strong> ${payload.email || user.email}</p>
      `
    });
  } catch(err) {
    console.warn("Failed to send email", err);
  }

  return cert;
}

function getPublicStats() {
  return {
    users: listRows('Users').length,
    courses: listRows('Courses', function(c) { return !c.status || c.status === 'published'; }).length,
    graduates: listRows('Enrollments', function(e) { return e.status === 'completed'; }).length,
    certificates: listRows('Certificates', function(c) { return c.status !== 'revoked'; }).length,
    vip: listRows('Users', function(u) { return u.vipStatus === 'approved'; }).length
  };
}
