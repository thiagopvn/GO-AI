// Tipos para o Sistema de Classificação de Comportamento Militar (RDCBMERJ)

// Tipos de punições disciplinares
export enum TipoPunicao {
  REPREENSAO = 'REPREENSAO',
  DETENCAO = 'DETENCAO',
  PRISAO = 'PRISAO',
}

// Classificações de comportamento (Art. 52 do RDCBMERJ)
export enum ClassificacaoComportamento {
  EXCEPCIONAL = 'EXCEPCIONAL',
  OTIMO = 'OTIMO',
  BOM = 'BOM',
  INSUFICIENTE = 'INSUFICIENTE',
  MAU = 'MAU',
}

// Interface para registro de punição
export interface Punicao {
  id: string;
  militarId: string;
  tipo: TipoPunicao;
  dias: number; // Quantidade de dias da punição
  dataAplicacao: Date;
  dataTermino: Date;
  motivo: string;
  numeroProcesso?: string; // Referência ao processo (sindicância ou transgressão)
  observacoes?: string;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm?: Date;
}

// Conversão de punições (Art. 55 do RDCBMERJ)
export interface ConversaoPunicao {
  repreensaoParaDetencao: number; // 2 repreensões = 1 detenção
  detencaoParaPrisao: number; // 2 detenções = 1 prisão
}

// Janelas de tempo para cada classificação
export interface JanelaTempoComportamento {
  classificacao: ClassificacaoComportamento;
  anosJanela: number;
  limitePunicoes: {
    tipo: 'prisao' | 'detencao';
    quantidade: number;
  };
}

// Histórico de comportamento do militar
export interface HistoricoComportamento {
  id: string;
  militarId: string;
  classificacaoAnterior: ClassificacaoComportamento;
  classificacaoNova: ClassificacaoComportamento;
  dataAlteracao: Date;
  motivoAlteracao: string; // Ex: "Nova punição aplicada", "Melhoria por decurso de tempo"
  punicaoRelacionadaId?: string;
  calculoAutomatico: boolean;
}

// Estado do comportamento do militar
export interface ComportamentoMilitar {
  militarId: string;
  classificacaoAtual: ClassificacaoComportamento;
  dataUltimaAtualizacao: Date;
  dataProximaRevisao?: Date; // Data em que o comportamento pode melhorar
  punicoesAcumuladas: {
    repreensoes: number;
    detencoes: number;
    prisoes: number;
    equivalentePrisoes: number; // Total convertido em prisões
  };
  historicoClassificacoes: HistoricoComportamento[];
}

// Configuração do sistema de comportamento
export interface ConfiguracaoComportamento {
  conversao: ConversaoPunicao;
  janelas: JanelaTempoComportamento[];
  comportamentoPadraInicial: ClassificacaoComportamento;
  aplicarApenasParaPracas: boolean;
}

// Resultado do cálculo de comportamento
export interface ResultadoCalculoComportamento {
  classificacao: ClassificacaoComportamento;
  justificativa: string;
  punicoesConsideradas: Punicao[];
  proximaDataMelhoria?: Date;
  detalhesCalculo: {
    janelaAnalisada: number; // Em anos
    totalPunicoesEquivalentes: number;
    limitePunicoes: number;
  };
}

// Dados para dashboard de comportamento
export interface DashboardComportamento {
  totalPracas: number;
  distribuicaoComportamento: {
    [key in ClassificacaoComportamento]: number;
  };
  tendenciaMensal: {
    mes: string;
    melhorias: number;
    rebaixamentos: number;
  }[];
  militaresAtencao: {
    // Militares próximos de rebaixamento
    militarId: string;
    nome: string;
    comportamentoAtual: ClassificacaoComportamento;
    punicoesRecentes: number;
    diasParaMelhoria?: number;
  }[];
}