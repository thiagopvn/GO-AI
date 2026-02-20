// Tipos para o módulo de Permutas

export type FuncaoPermuta = '1º SOCORRO' | '2º SOCORRO' | 'BUSCA E SALVAMENTO' | 'OFICIAL DE DIA AO QCG' | string;

export const FUNCOES_PADRAO: FuncaoPermuta[] = [
  '1º SOCORRO',
  '2º SOCORRO',
  'BUSCA E SALVAMENTO',
  'OFICIAL DE DIA AO QCG',
];

// Ordem de exibição das funções no documento
export const ORDEM_FUNCOES: string[] = [
  '1º SOCORRO',
  '2º SOCORRO',
  'BUSCA E SALVAMENTO',
  'OFICIAL DE DIA AO QCG',
];

export interface MilitarSnapshot {
  rg: string;
  nome: string;
  grad: string;       // patente / graduação
  quadro: string;     // ex: "QOC", "QPE", etc.
  unidade?: string;
}

export interface PermutaDoc {
  id: string;
  data: string;                          // ISO date string "2026-02-19" (data do serviço)
  funcao: FuncaoPermuta;
  militarEntraRg: string;
  militarSaiRg: string;
  militarEntraData: MilitarSnapshot;     // snapshot do militar que entra
  militarSaiData: MilitarSnapshot;       // snapshot do militar que sai
  enviada: boolean;
  dataEnvio?: string;                    // ISO date string
  arquivada: boolean;
  dataArquivamento?: string;             // ISO date string
  sei?: {
    processo?: string;
    documento?: string;
  };
  documentoGerado?: {
    url: string;
    geradoEm: string;                   // ISO date string
  };
  criadoPor: string;
  criadoEm: string;                     // ISO date string
  atualizadoEm: string;                 // ISO date string
}

// Tipo para exibição na UI (mesmo que PermutaDoc já tem snapshots)
export type PermutaUI = PermutaDoc;

// Tipo para criar uma permuta (sem id e campos automáticos)
export interface PermutaInput {
  data: string;
  funcao: FuncaoPermuta;
  militarEntraRg: string;
  militarSaiRg: string;
  militarEntraData: MilitarSnapshot;
  militarSaiData: MilitarSnapshot;
  sei?: {
    processo?: string;
    documento?: string;
  };
}

// Filtros para listar permutas
export interface PermutaFiltros {
  arquivada?: boolean;
  enviada?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}
