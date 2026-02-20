import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
  ShadingType,
  BorderStyle,
  VerticalAlign,
} from 'docx';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { PermutaDoc, ORDEM_FUNCOES, funcaoParaTituloDocumento } from '@/types/permutas';

/**
 * Formata RG com ponto: "53726" -> "53.726"
 */
function formatarRG(rg: string): string {
  const rgLimpo = rg.replace(/\D/g, '');
  if (rgLimpo.length > 3) {
    return `${rgLimpo.slice(0, -3)}.${rgLimpo.slice(-3)}`;
  }
  return rgLimpo;
}

/**
 * Converte graduação para title case:
 * "1° TEN" -> "1° Ten", "CAP" -> "Cap", "2° TEN" -> "2° Ten"
 */
function formatarGraduacao(grad: string): string {
  return grad
    .split(' ')
    .map((part) => {
      if (/\d/.test(part)) return part; // "1°", "2°" ficam como estão
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Formata nome do militar: "Cap BM QOC FORTES"
 */
function formatarMilitar(snap: { grad: string; quadro: string; nome: string }): string {
  return `${formatarGraduacao(snap.grad)} BM ${snap.quadro} ${snap.nome}`;
}

/**
 * Formata data ISO para DD/MM/YYYY
 */
function formatarDataPtBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Agrupa permutas por função na ordem definida
 */
function agruparPorFuncao(permutas: PermutaDoc[]): Map<string, PermutaDoc[]> {
  const grupos = new Map<string, PermutaDoc[]>();

  for (const funcao of ORDEM_FUNCOES) {
    grupos.set(funcao, []);
  }

  for (const p of permutas) {
    const funcao = p.funcao || '1º SOCORRO';
    if (!grupos.has(funcao)) {
      grupos.set(funcao, []);
    }
    grupos.get(funcao)!.push(p);
  }

  for (const [, lista] of grupos) {
    lista.sort((a, b) => a.data.localeCompare(b.data));
  }

  for (const [key, lista] of grupos) {
    if (lista.length === 0) grupos.delete(key);
  }

  return grupos;
}

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

// Fundo cinza claro #D9D9D9 para cabeçalhos
const HEADER_SHADING = {
  type: ShadingType.CLEAR,
  fill: 'D9D9D9',
};

export class PermutaDocumentService {
  static async gerarDocumento(
    permutas: PermutaDoc[],
    noteNumber: string
  ): Promise<Blob> {
    const grupos = agruparPorFuncao(permutas);
    const children: (Paragraph | Table)[] = [];

    // Título principal (bold)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `ESCALA DE SERVIÇO – COMANDANTE DE SOCORRO – ALTERAÇÃO – ANEXO XX – NOTA GOCG ${noteNumber}`,
            bold: true,
            size: 24,
            font: 'Arial',
            color: '000000',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    for (const [funcao, lista] of grupos) {
      // Subtítulo da função (SEM negrito)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: funcaoParaTituloDocumento(funcao),
              bold: false,
              size: 24,
              font: 'Arial',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 200 },
        })
      );

      // Header row 1: ENTRA (colSpan=3) | SAI (colSpan=2) — sem negrito, texto preto, fundo cinza
      const headerRow1 = new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'ENTRA', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            columnSpan: 3,
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'SAI', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            columnSpan: 2,
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      });

      // Header row 2: DIA | MILITAR | RG | MILITAR | RG — sem negrito, texto preto, fundo cinza
      const headerRow2 = new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'DIA', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'MILITAR', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 32, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'RG', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'MILITAR', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 32, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'RG', bold: false, size: 24, font: 'Arial', color: '000000' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: HEADER_SHADING,
            borders: CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
        ],
      });

      // Data rows
      const dataRows = lista.map(
        (p) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: formatarDataPtBR(p.data), size: 24, font: 'Arial', color: '000000' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                borders: CELL_BORDER,
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: formatarMilitar(p.militarEntraData), size: 24, font: 'Arial', color: '000000' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                borders: CELL_BORDER,
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: formatarRG(p.militarEntraRg), size: 24, font: 'Arial', color: '000000' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                borders: CELL_BORDER,
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: formatarMilitar(p.militarSaiData), size: 24, font: 'Arial', color: '000000' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                borders: CELL_BORDER,
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: formatarRG(p.militarSaiRg), size: 24, font: 'Arial', color: '000000' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                borders: CELL_BORDER,
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          })
      );

      children.push(
        new Table({
          rows: [headerRow1, headerRow2, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    const docObj = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 1440,
                right: 1440,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(docObj);
    return new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  static async uploadDocumento(blob: Blob): Promise<string> {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const path = `documentos/permutas/${dataStr}/Escala_Permutas_${dataStr}.docx`;

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    return await getDownloadURL(snapshot.ref);
  }

  static async gerarEUploadDocumento(
    permutas: PermutaDoc[],
    noteNumber: string
  ): Promise<string> {
    const blob = await this.gerarDocumento(permutas, noteNumber);
    return await this.uploadDocumento(blob);
  }
}
