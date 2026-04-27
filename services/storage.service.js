// This file handles all Cloudflare R2 storage operations.
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-marketing-bucket';

// ─── Maximum signed URL validity: 15 minutes ──────────────────────────────────
// IMPORTANT: The R2 bucket itself must be set to PRIVATE in Cloudflare dashboard.
// No file should ever be directly accessible via a public URL.
const SIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

/**
 * Upload a file to R2 (bucket must be private — no public access).
 * Returns only the file KEY, NOT a public URL.
 * Callers must use getPresignedUrl() to get a time-limited access URL.
 */
const uploadToR2 = async (fileKey, body, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return only the key — never a public URL.
    // File access must always go through getPresignedUrl().
    console.log(`[StorageService] Uploaded: ${fileKey}`);
    return fileKey;
  } catch (error) {
    console.error('[StorageService] Upload Error:', error);
    throw error;
  }
};

/**
 * Generate a signed URL for viewing private R2 files.
 * Expires in 15 minutes. Never expose the raw bucket URL.
 */
const getPresignedUrl = async (fileKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
    console.log(`[StorageService] Signed URL generated for: ${fileKey} (expires ${SIGNED_URL_EXPIRY_SECONDS}s)`);
    return url;
  } catch (error) {
    console.error('[StorageService] Signed URL Error:', error);
    throw error;
  }
};

module.exports = {
  uploadToR2,
  getPresignedUrl
};
