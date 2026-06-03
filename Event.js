function listEventsRaw(payload) {
  payload = payload || {};
  return listRows('Events', function(row) {
    if (!payload.includeDrafts && row.status && row.status !== 'published') return false;
    if (payload.type && row.type !== payload.type) return false;
    return true;
  }).sort(function(a, b) { return String(a.startAt).localeCompare(String(b.startAt)); });
}

function getEventRaw(payload) {
  requireFields(payload, ['id']);
  const event = findById('Events', payload.id);
  if (!event) throw new Error('ไม่พบกิจกรรม');
  const count = listRows('EventRegistrations', function(row) { return row.eventId === event.id; }).length;
  return { event: event, registered: count, payment: APP.payment };
}

function saveEventRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['title', 'description', 'speaker', 'location', 'startAt', 'capacity', 'type']);
  const record = {
    title: payload.title,
    description: payload.description,
    speaker: payload.speaker,
    location: payload.location,
    startAt: payload.startAt,
    endAt: payload.endAt || '',
    capacity: toNumber(payload.capacity),
    price: toNumber(payload.price),
    type: payload.type,
    imageFileId: payload.imageFileId || '',
    imageUrl: payload.imageUrl || '',
    documentFileId: payload.documentFileId || '',
    status: payload.status || 'published',
    updatedAt: nowIso()
  };
  if (payload.id) {
    const updated = updateRow('Events', payload.id, record);
    logActivity('edit_event', 'Events', payload.id, record.title);
    return updated;
  }
  record.id = newId('EVT');
  record.createdBy = admin.email;
  record.createdAt = nowIso();
  appendRow('Events', record);
  logActivity('create_event', 'Events', record.id, record.title);
  return record;
}

function registerEventRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['eventId', 'name', 'phone', 'organization']);
  const event = findById('Events', payload.eventId);
  if (!event) throw new Error('ไม่พบกิจกรรม');
  const registered = listRows('EventRegistrations', function(row) { return row.eventId === event.id; });
  if (toNumber(event.capacity) > 0 && registered.length >= toNumber(event.capacity)) throw new Error('ที่นั่งเต็มแล้ว');
  const existing = registered.find(function(row) { return normalizeEmail(row.userEmail) === normalizeEmail(user.email); });
  if (existing) return existing;
  if (event.type === 'vip' && user.vipStatus !== 'approved' && !isAdminRole(user.role)) throw new Error('กิจกรรมนี้สำหรับ VIP');
  const paymentRequired = event.type === 'paid' || toNumber(event.price) > 0;
  const registration = {
    id: newId('REG'),
    eventId: event.id,
    userEmail: user.email,
    name: payload.name,
    phone: payload.phone,
    organization: payload.organization,
    status: paymentRequired ? 'pending_payment' : 'confirmed',
    paymentId: '',
    certificateId: '',
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  appendRow('EventRegistrations', registration);
  logActivity('register_event', 'Events', event.id, event.title);
  return registration;
}

function listEventRegistrationsRaw(payload) {
  requireAdmin();
  requireFields(payload, ['eventId']);
  return listRows('EventRegistrations', function(row) { return row.eventId === payload.eventId; });
}

function issueEventCertificateRaw(payload) {
  requireFields(payload, ['registrationId']);
  return issueEventCertificate(payload.registrationId);
}

function issueEventCertificate(registrationId) {
  const admin = requireAdmin();
  const registration = findById('EventRegistrations', registrationId);
  if (!registration) throw new Error('ไม่พบรายการลงทะเบียน');
  const event = findById('Events', registration.eventId);
  const cert = issueCertificateInternal({
    userEmail: registration.userEmail,
    recipientName: registration.name,
    sourceType: 'event',
    sourceId: event.id,
    sourceTitle: event.title,
    hours: '',
    issuedBy: admin.email
  });
  updateRow('EventRegistrations', registration.id, { certificateId: cert.certificateId });
  appendTranscript(registration.userEmail, 'event', event.id, event.title, 0, cert.certificateId);
  return cert;
}
