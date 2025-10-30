/**
 * Módulo de Cálculo Automático de Comportamento Militar
 * Baseado no Regulamento Disciplinar do CBMERJ (RDCBMERJ)
 *
 * Este módulo automatiza a classificação do comportamento dos militares,
 * eliminando análise manual e garantindo aplicação consistente das regras.
 */

import {
  ClassificacaoComportamento,
  TipoPunicao,
  Punicao,
  ResultadoCalculoComportamento,
  ConfiguracaoComportamento,
} from '@/types/comportamento';

// Configuração padrão baseada no RDCBMERJ
export const CONFIGURACAO_PADRAO: ConfiguracaoComportamento = {
  conversao: {
    repreensaoParaDetencao: 2, // 2 repreensões = 1 detenção
    detencaoParaPrisao: 2, // 2 detenções = 1 prisão
  },
  janelas: [
    {
      classificacao: ClassificacaoComportamento.EXCEPCIONAL,
      anosJanela: 8,
      limitePunicoes: { tipo: 'prisao', quantidade: 0 },
    },
    {
      classificacao: ClassificacaoComportamento.OTIMO,
      anosJanela: 4,
      limitePunicoes: { tipo: 'detencao', quantidade: 1 },
    },
    {
      classificacao: ClassificacaoComportamento.BOM,
      anosJanela: 2,
      limitePunicoes: { tipo: 'prisao', quantidade: 2 },
    },
    {
      classificacao: ClassificacaoComportamento.INSUFICIENTE,
      anosJanela: 1,
      limitePunicoes: { tipo: 'prisao', quantidade: 2 },
    },
    {
      classificacao: ClassificacaoComportamento.MAU,
      anosJanela: 1,
      limitePunicoes: { tipo: 'prisao', quantidade: 2 }, // Mais de 2 = MAU
    },
  ],
  comportamentoPadraInicial: ClassificacaoComportamento.BOM,
  aplicarApenasParaPracas: true,
};

export class CalculadorComportamento {
  private config: ConfiguracaoComportamento;

  constructor(config: ConfiguracaoComportamento = CONFIGURACAO_PADRAO) {
    this.config = config;
  }

  /**
   * Converte todas as punições para equivalente em prisões
   * Regra de conversão (Art. 55):
   * - 2 repreensões = 1 detenção
   * - 2 detenções = 1 prisão
   * - Logo: 4 repreensões = 1 prisão
   */
  private converterPunicoesParaPrisoes(punicoes: Punicao[]): number {
    let totalRepreensoes = 0;
    let totalDetencoes = 0;
    let totalPrisoes = 0;

    for (const punicao of punicoes) {
      switch (punicao.tipo) {
        case TipoPunicao.REPREENSAO:
          totalRepreensoes += punicao.dias;
          break;
        case TipoPunicao.DETENCAO:
          totalDetencoes += punicao.dias;
          break;
        case TipoPunicao.PRISAO:
          totalPrisoes += punicao.dias;
          break;
      }
    }

    // Converter repreensões em detenções
    const detencoesDeRepreensoes = totalRepreensoes / this.config.conversao.repreensaoParaDetencao;

    // Somar todas as detenções
    const totalDetencoesEquivalente = totalDetencoes + detencoesDeRepreensoes;

    // Converter detenções em prisões
    const prisoesDeDetencoes = totalDetencoesEquivalente / this.config.conversao.detencaoParaPrisao;

    // Total final em equivalente de prisões
    return totalPrisoes + prisoesDeDetencoes;
  }

  /**
   * Converte punições para equivalente em detenções
   * Usado especificamente para a classificação ÓTIMO
   */
  private converterPunicoesParaDetencoes(punicoes: Punicao[]): number {
    let totalRepreensoes = 0;
    let totalDetencoes = 0;
    let totalPrisoes = 0;

    for (const punicao of punicoes) {
      switch (punicao.tipo) {
        case TipoPunicao.REPREENSAO:
          totalRepreensoes += punicao.dias;
          break;
        case TipoPunicao.DETENCAO:
          totalDetencoes += punicao.dias;
          break;
        case TipoPunicao.PRISAO:
          totalPrisoes += punicao.dias;
          break;
      }
    }

    // Converter repreensões em detenções
    const detencoesDeRepreensoes = totalRepreensoes / this.config.conversao.repreensaoParaDetencao;

    // Converter prisões em detenções
    const detencoesDeprisoes = totalPrisoes * this.config.conversao.detencaoParaPrisao;

    // Total em detenções
    return totalDetencoes + detencoesDeRepreensoes + detencoesDeprisoes;
  }

