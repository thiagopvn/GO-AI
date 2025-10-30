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
  HeadingLevel,
  Packer,
  VerticalAlign,
  ShadingType,
  PageBreak,
  spacing
} from 'docx';
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
    const { conclusao, militarNome, militarPosto, processoNumero, comandanteNome, comandantePosto, comandanteRG, comandanteFuncao } = dados;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 567, // Reduzido de 720 (0.79 polegadas)
              right: 567,
              bottom: 567,
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
          ...this.gerarAssinatura(comandanteNome, comandantePosto, comandanteRG, comandanteFuncao),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  private gerarSecaoPunicao(conclusao: ConclusaoPadData, militarNome: string, militarPosto: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

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
    const atenuantesNumeros = conclusao.atenuantes?.map((id, index) =>
      ATENUANTES_DOC.findIndex(a => a.id === id) + 1
    ).filter(n => n > 0).join(', ') || '___________';

    const agravantesNumeros = conclusao.agravantes?.map((id, index) =>
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

  private gerarAssinatura(nome: string, posto: string, rg: string, funcao: string): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `${nome} - ${posto} BM QOC/02`,
            bold: true,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `RG CBMERJ ${rg} | Id funcional ${rg}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: funcao,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ];
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