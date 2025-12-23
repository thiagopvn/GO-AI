/**
 * ComportamentoService - Serviço para cálculo de comportamento militar
 *
 * Este serviço implementa a lógica correta de cálculo de comportamento militar
 * baseada nas regras do RDCBMERJ (Regulamento Disciplinar do CBMERJ).
 *
 * IMPORTANTE:
 * - A análise é feita na coleção 'pads' (documentos de punição)
 * - A data de referência é 'dataInicioPunicao' (data em que a punição começou a valer)
 * - O cálculo se baseia na QUANTIDADE de punições, NÃO na duração em dias
 * - Apenas PADs com status='finalizado' e decisao='punir' são considerados
 *
 * Regras de equivalência (Art. 55 RDCBMERJ):
 * - 2 repreensões = 1 detenção
 * - 2 detenções = 1 prisão
 * - 4 repreensões = 1 prisão
 *
 * Sistema de unidades inteiras para evitar float:
 * - Repreensão = 1 unidade
 * - Detenção = 2 unidades
 * - Prisão = 4 unidades
 * - 2 prisões equivalentes = 8 unidades
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Militar,
  ComportamentoMilitar,
  isPraca
} from '@/types';

// Interface para PAD com punição (dados da coleção 'pads')
interface PADPunitivo {
  id: string;
  militarId: string;
  militarNome: string;
  status: string;
  decisao: string;
  tipoPunicao: string;
  diasPunicao: number;
  dataInicioPunicao: Date | null;
  dataAbertura: Date | null;
  dataConclusao: Date | null;
}

// Interface para contagem de punições
interface ContagemPunicoes {
  repreensoes: number;
  detencoes: number;
  prisoes: number;
}

export class ComportamentoService {
  /**
   * Calcula e atualiza o comportamento de um militar
   * @param militarId ID do militar
   * @returns O novo comportamento calculado ou null se não aplicável
   */
  public static async calcularEAtualizarComportamento(
    militarId: string
  ): Promise<ComportamentoMilitar | null> {
    try {
      // Passo 1: Obter os dados do militar
      const militarDoc = await getDoc(doc(db, 'militares', militarId));

      if (!militarDoc.exists()) {
        console.error(`Militar com ID ${militarId} não encontrado`);
        return null;
      }

      const militarData = militarDoc.data();
      const militar = {
        id: militarDoc.id,
        ...militarData,
        // Converter timestamp para Date
        dataInclusao: militarData.dataInclusao?.toDate?.() || militarData.dataInclusao
      } as Militar;

      // Verificar se é praça (Soldado a Subtenente)
      if (!isPraca(militar.patente)) {
        console.log(`Militar ${militar.nome} é oficial. Comportamento não aplicável.`);
        return null;
      }

      // Verificar se tem data de inclusão
      if (!militar.dataInclusao) {
        console.error(`Militar ${militar.nome} não possui data de inclusão registrada`);
        return null;
      }

      // Passo 2: Buscar TODO o histórico de punições do militar (da coleção 'pads')
      const padsPunitivos = await this.buscarPADsPunitivos(militarId);

      // Passo 3 e 4: Calcular o comportamento baseado nas regras e data de inclusão
      const novoComportamento = this.calcularComportamento(padsPunitivos, militar.dataInclusao);

      // Passo 5: Atualizar o documento do militar
      await this.atualizarComportamentoNoFirestore(militarId, novoComportamento);

      console.log(`Comportamento do militar ${militar.nome} atualizado para: ${novoComportamento}`);
      return novoComportamento;

    } catch (error) {
      console.error('Erro ao calcular comportamento:', error);
      throw error;
    }
  }

  /**
   * Busca todos os PADs punitivos finalizados de um militar
   * @param militarId ID do militar
   * @returns Array de PADs com punição aplicada
   */
  private static async buscarPADsPunitivos(
    militarId: string
  ): Promise<PADPunitivo[]> {
    const q = query(
      collection(db, 'pads'),
      where('militarId', '==', militarId),
      where('status', '==', 'finalizado'),
      where('decisao', '==', 'punir')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        militarId: data.militarId,
        militarNome: data.militarNome,
        status: data.status,
        decisao: data.decisao,
        tipoPunicao: data.tipoPunicao || '',
        diasPunicao: data.diasPunicao || 0,
        // Converter timestamps para Date - usar dataInicioPunicao como referência
        dataInicioPunicao: data.dataInicioPunicao?.toDate?.() || null,
        dataAbertura: data.dataAbertura?.toDate?.() || null,
        dataConclusao: data.dataConclusao?.toDate?.() || null
      } as PADPunitivo;
    });
  }

  /**
   * Filtra PADs por janela de tempo baseado na dataInicioPunicao
   * @param pads Array de PADs punitivos
   * @param anos Número de anos para a janela de tempo
   * @param dataReferencia Data de referência (padrão: hoje)
   * @returns PADs dentro da janela de tempo
   */
  private static filtrarPorJanelaTempo(
    pads: PADPunitivo[],
    anos: number,
    dataReferencia: Date = new Date()
  ): PADPunitivo[] {
    const dataLimite = new Date(dataReferencia);
    dataLimite.setFullYear(dataLimite.getFullYear() - anos);

    return pads.filter(pad => {
      // Usa dataInicioPunicao como referência principal
      const dataPunicao = pad.dataInicioPunicao || pad.dataConclusao || pad.dataAbertura;
      if (!dataPunicao) return false;
      const data = new Date(dataPunicao);
      // Punição deve estar dentro da janela e não ser futura
      return data >= dataLimite && data <= dataReferencia;
    });
  }

  /**
   * Conta as punições por tipo em uma lista de PADs
   * IMPORTANTE: Cada PAD conta como 1 punição, independente dos dias
   * @param pads Array de PADs punitivos
   * @returns Contagem de punições por tipo
   */
  private static contarPunicoes(pads: PADPunitivo[]): ContagemPunicoes {
    const contagem: ContagemPunicoes = {
      repreensoes: 0,
      detencoes: 0,
      prisoes: 0
    };

    pads.forEach(pad => {
      // Cada PAD conta como 1 punição, independente da quantidade de dias
      const tipoPunicao = String(pad.tipoPunicao || '').toLowerCase();
      if (tipoPunicao === 'repreensão' || tipoPunicao === 'repreensao') {
        contagem.repreensoes++;
      } else if (tipoPunicao === 'detenção' || tipoPunicao === 'detencao') {
        contagem.detencoes++;
      } else if (tipoPunicao === 'prisão' || tipoPunicao === 'prisao') {
        contagem.prisoes++;
      }
    });

    return contagem;
  }

  /**
   * Calcula o total de unidades de uma lista de PADs
   * Sistema de unidades inteiras para evitar problemas com float:
   * - Repreensão = 1 unidade
   * - Detenção = 2 unidades
   * - Prisão = 4 unidades
   * @param pads Array de PADs punitivos
   * @returns Total de unidades
   */
  private static calcularUnidades(pads: PADPunitivo[]): number {
    return pads.reduce((acc, pad) => {
      const tipoPunicao = String(pad.tipoPunicao || '').toLowerCase();
      if (tipoPunicao === 'repreensão' || tipoPunicao === 'repreensao') {
        return acc + 1; // Repreensão = 1 unidade
      } else if (tipoPunicao === 'detenção' || tipoPunicao === 'detencao') {
        return acc + 2; // Detenção = 2 unidades
      } else if (tipoPunicao === 'prisão' || tipoPunicao === 'prisao') {
        return acc + 4; // Prisão = 4 unidades
      }
      return acc;
    }, 0);
  }

  /**
   * Converte punições em "prisões equivalentes"
   * 2 repreensões = 1 detenção
   * 2 detenções = 1 prisão
   * @param contagem Contagem de punições
   * @returns Número de prisões equivalentes (com decimais para cálculo preciso)
   */
  private static converterEmPrisoesEquivalentes(contagem: ContagemPunicoes): number {
    // Converter repreensões em detenções equivalentes (com decimais)
    const detencoesEquivalentes = (contagem.repreensoes / 2) + contagem.detencoes;

    // Converter detenções em prisões equivalentes (com decimais)
    const prisoesEquivalentes = (detencoesEquivalentes / 2) + contagem.prisoes;

    return prisoesEquivalentes;
  }

  /**
   * Converte punições em "detenções equivalentes"
   * 2 repreensões = 1 detenção
   * @param contagem Contagem de punições
   * @returns Número de detenções equivalentes (com decimais para cálculo preciso)
   */
  private static converterEmDetencoesEquivalentes(contagem: ContagemPunicoes): number {
    return (contagem.repreensoes / 2) + contagem.detencoes;
  }

  /**
   * Calcula o comportamento baseado nas regras do RDCBMERJ
   *
   * REGRAS (decisão em árvore com prioridade):
   *
   * (A) EXCEPCIONAL - Janela: 8 anos - Condição: 0 punições
   * (B) MAU - Janela: 1 ano - Condição: > 8 unidades (mais de 2 prisões equivalentes)
   * (C) INSUFICIENTE - Janela: 1 ano - Condição: == 8 unidades (exatamente 2 prisões equivalentes)
   * (D) ÓTIMO - Janela: 4 anos - Condição: <= 2 unidades (no máximo 1 detenção equivalente)
   * (E) BOM - Janela: 2 anos - Condição: <= 8 unidades (no máximo 2 prisões equivalentes)
   * (F) Fallback: MAU (quando excede o limite do BOM em 2 anos)
   *
   * Sistema de unidades:
   * - Repreensão = 1 unidade
   * - Detenção = 2 unidades
   * - Prisão = 4 unidades
   * - 2 prisões equivalentes = 8 unidades
   * - 1 detenção equivalente = 2 unidades
   *
   * @param pads Array completo de PADs punitivos do militar
   * @param dataInclusao Data de inclusão do militar no serviço
   * @returns Classificação de comportamento
   */
  private static calcularComportamento(
    pads: PADPunitivo[],
    dataInclusao: Date
  ): ComportamentoMilitar {
    const hoje = new Date();
    const dataInclusaoDate = new Date(dataInclusao);
    const tempoServicoAnos = (hoje.getTime() - dataInclusaoDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // ========================================
    // (A) EXCEPCIONAL: 0 punições nos últimos 8 anos
    // ========================================
    if (tempoServicoAnos >= 8) {
      const pads8Anos = this.filtrarPorJanelaTempo(pads, 8, hoje);
      const unidades8Anos = this.calcularUnidades(pads8Anos);
      if (unidades8Anos === 0) {
        return ComportamentoMilitar.EXCEPCIONAL;
      }
    }

    // ========================================
    // (B) e (C) Avaliar último ano PRIMEIRO - tem prioridade
    // MAU: > 8 unidades (mais de 2 prisões equivalentes)
    // INSUFICIENTE: == 8 unidades (exatamente 2 prisões equivalentes)
    // ========================================
    const pads1Ano = tempoServicoAnos >= 1
      ? this.filtrarPorJanelaTempo(pads, 1, hoje)
      : pads; // Se tem menos de 1 ano, considerar todas as punições

    const unidades1Ano = this.calcularUnidades(pads1Ano);

    // Mais de 2 prisões equivalentes (> 8 unidades) -> MAU
    if (unidades1Ano > 8) {
      return ComportamentoMilitar.MAU;
    }

    // Exatamente 2 prisões equivalentes (== 8 unidades) -> INSUFICIENTE
    if (unidades1Ano === 8) {
      return ComportamentoMilitar.INSUFICIENTE;
    }

    // ========================================
    // (D) ÓTIMO: Últimos 4 anos com no máximo 1 detenção equivalente (<= 2 unidades)
    // ========================================
    if (tempoServicoAnos >= 4) {
      const pads4Anos = this.filtrarPorJanelaTempo(pads, 4, hoje);
      const unidades4Anos = this.calcularUnidades(pads4Anos);
      if (unidades4Anos <= 2) {
        return ComportamentoMilitar.OTIMO;
      }
    }

    // ========================================
    // (E) BOM: Últimos 2 anos com no máximo 2 prisões equivalentes (<= 8 unidades)
    // ========================================
    const pads2Anos = tempoServicoAnos >= 2
      ? this.filtrarPorJanelaTempo(pads, 2, hoje)
      : pads; // Se tem menos de 2 anos, considerar todas as punições

    const unidades2Anos = this.calcularUnidades(pads2Anos);

    if (unidades2Anos <= 8) {
      return ComportamentoMilitar.BOM;
    }

    // ========================================
    // (F) Fallback: MAU (quando excede o limite do BOM em 2 anos)
    // Ex: 2 prisões + 1 repreensão = 8 + 1 = 9 unidades -> MAU
    // ========================================
    return ComportamentoMilitar.MAU;
  }

  /**
   * Retorna o nível numérico do comportamento (quanto maior, melhor)
   * Usado para comparação entre comportamentos
   */
  private static getNivelComportamento(comportamento: ComportamentoMilitar): number {
    const niveis: Record<ComportamentoMilitar, number> = {
      [ComportamentoMilitar.MAU]: 1,
      [ComportamentoMilitar.INSUFICIENTE]: 2,
      [ComportamentoMilitar.BOM]: 3,
      [ComportamentoMilitar.OTIMO]: 4,
      [ComportamentoMilitar.EXCEPCIONAL]: 5
    };
    return niveis[comportamento] || 0;
  }

  /**
   * Atualiza o comportamento do militar no Firestore
   * Detecta mudanças e atualiza os campos de rastreamento
   * @param militarId ID do militar
   * @param novoComportamento Novo comportamento calculado
   */
  private static async atualizarComportamentoNoFirestore(
    militarId: string,
    novoComportamento: ComportamentoMilitar
  ): Promise<void> {
    // Buscar o comportamento atual do militar para comparação
    const militarDoc = await getDoc(doc(db, 'militares', militarId));
    const militarData = militarDoc.data();
    const comportamentoAtual = militarData?.comportamento as ComportamentoMilitar | undefined;

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {
      comportamento: novoComportamento,
      dataUltimaAtualizacaoComportamento: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Verificar se houve mudança de comportamento
    if (comportamentoAtual && comportamentoAtual !== novoComportamento) {
      const nivelAnterior = this.getNivelComportamento(comportamentoAtual);
      const nivelNovo = this.getNivelComportamento(novoComportamento);

      // Registrar a mudança
      updateData.comportamentoAnterior = comportamentoAtual;
      updateData.comportamentoMudou = true;
      updateData.dataMudancaComportamento = Timestamp.now();
      updateData.tipoMudancaComportamento = nivelNovo > nivelAnterior ? 'melhoria' : 'queda';

      console.log(`Mudança de comportamento detectada: ${comportamentoAtual} -> ${novoComportamento} (${updateData.tipoMudancaComportamento})`);
    }

    await updateDoc(doc(db, 'militares', militarId), updateData);
  }

  /**
   * Marca a mudança de comportamento como visualizada
   * @param militarId ID do militar
   */
  public static async marcarMudancaComoVista(militarId: string): Promise<void> {
    await updateDoc(doc(db, 'militares', militarId), {
      comportamentoMudou: false,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Atualiza o comportamento de um militar baseado em seus dados
   * Método de compatibilidade com a versão anterior
   * @param militar Dados do militar
   */
  public static async atualizarComportamentoDoMilitar(militar: Militar): Promise<void> {
    if (!isPraca(militar.patente)) {
      console.log(`Militar ${militar.nome} é oficial. Comportamento não aplicável.`);
      return;
    }

    if (!militar.dataInclusao) {
      console.error(`Militar ${militar.nome} não possui data de inclusão registrada`);
      return;
    }

    const novoComportamento = await this.calcularEAtualizarComportamento(militar.id);

    if (novoComportamento) {
      console.log(`Comportamento do militar ${militar.nome} atualizado para: ${novoComportamento}`);
    }
  }

  /**
   * Recalcula o comportamento de todos os praças
   * Útil para executar periodicamente ou após mudanças nas regras
   */
  public static async recalcularComportamentoTodos(): Promise<void> {
    try {
      // Buscar todos os militares
      const militaresSnapshot = await getDocs(collection(db, 'militares'));

      const promises = militaresSnapshot.docs.map(async (docSnapshot) => {
        const militar = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as Militar;

        // Processar apenas praças
        if (isPraca(militar.patente)) {
          await this.calcularEAtualizarComportamento(militar.id);
        }
      });

      await Promise.all(promises);
      console.log('Comportamento de todos os praças recalculado com sucesso');
    } catch (error) {
      console.error('Erro ao recalcular comportamento de todos:', error);
      throw error;
    }
  }

  /**
   * Obtém o comportamento inicial para um novo militar
   * @param militar Dados do militar
   * @returns Comportamento inicial ou null se não aplicável
   */
  public static getComportamentoInicial(militar: Partial<Militar>): ComportamentoMilitar | null {
    if (militar.patente && isPraca(militar.patente)) {
      // Por padrão, militares iniciam com comportamento BOM
      return ComportamentoMilitar.BOM;
    }
    return null;
  }

  /**
   * Método auxiliar para debug: mostra o cálculo detalhado
   * Sistema de unidades: Repreensão=1, Detenção=2, Prisão=4
   * 2 prisões equivalentes = 8 unidades
   * @param militarId ID do militar
   * @returns Objeto com detalhes do cálculo
   */
  public static async obterDetalhesCalculo(militarId: string): Promise<{
    comportamentoCalculado: ComportamentoMilitar | null;
    dadosMilitar: {
      nome: string;
      patente: string;
      dataInclusao: Date | null;
      tempoServicoAnos: number;
    };
    detalhes: {
      punicoes8Anos: { total: number | string; unidades: number | string };
      punicoes4Anos: { total: number | string; unidades: number | string; detencoesEquivalentes: number | string };
      punicoes2Anos: { total: number | string; unidades: number | string; prisoesEquivalentes: number | string };
      punicoes1Ano: { total: number | string; unidades: number | string; prisoesEquivalentes: number | string };
      pads: PADPunitivo[];
    };
  } | null> {
    try {
      // Verificar se é praça
      const militarDoc = await getDoc(doc(db, 'militares', militarId));
      if (!militarDoc.exists()) return null;

      const militarData = militarDoc.data();
      const militar = {
        id: militarDoc.id,
        ...militarData,
        dataInclusao: militarData.dataInclusao?.toDate?.() || militarData.dataInclusao
      } as Militar;

      if (!isPraca(militar.patente)) return null;
      if (!militar.dataInclusao) return null;

      // Calcular tempo de serviço
      const hoje = new Date();
      const dataInclusaoDate = new Date(militar.dataInclusao);
      const tempoServicoAnos = (hoje.getTime() - dataInclusaoDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

      // Buscar PADs punitivos
      const pads = await this.buscarPADsPunitivos(militarId);

      // Calcular detalhes para cada janela (respeitando tempo de serviço)
      let detalhes8Anos: { total: number | string; unidades: number | string } = {
        total: "N/A - menos de 8 anos de serviço",
        unidades: "N/A"
      };
      let detalhes4Anos: { total: number | string; unidades: number | string; detencoesEquivalentes: number | string } = {
        total: "N/A - menos de 4 anos de serviço",
        unidades: "N/A",
        detencoesEquivalentes: "N/A"
      };
      let detalhes2Anos: { total: number | string; unidades: number | string; prisoesEquivalentes: number | string } = {
        total: "N/A - menos de 2 anos de serviço",
        unidades: "N/A",
        prisoesEquivalentes: "N/A"
      };
      let detalhes1Ano: { total: number | string; unidades: number | string; prisoesEquivalentes: number | string } = {
        total: "N/A - menos de 1 ano de serviço",
        unidades: "N/A",
        prisoesEquivalentes: "N/A"
      };

      // Calcular apenas para janelas aplicáveis baseado no tempo de serviço
      if (tempoServicoAnos >= 8) {
        const pads8Anos = this.filtrarPorJanelaTempo(pads, 8, hoje);
        const unidades8Anos = this.calcularUnidades(pads8Anos);
        detalhes8Anos = {
          total: pads8Anos.length,
          unidades: unidades8Anos
        };
      }

      if (tempoServicoAnos >= 4) {
        const pads4Anos = this.filtrarPorJanelaTempo(pads, 4, hoje);
        const unidades4Anos = this.calcularUnidades(pads4Anos);
        detalhes4Anos = {
          total: pads4Anos.length,
          unidades: unidades4Anos,
          detencoesEquivalentes: unidades4Anos / 2 // 1 detenção = 2 unidades
        };
      }

      if (tempoServicoAnos >= 2) {
        const pads2Anos = this.filtrarPorJanelaTempo(pads, 2, hoje);
        const unidades2Anos = this.calcularUnidades(pads2Anos);
        detalhes2Anos = {
          total: pads2Anos.length,
          unidades: unidades2Anos,
          prisoesEquivalentes: unidades2Anos / 4 // 1 prisão = 4 unidades
        };
      }

      if (tempoServicoAnos >= 1) {
        const pads1Ano = this.filtrarPorJanelaTempo(pads, 1, hoje);
        const unidades1Ano = this.calcularUnidades(pads1Ano);
        detalhes1Ano = {
          total: pads1Ano.length,
          unidades: unidades1Ano,
          prisoesEquivalentes: unidades1Ano / 4 // 1 prisão = 4 unidades
        };
      }

      const comportamentoCalculado = this.calcularComportamento(pads, militar.dataInclusao);

      return {
        comportamentoCalculado,
        dadosMilitar: {
          nome: militar.nome || 'Nome não informado',
          patente: militar.patente,
          dataInclusao: militar.dataInclusao,
          tempoServicoAnos: tempoServicoAnos
        },
        detalhes: {
          punicoes8Anos: detalhes8Anos,
          punicoes4Anos: detalhes4Anos,
          punicoes2Anos: detalhes2Anos,
          punicoes1Ano: detalhes1Ano,
          pads: pads.sort((a, b) => {
            const dateA = a.dataInicioPunicao ? new Date(a.dataInicioPunicao).getTime() : 0;
            const dateB = b.dataInicioPunicao ? new Date(b.dataInicioPunicao).getTime() : 0;
            return dateB - dateA; // Ordem decrescente (mais recente primeiro)
          })
        }
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do cálculo:', error);
      return null;
    }
  }
}

// Exportação nomeada para compatibilidade
export default ComportamentoService;