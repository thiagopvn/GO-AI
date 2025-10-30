// Tipos de dados do sistema

// Tipos base - devem vir primeiro
export enum ComportamentoMilitar {
  EXCEPCIONAL = 'Excepcional',
  OTIMO = 'Ótimo',
  BOM = 'Bom',
  INSUFICIENTE = 'Insuficiente',
  MAU = 'Mau'
}

export enum TipoPunicao {
  REPREENSAO = 'Repreensão',
  DETENCAO = 'Detenção',
  PRISAO = 'Prisão'
}

export enum Patente {
  CORONEL = 'Coronel',
  TENENTE_CORONEL = 'Tenente Coronel',
  MAJOR = 'Major',
  CAPITAO = 'Capitão',
  PRIMEIRO_TENENTE = '1º Tenente',
  SEGUNDO_TENENTE = '2º Tenente',
  ASPIRANTE = 'Aspirante',
  SUBTENENTE = 'Subtenente',
  PRIMEIRO_SARGENTO = '1º Sargento',
  SEGUNDO_SARGENTO = '2º Sargento',
  TERCEIRO_SARGENTO = '3º Sargento',
  CABO = 'Cabo',
  SOLDADO = 'Soldado'
}

export interface Militar {
  id: string;
  rg?: string;
  matricula: string;
  nome: string;
  nomeCompleto?: string;
  nomeDeGuerra?: string; // Nome de guerra (será destacado em negrito nos documentos)
  nomeGuerra?: string; // Alias para compatibilidade
  patente: string;
  postoGraduacao?: string;
  unidade?: string;
  subunidade?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  dataInclusao?: Date;
  comportamento?: ComportamentoMilitar;
  diasForaDaPauta?: number;
  status?: 'Ativo' | 'Inativo' | 'Afastado' | 'Baixado';
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transgressao {
  id: string;
  militarId: string;
  militarNome?: string;
  militarPosto?: string;
  data: Date;
  numero?: string; // Número do BI
  tipo?: string;
  artigo?: string;
  natureza?: 'Leve' | 'Média' | 'Grave';
  punicao?: string;
  tipoPunicao?: TipoPunicao;
  diasPunicao: number;
  descricao: string;
  reincidente?: boolean;
  processoId?: string;
  dataInicioCumprimento?: Date;
  dataFimCumprimento?: Date;
  status?: 'Em Cumprimento' | 'Cumprida' | 'Cancelada' | 'Aguardando';
  comportamentoAnterior?: string;
  comportamentoAtual?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface Sindicancia {
  id: string;
  numero: string;
  tipo: 'Sindicância' | 'IPM' | 'Conselho de Disciplina' | 'Apuratória';
  encarregadoId: string;
  encarregadoNome: string;
  encarregadoPosto: string;
  militarInvestigadoId?: string;
  militarInvestigadoNome?: string;
  assunto: string;
  dataInstauracao: Date;
  prazoInicial: number; // em dias
  prorrogacoes: number;
  dataLimite: Date;
  status: 'Em Andamento' | 'Concluída' | 'Arquivada' | 'Cancelada';
  decisao?: string;
  observacoes?: string;
  documentos?: string[]; // URLs dos documentos
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PAD {
  id: string;
  numero: string;
  militarId: string;
  militarNome: string;
  militarPosto: string;
  transgressaoId: string;
  dataEmissao: Date;
  prazoRecurso: Date; // 5 dias úteis
  prazoNota: Date; // 10 dias
  status: 'Emitido' | 'Recorrido' | 'Mantido' | 'Modificado' | 'Cancelado';
  documentoUrl?: string;
  recurso?: {
    data: Date;
    motivo: string;
    decisao?: string;
  };
  nota?: {
    data: Date;
    conteudo: string;
  };
  createdAt: Date;
  createdBy: string;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: any;
  tipo: 'texto' | 'numero' | 'booleano' | 'json';
  categoria: 'geral' | 'prazos' | 'documentos' | 'notificacoes' | 'comportamento';
  descricao?: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface Notificacao {
  id: string;
  tipo: 'prazo' | 'transgressao' | 'sindicancia' | 'comportamento' | 'sistema';
  titulo: string;
  mensagem: string;
  lida: boolean;
  usuarioId: string;
  link?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  createdAt: Date;
}

export interface DistribuicaoSindicancia {
  oficialId: string;
  oficialNome: string;
  oficialPosto: string;
  totalSindicancias: number;
  sindicanciasEmAndamento: number;
  ultimaSindicancia?: Date;
  disponivel: boolean;
}

// Função auxiliar para verificar se é praça
export function isPraca(postoGraduacao: string): boolean {
  const pracas = ['Subtenente', '1º Sargento', '2º Sargento', '3º Sargento', 'Cabo', 'Soldado'];
  return pracas.includes(postoGraduacao);
}

// Tipos para Processos Disciplinares
export interface ProcessoDisciplinar {
  id: string;
  numero: string;
  tipo: TipoProcesso;
  militarId: string;
  militarNome?: string;
  militarPosto?: string;
  transgressaoId?: string;
  padId?: string; // ID do PAD na nova coleção 'pads'
  dataAbertura: Date;
  dataFechamento?: Date;
  status: StatusProcesso;
  motivo: string;
  relator?: string;
  decisao?: string;
  observacoes?: string;
  documentoUrl?: string;
  documentos?: string[];
  // Campos para conclusão do PAD
  tipoPunicao?: TipoPunicao | null;
  diasPunicao?: number | null;
  dataInicioPunicao?: Date | null;
  justificativa?: string | null;
  observacoesConclusao?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export enum TipoProcesso {
  PAD = 'PAD',
  SINDICANCIA = 'Sindicância',
  IPM = 'IPM',
  CONSELHO_DISCIPLINA = 'Conselho de Disciplina'
}

export enum StatusProcesso {
  EM_ANDAMENTO = 'Em Andamento',
  AGUARDANDO_DECISAO = 'Aguardando Decisão',
  FINALIZADO = 'Finalizado',
  ARQUIVADO = 'Arquivado',
  CANCELADO = 'Cancelado'
}
