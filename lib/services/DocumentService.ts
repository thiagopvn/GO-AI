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
  HeadingLevel,
  ImageRun,
  BorderStyle,
  VerticalAlign,
  PageOrientation
} from 'docx';
import { Militar, isPraca } from '@/types';
import { ConclusaoPadData } from '@/components/modals/ConcluirPadModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosDespacho {
  conclusao: ConclusaoPadData;
  militarNome: string;
  militarPosto: string;
  processoNumero: string;
  comandanteNome: string;
  comandantePosto: string;
  comandanteRG: string;
  comandanteFuncao: string;
}

// Lista de atenuantes e agravantes completas para o documento
const ATENUANTES_DOC = [
  { id: 'bom_comportamento', texto: 'Bom comportamento' },
  { id: 'servicos_relevantes', texto: 'Relevância de serviços prestados' },
  { id: 'evitar_mal_maior', texto: 'Ter sido cometida a transgressão para evitar mal maior' },
  { id: 'defesa_propria', texto: 'Ter sido cometida a transgressão em defesa própria, de seus direitos ou de outrem, desde que não constitua causa de justificação' },
  { id: 'falta_pratica_servico', texto: 'Falta da prática do serviço' }
];

const AGRAVANTES_DOC = [
  { id: 'mau_comportamento', texto: 'Mau comportamento' },
  { id: 'pratica_simultanea', texto: 'Prática simultânea de duas ou mais transgressões' },
  { id: 'reincidencia_verbal', texto: 'Reincidência da transgressão mesmo punida verbalmente' },
  { id: 'conluio', texto: 'Conluio de duas ou mais pessoas' },
  { id: 'durante_servico', texto: 'Ser praticada a transgressão durante execução do serviço' },
  { id: 'presenca_subordinado', texto: 'Ser cometida a falta em presença de subordinado' },
  { id: 'abuso_autoridade', texto: 'Ter abusado o transgressor de sua autoridade hierárquica' },
  { id: 'premeditacao', texto: 'Ter praticado a transgressão com premeditação' },
  { id: 'presenca_tropa', texto: 'Ter sido praticada a transgressão em presença de tropa' },
  { id: 'presenca_publico', texto: 'Ter sido praticada a transgressão em presença do público' }
];

