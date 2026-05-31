import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, { extension: string; signatures: number[][] }> = {
  'image/jpeg': { extension: 'jpg', signatures: [[0xff, 0xd8, 0xff]] },
  'image/png': { extension: 'png', signatures: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { extension: 'webp', signatures: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { extension: 'gif', signatures: [[0x47, 0x49, 0x46, 0x38]] },
};

function hasCloudinaryConfig() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function matchesSignature(bytes: Uint8Array, signatures: number[][]) {
  return signatures.some((signature) => signature.every((byte, index) => bytes[index] === byte));
}

export async function saveProductImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const imageType = ALLOWED_IMAGE_TYPES[file.type];
  if (!imageType) {
    throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Product image must be 5MB or smaller.');
  }

  if (!hasCloudinaryConfig()) {
    throw new Error('Cloudinary image upload is not configured.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(buffer, imageType.signatures)) {
    throw new Error('Uploaded file does not match the selected image format.');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'maison-elara/products',
    public_id: `${Date.now()}-${randomUUID()}`,
    resource_type: 'image',
    overwrite: false,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { flags: 'strip_profile' },
    ],
  });

  return result.secure_url;
}
