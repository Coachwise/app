// Turns whatever the phone hands us into an avatar.
//
// A photo straight from the camera roll is typically 3–8 MB and 4000×3000, and
// it renders at about 96px. Uploading the original wastes the user's mobile data
// and our disk, and on a weak connection it's the difference between an upload
// that finishes and one that doesn't. So the photo is framed, cropped and shrunk
// here, before it ever leaves the phone: an 8 MB photo comes out around 60 KB.

/** Thrown when the browser can't decode the file — HEIC is the usual reason. */
export class UnsupportedImageError extends Error {}

/** The square we upload. Avatars never render anywhere near this large. */
export const AVATAR_SIZE = 512;

/** Working copy is capped here: big enough to crop a sharp 512 out of, small
 *  enough that a 12-megapixel photo doesn't hurt a cheap phone. */
const WORKING_MAX = 1600;

const TARGET_BYTES = 200 * 1024;
const QUALITIES = [0.85, 0.75, 0.62, 0.5];

/**
 * Decodes the file, honouring its EXIF orientation — without this, portrait
 * photos from a phone come out sideways, because the sensor writes them
 * landscape plus a "rotate me" flag.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older Safari rejects the options argument rather than the image itself.
    try {
      return await createImageBitmap(file);
    } catch {
      // Last resort: <img> applies EXIF orientation on its own.
      return await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new UnsupportedImageError(file.type || 'unknown image format'));
        };
        img.src = url;
      });
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** A decoded, upright, right-sized photo the cropper can display and cut from. */
export interface PreparedImage {
  url: string;
  width: number;
  height: number;
  /** Releases the object URL. Call when the cropper closes. */
  release: () => void;
}

/**
 * Decodes a picked file into something we can show and crop: upright (EXIF
 * applied), and scaled down so the cropper isn't dragging 12 megapixels around.
 *
 * Throws UnsupportedImageError for formats the browser can't read (iPhones shoot
 * HEIC by default, and no browser decodes it) — the caller should say so plainly
 * rather than let the upload fail for no visible reason.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const source = await decode(file);
  const sw = source.width;
  const sh = source.height;
  if (!sw || !sh) throw new UnsupportedImageError(file.type || 'unknown image format');

  const scale = Math.min(1, WORKING_MAX / Math.max(sw, sh));
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new UnsupportedImageError('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source) source.close();

  const blob = await toBlob(canvas, 0.92);
  if (!blob) throw new UnsupportedImageError('could not decode image');

  const url = URL.createObjectURL(blob);
  return { url, width, height, release: () => URL.revokeObjectURL(url) };
}

/**
 * Cuts a square out of the prepared image and encodes it, stepping the quality
 * down until the result is comfortably small. (sx, sy, side) are in the prepared
 * image's own pixels — which is what the cropper works in.
 */
export async function cropToAvatar(image: HTMLImageElement, sx: number, sy: number, side: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new UnsupportedImageError('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  for (const quality of QUALITIES) {
    const blob = await toBlob(canvas, quality);
    if (!blob) continue;
    if (blob.size <= TARGET_BYTES || quality === QUALITIES[QUALITIES.length - 1]) {
      return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    }
  }

  throw new UnsupportedImageError('could not encode image');
}
