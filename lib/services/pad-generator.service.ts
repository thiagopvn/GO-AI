import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transgressao, PAD, Militar } from '@/types';
import { ConfiguracaoService } from './configuracao.service';

export class PADGeneratorService {
  static async gerarDocumentoPAD(
    transgressao: Transgressao,
    pad: PAD,
    militar: Militar
  ): Promise<Blob> {
    // Buscar configurações
    const nomeUnidade = await ConfiguracaoService.obter('nome_unidade') || 'Unidade Militar';
    const comandante = await ConfiguracaoService.obter('comandante_unidade') || 'Nome do Comandante';

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Cabeçalho
          new Paragraph({
            children: [
              new TextRun({
                text: nomeUnidade.toUpperCase(),
                bold: true,
                size: 28
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "PROCESSO ADMINISTRATIVO DISCIPLINAR",
                bold: true,
                size: 24
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Número do PAD
          new Paragraph({
            children: [
              new TextRun({
                text: `PAD Nº ${pad.numero}`,
                bold: true,
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),

          // Data
          new Paragraph({
            children: [
              new TextRun({
                text: `Data: ${format(pad.dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
                size: 22
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 }
          }),

          // Dados do Militar
          new Paragraph({
            children: [
              new TextRun({
                text: "IDENTIFICAÇÃO DO MILITAR",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Nome: ",
                bold: true
              }),
              new TextRun({
                text: `${militar.postoGraduacao} ${militar.nomeCompleto}`
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "RG: ",
                bold: true
              }),
              new TextRun({
                text: militar.rg
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Unidade: ",
                bold: true
              }),
              new TextRun({
                text: militar.unidade
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Comportamento Atual: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.comportamentoAnterior
              }),
            ],
            spacing: { after: 400 }
          }),

          // Dados da Transgressão
          new Paragraph({
            children: [
              new TextRun({
                text: "DADOS DA TRANSGRESSÃO",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Boletim Interno: ",
                bold: true
              }),
              new TextRun({
                text: `Nº ${transgressao.numero}`
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Data da Transgressão: ",
                bold: true
              }),
              new TextRun({
                text: format(transgressao.data, 'dd/MM/yyyy', { locale: ptBR })
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Tipo: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.tipo
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Natureza: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.natureza
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Punição: ",
                bold: true
              }),
              new TextRun({
                text: `${transgressao.punicao} - ${transgressao.diasPunicao} dias`
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Descrição: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.descricao
              }),
            ],
            spacing: { after: 400 }
          }),

          // Alteração de Comportamento
          new Paragraph({
            children: [
              new TextRun({
                text: "ALTERAÇÃO DE COMPORTAMENTO",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Comportamento Anterior: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.comportamentoAnterior
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Novo Comportamento: ",
                bold: true
              }),
              new TextRun({
                text: transgressao.comportamentoAtual
              }),
            ],
            spacing: { after: 400 }
          }),

          // Prazos
          new Paragraph({
            children: [
              new TextRun({
                text: "PRAZOS LEGAIS",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Prazo para Recurso: ",
                bold: true
              }),
              new TextRun({
                text: `${format(pad.prazoRecurso, 'dd/MM/yyyy', { locale: ptBR })} (5 dias úteis)`
              }),
            ],
            spacing: { after: 120 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Prazo para Apresentação de Nota: ",
                bold: true
              }),
              new TextRun({
                text: `${format(pad.prazoNota, 'dd/MM/yyyy', { locale: ptBR })} (10 dias)`
              }),
            ],
            spacing: { after: 400 }
          }),

          // Fundamentação Legal
          new Paragraph({
            children: [
              new TextRun({
                text: "FUNDAMENTAÇÃO LEGAL",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Este Processo Administrativo Disciplinar está fundamentado no Regulamento Disciplinar do Exército (RDE), " +
                      "Decreto nº 4.346, de 26 de agosto de 2002, e demais normas aplicáveis.",
                size: 22
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 600 }
          }),

          // Assinatura
          new Paragraph({
            children: [
              new TextRun({
                text: "_______________________________________",
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: comandante,
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Comandante",
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          // Ciente do Militar
          new Paragraph({
            children: [
              new TextRun({
                text: "CIENTE DO MILITAR",
                bold: true,
                size: 24
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 800, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Declaro que tomei conhecimento do presente Processo Administrativo Disciplinar.",
                size: 22
              }),
            ],
            spacing: { after: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Data: ____/____/____",
                size: 22
              }),
            ],
            spacing: { after: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "_______________________________________",
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${militar.postoGraduacao} ${militar.nomeCompleto}`,
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `RG: ${militar.rg}`,
                size: 22
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    // Converter para Blob
    const buffer = await Packer.toBlob(doc);
    return buffer;
  }

  static async gerarRelatorioSindicancia(sindicancia: Sindicancia): Promise<Blob> {
    // TODO: Implementar geração de relatório de sindicância
    throw new Error('Não implementado ainda');
  }

  static async gerarRelatorioComportamento(militares: Militar[]): Promise<Blob> {
    // TODO: Implementar geração de relatório de comportamento
    throw new Error('Não implementado ainda');
  }
}

// Importação necessária que faltou
import { Packer } from 'docx';
import { ProcessoDisciplinar, Militar as MilitarProcesso } from '@/types';
import { buscarItemPorNumero } from '@/lib/constants/tipificacao';

interface DadosAcusacaoPAD {
  descricaoFato: string;
  itemTipificacao: number;
  dataTransgressao: Date;
}

// Função auxiliar para criar seções com borda (deve vir ANTES da classe)
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

// Adicionar método estático dentro da classe
export class PADGeneratorServiceNovo {
  static async gerarDocumentoPADNovo(
    processo: ProcessoDisciplinar,
    militar: MilitarProcesso,
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
            top: 1440,  // 1 polegada = 1440 twentieths of a point
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // === CABEÇALHO ===
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
              text: "GRUPAMENTO DE OPERAÇÕES COM CÃES (GOCG)",
              bold: true,
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // === TÍTULO PRINCIPAL ===
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

        // === 1ª VIA ===
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

        // === LINHA DE IDENTIFICAÇÃO ===
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

        // === SEÇÃO: DEFENDENTE ===
        createBorderedSection("DEFENDENTE", [
          new Paragraph({
            children: [
              new TextRun({
                text: `Posto/Graduação: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: militar.postoGraduacao || militar.patente || '',
                size: 22,
              }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `RG: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: militar.rg || 'N/A',
                size: 22,
              }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Nome Completo: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: militar.nomeCompleto || militar.nome,
                size: 22,
              }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Unidade: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: militar.unidade || 'GOCG',
                size: 22,
              }),
            ],
          }),
        ]),

        // === SEÇÃO: PEÇA ACUSATÓRIA ===
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

        // === SEÇÃO: TIPIFICAÇÃO ===
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

        // === SEÇÃO: PRAZO PARA EXPOSIÇÃO DAS RAZÕES ESCRITAS DE DEFESA ===
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

        // === BLOCO DE RECEBIMENTO ===
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