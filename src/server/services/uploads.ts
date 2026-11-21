import "server-only";
import { COVER_MAX_BYTES, type COVER_MIME_TYPES } from "@/lib/constants";
import { prisma } from "../db";
import { HttpError } from "../http";

/**
 * Detects the real image type from magic bytes. The browser-supplied MIME type
 * and file extension are not trusted.
 */
export function sniffImageType(bytes: Uint8Array): (typeof COVER_MIME_TYPES)[number] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function saveCover(ownerId: string, file: File | null) {
  if (!file || typeof file === "string")
    throw new HttpError(422, "NO_FILE", "Choose an image to upload");
  if (file.size === 0) throw new HttpError(422, "EMPTY_FILE", "The file is empty");
  if (file.size > COVER_MAX_BYTES) {
    throw new HttpError(
      413,
      "FILE_TOO_LARGE",
      `The image is too large. Maximum size is ${COVER_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffImageType(bytes);
  if (!mimeType)
    throw new HttpError(415, "UNSUPPORTED_TYPE", "Only JPEG, PNG and WebP images are supported");

  const upload = await prisma.upload.create({
    data: { ownerId, mimeType, size: bytes.length, data: bytes },
    select: { id: true },
  });
  return { url: `/api/uploads/${upload.id}` };
}

export async function getUpload(id: string) {
  return prisma.upload.findUnique({
    where: { id },
    select: { data: true, mimeType: true, size: true },
  });
}
