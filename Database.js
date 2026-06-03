function getSpreadsheet() {
  return SpreadsheetApp.openById(APP.spreadsheetId);
}

function setupDatabase() {
  const ss = getSpreadsheet();
  const schema = getSchema();
  Object.keys(schema).forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = schema[name];
    const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    const missing = headers.filter(function(header) { return current.indexOf(header) === -1; });
    if (sheet.getLastRow() === 0 || current[0] === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else if (missing.length) {
      sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    }
    sheet.setFrozenRows(1);
  });
  ensureDefaultSettings();
  ensureSuperAdmin();
  installOfficialAssets();
  logActivity('setup_database', 'System', 'database', 'Created or updated required sheets');
  return true;
}

function getSheet(name) {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    setupDatabase();
    const created = getSpreadsheet().getSheetByName(name);
    if (!created) throw new Error('ไม่พบชีต ' + name);
    return created;
  }
  return sheet;
}

const DB_CACHE = {};
const HEADER_CACHE = {};

function getHeaders(name) {
  if (HEADER_CACHE[name]) return HEADER_CACHE[name];
  const sheet = getSheet(name);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String);
  HEADER_CACHE[name] = headers;
  return headers;
}

function getCacheChunked(cache, key) {
  const chunksStr = cache.get(key + '_chunks');
  if (!chunksStr) return null;
  const chunks = parseInt(chunksStr, 10);
  if (chunks === 1) return cache.get(key);
  let result = '';
  for (let i = 0; i < chunks; i++) {
    const chunk = cache.get(key + '_' + i);
    if (chunk === null) return null;
    result += chunk;
  }
  return result;
}

function putCacheChunked(cache, key, value, expiration) {
  const chunkSize = 90000;
  if (value.length <= chunkSize) {
    cache.put(key, value, expiration);
    cache.put(key + '_chunks', '1', expiration);
    return;
  }
  const chunks = Math.ceil(value.length / chunkSize);
  cache.put(key + '_chunks', String(chunks), expiration);
  for (let i = 0; i < chunks; i++) {
    cache.put(key + '_' + i, value.substring(i * chunkSize, (i + 1) * chunkSize), expiration);
  }
}

function readRows(name) {
  if (DB_CACHE[name]) return DB_CACHE[name];
  const cache = CacheService.getScriptCache();
  const cachedJson = getCacheChunked(cache, 'DB_ROWS_' + name);
  if (cachedJson) {
    try {
      const data = JSON.parse(cachedJson);
      DB_CACHE[name] = data;
      return data;
    } catch(e) {}
  }
  
  const sheet = getSheet(name);
  const lastRow = sheet.getLastRow();
  const headers = getHeaders(name);
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const data = values.map(function(row, index) {
    const obj = { _row: index + 2 };
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    return obj;
  });
  
  DB_CACHE[name] = data;
  try {
    const json = JSON.stringify(data);
    putCacheChunked(cache, 'DB_ROWS_' + name, json, 300);
  } catch(e) {}
  
  return data;
}

function clearDBCache(name) {
  delete DB_CACHE[name];
  const cache = CacheService.getScriptCache();
  const chunksStr = cache.get('DB_ROWS_' + name + '_chunks');
  if (chunksStr) {
    const chunks = parseInt(chunksStr, 10);
    if (chunks === 1) cache.remove('DB_ROWS_' + name);
    else {
      for (let i = 0; i < chunks; i++) cache.remove('DB_ROWS_' + name + '_' + i);
    }
    cache.remove('DB_ROWS_' + name + '_chunks');
  }
}

function appendRow(name, record) {
  const sheet = getSheet(name);
  const headers = getHeaders(name);
  const row = headers.map(function(header) { return record[header] == null ? '' : record[header]; });
  sheet.appendRow(row);
  clearDBCache(name);
  return Object.assign({}, record);
}

function updateRow(name, idOrKey, patch, keyField) {
  keyField = keyField || 'id';
  const rows = readRows(name);
  const row = rows.find(function(item) { return String(item[keyField]) === String(idOrKey); });
  if (!row) throw new Error('ไม่พบข้อมูลใน ' + name);
  const updated = Object.assign({}, row, patch, { updatedAt: patch.updatedAt || nowIso() });
  const headers = getHeaders(name);
  getSheet(name).getRange(row._row, 1, 1, headers.length).setValues([headers.map(function(header) {
    return updated[header] == null ? '' : updated[header];
  })]);
  clearDBCache(name);
  return stripInternal(updated);
}

function deleteRow(name, id, keyField) {
  keyField = keyField || 'id';
  const row = readRows(name).find(function(item) { return String(item[keyField]) === String(id); });
  if (!row) throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
  getSheet(name).deleteRow(row._row);
  clearDBCache(name);
  return true;
}

function findById(name, id, keyField) {
  keyField = keyField || 'id';
  const row = readRows(name).find(function(item) { return String(item[keyField]) === String(id); });
  return row ? stripInternal(row) : null;
}

function stripInternal(row) {
  const clean = Object.assign({}, row);
  delete clean._row;
  return clean;
}

function listRows(name, predicate) {
  const rows = readRows(name).map(stripInternal);
  return predicate ? rows.filter(predicate) : rows;
}

function getSettingsMap() {
  const map = {};
  try {
    readRows('Settings').forEach(function(row) { map[row.key] = row.value; });
  } catch (err) {}
  return map;
}

function getSetting(key) {
  return getSettingsMap()[key] || '';
}

function setSetting(key, value) {
  const existing = readRows('Settings').find(function(row) { return row.key === key; });
  if (existing) return updateRow('Settings', key, { value: value, updatedAt: nowIso() }, 'key');
  return appendRow('Settings', { key: key, value: value, updatedAt: nowIso() });
}

function ensureDefaultSettings() {
  const defaults = {
    siteName: APP.name,
    subtitle: APP.subtitle,
    logoUrl: APP.logoUrl,
    paymentQrUrl: APP.paymentQrUrl,
    paymentBank: APP.payment.bank,
    paymentAccountNumber: APP.payment.accountNumber,
    paymentPromptPay: APP.payment.promptPay,
    paymentAccountName: APP.payment.accountName,
    publishedUrl: ''
  };
  Object.keys(defaults).forEach(function(key) {
    if (!getSetting(key)) setSetting(key, defaults[key]);
  });
}
