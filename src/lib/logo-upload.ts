import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Saves an uploaded logo to local disk and returns its public URL.
 * Local disk is fine for this dev/demo setup — swap for S3/Cloudinary in production
 * (multiple app instances won't share this filesystem).
 */
export async function saveLogoFile(file: File, slug: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Logo must be a PNG, JPEG, WebP, or SVG image");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Logo must be smaller than 2MB");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const filename = `${slug}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return `/uploads/logos/${filename}`;
}
