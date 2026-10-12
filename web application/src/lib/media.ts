import { Platform } from "react-native";

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_MAX_BYTES = 200 * 1024;

let cachedKey: CryptoKey | null = null;

function subtle(): SubtleCrypto {
  const s = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
  if (!s) {
    throw new Error("Web Crypto is not available on this platform.");
  }
  return s;
}

function decodeBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function encodeBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function avatarKeyBytes(): Uint8Array<ArrayBuffer> {
  const b64 = process.env.EXPO_PUBLIC_AVATAR_KEY;
  if (!b64) throw new Error("EXPO_PUBLIC_AVATAR_KEY is not configured. Profile images are disabled.");
  const key = decodeBase64(b64);
  if (key.length !== 32) throw new Error("EXPO_PUBLIC_AVATAR_KEY must be a base64-encoded 32-byte key.");
  return key;
}

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await (await subtle()).importKey("raw", avatarKeyBytes(), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  return cachedKey;
}

export interface EncryptedAvatar {
  data: string;
  mime: string;
}

export async function encryptAvatar(bytes: Uint8Array<ArrayBuffer>, mime: string): Promise<EncryptedAvatar> {
  const iv = new Uint8Array(12);
  (globalThis as { crypto?: Crypto }).crypto?.getRandomValues?.(iv);
  const cipherText = await (await subtle()).encrypt({ name: "AES-GCM", iv, tagLength: 128 }, await getKey(), bytes);
  const cipherBytes = new Uint8Array(cipherText);
  const payload = new Uint8Array(iv.length + cipherBytes.length);
  payload.set(iv, 0);
  payload.set(cipherBytes, iv.length);
  return { data: encodeBase64(payload), mime };
}

export async function decryptAvatar(data: string): Promise<string> {
  const payload = decodeBase64(data);
  if (payload.length < 28) throw new Error("Encrypted avatar payload is too short.");
  const iv = payload.slice(0, 12);
  const cipherText = payload.slice(12);
  const plain = await (await subtle()).decrypt({ name: "AES-GCM", iv, tagLength: 128 }, await getKey(), cipherText);
  return arrayBufferToBase64(plain);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function compressImageFile(file: File): Promise<{ bytes: Uint8Array<ArrayBuffer>; mime: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a canvas for image processing.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) throw new Error("Image compression failed.");
  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error(`Compressed image is ${Math.round(blob.size / 1024)}KB — must stay under 200KB.`);
  }
  return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/jpeg" };
}

export function avatarDataUri(data: string, mime: string): string {
  return `data:${mime};base64,${data}`;
}

export function canProcessAvatar(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof createImageBitmap === "function" &&
    Boolean((globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle)
  );
}