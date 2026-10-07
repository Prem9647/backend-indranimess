const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config/env");
const routes = require("./routes");
const { errorMiddleware } = require("./middleware/error.middleware");
const { notFoundMiddleware } = require("./middleware/notFound.middleware");

function createApp() {
  const app = express();

  app.use(cors({
    origin: env.nodeEnv === "production" ? env.clientOrigin : true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => res.status(200).json({ success: true, data: { status: "ok" } }));

  app.use("/api", routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
