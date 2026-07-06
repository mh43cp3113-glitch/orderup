import { put } from "@vercel/blob";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Uploads a logo to Vercel Blob storage and returns its public URL.
 */
export async function saveLogoFile(file: File, slug: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Logo must be a PNG, JPEG, WebP, or SVG image");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Logo must be smaller than 2MB");
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const filename = `logos/${slug}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return blob.url;
}
