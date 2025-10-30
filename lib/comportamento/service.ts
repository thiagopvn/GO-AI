/**
 * Serviço de Gerenciamento de Comportamento Militar
 * Responsável pela persistência e gerenciamento de dados de comportamento
 */

import {
  ClassificacaoComportamento,
  Punicao,
  ComportamentoMilitar,
  HistoricoComportamento,
  TipoPunicao,
  DashboardComportamento,
} from '@/types/comportamento';
import { CalculadorComportamento } from './calculador';

// Simulação de banco de dados em memória
class ComportamentoDatabase {
  private punicoes: Map<string, Punicao> = new Map();
  private comportamentos: Map<string, ComportamentoMilitar> = new Map();
  private historicos: HistoricoComportamento[] = [];

  // Métodos para Punições
  salvarPunicao(punicao: Punicao): void {
    this.punicoes.set(punicao.id, punicao);
  }

  buscarPunicoesPorMilitar(militarId: string): Punicao[] {
    return Array.from(this.punicoes.values()).filter(
      p => p.militarId === militarId
    );
  }

  buscarPunicaoPorId(id: string): Punicao | undefined {
    return this.punicoes.get(id);
  }

  removerPunicao(id: string): boolean {
    return this.punicoes.delete(id);
  }

  // Métodos para Comportamento
  salvarComportamento(comportamento: ComportamentoMilitar): void {
    this.comportamentos.set(comportamento.militarId, comportamento);
  }

  buscarComportamentoPorMilitar(militarId: string): ComportamentoMilitar | undefined {
    return this.comportamentos.get(militarId);
  }

  buscarTodosComportamentos(): ComportamentoMilitar[] {
    return Array.from(this.comportamentos.values());
  }

  // Métodos para Histórico
  adicionarHistorico(historico: HistoricoComportamento): void {
    this.historicos.push(historico);
  }

  buscarHistoricoPorMilitar(militarId: string): HistoricoComportamento[] {
    return this.historicos
      .filter(h => h.militarId === militarId)
      .sort((a, b) => b.dataAlteracao.getTime() - a.dataAlteracao.getTime());
  }
}

export class ComportamentoService {
  private db: ComportamentoDatabase;
  private calculador: CalculadorComportamento;

  constructor() {
    this.db = new ComportamentoDatabase();
    this.calculador = new CalculadorComportamento();
  }

