import { isNativeApp } from "@/lib/platform";
import { buildInvoicePdf } from "./template";
import type { InvoiceData } from "./types";

export type ShareOutcome = "shared" | "downloaded";

interface ShareMeta {
  title: string;
  text: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function shareNative(base64: string, filename: string, meta: ShareMeta): Promise<void> {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const written = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({
    title: meta.title,
    text: meta.text,
    files: [written.uri],
    dialogTitle: "Send invoice",
  });
}

export function downloadInvoice(data: InvoiceData): void {
  const { blob, filename } = buildInvoicePdf(data);
  downloadBlob(blob, filename);
}

export async function shareInvoice(data: InvoiceData): Promise<ShareOutcome> {
  const { blob, base64, filename } = buildInvoicePdf(data);
  const meta: ShareMeta = {
    title: `Invoice ${data.invoiceNumber}`,
    text: `Invoice from ${data.photographer.name}`,
  };

  if (isNativeApp()) {
    await shareNative(base64, filename, meta);
    return "shared";
  }

  const file = new File([blob], filename, { type: "application/pdf" });
  if (
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === "function"
  ) {
    await navigator.share({ files: [file], title: meta.title, text: meta.text });
    return "shared";
  }

  downloadBlob(blob, filename);
  return "downloaded";
}
