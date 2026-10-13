import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { InvoiceData } from "./types";

const MARGIN = 40;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ACCENT: [number, number, number] = [168, 53, 36];

export interface BuiltInvoice {
  blob: Blob;
  base64: string;
  filename: string;
}

function money(amount: number, currency: string): string {
  const value = Number(amount ?? 0);
  const safe = Number.isNaN(value) ? 0 : value;
  const formatted = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

function dateLabel(date: string | null | undefined): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function drawLogo(doc: jsPDF, dataUri: string | null | undefined, x: number, y: number): void {
  if (!dataUri) return;
  const format = dataUri.includes("image/png") ? "PNG" : "JPEG";
  try {
    doc.addImage(dataUri, format, x, y, 56, 56);
  } catch {
    // A malformed logo must not block the invoice; fall back to text-only header.
  }
}

export function buildInvoicePdf(data: InvoiceData): BuiltInvoice {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "normal");

  const logo = data.photographer.logoDataUri;
  drawLogo(doc, logo, MARGIN, MARGIN);
  const headerX = logo ? MARGIN + 68 : MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(data.photographer.name, headerX, MARGIN + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const contact = [data.photographer.address, data.photographer.phone, data.photographer.email, data.photographer.website]
    .filter((v): v is string => !!v && v.trim().length > 0);
  const wrappedContact = contact.flatMap((line) => doc.splitTextToSize(line, 260));
  let contactY = MARGIN + 28;
  wrappedContact.slice(0, 4).forEach((line) => {
    doc.text(line, headerX, contactY);
    contactY += 12;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...ACCENT);
  doc.text("INVOICE", PAGE_WIDTH - MARGIN, MARGIN + 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`No: ${data.invoiceNumber}`, PAGE_WIDTH - MARGIN, MARGIN + 34, { align: "right" });
  doc.text(`Date: ${dateLabel(data.issueDate)}`, PAGE_WIDTH - MARGIN, MARGIN + 46, { align: "right" });

  let y = Math.max(contactY, MARGIN + 62) + 10;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 22;

  const halfWidth = (CONTENT_WIDTH - 20) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("BILL TO", MARGIN, y);
  doc.text("BOOKING", MARGIN + halfWidth + 20, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const clientLines = [data.client.name, data.client.address, data.client.phone, data.client.email]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .flatMap((line) => doc.splitTextToSize(line, halfWidth));
  let clientY = y;
  clientLines.slice(0, 5).forEach((line) => {
    doc.text(line, MARGIN, clientY);
    clientY += 13;
  });

  const bookingLines = [
    data.bookingTitle,
    data.eventType,
    data.bookingDate ? `Date: ${dateLabel(data.bookingDate)}` : null,
  ].filter((v): v is string => !!v);
  let bookingY = y;
  bookingLines.forEach((line) => {
    doc.text(line, MARGIN + halfWidth + 20, bookingY);
    bookingY += 13;
  });

  y = Math.max(clientY, bookingY) + 16;

  const body = data.lines.map((line) => [
    line.label,
    line.type,
    dateLabel(line.dueDate),
    line.status ? line.status.toUpperCase() : "-",
    money(line.amount, data.currency),
    money(line.paid, data.currency),
  ]);

  autoTable(doc, {
    head: [["Description", "Type", "Due", "Status", "Amount", "Paid"]],
    body: body.length > 0 ? body : [["-", "-", "-", "-", money(0, data.currency), money(0, data.currency)]],
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    headStyles: { fillColor: ACCENT, textColor: 255, fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 6, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 150 },
      4: { halign: "right", cellWidth: 78 },
      5: { halign: "right", cellWidth: 78 },
    },
  });

  const afterTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  let totalY = (afterTable?.finalY ?? y) + 20;
  const labelX = PAGE_WIDTH - MARGIN - 150;
  const valueX = PAGE_WIDTH - MARGIN;

  const totals: Array<[string, string, boolean]> = [
    ["Total", money(data.total, data.currency), false],
    ["Paid", money(data.paid, data.currency), false],
    ["Balance Due", money(data.balance, data.currency), true],
  ];

  totals.forEach(([label, value, strong]) => {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 12 : 10);
    doc.setTextColor(...(strong ? ACCENT : ([70, 70, 70] as [number, number, number])));
    doc.text(label, labelX, totalY);
    doc.text(value, valueX, totalY, { align: "right" });
    totalY += strong ? 20 : 16;
  });

  if (data.notes && data.notes.trim()) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const note = doc.splitTextToSize(`Note: ${data.notes.trim()}`, CONTENT_WIDTH);
    doc.text(note, MARGIN, totalY + 8);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text("Thank you for your business.", MARGIN, 800);

  const filename = `Invoice-${data.invoiceNumber}.pdf`;
  const blob = doc.output("blob");
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return { blob, base64, filename };
}