export class DocumentService {
  async gerarDespacho(dados: DadosDespacho): Promise<Blob> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { conclusao, militarNome, militarPosto, processoNumero: _processoNumero, comandanteNome: _comandanteNome, comandantePosto: _comandantePosto, comandanteRG: _comandanteRG, comandanteFuncao: _comandanteFuncao } = dados;

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
              right: 567,
              bottom: 283, // 0.5cm
              left: 567,
            },
          },
        },
        children: [
          // Cabeçalho
          new Paragraph({
            children: [
              new TextRun({
                text: "CORPO DE BOMBEIROS MILITARES DO ESTADO DO RIO DE JANEIRO",
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "COMANDO DE BOMBEIROS DE ÁREA I - CAPITAL",
                bold: true,
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "GRUPAMENTO OPERACIONAL DO COMANDO GERAL",
                bold: true,
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Título DESPACHO (preto e negrito)
          new Paragraph({
            children: [
              new TextRun({
                text: "DESPACHO",
                bold: true,
                size: 28,
                color: "000000", // Preto
              }),
            ],
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 100, after: 100 },
          }),

          // Linha separadora entre DESPACHO e SOLUÇÃO
          new Paragraph({
            children: [
              new TextRun({
                text: "_".repeat(80),
                size: 20,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
          }),

          // SOLUÇÃO
          new Paragraph({
            children: [
              new TextRun({
                text: "SOLUÇÃO",
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
          }),

          // Opções de decisão
          new Paragraph({
            children: [
              new TextRun({
                text: `(   ${conclusao.decisao === 'justificar' ? 'X' : ' '}   ) JUSTIFICA`,
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `(   ${conclusao.decisao === 'justificar_parte' ? 'X' : ' '}   ) JUSTIFICA EM PARTE`,
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `(   ${conclusao.decisao === 'punir' ? 'X' : ' '}   ) NÃO JUSTIFICA`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Se a decisão for punir, adicionar as seções de atenuantes/agravantes
          ...(conclusao.decisao === 'punir' ? this.gerarSecaoPunicao(conclusao, militarNome, militarPosto) : []),

          // Assinatura
          ...this.gerarAssinatura(logoImageRun),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private gerarSecaoPunicao(conclusao: ConclusaoPadData, _militarNome: string, _militarPosto: string): (Paragraph | Table)[] {
    const paragraphs: (Paragraph | Table)[] = [];

    // Linha separadora antes dos atenuantes/agravantes
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "_".repeat(80),
            size: 20,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 150 },
      })
    );

    // Tabela de Atenuantes e Agravantes
    const tableRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ATENUANTES",
                    bold: true,
                    size: 24,
                    color: "000000",
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              }),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: {
              type: ShadingType.SOLID,
              fill: "F0F0F0", // Fundo cinza claro
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "AGRAVANTES",
                    bold: true,
                    size: 24,
                    color: "000000",
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              }),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: {
              type: ShadingType.SOLID,
              fill: "F0F0F0", // Fundo cinza claro
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: ATENUANTES_DOC.map(atenuante =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${conclusao.atenuantes?.includes(atenuante.id) ? '☑' : '☐'} ${atenuante.texto}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 40 },
              })
            ),
          }),
          new TableCell({
            children: AGRAVANTES_DOC.map(agravante =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${conclusao.agravantes?.includes(agravante.id) ? '☑' : '☐'} ${agravante.texto}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 40 },
              })
            ),
          }),
        ],
      }),
    ];

    paragraphs.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Números dos atenuantes e agravantes selecionados
    const atenuantesNumeros = conclusao.atenuantes?.map((id) =>
      ATENUANTES_DOC.findIndex(a => a.id === id) + 1
    ).filter(n => n > 0).join(', ') || '___________';

    const agravantesNumeros = conclusao.agravantes?.map((id) =>
      AGRAVANTES_DOC.findIndex(a => a.id === id) + 1
    ).filter(n => n > 0).join(', ') || '___________';

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Atenuante(s) de nºs ${atenuantesNumeros}, do Art.18 e agravante(s) de nºs ${agravantesNumeros}, do Art.19, tudo do RDCBMERJ.`,
            size: 22,
          }),
        ],
        spacing: { before: 150, after: 150 },
      })
    );

    // Linha separadora antes da classificação
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "_".repeat(80),
            size: 20,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 150 },
      })
    );

    // CLASSIFICAÇÃO DA TRANSGRESSÃO
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CLASSIFICAÇÃO DA TRANSGRESSÃO",
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.classificacao === 'leve' ? 'X' : ' '}   ) LEVE`,
            size: 22,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.classificacao === 'media' ? 'X' : ' '}   ) MÉDIA`,
            size: 22,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.classificacao === 'grave' ? 'X' : ' '}   ) GRAVE`,
            size: 22,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    // Linha separadora antes da gradação
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "_".repeat(80),
            size: 20,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 150 },
      })
    );

    // GRADAÇÃO DA PUNIÇÃO
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "GRADAÇÃO DA PUNIÇÃO",
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.tipoPunicao === 'advertencia' ? 'X' : ' '}   ) ADVERTÊNCIA`,
            size: 22,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.tipoPunicao === 'repreensao' ? 'X' : ' '}   ) REPREENSÃO`,
            size: 22,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.tipoPunicao === 'detencao' ? 'X' : ' '}   ) DETENÇÃO`,
            size: 22,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `(   ${conclusao.tipoPunicao === 'prisao' ? 'X' : ' '}   ) PRISÃO`,
            size: 22,
          }),
        ],
        spacing: { after: 150 },
      })
    );

    // DOSIMETRIA
    if (conclusao.tipoPunicao === 'detencao' || conclusao.tipoPunicao === 'prisao') {
      // Linha separadora antes da dosimetria
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "_".repeat(80),
              size: 20,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 },
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "DOSIMETRIA",
              bold: true,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );

      const dataInicio = conclusao.dataInicioPunicao
        ? format(conclusao.dataInicioPunicao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : '_____________________________';

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${conclusao.diasPunicao || '___'} DIAS, A CONTAR DE ${dataInicio}.`,
              size: 22,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    return paragraphs;
  }

  private gerarAssinatura(logoImageRun: ImageRun | null): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: "________________________________",
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Leandro Veríssimo de Oliveira Araújo - Maj. BM QOC/03",
            bold: true,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "RG CBMERJ 34038 | Id funcional 4149275-7",
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Subcomandante Administrativo do GOCG",
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    // Adicionar logo do GOCG se disponível
    if (logoImageRun) {
      paragraphs.push(
        new Paragraph({
          children: [logoImageRun],
          alignment: AlignmentType.CENTER,
        })
      );
    }

    return paragraphs;
  }

  /**
   * Gera relatório de comportamento de todos os praças em formato Word
   * Tabela estilizada com Nome de Guerra (negrito), RG e Comportamento
   */
  static async gerarRelatorioComportamento(militares: Militar[]): Promise<Blob> {
    // Filtrar apenas praças e ordenar por patente/nome
    const ordemPatentes = [
      'Subtenente', '1º Sargento', '2º Sargento', '3º Sargento', 'Cabo', 'Soldado'
    ];

    const pracas = militares
      .filter(m => isPraca(m.patente))
      .sort((a, b) => {
        const idxA = ordemPatentes.indexOf(a.patente);
        const idxB = ordemPatentes.indexOf(b.patente);
        if (idxA !== idxB) return idxA - idxB;
        return a.nome.localeCompare(b.nome);
      });

    const borderStyle = {
      style: BorderStyle.SINGLE,
      size: 1,
      color: '999999',
    };

    const cellBorders = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
    };

    // Cabeçalho da tabela
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Nº', bold: true, size: 20, color: '000000', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'D1D5DB', color: 'D1D5DB' },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'POSTO/GRAD', bold: true, size: 20, color: '000000', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'D1D5DB', color: 'D1D5DB' },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'NOME COMPLETO', bold: true, size: 20, color: '000000', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          width: { size: 38, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'D1D5DB', color: 'D1D5DB' },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'RG', bold: true, size: 20, color: '000000', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'D1D5DB', color: 'D1D5DB' },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'COMPORTAMENTO', bold: true, size: 20, color: '000000', font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          width: { size: 24, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'D1D5DB', color: 'D1D5DB' },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    });

    // Linhas dos dados
    const dataRows = pracas.map((militar, index) => {
      const comportamento = militar.comportamento || 'BOM';
      const rowFill = index % 2 === 0 ? 'FFFFFF' : 'F3F4F6';

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(index + 1), size: 20, font: 'Arial' })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            shading: { type: ShadingType.CLEAR, fill: rowFill, color: rowFill },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: militar.patente, size: 20, font: 'Arial' })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            shading: { type: ShadingType.CLEAR, fill: rowFill, color: rowFill },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({
              children: (() => {
                const nomeCompleto = militar.nome || '';
                const nomeGuerra = militar.nomeDeGuerra || '';
                // Se tem nome de guerra, destacar ele em negrito dentro do nome completo
                if (nomeGuerra && nomeCompleto.toUpperCase().includes(nomeGuerra.toUpperCase())) {
                  const idx = nomeCompleto.toUpperCase().indexOf(nomeGuerra.toUpperCase());
                  const antes = nomeCompleto.substring(0, idx);
                  const destaque = nomeCompleto.substring(idx, idx + nomeGuerra.length);
                  const depois = nomeCompleto.substring(idx + nomeGuerra.length);
                  const runs: TextRun[] = [];
                  if (antes) runs.push(new TextRun({ text: antes, size: 20, font: 'Arial' }));
                  runs.push(new TextRun({ text: destaque, bold: true, size: 20, font: 'Arial' }));
                  if (depois) runs.push(new TextRun({ text: depois, size: 20, font: 'Arial' }));
                  return runs;
                }
                // Se nome de guerra não está contido no nome completo, mostrar "NOME (GUERRA)"
                if (nomeGuerra) {
                  return [
                    new TextRun({ text: nomeCompleto + ' (', size: 20, font: 'Arial' }),
                    new TextRun({ text: nomeGuerra, bold: true, size: 20, font: 'Arial' }),
                    new TextRun({ text: ')', size: 20, font: 'Arial' }),
                  ];
                }
                return [new TextRun({ text: nomeCompleto, size: 20, font: 'Arial' })];
              })(),
              spacing: { before: 40, after: 40 },
            })],
            shading: { type: ShadingType.CLEAR, fill: rowFill, color: rowFill },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: militar.rg || militar.matricula || '-', size: 20, font: 'Arial' })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            shading: { type: ShadingType.CLEAR, fill: rowFill, color: rowFill },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: comportamento,
                size: 20,
                font: 'Arial',
              })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            })],
            shading: { type: ShadingType.CLEAR, fill: rowFill, color: rowFill },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      });
    });

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 567, right: 567, bottom: 567, left: 567 },
            size: { orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: [
          // Cabeçalho institucional
          new Paragraph({
            children: [new TextRun({
              text: 'CORPO DE BOMBEIROS MILITAR DO ESTADO DO RIO DE JANEIRO',
              bold: true, size: 24, font: 'Arial',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: 'GRUPAMENTO OPERACIONAL DO COMANDO GERAL',
              bold: true, size: 22, font: 'Arial',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Título
          new Paragraph({
            children: [new TextRun({
              text: 'RELATÓRIO DE COMPORTAMENTO DOS PRAÇAS',
              bold: true, size: 28, font: 'Arial', color: '1F2937',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: `Data de emissão: ${dataAtual}`,
              size: 20, font: 'Arial', color: '6B7280', italics: true,
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Linha separadora
          new Paragraph({
            children: [new TextRun({
              text: '_'.repeat(120),
              size: 16, color: 'D1D5DB',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Tabela
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Rodapé com totais
          new Paragraph({
            children: [new TextRun({
              text: '_'.repeat(120),
              size: 16, color: 'D1D5DB',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: `Total de praças: ${pracas.length}`,
              bold: true, size: 20, font: 'Arial',
            })],
            spacing: { after: 50 },
          }),
          ...Object.entries(
            pracas.reduce((acc, m) => {
              const c = m.comportamento || 'BOM';
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([comportamento, qtd]) =>
            new Paragraph({
              children: [new TextRun({
                text: `  ${comportamento}: ${qtd} militar${qtd > 1 ? 'es' : ''}`,
                size: 20, font: 'Arial', color: '374151',
              })],
              spacing: { after: 30 },
            })
          ),

          // Assinatura
          new Paragraph({
            children: [new TextRun({
              text: '________________________________',
              size: 22, font: 'Arial',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: 'AIOP - GOCG/CBMERJ',
              bold: true, size: 20, font: 'Arial',
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: 'Documento gerado automaticamente pelo sistema',
              size: 18, font: 'Arial', color: '9CA3AF', italics: true,
            })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  // Método auxiliar para converter o Blob em base64 para upload no Firebase
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}