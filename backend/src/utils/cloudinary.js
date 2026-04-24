import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

const ensureCloudinaryConfig = () => {
  if (isConfigured) {
    return;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
};

const uploadEvidenceFileToCloudinary = async (filePath, mimeType) => {
  ensureCloudinaryConfig();

  const resourceType = mimeType === "application/pdf" ? "raw" : "image";

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    folder: "cims/evidence",
    resource_type: resourceType,
  });

  return {
    url: uploadResult.secure_url,
    type: mimeType === "application/pdf" ? "pdf" : "image",
  };
};

const uploadImageFileToCloudinary = async (filePath, folder = "cims/images") => {
  ensureCloudinaryConfig();

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });

  return {
    url: uploadResult.secure_url,
    type: "image",
  };
};

export { uploadEvidenceFileToCloudinary, uploadImageFileToCloudinary };
