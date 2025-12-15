/**
 * Worker para Recálculo Automático de Comportamento
 * Executa periodicamente para garantir que o comportamento seja atualizado
 * com base na passagem do tempo (melhoria automática)
 */

import { comportamentoService } from './service';

export class ComportamentoWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastExecution: Date | null = null;
  private executionCount: number = 0;

  /**
   * Inicia o worker de recálculo automático
   * @param intervaloMinutos Intervalo em minutos entre execuções (padrão: 60 minutos)
   */
  start(intervaloMinutos: number = 60): void {
    if (this.isRunning) {
      console.log('[ComportamentoWorker] Já está em execução');
      return;
    }

    console.log(`[ComportamentoWorker] Iniciando com intervalo de ${intervaloMinutos} minutos`);

    // Executar imediatamente na primeira vez
    this.executarRecalculo();

    // Configurar execução periódica
    this.intervalId = setInterval(
      () => this.executarRecalculo(),
      intervaloMinutos * 60 * 1000
    );

    this.isRunning = true;
  }

  /**
   * Para o worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[ComportamentoWorker] Não está em execução');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('[ComportamentoWorker] Parado');
  }

  /**
   * Executa o recálculo de comportamentos
   */
  private async executarRecalculo(): Promise<void> {
    const inicio = Date.now();
    console.log('[ComportamentoWorker] Iniciando recálculo automático...');

    try {
      const atualizados = await comportamentoService.recalcularTodosComportamentos();

      const duracao = Date.now() - inicio;
      this.lastExecution = new Date();
      this.executionCount++;

      console.log(
        `[ComportamentoWorker] Recálculo concluído em ${duracao}ms. ` +
        `${atualizados} comportamentos atualizados. ` +
        `Execução #${this.executionCount}`
      );

      // Registrar estatísticas
      this.registrarEstatisticas(atualizados, duracao);

    } catch (error) {
      console.error('[ComportamentoWorker] Erro durante recálculo:', error);
      // Poderia enviar notificação de erro aqui
    }
  }

  /**
   * Registra estatísticas da execução
   */
  private registrarEstatisticas(atualizados: number, duracao: number): void {
    const estatisticas = {
      timestamp: new Date(),
      executionNumber: this.executionCount,
      updatedCount: atualizados,
      durationMs: duracao,
      status: 'success',
    };

    // Aqui você poderia salvar em banco de dados ou enviar para sistema de monitoramento
    // Por enquanto, apenas log
    if (atualizados > 0) {
      console.log('[ComportamentoWorker] Estatísticas:', estatisticas);
    }
  }

  /**
   * Retorna o status atual do worker
   */
  getStatus(): {
    isRunning: boolean;
    lastExecution: Date | null;
    executionCount: number;
  } {
    return {
      isRunning: this.isRunning,
      lastExecution: this.lastExecution,
      executionCount: this.executionCount,
    };
  }

  /**
   * Força uma execução imediata (útil para testes ou situações especiais)
   */
  async forcarExecucao(): Promise<number> {
    console.log('[ComportamentoWorker] Execução forçada iniciada');
    return await comportamentoService.recalcularTodosComportamentos();
  }
}

// Criar instância singleton
export const comportamentoWorker = new ComportamentoWorker();

// Função utilitária para iniciar o worker em ambiente de produção
export function iniciarWorkerComportamento(): void {
  if (typeof window === 'undefined') {
    // Executar apenas no servidor (Node.js)

    // Em produção, executar a cada hora
    const intervalo = process.env.NODE_ENV === 'production' ? 60 : 5; // 5 minutos em dev

    comportamentoWorker.start(intervalo);

    // Registrar handlers para shutdown gracioso
    process.on('SIGTERM', () => {
      console.log('[ComportamentoWorker] SIGTERM recebido, parando worker...');
      comportamentoWorker.stop();
    });

    process.on('SIGINT', () => {
      console.log('[ComportamentoWorker] SIGINT recebido, parando worker...');
      comportamentoWorker.stop();
      process.exit(0);
    });
  }
}

/**
 * Hook para usar o worker em componentes React
 */
export function useComportamentoWorker() {
  const forcarRecalculo = async () => {
    try {
      const atualizados = await comportamentoWorker.forcarExecucao();
      return {
        success: true,
        atualizados,
        mensagem: `${atualizados} comportamentos atualizados`,
      };
    } catch (error) {
      return {
        success: false,
        atualizados: 0,
        mensagem: 'Erro ao executar recálculo',
      };
    }
  };

  const obterStatus = () => {
    return comportamentoWorker.getStatus();
  };

  return {
    forcarRecalculo,
    obterStatus,
  };
}