  /**
   * Filtra punições dentro de uma janela de tempo específica
   */
  private filtrarPunicoesPorJanela(
    punicoes: Punicao[],
    anosJanela: number,
    dataReferencia: Date = new Date()
  ): Punicao[] {
    const dataLimite = new Date(dataReferencia);
    dataLimite.setFullYear(dataLimite.getFullYear() - anosJanela);

    return punicoes.filter(p => p.dataAplicacao >= dataLimite);
  }

  /**
   * Calcula a classificação de comportamento baseada no histórico de punições
   * Aplica as regras do Art. 52 do RDCBMERJ
   */
  calcularComportamento(
    punicoesTotais: Punicao[],
    dataInclusao: Date,
    dataReferencia: Date = new Date()
  ): ResultadoCalculoComportamento {
    // Ordenar janelas por tempo (maior para menor) para verificar da melhor para pior
    const janelasOrdenadas = [...this.config.janelas].sort(
      (a, b) => b.anosJanela - a.anosJanela
    );

    for (const janela of janelasOrdenadas) {
      const punicoesNaJanela = this.filtrarPunicoesPorJanela(
        punicoesTotais,
        janela.anosJanela,
        dataReferencia
      );

      let totalEquivalente: number;
      let unidadeMedida: string;

      // Calcular o equivalente baseado no tipo de limite
      if (janela.limitePunicoes.tipo === 'prisao') {
        totalEquivalente = this.converterPunicoesParaPrisoes(punicoesNaJanela);
        unidadeMedida = 'prisão(ões)';
      } else {
        totalEquivalente = this.converterPunicoesParaDetencoes(punicoesNaJanela);
        unidadeMedida = 'detenção(ões)';
      }

      // Verificar condições específicas para cada classificação
      let atendeCriterio = false;
      let justificativa = '';

      switch (janela.classificacao) {
        case ClassificacaoComportamento.EXCEPCIONAL:
          // Excepcional: ZERO punições em 8 anos
          atendeCriterio = totalEquivalente === 0;
          justificativa = `Sem punições nos últimos ${janela.anosJanela} anos`;
          break;

        case ClassificacaoComportamento.OTIMO:
          // Ótimo: No máximo 1 detenção em 4 anos
          atendeCriterio = totalEquivalente <= janela.limitePunicoes.quantidade;
          justificativa = `${totalEquivalente.toFixed(1)} ${unidadeMedida} nos últimos ${janela.anosJanela} anos (limite: ${janela.limitePunicoes.quantidade})`;
          break;

        case ClassificacaoComportamento.BOM:
          // Bom: No máximo 2 prisões em 2 anos
          atendeCriterio = totalEquivalente <= janela.limitePunicoes.quantidade;
          justificativa = `${totalEquivalente.toFixed(1)} ${unidadeMedida} equivalente(s) nos últimos ${janela.anosJanela} anos (limite: ${janela.limitePunicoes.quantidade})`;
          break;

        case ClassificacaoComportamento.INSUFICIENTE:
          // Insuficiente: Até 2 prisões em 1 ano (se tiver mais, é MAU)
          atendeCriterio = totalEquivalente > 0 && totalEquivalente <= janela.limitePunicoes.quantidade;
          justificativa = `${totalEquivalente.toFixed(1)} ${unidadeMedida} equivalente(s) no último ano (limite: ${janela.limitePunicoes.quantidade})`;
          break;

        case ClassificacaoComportamento.MAU:
          // Mau: Mais de 2 prisões em 1 ano
          atendeCriterio = totalEquivalente > janela.limitePunicoes.quantidade;
          justificativa = `${totalEquivalente.toFixed(1)} ${unidadeMedida} equivalente(s) no último ano (acima do limite de ${janela.limitePunicoes.quantidade})`;
          break;
      }

      if (atendeCriterio) {
        // Calcular próxima data de possível melhoria
        const proximaDataMelhoria = this.calcularProximaDataMelhoria(
          punicoesNaJanela,
          janela.classificacao,
          dataReferencia
        );

        return {
          classificacao: janela.classificacao,
          justificativa,
          punicoesConsideradas: punicoesNaJanela,
          proximaDataMelhoria,
          detalhesCalculo: {
            janelaAnalisada: janela.anosJanela,
            totalPunicoesEquivalentes: totalEquivalente,
            limitePunicoes: janela.limitePunicoes.quantidade,
          },
        };
      }
    }

    // Se nenhuma condição foi atendida, retornar comportamento BOM (padrão)
    return {
      classificacao: ClassificacaoComportamento.BOM,
      justificativa: 'Comportamento padrão inicial',
      punicoesConsideradas: [],
      detalhesCalculo: {
        janelaAnalisada: 2,
        totalPunicoesEquivalentes: 0,
        limitePunicoes: 2,
      },
    };
  }

