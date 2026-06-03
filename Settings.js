const APP = {
  name: 'ONLINE LEARNING',
  subtitle: 'by สมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย',
  browserTitle: 'ONLINE LEARNING by สมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย',
  spreadsheetId: '1sqUwhpb8nAw0uV6M866vC-J9yIYWS72x-U7oRMp9km4',
  driveFolderId: '1TnD4cu6BNT4-U0iAePFr6NJ1uLlzb6WS',
  logoUrl: 'https://img2.pic.in.th/1111bcdae880aff7e05f.png',
  paymentQrUrl: 'https://img1.pic.in.th/images/unnamed-1dde43eac40d0e0a1.jpg',
  superAdminEmail: 'Mrkritsanajiatha@gmail.com',
  payment: {
    bank: 'ธนาคารไทยพาณิชย์',
    accountNumber: '4-1016-8624-0',
    promptPay: '062-607-8601',
    accountName: 'นายยุทธ อัครางกูร'
  },
  roles: {
    student: 'student',
    admin: 'admin',
    superAdmin: 'super_admin'
  },
  publicPages: ['home', 'courses', 'course-detail', 'payment', 'vip', 'certificate', 'verify', 'events', 'event-detail', 'news', 'about', 'contact', 'login'],
  courseCategories: ['ภาษาอังกฤษ', 'AI เพื่อการศึกษา', 'PLC', 'Active Learning', 'STEM', 'Coding', 'การวัดผล', 'วิจัยในชั้นเรียน', 'วิทยฐานะ', 'ผู้บริหารสถานศึกษา']
};

function getAppSettings() {
  const saved = getSettingsMap();
  return Object.assign({}, APP, {
    assets: {
      logoFileId: saved.logoFileId || '',
      paymentQrFileId: saved.paymentQrFileId || ''
    },
    publishedUrl: saved.publishedUrl || ScriptApp.getService().getUrl() || ''
  });
}

function getRoutes() {
  return {
    home: { file: 'index', title: APP.name },
    login: { file: 'login', title: 'เข้าสู่ระบบ' },
    dashboard: { file: 'dashboard', title: 'แดชบอร์ดผู้เรียน', auth: true },
    courses: { file: 'courses', title: 'หลักสูตรทั้งหมด' },
    'course-detail': { file: 'course-detail', title: 'รายละเอียดหลักสูตร' },
    learn: { file: 'learn', title: 'เข้าสู่ห้องเรียน', auth: true },
    cart: { file: 'cart', title: 'ตะกร้าสินค้า', auth: true },
    payment: { file: 'payment', title: 'ชำระเงิน', auth: true },
    vip: { file: 'vip', title: 'สมาชิก VIP' },
    certificate: { file: 'certificate', title: 'เกียรติบัตรของฉัน', auth: true },
    verify: { file: 'verify', title: 'ตรวจสอบเกียรติบัตร' },
    events: { file: 'events', title: 'กิจกรรม' },
    'event-detail': { file: 'event-detail', title: 'รายละเอียดกิจกรรม' },
    news: { file: 'news', title: 'ข่าวสาร' },
    about: { file: 'about', title: 'เกี่ยวกับเรา' },
    contact: { file: 'contact', title: 'ติดต่อเรา' },
    admin: { file: 'admin', title: 'Admin Backoffice', auth: true, admin: true }
  };
}

function getSchema() {
  return {
    Users: ['id', 'email', 'password', 'token', 'title', 'firstName', 'lastName', 'name', 'profileUrl', 'role', 'vipStatus', 'phone', 'facebookName', 'source', 'organization', 'createdAt', 'lastLoginAt', 'updatedAt'],
    Courses: ['id', 'title', 'description', 'instructor', 'hours', 'price', 'type', 'category', 'coverFileId', 'coverUrl', 'documentFileId', 'videoUrl', 'status', 'featured', 'createdBy', 'createdAt', 'updatedAt'],
    Enrollments: ['id', 'userEmail', 'courseId', 'status', 'progress', 'hoursEarned', 'paymentId', 'certificateId', 'enrolledAt', 'completedAt', 'updatedAt', 'finalPrice'],
    Payments: ['id', 'userEmail', 'courseId', 'eventId', 'vipRequestId', 'amount', 'type', 'slipFileId', 'status', 'adminNote', 'createdAt', 'reviewedBy', 'reviewedAt'],
    VIPRequests: ['id', 'userEmail', 'title', 'firstName', 'lastName', 'name', 'phone', 'facebookName', 'organization', 'status', 'paymentId', 'adminNote', 'createdAt', 'reviewedBy', 'reviewedAt'],
    Certificates: ['id', 'certificateId', 'userEmail', 'recipientName', 'sourceType', 'sourceId', 'sourceTitle', 'hours', 'pdfFileId', 'qrFileId', 'status', 'issuedBy', 'issuedAt', 'revokedAt'],
    News: ['id', 'title', 'summary', 'content', 'category', 'imageFileId', 'imageUrl', 'pinned', 'published', 'expiresAt', 'createdBy', 'createdAt', 'updatedAt'],
    Events: ['id', 'title', 'description', 'speaker', 'location', 'startAt', 'endAt', 'capacity', 'price', 'type', 'imageFileId', 'imageUrl', 'documentFileId', 'status', 'createdBy', 'createdAt', 'updatedAt'],
    EventRegistrations: ['id', 'eventId', 'userEmail', 'name', 'phone', 'organization', 'status', 'paymentId', 'certificateId', 'createdAt', 'updatedAt'],
    Forms: ['id', 'title', 'description', 'formType', 'sourceType', 'sourceId', 'questionsJson', 'passingScore', 'status', 'createdBy', 'createdAt', 'updatedAt'],
    Responses: ['id', 'formId', 'userEmail', 'answersJson', 'score', 'passed', 'submittedAt'],
    Settings: ['key', 'value', 'updatedAt'],
    ActivityLogs: ['id', 'actorEmail', 'action', 'entityType', 'entityId', 'detail', 'createdAt'],
    Transcript: ['id', 'userEmail', 'sourceType', 'sourceId', 'sourceTitle', 'hours', 'certificateId', 'completedAt'],
    MediaLibrary: ['id', 'name', 'fileId', 'url', 'mimeType', 'size', 'category', 'createdBy', 'createdAt'],
    BroadcastEmails: ['id', 'subject', 'body', 'targetGroup', 'imageFileId', 'attachmentFileId', 'linkUrl', 'status', 'sentBy', 'createdAt', 'sentAt'],
    EmailLogs: ['id', 'to', 'subject', 'status', 'error', 'createdAt']
  };
}
