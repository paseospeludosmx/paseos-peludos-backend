// utils/week.js
function getWeekStartISO(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  const diff = day === 0 ? -6 : 1 - day; // mover a lunes
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}
module.exports = { getWeekStartISO };
