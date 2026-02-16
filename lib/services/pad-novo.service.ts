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
  Packer,
  ImageRun,
  convertInchesToTwip
} from 'docx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProcessoDisciplinar, Militar } from '@/types';
import { buscarItemEnriquecidoPorNumero } from '@/lib/constants/tipificacao-enriquecida';

export interface DadosAcusacaoPAD {
  descricaoFato: string;
  itensTipificacao: number[];
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
    text: `, RG ${rg}, lotado no ${unidade}.`,
    size: 22,
  }));

  return textRuns;
}

// Função auxiliar para construir texto curto do militar para PEÇA ACUSATÓRIA
function buildMilitarTextoCurto(militar: Militar): string {
  const patente = militar.postoGraduacao || militar.patente || '';
  const nomeDeGuerra = militar.nomeDeGuerra || militar.nomeGuerra || '';
  const nomeCompleto = militar.nomeCompleto || militar.nome || '';
  const nome = nomeDeGuerra || nomeCompleto.split(' ')[0] || '';

  return `${patente} BM ${nome}`;
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

// Função para gerar parágrafos de tipificação com múltiplos itens
function gerarParagrafosTipificacao(itensTipificacao: number[]): Paragraph[] {
  const paragrafos: Paragraph[] = [];

  // Ordenar itens
  const itensOrdenados = [...itensTipificacao].sort((a, b) => a - b);

  // Gerar texto da linha principal
  let textoPrincipal = "A conduta imputada infringe, em tese, o disposto ";

  if (itensOrdenados.length === 1) {
    textoPrincipal += `no item nº ${itensOrdenados[0]} `;
  } else {
    const ultimoItem = itensOrdenados.pop();
    textoPrincipal += `nos itens nº ${itensOrdenados.join(', nº ')} e nº ${ultimoItem} `;
    itensOrdenados.push(ultimoItem!); // Restaurar o array
  }

  textoPrincipal += "do Anexo I, referenciado no art. 14, item 1, do Decreto Estadual nº 3.767, de 04 de dezembro de 1980 (RDCBMERJ):";

  // Parágrafo principal
  paragrafos.push(new Paragraph({
    children: [
      new TextRun({
        text: textoPrincipal,
        size: 22,
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 300 }
  }));

  // Lista de itens com bullets
  for (const itemId of [...itensTipificacao].sort((a, b) => a - b)) {
    const item = buscarItemEnriquecidoPorNumero(itemId);
    if (item) {
      paragrafos.push(new Paragraph({
        children: [
          new TextRun({
            text: `• Item nº ${item.id} - `,
            size: 22,
            bold: true,
          }),
          new TextRun({
            text: `"${item.text}"`,
            size: 20,
            italics: true,
            color: "333333",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 150 },
        indent: { left: 400 }
      }));
    }
  }

  return paragrafos;
}

// Função para gerar texto do prazo de defesa
function gerarTextoPrazoDefesa(): TextRun[] {
  return [
    new TextRun({
      text: "Informo ao senhor defendente, que será aberto o prazo de 05 (cinco) dias úteis, a contar da data do recebimento deste, para que possa ser exercido seu direito constitucional à ampla defesa e ao contraditório, nos termos do art. 5º, inciso LV, da Constituição da República de 1988.",
      size: 22,
    }),
  ];
}

// Classe para geração do novo formato de PAD
export class PADNovoService {
  static async gerarDocumentoPAD(
    processo: ProcessoDisciplinar,
    militar: Militar,
    dadosAcusacao: DadosAcusacaoPAD
  ): Promise<Blob> {
    const dataEmissao = new Date();
    const ano = dataEmissao.getFullYear();

    // Preparar texto da peça acusatória
    const militarTextoCurto = buildMilitarTextoCurto(militar);

    // Carregar a logo do GOCG (PNG)
    let logoImageRun: ImageRun | null = null;
    try {
      const response = await fetch('/logo-gocg.png');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        logoImageRun = new ImageRun({
          data: arrayBuffer,
          transformation: {
            width: 60,
            height: 60,
          },
          type: 'png',
        });
      }
    } catch (error) {
      console.warn('Logo do GOCG não encontrado, documento será gerado sem logo');
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 283,    // 0.5cm
              right: 1440,
              bottom: 283, // 0.5cm
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

          // Seção PEÇA ACUSATÓRIA - Texto conforme especificação
          createBorderedSection("PEÇA ACUSATÓRIA", [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Tendo chegado ao conhecimento deste Maj BM, Subcomandante Administrativo do GOCG, no exercício de suas atribuições administrativas e disciplinares no âmbito do Grupamento Operacional do Comando Geral, o fato de que, em tese, o ",
                  size: 22,
                }),
                new TextRun({
                  text: militarTextoCurto,
                  size: 22,
                  bold: true,
                }),
                new TextRun({
                  text: ", ",
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

          // Seção TIPIFICAÇÃO - Com múltiplos itens
          createBorderedSection("TIPIFICAÇÃO", gerarParagrafosTipificacao(dadosAcusacao.itensTipificacao)),

          // Seção PRAZO PARA EXPOSIÇÃO DAS RAZÕES ESCRITAS DE DEFESA
          createBorderedSection("PRAZO PARA EXPOSIÇÃO DAS RAZÕES ESCRITAS DE DEFESA", [
            new Paragraph({
              children: gerarTextoPrazoDefesa(),
              alignment: AlignmentType.JUSTIFIED,
            }),
          ]),

          // Espaçamento antes do bloco de recebimento
          new Paragraph({ text: "", spacing: { after: 600 } }),

          // Bloco de Recebimento
          new Table({
            width: { size: 35, type: WidthType.PERCENTAGE },
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
                            size: 18,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Em ___/___/___.",
                            size: 18,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "__________________",
                            size: 18,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 50 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Assinatura",
                            size: 18,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    margins: {
                      top: 100,
                      bottom: 100,
                      left: 100,
                      right: 100,
                    },
                  }),
                ],
              }),
            ],
          }),

          // Espaçamento antes da assinatura do Major
          new Paragraph({ text: "", spacing: { after: 600 } }),

          // Bloco de Assinatura do Major (após recebi o original)
          new Paragraph({
            children: [
              new TextRun({
                text: "________________________________",
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Leandro Veríssimo de Oliveira Araújo - Maj. BM QOC/03",
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "RG CBMERJ 34038 | Id funcional 4149275-7",
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Subcomandante Administrativo do GOCG",
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Logo do GOCG no final do documento
          ...(logoImageRun ? [
            new Paragraph({
              children: [logoImageRun],
              alignment: AlignmentType.CENTER,
            }),
          ] : []),
        ],
      }],
    });

    // Converter para Blob
    const buffer = await Packer.toBlob(doc);
    return buffer;
  }
}
