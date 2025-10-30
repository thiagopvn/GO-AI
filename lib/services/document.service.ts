import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  Packer
} from 'docx';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Militar, ProcessoDisciplinar, Transgressao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class DocumentService {
  // Formata data em português
  private static formatarData(data: Date): string {
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Gera o cabeçalho do documento
  private static gerarCabecalho(): Paragraph[] {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'ESTADO DO RIO DE JANEIRO',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'SECRETARIA DE ESTADO DE DEFESA CIVIL',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'CORPO DE BOMBEIROS MILITAR DO ESTADO DO RIO DE JANEIRO',
            bold: true,
            size: 24
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'DIRETORIA GERAL DE PESSOAL',
            bold: true,
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    ];
  }

  // Gera o documento PAD
  public static async gerarPAD(
    processo: ProcessoDisciplinar,
    militar: Militar,
    transgressao: Transgressao
  ): Promise<Document> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          ...this.gerarCabecalho(),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `PROCESSO ADMINISTRATIVO DISCIPLINAR Nº ${processo.numero}`,
                bold: true,
                size: 28
              })
            ],
            spacing: { before: 400, after: 600 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'DADOS DO MILITAR:',
                bold: true,
                size: 26
              })
            ],
            spacing: { before: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nome: ${militar.nome}`,
                size: 24
              })
            ],
            spacing: { before: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Patente: ${militar.patente}`,
                size: 24
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Matrícula: ${militar.matricula}`,
                size: 24
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Unidade: ${militar.unidade}`,
                size: 24
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'TRANSGRESSÃO DISCIPLINAR:',
                bold: true,
                size: 26
              })
            ],
            spacing: { before: 600, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Data: ${this.formatarData(transgressao.data)}`,
                size: 24
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Artigo: ${transgressao.artigo} do RDCBMERJ`,
                size: 24
              })
            ],
            spacing: { before: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Descrição da Transgressão:',
                bold: true,
                size: 24
              })
            ],
            spacing: { before: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: transgressao.descricao,
                size: 24
              })
            ],
            spacing: { before: 200, after: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'PUNIÇÃO APLICADA:',
                bold: true,
                size: 26
              })
            ],
            spacing: { before: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Tipo: ${transgressao.tipoPunicao}`,
                size: 24
              })
            ],
            spacing: { before: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Período: ${transgressao.diasPunicao} dias`,
                size: 24
              })
            ]
          }),

          ...(transgressao.reincidente ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'OBSERVAÇÃO: MILITAR REINCIDENTE',
                  bold: true,
                  color: 'FF0000',
                  size: 26
                })
              ],
              spacing: { before: 400 }
            })
          ] : []),

          new Paragraph({
            children: [
              new TextRun({
                text: `Rio de Janeiro, ${this.formatarData(new Date())}`,
                size: 24
              })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 800 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '_______________________________________',
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Comandante da Unidade',
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    return doc;
  }

  // Salva o documento no Firebase Storage e retorna a URL
  public static async salvarDocumento(
    doc: Document,
    nomeArquivo: string
  ): Promise<string> {
    try {
      // Gerar o arquivo docx
      const blob = await Packer.toBlob(doc);

      // Criar referência no Storage
      const storageRef = ref(storage, `documentos/pads/${nomeArquivo}`);

      // Upload do arquivo
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      throw new Error('Erro ao salvar documento no Storage');
    }
  }

  // Gera e salva um PAD completo
  public static async gerarESalvarPAD(
    processo: ProcessoDisciplinar,
    militar: Militar,
    transgressao: Transgressao
  ): Promise<string> {
    const doc = await this.gerarPAD(processo, militar, transgressao);
    const nomeArquivo = `PAD_${processo.numero}_${militar.matricula}_${Date.now()}.docx`;
    const url = await this.salvarDocumento(doc, nomeArquivo);

    return url;
  }
}