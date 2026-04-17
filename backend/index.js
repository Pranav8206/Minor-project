import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: resolve(__dirname, "../.env"),
  override: true,
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

try {
  await connectDB();

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
} catch (err) {
  console.log("Error:", err);
}