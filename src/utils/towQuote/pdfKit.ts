import type { jsPDF as JsPDF } from 'jspdf';
import { COMPANY, type CompanyInfo } from './company';

// Peças de layout compartilhadas pelos PDFs (orçamento e ordem de serviço),
// no visual do "Modelo Orçamento Cliente.pdf" da Renovo. Cada PDF é emitido por
// uma empresa (oficina ou guincho), passada em createPdf.

export type Rgb = [number, number, number];

export const RED: Rgb = [158, 27, 27];
export const TEXT: Rgb = [31, 41, 55];
export const MUTED: Rgb = [107, 114, 128];
export const BORDER: Rgb = [220, 223, 228];

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 14;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const RIGHT = PAGE_W - MARGIN;
const BOTTOM_LIMIT = PAGE_H - 14;

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

// Carrega uma imagem (logo local ou foto do Cloudinary) e reduz para no máximo
// maxSize px no maior lado, para o PDF não ficar pesado. JPEG para fotos, PNG
// quando precisa manter transparência (logo).
export async function loadImage(url: string, maxSize: number, format: 'jpeg' | 'png' = 'jpeg'): Promise<LoadedImage | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return {
      dataUrl: canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.82),
      width,
      height,
    };
  } catch (error) {
    console.error('Erro ao carregar imagem para o PDF:', url, error);
    return null;
  }
}

export const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');

// A API grava em UTC mas às vezes serializa sem fuso ("2026-09-24T18:32:58");
// sem o "Z" o navegador leria como horário local e mostraria 3h a mais.
const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);

export const formatDate = (value: Date | string) => toDate(value).toLocaleDateString('pt-BR');