  /**
   * Registra uma nova punição e recalcula o comportamento automaticamente
   */
  async registrarPunicao(
    militarId: string,
    tipo: TipoPunicao,
    dias: number,
    motivo: string,
    numeroProcesso?: string,
    observacoes?: string
  ): Promise<Punicao> {
    const novaPunicao: Punicao = {
      id: `PUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      militarId,
      tipo,
      dias,
      dataAplicacao: new Date(),
      dataTermino: this.calcularDataTermino(new Date(), dias),
      motivo,
      numeroProcesso,
      observacoes,
      criadoPor: 'sistema',
      criadoEm: new Date(),
    };

    // Salvar punição
    this.db.salvarPunicao(novaPunicao);

    // Recalcular comportamento automaticamente
    await this.recalcularComportamento(militarId, 'Nova punição aplicada');

    return novaPunicao;
  }

  /**
   * Recalcula o comportamento de um militar baseado em seu histórico
   */
  async recalcularComportamento(
    militarId: string,
    motivoRecalculo: string = 'Recálculo automático'
  ): Promise<ComportamentoMilitar> {
    // Buscar todas as punições do militar
    const punicoes = this.db.buscarPunicoesPorMilitar(militarId);

    // Buscar comportamento atual (se existir)
    const comportamentoAtual = this.db.buscarComportamentoPorMilitar(militarId);
    const classificacaoAnterior = comportamentoAtual?.classificacaoAtual || ClassificacaoComportamento.BOM;

    // Calcular nova classificação
    // Para este exemplo, usaremos a data atual como data de inclusão
    const dataInclusao = new Date('2020-01-01'); // Substituir por data real do militar
    const resultado = this.calculador.calcularComportamento(punicoes, dataInclusao);

    // Calcular totais de punições
    const totais = this.calcularTotaisPunicoes(punicoes);

    // Criar/Atualizar registro de comportamento
    const novoComportamento: ComportamentoMilitar = {
      militarId,
      classificacaoAtual: resultado.classificacao,
      dataUltimaAtualizacao: new Date(),
      dataProximaRevisao: resultado.proximaDataMelhoria,
      punicoesAcumuladas: totais,
      historicoClassificacoes: comportamentoAtual?.historicoClassificacoes || [],
    };

    // Se houve mudança de classificação, registrar no histórico
    if (classificacaoAnterior !== resultado.classificacao) {
      const novoHistorico: HistoricoComportamento = {
        id: `HIST-${Date.now()}`,
        militarId,
        classificacaoAnterior,
        classificacaoNova: resultado.classificacao,
        dataAlteracao: new Date(),
        motivoAlteracao: `${motivoRecalculo} - ${resultado.justificativa}`,
        calculoAutomatico: true,
      };

      this.db.adicionarHistorico(novoHistorico);
      novoComportamento.historicoClassificacoes.push(novoHistorico);
    }

    // Salvar comportamento atualizado
    this.db.salvarComportamento(novoComportamento);

    return novoComportamento;
  }

  /**
   * Executa recálculo em massa para todos os militares
   * Útil para executar periodicamente (ex: diariamente)
   */
  async recalcularTodosComportamentos(): Promise<number> {
    const comportamentos = this.db.buscarTodosComportamentos();
    let atualizados = 0;

    for (const comp of comportamentos) {
      const novoComp = await this.recalcularComportamento(
        comp.militarId,
        'Recálculo periódico automático'
      );

      if (novoComp.classificacaoAtual !== comp.classificacaoAtual) {
        atualizados++;
      }
    }

    return atualizados;
  }

  /**
   * Busca o comportamento atual de um militar
   */
  async buscarComportamento(militarId: string): Promise<ComportamentoMilitar | null> {
    let comportamento = this.db.buscarComportamentoPorMilitar(militarId);

    // Se não existe, criar registro inicial
    if (!comportamento) {
      comportamento = await this.recalcularComportamento(militarId, 'Registro inicial');
    }

    return comportamento;
  }

  /**
   * Busca histórico de mudanças de comportamento
   */
  async buscarHistoricoComportamento(militarId: string): Promise<HistoricoComportamento[]> {
    return this.db.buscarHistoricoPorMilitar(militarId);
  }

  /**
   * Gera dados para dashboard de comportamento
   */
  async gerarDashboard(): Promise<DashboardComportamento> {
    const todosComportamentos = this.db.buscarTodosComportamentos();

    // Calcular distribuição
    const distribuicao = {
      [ClassificacaoComportamento.EXCEPCIONAL]: 0,
      [ClassificacaoComportamento.OTIMO]: 0,
      [ClassificacaoComportamento.BOM]: 0,
      [ClassificacaoComportamento.INSUFICIENTE]: 0,
      [ClassificacaoComportamento.MAU]: 0,
    };

    for (const comp of todosComportamentos) {
      distribuicao[comp.classificacaoAtual]++;
    }

    // Identificar militares que precisam de atenção
    const militaresAtencao = todosComportamentos
      .filter(c =>
        c.classificacaoAtual === ClassificacaoComportamento.INSUFICIENTE ||
        c.classificacaoAtual === ClassificacaoComportamento.MAU
      )
      .map(c => ({
        militarId: c.militarId,
        nome: `Militar ${c.militarId}`, // Substituir por nome real
        comportamentoAtual: c.classificacaoAtual,
        punicoesRecentes: c.punicoesAcumuladas.equivalentePrisoes,
        diasParaMelhoria: c.dataProximaRevisao
          ? Math.ceil((c.dataProximaRevisao.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined,
      }));

    // Calcular tendência mensal (simplificado para demonstração)
    const tendenciaMensal = this.calcularTendenciaMensal();

    return {
      totalPracas: todosComportamentos.length,
      distribuicaoComportamento: distribuicao,
      tendenciaMensal,
      militaresAtencao,
    };
  }

  /**
   * Simula o comportamento futuro com punições hipotéticas
   */
  async simularPunicao(
    militarId: string,
    tipoPunicao: TipoPunicao,
    dias: number
  ): Promise<{
    classificacaoAtual: ClassificacaoComportamento;
    classificacaoAposSimulacao: ClassificacaoComportamento;
    mudaria: boolean;
  }> {
    const punicoesAtuais = this.db.buscarPunicoesPorMilitar(militarId);
    const comportamentoAtual = await this.buscarComportamento(militarId);

    const novasPunicoes = [{
      militarId,
      tipo: tipoPunicao,
      dias,
      dataAplicacao: new Date(),
      dataTermino: this.calcularDataTermino(new Date(), dias),
      motivo: 'Simulação',
    }];

    const dataInclusao = new Date('2020-01-01'); // Substituir por data real
    const resultadoSimulacao = this.calculador.simularComportamentoFuturo(
      punicoesAtuais,
      novasPunicoes,
      dataInclusao
    );

    return {
      classificacaoAtual: comportamentoAtual!.classificacaoAtual,
      classificacaoAposSimulacao: resultadoSimulacao.classificacao,
      mudaria: comportamentoAtual!.classificacaoAtual !== resultadoSimulacao.classificacao,
    };
  }

  /**
   * Remove uma punição e recalcula o comportamento
   */
  async removerPunicao(punicaoId: string): Promise<boolean> {
    const punicao = this.db.buscarPunicaoPorId(punicaoId);
    if (!punicao) return false;

    const removida = this.db.removerPunicao(punicaoId);
    if (removida) {
      await this.recalcularComportamento(punicao.militarId, 'Punição removida');
    }

    return removida;
  }

  // Métodos auxiliares privados

  private calcularDataTermino(dataInicio: Date, dias: number): Date {
    const dataTermino = new Date(dataInicio);
    dataTermino.setDate(dataTermino.getDate() + dias);
    return dataTermino;
  }

  private calcularTotaisPunicoes(punicoes: Punicao[]) {
    let repreensoes = 0;
    let detencoes = 0;
    let prisoes = 0;

    for (const p of punicoes) {
      switch (p.tipo) {
        case TipoPunicao.REPREENSAO:
          repreensoes += p.dias;
          break;
        case TipoPunicao.DETENCAO:
          detencoes += p.dias;
          break;
        case TipoPunicao.PRISAO:
          prisoes += p.dias;
          break;
      }
    }

    // Calcular equivalente em prisões
    const equivalentePrisoes = prisoes + (detencoes / 2) + (repreensoes / 4);

    return {
      repreensoes,
      detencoes,
      prisoes,
      equivalentePrisoes,
    };
  }

  private calcularTendenciaMensal() {
    // Implementação simplificada para demonstração
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril',
      'Maio', 'Junho', 'Julho', 'Agosto',
      'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const mesAtual = new Date().getMonth();
    const tendencia = [];

    for (let i = 5; i >= 0; i--) {
      const mesIndex = (mesAtual - i + 12) % 12;
      tendencia.push({
        mes: meses[mesIndex],
        melhorias: Math.floor(Math.random() * 10) + 1,
        rebaixamentos: Math.floor(Math.random() * 5),
      });
    }

    return tendencia;
  }
}

// Exportar instância única (singleton)
export const comportamentoService = new ComportamentoService();