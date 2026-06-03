function listNewsRaw(payload) {
  payload = payload || {};
  return listRows('News', function(row) {
    if (!payload.includeUnpublished && String(row.published) !== 'true' && row.published !== true) return false;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) return false;
    if (payload.category && row.category !== payload.category) return false;
    return true;
  }).sort(function(a, b) {
    return String(b.pinned).localeCompare(String(a.pinned)) || String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function getTickerNewsRaw() {
  return listNewsRaw({}).filter(function(row) { return toBool(row.pinned); }).slice(0, 5);
}

function saveNewsRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['title', 'summary', 'content', 'category']);
  const record = {
    title: payload.title,
    summary: payload.summary,
    content: payload.content,
    category: payload.category,
    imageFileId: payload.imageFileId || '',
    imageUrl: payload.imageUrl || '',
    pinned: toBool(payload.pinned),
    published: payload.published === undefined ? true : toBool(payload.published),
    expiresAt: payload.expiresAt || '',
    updatedAt: nowIso()
  };
  if (payload.id) {
    const updated = updateRow('News', payload.id, record);
    logActivity('edit_news', 'News', payload.id, record.title);
    return updated;
  }
  record.id = newId('NEWS');
  record.createdBy = admin.email;
  record.createdAt = nowIso();
  appendRow('News', record);
  logActivity('create_news', 'News', record.id, record.title);
  return record;
}

function deleteNewsRaw(payload) {
  requireAdmin();
  requireFields(payload, ['id']);
  deleteRow('News', payload.id);
  logActivity('delete_news', 'News', payload.id, '');
  return true;
}
