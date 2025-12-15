/**
 * ComportamentoService - Serviço para cálculo de comportamento militar
 *
 * Este serviço implementa a lógica correta de cálculo de comportamento militar
 * baseada nas regras do RDCBMERJ (Regulamento Disciplinar do CBMERJ).
 *
 * IMPORTANTE:
 * - A análise é feita na coleção 'processos' (não em 'transgressoes')
 * - A data de referência é 'dataFechamento' (não 'data' ou 'dataInicioPunicao')
 * - O cálculo se baseia na QUANTIDADE de punições, NÃO na duração em dias
 * - Apenas processos com status='Finalizado' e decisao='Punição Aplicada' são considerados
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
  ProcessoDisciplinar,
  TipoPunicao,
  Militar,
  ComportamentoMilitar,
  isPraca
} from '@/types';

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

      // Passo 2: Buscar TODO o histórico de punições do militar
      const processosPunitivos = await this.buscarProcessosPunitivos(militarId);

      // Passo 3 e 4: Calcular o comportamento baseado nas regras e data de inclusão
      const novoComportamento = this.calcularComportamento(processosPunitivos, militar.dataInclusao);

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
   * Busca todos os processos punitivos finalizados de um militar
   * @param militarId ID do militar
   * @returns Array de processos disciplinares com punição aplicada
   */
  private static async buscarProcessosPunitivos(
    militarId: string
  ): Promise<ProcessoDisciplinar[]> {
    const q = query(
      collection(db, 'processos'),
      where('militarId', '==', militarId),
      where('status', '==', 'Finalizado'),
      where('decisao', '==', 'Punição Aplicada')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        // Converter timestamps para Date
        dataFechamento: data.dataFechamento?.toDate?.() || data.dataFechamento,
        dataAbertura: data.dataAbertura?.toDate?.() || data.dataAbertura,
        dataInicioPunicao: data.dataInicioPunicao?.toDate?.() || data.dataInicioPunicao,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as ProcessoDisciplinar;
    });
  }

  /**
   * Filtra processos por janela de tempo baseado na dataFechamento
   * @param processos Array de processos
   * @param anos Número de anos para a janela de tempo
   * @returns Processos dentro da janela de tempo
   */
  private static filtrarPorJanelaTempo(
    processos: ProcessoDisciplinar[],
    anos: number
  ): ProcessoDisciplinar[] {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setFullYear(hoje.getFullYear() - anos);

    return processos.filter(processo => {
      if (!processo.dataFechamento) return false;
      const dataFechamento = new Date(processo.dataFechamento);
      return dataFechamento >= dataLimite;
    });
  }

  /**
   * Conta as punições por tipo em uma lista de processos
   * @param processos Array de processos
   * @returns Contagem de punições por tipo
   */
  private static contarPunicoes(processos: ProcessoDisciplinar[]): ContagemPunicoes {
    const contagem: ContagemPunicoes = {
      repreensoes: 0,
      detencoes: 0,
      prisoes: 0
    };

    processos.forEach(processo => {
      const tipoPunicao = String(processo.tipoPunicao || '').toLowerCase();
      if (tipoPunicao === 'repreensão' || tipoPunicao === 'repreensao' || tipoPunicao === TipoPunicao.REPREENSAO.toLowerCase()) {
        contagem.repreensoes++;
      } else if (tipoPunicao === 'detenção' || tipoPunicao === 'detencao' || tipoPunicao === TipoPunicao.DETENCAO.toLowerCase()) {
        contagem.detencoes++;
      } else if (tipoPunicao === 'prisão' || tipoPunicao === 'prisao' || tipoPunicao === TipoPunicao.PRISAO.toLowerCase()) {
        contagem.prisoes++;
      }
    });

    return contagem;
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
   * @param processos Array completo de processos punitivos do militar
   * @param dataInclusao Data de inclusão do militar no serviço
   * @returns Classificação de comportamento
   */
  private static calcularComportamento(
    processos: ProcessoDisciplinar[],
    dataInclusao: Date
  ): ComportamentoMilitar {
    // Calcular tempo de serviço em anos
    const hoje = new Date();
    const dataInclusaoDate = new Date(dataInclusao);
    const tempoServicoAnos = (hoje.getTime() - dataInclusaoDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // Regra 1: EXCEPCIONAL - 8 anos sem punições (apenas se tem 8+ anos de serviço)
    if (tempoServicoAnos >= 8) {
      const punicoes8Anos = this.filtrarPorJanelaTempo(processos, 8);
      if (punicoes8Anos.length === 0) {
        return ComportamentoMilitar.EXCEPCIONAL;
      }
    }

    // Regra 2: ÓTIMO - 4 anos com no máximo 1 detenção equivalente (apenas se tem 4+ anos de serviço)
    if (tempoServicoAnos >= 4) {
      const punicoes4Anos = this.filtrarPorJanelaTempo(processos, 4);
      const contagem4Anos = this.contarPunicoes(punicoes4Anos);
      const detencoesEquivalentes4Anos = this.converterEmDetencoesEquivalentes(contagem4Anos);

      if (detencoesEquivalentes4Anos <= 1) {
        return ComportamentoMilitar.OTIMO;
      }
    }

    // Avaliar punições no último ano (SEMPRE - para detectar quedas)
    const punicoesUltimoAno = tempoServicoAnos >= 1
      ? this.filtrarPorJanelaTempo(processos, 1)
      : processos; // Se tem menos de 1 ano, avaliar todas as punições desde a inclusão

    const contagemUltimoAno = this.contarPunicoes(punicoesUltimoAno);
    const prisoesEquivalentesUltimoAno = this.converterEmPrisoesEquivalentes(contagemUltimoAno);

    // Regra de queda no último ano: Mais de 2 prisões equivalentes -> MAU
    if (prisoesEquivalentesUltimoAno > 2) {
      return ComportamentoMilitar.MAU;
    }

    // Regra de queda no último ano: Exatamente 2 prisões equivalentes -> INSUFICIENTE
    if (prisoesEquivalentesUltimoAno === 2) {
      return ComportamentoMilitar.INSUFICIENTE;
    }

    // Regra 3: Avaliar últimos 2 anos (se tem 2+ anos de serviço)
    if (tempoServicoAnos >= 2) {
      const punicoes2Anos = this.filtrarPorJanelaTempo(processos, 2);
      const contagem2Anos = this.contarPunicoes(punicoes2Anos);
      const prisoesEquivalentes2Anos = this.converterEmPrisoesEquivalentes(contagem2Anos);

      // Regra de queda nos últimos 2 anos: Mais de 2 prisões equivalentes -> MAU
      if (prisoesEquivalentes2Anos > 2) {
        return ComportamentoMilitar.MAU;
      }

      // Regra de queda nos últimos 2 anos: Exatamente 2 prisões equivalentes -> INSUFICIENTE
      if (prisoesEquivalentes2Anos === 2) {
        return ComportamentoMilitar.INSUFICIENTE;
      }

      // Menos de 2 prisões equivalentes em 2 anos -> BOM
      return ComportamentoMilitar.BOM;
    }

    // Comportamento padrão: BOM (todos iniciam no BOM, menos de 2 prisões equiv.)
    return ComportamentoMilitar.BOM;
  }

  /**
   * Atualiza o comportamento do militar no Firestore
   * @param militarId ID do militar
   * @param comportamento Novo comportamento
   */
  private static async atualizarComportamentoNoFirestore(
    militarId: string,
    comportamento: ComportamentoMilitar
  ): Promise<void> {
    await updateDoc(doc(db, 'militares', militarId), {
      comportamento: comportamento,
      dataUltimaAtualizacaoComportamento: Timestamp.now(),
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
      punicoes8Anos: number | string;
      punicoes4Anos: { total: number | string; detencoesEquivalentes: number | string };
      punicoes2Anos: { total: number | string; prisoesEquivalentes: number | string };
      punicoes1Ano: { total: number | string; prisoesEquivalentes: number | string };
      processos: ProcessoDisciplinar[];
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

      // Buscar processos
      const processos = await this.buscarProcessosPunitivos(militarId);

      // Calcular detalhes para cada janela (respeitando tempo de serviço)
      let detalhes8Anos: number | string = "N/A - menos de 8 anos de serviço";
      let detalhes4Anos: { total: number | string; detencoesEquivalentes: number | string } = {
        total: "N/A - menos de 4 anos de serviço",
        detencoesEquivalentes: "N/A"
      };
      let detalhes2Anos: { total: number | string; prisoesEquivalentes: number | string } = {
        total: "N/A - menos de 2 anos de serviço",
        prisoesEquivalentes: "N/A"
      };
      let detalhes1Ano: { total: number | string; prisoesEquivalentes: number | string } = {
        total: "N/A - menos de 1 ano de serviço",
        prisoesEquivalentes: "N/A"
      };

      // Calcular apenas para janelas aplicáveis baseado no tempo de serviço
      if (tempoServicoAnos >= 8) {
        const punicoes8Anos = this.filtrarPorJanelaTempo(processos, 8);
        detalhes8Anos = punicoes8Anos.length;
      }

      if (tempoServicoAnos >= 4) {
        const punicoes4Anos = this.filtrarPorJanelaTempo(processos, 4);
        const contagem4Anos = this.contarPunicoes(punicoes4Anos);
        detalhes4Anos = {
          total: punicoes4Anos.length,
          detencoesEquivalentes: this.converterEmDetencoesEquivalentes(contagem4Anos)
        };
      }

      if (tempoServicoAnos >= 2) {
        const punicoes2Anos = this.filtrarPorJanelaTempo(processos, 2);
        const contagem2Anos = this.contarPunicoes(punicoes2Anos);
        detalhes2Anos = {
          total: punicoes2Anos.length,
          prisoesEquivalentes: this.converterEmPrisoesEquivalentes(contagem2Anos)
        };
      }

      if (tempoServicoAnos >= 1) {
        const punicoes1Ano = this.filtrarPorJanelaTempo(processos, 1);
        const contagem1Ano = this.contarPunicoes(punicoes1Ano);
        detalhes1Ano = {
          total: punicoes1Ano.length,
          prisoesEquivalentes: this.converterEmPrisoesEquivalentes(contagem1Ano)
        };
      }

      const comportamentoCalculado = this.calcularComportamento(processos, militar.dataInclusao);

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
          processos: processos.sort((a, b) => {
            const dateA = a.dataFechamento ? new Date(a.dataFechamento).getTime() : 0;
            const dateB = b.dataFechamento ? new Date(b.dataFechamento).getTime() : 0;
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