  /**
   * Calcula a próxima data em que o comportamento pode melhorar
   * baseado na saída de punições da janela de tempo
   */
  private calcularProximaDataMelhoria(
    punicoesNaJanela: Punicao[],
    classificacaoAtual: ClassificacaoComportamento,
    dataReferencia: Date
  ): Date | undefined {
    if (punicoesNaJanela.length === 0) return undefined;

    // Se o comportamento já é excepcional, não há melhoria possível
    if (classificacaoAtual === ClassificacaoComportamento.EXCEPCIONAL) {
      return undefined;
    }

    // Ordenar punições por data (mais antigas primeiro)
    const punicoesOrdenadas = [...punicoesNaJanela].sort(
      (a, b) => a.dataAplicacao.getTime() - b.dataAplicacao.getTime()
    );

    // Encontrar a janela da próxima classificação melhor
    const indiceAtual = this.config.janelas.findIndex(
      j => j.classificacao === classificacaoAtual
    );

    if (indiceAtual > 0) {
      const proximaJanelaMelhor = this.config.janelas[indiceAtual - 1];

      // A data de melhoria é quando a punição mais antiga sair da janela da próxima classificação
      const punicaoMaisAntiga = punicoesOrdenadas[0];
      const dataMelhoria = new Date(punicaoMaisAntiga.dataAplicacao);
      dataMelhoria.setFullYear(dataMelhoria.getFullYear() + proximaJanelaMelhor.anosJanela);
      dataMelhoria.setDate(dataMelhoria.getDate() + 1); // +1 dia para sair completamente da janela

      return dataMelhoria;
    }

    return undefined;
  }

  /**
   * Verifica se um militar é elegível para classificação de comportamento
   * (Apenas Praças têm classificação de comportamento)
   */
  isElegivelParaClassificacao(posto: string): boolean {
    const postosPracas = [
      'SOLDADO',
      'CABO',
      'TERCEIRO_SARGENTO',
      'SEGUNDO_SARGENTO',
      'PRIMEIRO_SARGENTO',
      'SUBTENENTE',
    ];

    return postosPracas.includes(posto.toUpperCase());
  }

  /**
   * Simula o comportamento futuro baseado em novas punições hipotéticas
   */
  simularComportamentoFuturo(
    punicoesAtuais: Punicao[],
    novasPunicoes: Omit<Punicao, 'id' | 'criadoEm' | 'criadoPor'>[],
    dataInclusao: Date,
    dataSimulacao: Date = new Date()
  ): ResultadoCalculoComportamento {
    const punicoesSimuladas: Punicao[] = [
      ...punicoesAtuais,
      ...novasPunicoes.map((p, index) => ({
        ...p,
        id: `simulada-${index}`,
        criadoEm: new Date(),
        criadoPor: 'simulacao',
      } as Punicao)),
    ];

    return this.calcularComportamento(punicoesSimuladas, dataInclusao, dataSimulacao);
  }
}