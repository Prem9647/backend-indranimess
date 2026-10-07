const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { ROOMS } = require("./rooms");

// Two channels only:
//  - "kitchen": public, unauthenticated, read-only — the KDS has no login.
//  - "dashboard": authenticated staff only, JWT verified on handshake. Open
//    to waiter/manager/admin — every payload emitted into this room today
//    (order id/status, item delivery progress) is already something a
//    waiter can read over REST, so there's no privacy boundary to enforce
//    here. If manager-only data (e.g. revenue) ever gets emitted into this
//    same stream, split a dedicated room off before that happens.
// See .claude/skills/authentication/skill.md for why the KDS stays open.
function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const auth = socket.handshake.auth;

    if (auth.channel === "kitchen") {
      return next();
    }

    if (auth.channel === "dashboard") {
      try {
        const payload = jwt.verify(auth.token ?? "", env.jwtSecret);
        if (!["waiter", "manager", "admin"].includes(payload.role)) {
          return next(new Error("FORBIDDEN"));
        }
        socket.data.user = payload;
        return next();
      } catch {
        return next(new Error("UNAUTHORIZED"));
      }
    }

    next(new Error("UNKNOWN_CHANNEL"));
  });

  io.on("connection", (socket) => {
    const auth = socket.handshake.auth;

    if (auth.channel === "kitchen") {
      socket.join(ROOMS.KITCHEN);
    } else if (auth.channel === "dashboard") {
      socket.join(ROOMS.DASHBOARD_MANAGER);
    }
  });
}

module.exports = { registerSocketHandlers };
