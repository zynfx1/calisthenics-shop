import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pool } from "./config/db";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await pool.query("SELECT 1"); // fail fast if the database is unreachable
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}/api/v1`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
