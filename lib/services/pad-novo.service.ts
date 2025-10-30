import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer
} from 'docx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProcessoDisciplinar, Militar } from '@/types';
import { buscarItemPorNumero } from '@/lib/constants/tipificacao';

export interface DadosAcusacaoPAD {
  descricaoFato: string;
  itemTipificacao: number;
  dataTransgressao: Date;
}

// Função auxiliar para construir o texto do DEFENDENTE com nome de guerra em negrito
function buildDefendenteText(militar: Militar): TextRun[] {
  const patente = militar.postoGraduacao || militar.patente || '';
  const nomeCompleto = militar.nomeCompleto || militar.nome || '';
  const nomeDeGuerra = militar.nomeDeGuerra || militar.nomeGuerra || '';
  const rg = militar.rg || 'N/A';
  const unidade = militar.unidade || 'GOCG';

  const textRuns: TextRun[] = [];

  // [Patente] BM
  textRuns.push(new TextRun({
    text: `${patente} BM `,
    size: 22,
  }));

  // Parte antes do nome de guerra (se houver)
  if (nomeDeGuerra && nomeCompleto.includes(nomeDeGuerra)) {
    const partes = nomeCompleto.split(nomeDeGuerra);

    // Texto antes do nome de guerra
    if (partes[0]) {
      textRuns.push(new TextRun({
        text: partes[0],
        size: 22,
      }));
    }

    // Nome de guerra em NEGRITO
    textRuns.push(new TextRun({
      text: nomeDeGuerra,
      size: 22,
      bold: true,
    }));

    // Texto depois do nome de guerra
    if (partes[1]) {
      textRuns.push(new TextRun({
        text: partes[1],
        size: 22,
      }));
    }
  } else {
    // Se não houver nome de guerra ou não estiver no nome completo
    textRuns.push(new TextRun({
      text: nomeCompleto,
      size: 22,
    }));
  }

  // , RG [RG], lotado no [Unidade]
  textRuns.push(new TextRun({
    text: `, RG ${rg}, lotado no ${unidade}`,
    size: 22,
  }));

  return textRuns;
}

// Função auxiliar para criar seções com borda
function createBorderedSection(titulo: string, conteudo: Paragraph[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    margins: {
      top: 200,
      bottom: 200,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: titulo,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 300 }
              }),
              ...conteudo,
            ],
            margins: {
              top: 200,
              bottom: 200,
              left: 200,
              right: 200,
            },
          }),
        ],
      }),
    ],
  });
}

// Classe para geração do novo formato de PAD
export class PADNovoService {
  static async gerarDocumentoPAD(
    processo: ProcessoDisciplinar,
    militar: Militar,
    dadosAcusacao: DadosAcusacaoPAD
  ): Promise<Blob> {
    const itemTipificacao = buscarItemPorNumero(dadosAcusacao.itemTipificacao);
    const dataEmissao = new Date();
    const ano = dataEmissao.getFullYear();

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Cabeçalho
          new Paragraph({
            children: [
              new TextRun({
                text: "CORPO DE BOMBEIROS MILITAR DO ESTADO DO RIO DE JANEIRO",
                bold: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "COMANDO DE BOMBEIROS DE ÁREA I",
                bold: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "GRUPAMENTO OPERACIONAL DO COMANDO GERAL",
                bold: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Título Principal
          new Paragraph({
            children: [
              new TextRun({
                text: "PROCESSO ADMINISTRATIVO DISCIPLINAR",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // 1ª VIA
          new Paragraph({
            children: [
              new TextRun({
                text: "1ª VIA",
                bold: true,
                size: 22,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 }
          }),

          // Linha de Identificação
          new Paragraph({
            children: [
              new TextRun({
                text: processo.numero || `CBMERJ/GOCG/PAD/${format(dataEmissao, 'yyyyMMdd')}/${ano}`,
                bold: true,
                size: 22,
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Rio de Janeiro, ${format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
                size: 22,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 600 }
          }),

          // Seção DEFENDENTE - Formatada como sentença contínua
          createBorderedSection("DEFENDENTE", [
            new Paragraph({
              children: buildDefendenteText(militar),
              alignment: AlignmentType.JUSTIFIED,
            }),
          ]),

          // Seção PEÇA ACUSATÓRIA
          createBorderedSection("PEÇA ACUSATÓRIA", [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Tendo chegado ao conhecimento do Cel BM Comandante do GOCG, os seguintes fatos que são imputados ao defendente: Por, em tese, ",
                  size: 22,
                }),
                new TextRun({
                  text: dadosAcusacao.descricaoFato,
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
          ]),

          // Seção TIPIFICAÇÃO
          createBorderedSection("TIPIFICAÇÃO", [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Considerando a conduta imputada infringir, em tese, o disposto no item nº ",
                  size: 22,
                }),
                new TextRun({
                  text: dadosAcusacao.itemTipificacao.toString(),
                  size: 22,
                  bold: true,
                }),
                new TextRun({
                  text: " do anexo I, referenciado no art. 14, item 1, do Decreto Estadual nº 3.767, de 04 de dezembro de 1980 (RDCBMERJ).",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            ...(itemTipificacao ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `"${itemTipificacao.text}"`,
                    size: 20,
                    italics: true,
                    color: "444444",
                  }),
                ],
                alignment: AlignmentType.JUSTIFIED,
              })
            ] : []),
          ]),

          // Seção PRAZO PARA EXPOSIÇÃO DAS RAZÕES ESCRITAS DE DEFESA
          createBorderedSection("PRAZO PARA EXPOSIÇÃO DAS RAZÕES ESCRITAS DE DEFESA", [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Informo ao senhor defendente que será aberto o prazo de 05 (cinco) dias úteis, a contar da data do recebimento deste, para que possa ser exercido seu direito constitucional à ampla defesa e ao contraditório.",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
          ]),

          // Espaçamento antes do bloco de recebimento
          new Paragraph({
            text: "",
            spacing: { after: 800 }
          }),

          // Bloco de Recebimento
          new Table({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Recebi o original",
                            size: 22,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Em ___/___/___.",
                            size: 22,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "_________________________",
                            size: 22,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Assinatura",
                            size: 22,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    margins: {
                      top: 200,
                      bottom: 200,
                      left: 200,
                      right: 200,
                    },
                  }),
                ],
              }),
            ],
            float: {
              horizontalAnchor: 'text',
              verticalAnchor: 'text',
              relativeHorizontalPosition: 'right',
              relativeVerticalPosition: 'paragraph',
            },
          }),
        ],
      }],
    });

    // Converter para Blob
    const buffer = await Packer.toBlob(doc);
    return buffer;
  }
}
