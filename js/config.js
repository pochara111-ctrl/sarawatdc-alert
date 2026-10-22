// ===== ตั้งค่าเว็บ =====
const API_URL = 'https://script.google.com/macros/s/AKfycbz6kAzKn9Wrb7IO8AHF51GwpODmI9gplvdYVxxOg7D0pGlGq0Y3H-WdcEb9Ekc1YL-O1g/exec';           // URL ลงท้าย /exec ที่ได้หลัง Deploy
const SCHOOL = { lat: 6.8695, lng: 101.2505, zoom: 18, radius: 450 };  // radius = รัศมีโรงเรียน (เมตร) ใช้เตือนเมื่อปักหมุดนอกโรงเรียน // พิกัดโรงเรียน (แก้เป็นของจริง)

let _busy = 0;
async function api(action, data = {}, quiet = false) {
  if (!quiet && window.UI) { _busy++; UI.bar(true); }
  try {
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action, ...data }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'error');
    return j;
  } catch (e) {
    if (e instanceof TypeError || e instanceof SyntaxError) throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่');
    throw e;
  } finally { if (!quiet && window.UI && --_busy <= 0) { _busy = 0; UI.bar(false); } }
}
