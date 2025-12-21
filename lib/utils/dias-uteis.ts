// Utilitários para cálculo de dias úteis
import { addDays, isWeekend, isBefore, startOfDay, differenceInDays } from 'date-fns';

// Feriados nacionais fixos (dia/mês)
const FERIADOS_FIXOS = [
  { dia: 1, mes: 1 },   // Confraternização Universal
  { dia: 21, mes: 4 },  // Tiradentes
  { dia: 1, mes: 5 },   // Dia do Trabalho
  { dia: 7, mes: 9 },   // Independência do Brasil
  { dia: 12, mes: 10 }, // Nossa Senhora Aparecida
  { dia: 2, mes: 11 },  // Finados
  { dia: 15, mes: 11 }, // Proclamação da República
  { dia: 25, mes: 12 }, // Natal
];

// Feriados móveis 2024/2025/2026 (calculados previamente)
const FERIADOS_MOVEIS: { [ano: number]: Date[] } = {
  2024: [
    new Date(2024, 1, 12), // Carnaval
    new Date(2024, 1, 13), // Carnaval
    new Date(2024, 2, 29), // Sexta-feira Santa
    new Date(2024, 4, 30), // Corpus Christi
  ],
  2025: [
    new Date(2025, 2, 3),  // Carnaval
    new Date(2025, 2, 4),  // Carnaval
    new Date(2025, 3, 18), // Sexta-feira Santa
    new Date(2025, 5, 19), // Corpus Christi
  ],
  2026: [
    new Date(2026, 1, 16), // Carnaval
    new Date(2026, 1, 17), // Carnaval
    new Date(2026, 3, 3),  // Sexta-feira Santa
    new Date(2026, 5, 4),  // Corpus Christi
  ],
};

// Feriados estaduais RJ
const FERIADOS_RJ = [
  { dia: 23, mes: 4 },  // São Jorge
  { dia: 20, mes: 11 }, // Dia da Consciência Negra
];

/**
 * Verifica se uma data é feriado
 */
export function isFeriado(data: Date): boolean {
  const dia = data.getDate();
  const mes = data.getMonth() + 1;
  const ano = data.getFullYear();

  // Verificar feriados fixos nacionais
  for (const feriado of FERIADOS_FIXOS) {
    if (feriado.dia === dia && feriado.mes === mes) {
      return true;
    }
  }

  // Verificar feriados estaduais RJ
  for (const feriado of FERIADOS_RJ) {
    if (feriado.dia === dia && feriado.mes === mes) {
      return true;
    }
  }

  // Verificar feriados móveis
  const feriadosAno = FERIADOS_MOVEIS[ano] || [];
  for (const feriado of feriadosAno) {
    if (
      feriado.getDate() === dia &&
      feriado.getMonth() === data.getMonth() &&
      feriado.getFullYear() === ano
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica se uma data é dia útil
 */
export function isDiaUtil(data: Date): boolean {
  return !isWeekend(data) && !isFeriado(data);
}

/**
 * Adiciona dias úteis a uma data
 */
export function adicionarDiasUteis(dataInicial: Date, diasUteis: number): Date {
  let dataAtual = startOfDay(new Date(dataInicial));
  let diasAdicionados = 0;

  while (diasAdicionados < diasUteis) {
    dataAtual = addDays(dataAtual, 1);
    if (isDiaUtil(dataAtual)) {
      diasAdicionados++;
    }
  }

  return dataAtual;
}

/**
 * Calcula quantos dias úteis restam até uma data limite
 */
export function diasUteisRestantes(dataLimite: Date): number {
  const hoje = startOfDay(new Date());
  const limite = startOfDay(new Date(dataLimite));

  if (isBefore(limite, hoje)) {
    return -calcularDiasUteisEntre(limite, hoje);
  }

  return calcularDiasUteisEntre(hoje, limite);
}

/**
 * Calcula a quantidade de dias úteis entre duas datas
 */
export function calcularDiasUteisEntre(dataInicial: Date, dataFinal: Date): number {
  let dataAtual = startOfDay(new Date(dataInicial));
  const final = startOfDay(new Date(dataFinal));
  let diasUteis = 0;

  while (isBefore(dataAtual, final)) {
    dataAtual = addDays(dataAtual, 1);
    if (isDiaUtil(dataAtual)) {
      diasUteis++;
    }
  }

  return diasUteis;
}

/**
 * Verifica se o prazo está vencido
 */
export function isPrazoVencido(dataLimite: Date): boolean {
  const hoje = startOfDay(new Date());
  const limite = startOfDay(new Date(dataLimite));
  return isBefore(limite, hoje);
}

/**
 * Retorna status do prazo com informações formatadas
 */
export interface StatusPrazo {
  vencido: boolean;
  diasRestantes: number;
  texto: string;
  cor: 'green' | 'yellow' | 'orange' | 'red';
}

export function getStatusPrazo(dataLimite: Date): StatusPrazo {
  const diasRestantes = diasUteisRestantes(dataLimite);
  const vencido = diasRestantes < 0;

  if (vencido) {
    return {
      vencido: true,
      diasRestantes: Math.abs(diasRestantes),
      texto: `Vencido há ${Math.abs(diasRestantes)} dia(s) útil(is)`,
      cor: 'red'
    };
  }

  if (diasRestantes === 0) {
    return {
      vencido: false,
      diasRestantes: 0,
      texto: 'Vence hoje',
      cor: 'red'
    };
  }

  if (diasRestantes === 1) {
    return {
      vencido: false,
      diasRestantes: 1,
      texto: 'Vence amanhã',
      cor: 'orange'
    };
  }

  if (diasRestantes <= 2) {
    return {
      vencido: false,
      diasRestantes,
      texto: `Faltam ${diasRestantes} dias úteis`,
      cor: 'orange'
    };
  }

  if (diasRestantes <= 3) {
    return {
      vencido: false,
      diasRestantes,
      texto: `Faltam ${diasRestantes} dias úteis`,
      cor: 'yellow'
    };
  }

  return {
    vencido: false,
    diasRestantes,
    texto: `Faltam ${diasRestantes} dias úteis`,
    cor: 'green'
  };
}
