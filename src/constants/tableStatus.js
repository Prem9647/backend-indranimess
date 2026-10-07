// "reserved"/"maintenance" are manual admin overrides — the order lifecycle
// only ever sets "occupied" (order created) and "available" (order closed),
// see order.service.js. Waiters can only select "available" tables for a new
// order (see WaiterTablesScreen.js), so reserved/maintenance tables are
// automatically excluded from that flow.
const TABLE_STATUSES = ["available", "occupied", "reserved", "maintenance"];

module.exports = { TABLE_STATUSES };
