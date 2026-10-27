/**
 * SỔ LUYỆN HSK – máy chủ nhỏ chạy trên Google Apps Script.
 * Lưu tài khoản học sinh, tiến độ, câu hỏi và bài ghi âm vào Google Sheets / Google Drive của giáo viên.
 *
 * CÀI ĐẶT: xem file HUONG-DAN.pdf / hướng dẫn trong tin nhắn.
 * Chỉ cần sửa 2 dòng dưới đây.
 */
const ADMIN_PASSWORD = 'DOI-MAT-KHAU-NAY';          // Mật khẩu vào trang quản lý của giáo viên
const TEACHER_EMAIL  = 'tthanhthuypham@gmail.com';  // Email nhận thông báo khi học sinh gửi câu hỏi / ghi âm

/* ======================================================================= */
const SHEETS = {
  students: ['username','name','class','salt','hash','token','tokenExp','created','lastSeen','active'],
  progress: ['time','username','book','lesson','part','score','total'],
  questions:['id','time','username','name','book','lesson','part','message','reply','replyTime'],
  records:  ['id','time','username','name','book','lesson','fileId','url','score','comment'],
};
const TOKEN_DAYS = 60;
const REC_FOLDER = 'Sổ luyện HSK – Bài ghi âm';

function doGet() {
  return out_({ ok: true, service: 'so-luyen-hsk', time: new Date().toISOString() });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Yêu cầu không hợp lệ.' }); }
  try {
    const fn = API[req.action];
    if (!fn) return out_({ ok: false, error: 'Không có chức năng này.' });
    return out_(fn(req));
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------ helpers -------------------------------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), SHEETS[name].length).setNumberFormat('@');
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function rows_(name) {
  const sh = sheet_(name), n = sh.getLastRow();
  if (n < 2) return [];
  const cols = SHEETS[name];
  return sh.getRange(2, 1, n - 1, cols.length).getValues().map((r, i) => {
    const o = { _row: i + 2 }; cols.forEach((c, j) => o[c] = r[j]); return o;
  });
}
function append_(name, obj) {
  const sh = sheet_(name);
  sh.appendRow(SHEETS[name].map(c => obj[c] === undefined ? '' : obj[c]));
}
function set_(name, row, obj) {
  const sh = sheet_(name), cols = SHEETS[name];
  Object.keys(obj).forEach(k => { const j = cols.indexOf(k); if (j >= 0) sh.getRange(row, j + 1).setValue(obj[k]); });
}
function hash_(salt, pw) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw, Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function uid_() { return Utilities.getUuid().replace(/-/g, ''); }
function now_() { return new Date().toISOString(); }
function locked_(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function clean_(s, max) { return String(s == null ? '' : s).slice(0, max || 2000); }

function student_(token) {
  if (!token) throw new Error('Em cần đăng nhập lại.');
  const s = rows_('students').find(r => r.token === token);
  if (!s || String(s.active) === 'false') throw new Error('Phiên đăng nhập đã hết hạn, em đăng nhập lại nhé.');
  if (new Date(s.tokenExp) < new Date()) throw new Error('Phiên đăng nhập đã hết hạn, em đăng nhập lại nhé.');
  return s;
}
function admin_(token) {
  const p = PropertiesService.getScriptProperties();
  const t = p.getProperty('adminToken'), exp = p.getProperty('adminExp');
  if (!token || token !== t || new Date(exp) < new Date()) throw new Error('Phiên quản lý đã hết hạn, cô đăng nhập lại nhé.');
}
function slug_(name) {
  const s = String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!s.length) return 'hs';
  const given = s[s.length - 1], initials = s.slice(0, -1).map(w => w[0]).join('');
  return given + initials;
}
function pin_() { let p = ''; for (let i = 0; i < 6; i++) p += Math.floor(Math.random() * 10); return p; }
function bestProgress_(filterUser) {
  const best = {};
  rows_('progress').forEach(r => {
    if (filterUser && r.username !== filterUser) return;
    const key = [r.username, r.book || 'hsk2', r.lesson, r.part].join('|');
    const sc = Number(r.score), tt = Number(r.total), pct = tt ? sc / tt : 0, at = String(r.time);
    const cur = best[key];
    if (!cur) { best[key] = { s: sc, t: tt, pct: pct, at: at, n: 1 }; return; }
    cur.n++; if (at > cur.at) cur.at = at;
    if (pct > cur.pct) { cur.s = sc; cur.t = tt; cur.pct = pct; }
  });
  return best;
}

