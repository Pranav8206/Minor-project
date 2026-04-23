import fs from "node:fs";
import path from "node:path";

import multer from "multer";

const uploadsRoot = path.resolve("uploads");
const evidenceUploadsDir = path.join(uploadsRoot, "evidence");

if (!fs.existsSync(evidenceUploadsDir)) {
  fs.mkdirSync(evidenceUploadsDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, evidenceUploadsDir);
  },
  filename: (req, file, callback) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    callback(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const fileFilter = (req, file, callback) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    return callback(null, true);
  }

  return callback(new Error("Only image and PDF files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;