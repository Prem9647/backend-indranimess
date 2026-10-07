// Human-readable, sortable order number, e.g. ORD-20260907-003L or ORD-20260907-003D.
// Lunch (before 5:00 PM / 17:00) adds 'L', Dinner (5:00 PM onwards) adds 'D'.
function generateOrderNumber(sequenceToday, date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(sequenceToday).padStart(3, "0");
  const mealTag = date.getHours() < 17 ? "L" : "D";
  return `ORD-${y}${m}${d}-${seq}${mealTag}`;
}

module.exports = { generateOrderNumber };