/* -------------------------------- API ---------------------------------- */
const API = {
  /* ---- học sinh ---- */
  login(q) {
    return locked_(() => {
      const u = clean_(q.u, 60).trim().toLowerCase();
      const s = rows_('students').find(r => String(r.username).toLowerCase() === u);
      if (!s || String(s.active) === 'false' || hash_(s.salt, clean_(q.p, 100)) !== s.hash) return { ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu.' };
      const token = uid_(), exp = new Date(Date.now() + TOKEN_DAYS * 864e5).toISOString();
      set_('students', s._row, { token: token, tokenExp: exp, lastSeen: now_() });
      return { ok: true, token: token, user: { u: s.username, name: s.name, cls: s.class } };
    });
  },
  me(q) {
    const s = student_(q.token);
    const best = bestProgress_(s.username), progress = {};
    Object.keys(best).forEach(k => {
      const [, book, lesson, part] = k.split('|');
      const key = book + ':' + lesson;
      (progress[key] = progress[key] || {})[part] = [best[k].s, best[k].t, best[k].at];
    });
    const questions = rows_('questions').filter(r => r.username === s.username)
      .map(r => ({ id: r.id, time: r.time, book: r.book, lesson: r.lesson, part: r.part, message: r.message, reply: r.reply, replyTime: r.replyTime }));
    const records = rows_('records').filter(r => r.username === s.username)
      .map(r => ({ id: r.id, time: r.time, book: r.book, lesson: r.lesson, score: r.score, comment: r.comment }));
    set_('students', s._row, { lastSeen: now_() });
    return { ok: true, user: { u: s.username, name: s.name, cls: s.class }, progress: progress, questions: questions, records: records };
  },
  progress(q) {
    const s = student_(q.token);
    const score = Number(q.s), total = Number(q.t);
    if (!(total > 0) || !(score >= 0) || score > total) return { ok: false, error: 'Điểm không hợp lệ.' };
    locked_(() => append_('progress', { time: now_(), username: s.username, book: clean_(q.book || 'hsk2', 20), lesson: Number(q.lesson), part: clean_(q.part, 20), score: score, total: total }));
    return { ok: true };
  },
  ask(q) {
    const s = student_(q.token);
    const msg = clean_(q.message, 3000).trim();
    if (!msg) return { ok: false, error: 'Em hãy viết câu hỏi.' };
    const row = { id: uid_(), time: now_(), username: s.username, name: s.name, book: clean_(q.book || 'hsk2', 20), lesson: Number(q.lesson) || '', part: clean_(q.part, 200), message: msg };
    locked_(() => append_('questions', row));
    try {
      MailApp.sendEmail(TEACHER_EMAIL, '[Sổ luyện HSK] Câu hỏi của ' + s.name + (row.lesson ? ' – bài ' + row.lesson : ''),
        'Học sinh: ' + s.name + ' (' + s.username + ')\nBài: ' + (row.lesson || 'chung') + '\nPhần/câu: ' + (row.part || '-') + '\n\n' + msg +
        '\n\nTrả lời trong trang quản lý giáo viên để học sinh thấy câu trả lời.');
    } catch (err) {}
    return { ok: true, id: row.id };
  },
  record(q) {
    const s = student_(q.token);
    if (!q.data) return { ok: false, error: 'Không có file ghi âm.' };
    const bytes = Utilities.base64Decode(q.data);
    if (bytes.length > 25 * 1024 * 1024) return { ok: false, error: 'File quá lớn (tối đa 25MB).' };
    const folders = DriveApp.getFoldersByName(REC_FOLDER);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(REC_FOLDER);
    const ext = (clean_(q.fname, 200).match(/\.[a-z0-9]{1,5}$/i) || ['.m4a'])[0];
    const fname = 'Bai' + q.lesson + '_' + s.username + '_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmm') + ext;
    const file = folder.createFile(Utilities.newBlob(bytes, clean_(q.mime, 100) || 'audio/mp4', fname));
    const row = { id: uid_(), time: now_(), username: s.username, name: s.name, book: clean_(q.book || 'hsk2', 20), lesson: Number(q.lesson) || '', fileId: file.getId(), url: file.getUrl() };
    locked_(() => append_('records', row));
    try {
      MailApp.sendEmail(TEACHER_EMAIL, '[Sổ luyện HSK] Bài ghi âm của ' + s.name + ' – bài ' + row.lesson,
        'Học sinh ' + s.name + ' vừa gửi bài ghi âm đọc theo bài ' + row.lesson + '.\nNghe tại: ' + row.url + '\n\nChấm điểm trong trang quản lý giáo viên.');
    } catch (err) {}
    return { ok: true, id: row.id };
  },
  changePassword(q) {
    const s = student_(q.token);
    if (hash_(s.salt, clean_(q.old, 100)) !== s.hash) return { ok: false, error: 'Mật khẩu cũ không đúng.' };
    const np = clean_(q.new, 100);
    if (np.length < 4) return { ok: false, error: 'Mật khẩu mới cần ít nhất 4 ký tự.' };
    const salt = uid_();
    locked_(() => set_('students', s._row, { salt: salt, hash: hash_(salt, np) }));
    return { ok: true };
  },

  /* ---- giáo viên ---- */
  adminLogin(q) {
    if (ADMIN_PASSWORD === 'DOI-MAT-KHAU-NAY') return { ok: false, error: 'Cô cần đổi ADMIN_PASSWORD trong mã Apps Script trước khi dùng.' };
    if (clean_(q.p, 200) !== ADMIN_PASSWORD) { Utilities.sleep(800); return { ok: false, error: 'Sai mật khẩu quản lý.' }; }
    const t = uid_();
    PropertiesService.getScriptProperties().setProperties({ adminToken: t, adminExp: new Date(Date.now() + 7 * 864e5).toISOString() });
    return { ok: true, token: t };
  },
  adminOverview(q) {
    admin_(q.token);
    const students = rows_('students').filter(r => String(r.active) !== 'false')
      .map(r => ({ u: r.username, name: r.name, cls: r.class, created: r.created, lastSeen: r.lastSeen }));
    const best = bestProgress_(null), progress = {};
    Object.keys(best).forEach(k => {
      const [u, book, lesson, part] = k.split('|');
      ((progress[u] = progress[u] || {})[book + ':' + lesson] = progress[u][book + ':' + lesson] || {})[part] = [best[k].s, best[k].t, best[k].at, best[k].n];
    });
    const questions = rows_('questions').map(r => ({ id: r.id, time: r.time, u: r.username, name: r.name, book: r.book, lesson: r.lesson, part: r.part, message: r.message, reply: r.reply, replyTime: r.replyTime }));
    const records = rows_('records').map(r => ({ id: r.id, time: r.time, u: r.username, name: r.name, book: r.book, lesson: r.lesson, url: r.url, score: r.score, comment: r.comment }));
    return { ok: true, students: students, progress: progress, questions: questions, records: records };
  },
  adminCreate(q) {
    admin_(q.token);
    const list = (q.students || []).slice(0, 200);
    return locked_(() => {
      const existing = new Set(rows_('students').map(r => String(r.username).toLowerCase()));
      const made = [];
      list.forEach(it => {
        const name = clean_(it.name, 100).trim(); if (!name) return;
        let base = slug_(name), u = base, i = 2;
        while (existing.has(u)) u = base + (i++);
        existing.add(u);
        const pw = pin_(), salt = uid_();
        append_('students', { username: u, name: name, class: clean_(it.cls, 50), salt: salt, hash: hash_(salt, pw), created: now_(), active: true });
        made.push({ u: u, name: name, cls: clean_(it.cls, 50), p: pw });
      });
      return { ok: true, created: made };
    });
  },
  adminReset(q) {
    admin_(q.token);
    return locked_(() => {
      const s = rows_('students').find(r => r.username === q.u);
      if (!s) return { ok: false, error: 'Không tìm thấy học sinh.' };
      const pw = pin_(), salt = uid_();
      set_('students', s._row, { salt: salt, hash: hash_(salt, pw), token: '' });
      return { ok: true, u: s.username, name: s.name, p: pw };
    });
  },
  adminDelete(q) {
    admin_(q.token);
    return locked_(() => {
      const s = rows_('students').find(r => r.username === q.u);
      if (!s) return { ok: false, error: 'Không tìm thấy học sinh.' };
      set_('students', s._row, { active: false, token: '' });
      return { ok: true };
    });
  },
  adminReply(q) {
    admin_(q.token);
    return locked_(() => {
      const r = rows_('questions').find(x => x.id === q.id);
      if (!r) return { ok: false, error: 'Không tìm thấy câu hỏi.' };
      set_('questions', r._row, { reply: clean_(q.reply, 3000), replyTime: now_() });
      return { ok: true };
    });
  },
  adminGrade(q) {
    admin_(q.token);
    return locked_(() => {
      const r = rows_('records').find(x => x.id === q.id);
      if (!r) return { ok: false, error: 'Không tìm thấy bài ghi âm.' };
      set_('records', r._row, { score: clean_(q.score, 20), comment: clean_(q.comment, 2000) });
      return { ok: true };
    });
  },
};

/** Chạy hàm này một lần trong trình soạn thảo Apps Script để cấp quyền và tạo sẵn các trang tính. */
function setup() {
  Object.keys(SHEETS).forEach(sheet_);
  const def = ss_().getSheetByName('Sheet1') || ss_().getSheetByName('Trang tính1');
  if (def && def.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(def);
  const f = DriveApp.getFoldersByName(REC_FOLDER); if (!f.hasNext()) DriveApp.createFolder(REC_FOLDER);
  Logger.log('Xong. Các trang tính: ' + Object.keys(SHEETS).join(', '));
}
