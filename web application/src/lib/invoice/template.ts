import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { InvoiceData, InvoiceSection } from "./types";

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

function lastTableY(doc: jsPDF, fallback: number): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return last?.finalY ?? fallback;
}

const CHIP_FILL: [number, number, number] = [251, 245, 232];
const LABEL_GREY: [number, number, number] = [120, 120, 120];

const CARD_PAD = 10;
const CARD_TITLE_H = 18;
const CARD_COL_GAP = 10;
const CARD_ROW_H = 30;
const CARD_SECTION_TITLE_H = 16;
const CARD_SECTION_GAP = 8;

function packageCardHeight(sections: InvoiceSection[], maxColumns: number): number {
  let height = CARD_PAD + CARD_TITLE_H;
  sections.forEach((section, index) => {
    const columns = Math.min(section.columns, maxColumns);
    const rows = Math.ceil(section.fields.length / columns);
    height += CARD_SECTION_TITLE_H + rows * CARD_ROW_H;
    if (index < sections.length - 1) height += CARD_SECTION_GAP;
  });
  return height + CARD_PAD;
}

function drawPackageCard(
  doc: jsPDF,
  sections: InvoiceSection[],
  x: number,
  y: number,
  width: number,
  maxColumns: number,
): number {
  const height = packageCardHeight(sections, maxColumns);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.9);
  doc.roundedRect(x, y, width, height, 8, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("PACKAGE DETAILS", x + CARD_PAD, y + CARD_PAD + 6);

  const inner = width - CARD_PAD * 2;
  let cy = y + CARD_PAD + CARD_TITLE_H;

  sections.forEach((section, index) => {
    const columns = Math.min(section.columns, maxColumns);
    const colWidth = (inner - CARD_COL_GAP * (columns - 1)) / columns;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text(section.title.toUpperCase(), x + CARD_PAD, cy);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(x + CARD_PAD, cy + 3, x + width - CARD_PAD, cy + 3);
    cy += CARD_SECTION_TITLE_H;

    let col = 0;
    section.fields.forEach((fld) => {
      const fx = x + CARD_PAD + col * (colWidth + CARD_COL_GAP);
      const empty = !fld.value || fld.value.trim().length === 0 || fld.value === "-";
      const valueText = empty ? "-" : fld.value;
      const valueY = cy + 11;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...LABEL_GREY);
      doc.splitTextToSize(fld.label, colWidth).slice(0, 1).forEach((line: string) => doc.text(line, fx, cy));

      doc.setFontSize(8.5);
      const chipWidth = fld.chip && !empty ? doc.getTextWidth(valueText) + 12 : Number.POSITIVE_INFINITY;
      if (chipWidth <= colWidth) {
        doc.setFillColor(...CHIP_FILL);
        doc.setDrawColor(...ACCENT);
        doc.setLineWidth(0.5);
        doc.roundedRect(fx, valueY - 8, chipWidth, 12, 3, 3, "FD");
        doc.setTextColor(40, 40, 40);
        doc.text(valueText, fx + 6, valueY);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(empty ? ([150, 150, 150] as [number, number, number]) : ([30, 30, 30] as [number, number, number])));
        doc.splitTextToSize(valueText, colWidth).forEach((line: string, i: number) => doc.text(line, fx, valueY + i * 10));
      }

      col += 1;
      if (col >= columns) {
        col = 0;
        cy += CARD_ROW_H;
      }
    });
    if (col !== 0) cy += CARD_ROW_H;
    if (index < sections.length - 1) cy += CARD_SECTION_GAP;
  });

  return y + height;
}

function drawTotals(doc: jsPDF, data: InvoiceData, labelX: number, valueX: number, startY: number): number {
  let totalY = startY;
  const totals: Array<[string, string]> = [
    ["Total", money(data.total, data.currency)],
    ["Paid", money(data.paid, data.currency)],
    ["Balance Due", money(data.balance, data.currency)],
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  totals.forEach(([label, value]) => {
    doc.text(label, labelX, totalY);
    doc.text(value, valueX, totalY, { align: "right" });
    totalY += 16;
  });
  return totalY;
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
    line.note && line.note.trim() ? `${line.type}\n${line.note.trim()}` : line.type,
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

  let bottomY = lastTableY(doc, y) + 24;
  const BAND_GAP = 24;

  if (data.package && data.package.length > 0) {
    const leftWidth = (CONTENT_WIDTH - BAND_GAP) / 2;
    const cardHeight = packageCardHeight(data.package, 2);
    if (bottomY + cardHeight > 780) {
      doc.addPage();
      bottomY = MARGIN;
    }
    drawPackageCard(doc, data.package, MARGIN, bottomY, leftWidth, 2);
    const totalsBottom = drawTotals(doc, data, MARGIN + leftWidth + BAND_GAP, PAGE_WIDTH - MARGIN, bottomY + 16);
    bottomY = Math.max(bottomY + cardHeight, totalsBottom);
  } else {
    bottomY = drawTotals(doc, data, PAGE_WIDTH - MARGIN - 150, PAGE_WIDTH - MARGIN, bottomY + 16);
  }

  if (data.notes && data.notes.trim()) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const note = doc.splitTextToSize(`Note: ${data.notes.trim()}`, CONTENT_WIDTH);
    doc.text(note, MARGIN, bottomY + 10);
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
