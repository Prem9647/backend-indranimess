const { createServer } = require("http");
const { Server } = require("socket.io");
const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { setIO } = require("./sockets/io");
const { registerSocketHandlers } = require("./sockets");

async function main() {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.nodeEnv === "production" ? env.clientOrigin : "*",
      credentials: true,
    },
  });
  setIO(io);
  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
