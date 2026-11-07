import jsPDF from 'jspdf';

export interface PdfSection {
  heading: string;
  /** label/value pairs, rendered one per line */
  rows: [label: string, value: string][];
}

const MARGIN = 14;
const LINE_HEIGHT = 6;
const PAGE_HEIGHT = 297; // A4 portrait, mm

/** Builds a simple multi-page PDF of label/value sections and triggers the browser download.
 *  No table/layout library — jsPDF's own text+pagination primitives are enough for a plain
 *  "here is your data" export; this isn't meant to be a styled document. */
export function exportPdf(filename: string, title: string, sections: PdfSection[]) {
  const doc = new jsPDF();
  let y = MARGIN;

  const ensureSpace = (lines = 1) => {
    if (y + lines * LINE_HEIGHT > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFontSize(16);
  doc.text(title, MARGIN, y);
  y += LINE_HEIGHT * 1.5;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleString(), MARGIN, y);
  doc.setTextColor(0);
  y += LINE_HEIGHT * 1.5;

  for (const section of sections) {
    ensureSpace(2);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.heading, MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (section.rows.length === 0) {
      ensureSpace();
      doc.setTextColor(120);
      doc.text('(none)', MARGIN, y);
      doc.setTextColor(0);
      y += LINE_HEIGHT;
    }

    for (const [label, value] of section.rows) {
      const wrapped = doc.splitTextToSize(`${label}: ${value}`, 180);
      ensureSpace(wrapped.length);
      doc.text(wrapped, MARGIN, y);
      y += LINE_HEIGHT * wrapped.length;
    }
    y += LINE_HEIGHT * 0.5;
  }

  doc.save(filename);
}
