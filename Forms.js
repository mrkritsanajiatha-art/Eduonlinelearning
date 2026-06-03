function saveFormRaw(payload) {
  const admin = requireAdmin();
  requireFields(payload, ['title', 'formType', 'questions']);
  const record = {
    title: payload.title,
    description: payload.description || '',
    formType: payload.formType,
    sourceType: payload.sourceType || '',
    sourceId: payload.sourceId || '',
    questionsJson: JSON.stringify(payload.questions || []),
    passingScore: toNumber(payload.passingScore),
    status: payload.status || 'published',
    updatedAt: nowIso()
  };
  if (payload.id) {
    const updated = updateRow('Forms', payload.id, record);
    logActivity('edit_form', 'Forms', payload.id, record.title);
    return updated;
  }
  record.id = newId('FORM');
  record.createdBy = admin.email;
  record.createdAt = nowIso();
  appendRow('Forms', record);
  logActivity('create_form', 'Forms', record.id, record.title);
  return record;
}

function listFormsRaw(payload) {
  payload = payload || {};
  return listRows('Forms', function(row) {
    if (!payload.includeDrafts && row.status !== 'published') return false;
    if (payload.sourceType && row.sourceType !== payload.sourceType) return false;
    if (payload.sourceId && row.sourceId !== payload.sourceId) return false;
    return true;
  }).map(function(form) {
    form.questions = parseJson(form.questionsJson, []);
    return form;
  });
}

function submitFormResponseRaw(payload) {
  const user = ensureCurrentUser();
  requireFields(payload, ['formId', 'answers']);
  const form = findById('Forms', payload.formId);
  if (!form) throw new Error('ไม่พบแบบฟอร์ม');
  const questions = parseJson(form.questionsJson, []);
  const score = gradeAnswers(questions, payload.answers || {});
  const passed = toNumber(form.passingScore) ? score >= toNumber(form.passingScore) : true;
  const response = {
    id: newId('RESP'),
    formId: form.id,
    userEmail: user.email,
    answersJson: JSON.stringify(payload.answers || {}),
    score: score,
    passed: passed,
    submittedAt: nowIso()
  };
  appendRow('Responses', response);
  logActivity('submit_form', 'Forms', form.id, form.title);
  return response;
}

function gradeAnswers(questions, answers) {
  let total = 0;
  questions.forEach(function(q, index) {
    const key = q.id || String(index);
    if (q.correctAnswer !== undefined && String(answers[key]) === String(q.correctAnswer)) total++;
  });
  return total;
}