export const formatDateTime = (value: Date | string) =>
  toDate(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// As fontes padrão do PDF só têm os caracteres do Windows-1252: seta, emoji e afins
// saem como lixo e ainda bagunçam o espaçamento da linha inteira.
const PDF_REPLACEMENTS: Record<string, string> = { '→': '->', '←': '<-', '✓': 'OK', '✔': 'OK', '✕': 'x', '≥': '>=', '≤': '<=' };
const WIN1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

export const pdfSafe = (text: string) =>
  Array.from(text, (ch) => {
    if (PDF_REPLACEMENTS[ch]) return PDF_REPLACEMENTS[ch];
    const code = ch.codePointAt(0) ?? 0;
    return code <= 0xff || WIN1252_EXTRA.includes(ch) ? ch : '';
  }).join('');

// Wrapper com cursor vertical e quebra de página automática.
export class PdfWriter {
  doc: JsPDF;
  // Empresa emissora: cabeçalho, rodapé e assinatura saem com os dados dela.
  company: CompanyInfo;
  y = MARGIN;

  constructor(doc: JsPDF, company: CompanyInfo) {
    this.doc = doc;
    this.company = company;
  }

  setText(size: number, color: Rgb = TEXT, style: 'normal' | 'bold' | 'italic' = 'normal') {
    this.doc.setFont('helvetica', style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  ensureSpace(needed: number) {
    if (this.y + needed > BOTTOM_LIMIT) {
      this.doc.addPage();
      this.y = MARGIN + 4;
    }
  }

  // Logo + dados da empresa à esquerda, bloco do documento (título + metadados) à direita.
  header(title: string, meta: [string, string][], logo: LoadedImage | null) {
    const { doc } = this;
    const top = MARGIN;
    let textX = MARGIN;

    if (logo) {
      const logoH = 22;
      const logoW = (logo.width / logo.height) * logoH;
      doc.addImage(logo.dataUrl, 'PNG', MARGIN - 2, top - 2, logoW, logoH);
      textX = MARGIN + logoW + 2;
    }

    const { company } = this;
    this.setText(15, TEXT, 'bold');
    doc.text(company.name, textX, top + 5);
    // Com razão social, as linhas de contato descem 4 mm para abrir espaço.
    let lineY = top + 10;
    if (company.legalName) {
      this.setText(8, TEXT, 'bold');
      doc.text(company.legalName, textX, lineY);
      lineY += 4;
    }
    this.setText(8, MUTED);
    doc.text(company.address, textX, lineY);
    doc.text([company.cnpj && `CNPJ: ${company.cnpj}`, `Tel.: ${company.phone}`, company.email].filter(Boolean).join(' · '), textX, lineY + 4);
    doc.text(`WhatsApp: ${company.whatsapp.join(' / ')}`, textX, lineY + 8);

    this.setText(12, RED, 'bold');
    doc.text(title, RIGHT, top + 3, { align: 'right' });
    meta.forEach(([label, value], i) => {
      const lineY = top + 8 + i * 4.2;
      this.setText(7.5, TEXT, 'bold');
      doc.text(value, RIGHT, lineY, { align: 'right' });
      const labelX = RIGHT - Math.max(32, doc.getTextWidth(value) + 4);
      this.setText(7.5, MUTED);
      doc.text(label, labelX, lineY, { align: 'right' });
    });

    this.y = top + Math.max(lineY + 14 - top, 8 + meta.length * 4.2 + 2);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, this.y, RIGHT, this.y);
    this.y += 6;
  }

  sectionTitle(title: string, minSpaceBelow = 16) {
    this.ensureSpace(minSpaceBelow + 5);
    this.setText(7.5, RED, 'bold');
    this.doc.text(pdfSafe(title).toUpperCase(), MARGIN, this.y);
    this.y += 2.5;
  }

  // Título + card, mas só quando há algum campo preenchido (evita título solto).
  section(title: string, fields: [string, string | number | null | undefined][], columns = 2) {
    const hasValue = fields.some(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
    if (!hasValue) return;
    this.sectionTitle(title);
    this.fieldsCard(fields, columns);
  }

  // Card com pares rótulo/valor distribuídos em `columns` colunas. Campos vazios
  // são omitidos; valores longos quebram linha dentro da própria coluna.
  fieldsCard(fields: [string, string | number | null | undefined][], columns = 2) {
    const { doc } = this;
    const filled = fields
      .map(([label, value]) => [label, value === null || value === undefined ? '' : pdfSafe(String(value))] as [string, string])
      .filter(([, value]) => value.trim() !== '');
    if (filled.length === 0) return;

    const colW = CONTENT_W / columns;
    const innerW = colW - 8;
    this.setText(8.5, TEXT, 'bold');
    const cells = filled.map(([label, value]) => ({
      label,
      lines: doc.splitTextToSize(value, innerW) as string[],
    }));

    const rows: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += columns) rows.push(cells.slice(i, i + columns));
    const rowHeights = rows.map((row) => Math.max(...row.map((cell) => 4 + cell.lines.length * 3.8)) + 2);
    const height = rowHeights.reduce((a, b) => a + b, 3);

    this.ensureSpace(Math.min(height, 60));
    const startY = this.y;
    let rowY = startY + 4;
    rows.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = MARGIN + 4 + c * colW;
        this.setText(6.8, MUTED);
        doc.text(cell.label.toUpperCase(), x, rowY);
        this.setText(8.5, TEXT, 'bold');
        doc.text(cell.lines, x, rowY + 3.8);
      });
      rowY += rowHeights[r];
    });
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, startY, CONTENT_W, rowY - startY - 1, 1.5, 1.5);
    this.y = rowY + 4;
  }

  textCard(text: string) {
    if (!text.trim()) return;
    const { doc } = this;
    this.setText(8.5, TEXT);
    const lines = doc.splitTextToSize(pdfSafe(text), CONTENT_W - 8) as string[];
    const height = lines.length * 3.8 + 5;
    this.ensureSpace(height);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, this.y, CONTENT_W, height, 1.5, 1.5);
    doc.text(lines, MARGIN + 4, this.y + 5);
    this.y += height + 5;
  }

  // Tabela simples; `align` por coluna, larguras em mm (a última ocupa o resto).
  table(headers: string[], rows: string[][], widths: number[], align: ('left' | 'right' | 'center')[], footer?: [string, string]) {
    const { doc } = this;
    const lastW = CONTENT_W - widths.reduce((a, b) => a + b, 0);
    const colWidths = [...widths, lastW];
    const colX = colWidths.map((_, i) => MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0));
    const cellX = (i: number) =>
      align[i] === 'right' ? colX[i] + colWidths[i] - 3 : align[i] === 'center' ? colX[i] + colWidths[i] / 2 : colX[i] + 3;

    const rowH = 6.5;
    const height = rowH * (rows.length + 1) + (footer ? rowH + 1 : 0);
    this.ensureSpace(Math.min(height, 40));
    const startY = this.y;

    this.setText(6.8, TEXT, 'bold');
    headers.forEach((h, i) => doc.text(h.toUpperCase(), cellX(i), startY + 4.3, { align: align[i] }));
    let rowY = startY + rowH;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    rows.forEach((row) => {
      if (rowY + rowH > BOTTOM_LIMIT) {
        doc.roundedRect(MARGIN, startY, CONTENT_W, rowY - startY, 1.5, 1.5);
        doc.addPage();
        rowY = MARGIN + 4;
      }
      doc.line(MARGIN, rowY, RIGHT, rowY);
      this.setText(8.2, TEXT);
      row.forEach((cell, i) => {
        const text = doc.splitTextToSize(pdfSafe(cell ?? ''), colWidths[i] - 5)[0] as string;
        doc.text(text, cellX(i), rowY + 4.4, { align: align[i] });
      });
      rowY += rowH;
    });
    if (footer) {
      doc.line(MARGIN, rowY, RIGHT, rowY);
      this.setText(9, TEXT, 'bold');
      doc.text(footer[0], MARGIN + 3, rowY + 5);
      this.setText(10, RED, 'bold');
      doc.text(footer[1], RIGHT - 3, rowY + 5, { align: 'right' });
      rowY += rowH + 1;
    }
    const boxTop = rowY < startY ? MARGIN + 4 : startY;
    doc.roundedRect(MARGIN, boxTop, CONTENT_W, rowY - boxTop, 1.5, 1.5);
    this.y = rowY + 5;
  }

  signatures(rightLabel = `Responsável - ${this.company.name}`) {
    const { doc } = this;
    this.ensureSpace(22);
    this.y += 10;
    const half = (CONTENT_W - 10) / 2;
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, this.y, MARGIN + half, this.y);
    doc.line(RIGHT - half, this.y, RIGHT, this.y);
    this.setText(6.8, MUTED);
    doc.text('ASSINATURA DO CLIENTE', MARGIN, this.y + 4);
    doc.text(rightLabel.toUpperCase(), RIGHT - half, this.y + 4);
    this.y += 10;
  }

  footer() {
    const { doc } = this;
    this.ensureSpace(20);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, this.y, RIGHT, this.y);
    this.setText(9, TEXT, 'italic');
    doc.text('"E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens."', PAGE_W / 2, this.y + 6, {
      align: 'center',
      maxWidth: CONTENT_W - 10,
    });
    this.setText(6.8, RED, 'bold');
    doc.text('COLOSSENSES 3:23', PAGE_W / 2, this.y + 11, { align: 'center' });
    this.setText(6.8, MUTED);
    doc.text(`${this.company.name} · ${this.company.website}`, PAGE_W / 2, this.y + 15, { align: 'center' });
    this.y += 18;
  }

  // Numeração "Página x de y" em todas as páginas (chamar ao final).
  pageNumbers(label: string) {
    const { doc } = this;
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      this.setText(6.5, MUTED);
      doc.text(`${label} · Página ${i} de ${total}`, RIGHT, PAGE_H - 6, { align: 'right' });
    }
  }
}

export async function createPdf(company: CompanyInfo = COMPANY): Promise<PdfWriter> {
  const { jsPDF } = await import('jspdf');
  return new PdfWriter(new jsPDF({ unit: 'mm', format: 'a4' }), company);
}

// No celular abre o compartilhamento nativo (WhatsApp, e-mail...); no computador
// baixa o PDF (o Chrome do Windows também "compartilha" arquivos, mas lá o
// esperado é o download).
export async function shareOrDownloadPdf(blob: Blob, fileName: string, title: string) {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches;
  if (isTouchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (error) {
      // Usuário fechou o compartilhamento — não é erro.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
