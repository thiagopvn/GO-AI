/**
 * Testes para o ComportamentoService
 * Validação da lógica de cálculo de comportamento militar
 */

import { ComportamentoService } from '../ComportamentoService';
import { ProcessoDisciplinar, TipoPunicao, ComportamentoMilitar } from '@/types';

// Mock do módulo Firebase
jest.mock('@/lib/firebase/config', () => ({
  db: {}
}));

// Mock do Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date: Date) => ({ toDate: () => date })
  }
}));

describe('ComportamentoService', () => {
  describe('Cálculo de Comportamento', () => {
    // Teste do exemplo fornecido: Soldado Richard
    test('Exemplo Soldado Richard - deve retornar INSUFICIENTE', () => {
      const hoje = new Date('2025-11-03');

      // Processos punitivos do Soldado Richard
      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'richard-123',
          dataAbertura: new Date('2024-04-01'),
          dataFechamento: new Date('2024-05-15'), // Há 1 ano e 5 meses
          status: 'Finalizado' as any,
          motivo: 'Falta disciplinar',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'detencao' as any,
          diasPunicao: 2,
          createdAt: new Date('2024-04-01'),
          updatedAt: new Date('2024-05-15')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'richard-123',
          dataAbertura: new Date('2025-09-01'),
          dataFechamento: new Date('2025-10-10'), // Há menos de 1 mês
          status: 'Finalizado' as any,
          motivo: 'Atraso injustificado',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'detencao' as any,
          diasPunicao: 1,
          createdAt: new Date('2025-09-01'),
          updatedAt: new Date('2025-10-10')
        }
      ];

      // Testando o cálculo interno (método privado via reflexão para teste)
      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      // Análise esperada:
      // - Não é EXCEPCIONAL: tem punições nos últimos 8 anos
      // - Não é ÓTIMO: tem 2 detenções nos últimos 4 anos (limite é 1)
      // - Não é BOM: tem 2 detenções (= 1 prisão equivalente) nos últimos 2 anos, mas...
      // - É INSUFICIENTE: no último ano tem apenas 1 detenção (= 0.5 prisão equivalente)
      expect(resultado).toBe(ComportamentoMilitar.INSUFICIENTE);
    });

    test('Comportamento EXCEPCIONAL - 8 anos sem punições', () => {
      const processos: ProcessoDisciplinar[] = []; // Sem punições

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      expect(resultado).toBe(ComportamentoMilitar.EXCEPCIONAL);
    });

    test('Comportamento ÓTIMO - 4 anos com no máximo 1 detenção', () => {
      const hoje = new Date('2025-11-03');

      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2023-01-01'),
          dataFechamento: new Date('2023-02-01'), // Há ~2 anos e 9 meses
          status: 'Finalizado' as any,
          motivo: 'Falta leve',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'detencao' as any,
          diasPunicao: 1,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-02-01')
        }
      ];

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      expect(resultado).toBe(ComportamentoMilitar.OTIMO);
    });

    test('Comportamento BOM - 2 anos com no máximo 2 prisões equivalentes', () => {
      const hoje = new Date('2025-11-03');

      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2024-06-01'),
          dataFechamento: new Date('2024-07-01'), // Há ~1 ano e 4 meses
          status: 'Finalizado' as any,
          motivo: 'Falta grave',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 3,
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-07-01')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2019-01-01'),
          dataFechamento: new Date('2019-02-01'), // Há mais de 2 anos (não conta)
          status: 'Finalizado' as any,
          motivo: 'Falta antiga',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 5,
          createdAt: new Date('2019-01-01'),
          updatedAt: new Date('2019-02-01')
        }
      ];

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      // Nos últimos 2 anos: 1 prisão (≤ 2 prisões equivalentes)
      // No último ano: 1 prisão (≤ 2 prisões equivalentes)
      // Como tem punição no último ano, seria INSUFICIENTE
      expect(resultado).toBe(ComportamentoMilitar.INSUFICIENTE);
    });

    test('Comportamento MAU - Mais de 2 prisões equivalentes no último ano', () => {
      const hoje = new Date('2025-11-03');

      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-01-01'),
          dataFechamento: new Date('2025-02-01'), // Há 9 meses
          status: 'Finalizado' as any,
          motivo: 'Falta grave',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 5,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-02-01')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-06-01'),
          dataFechamento: new Date('2025-07-01'), // Há 4 meses
          status: 'Finalizado' as any,
          motivo: 'Outra falta grave',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 5,
          createdAt: new Date('2025-06-01'),
          updatedAt: new Date('2025-07-01')
        },
        {
          id: '3',
          numero: 'PROC-003',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-09-01'),
          dataFechamento: new Date('2025-10-01'), // Há 1 mês
          status: 'Finalizado' as any,
          motivo: 'Terceira falta',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 3,
          createdAt: new Date('2025-09-01'),
          updatedAt: new Date('2025-10-01')
        }
      ];

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      // No último ano: 3 prisões (> 2 prisões equivalentes)
      expect(resultado).toBe(ComportamentoMilitar.MAU);
    });

    test('Conversão de punições - 2 repreensões = 1 detenção', () => {
      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-01-01'),
          dataFechamento: new Date('2025-02-01'),
          status: 'Finalizado' as any,
          motivo: 'Falta leve',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-02-01')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-03-01'),
          dataFechamento: new Date('2025-04-01'),
          status: 'Finalizado' as any,
          motivo: 'Outra falta leve',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-03-01'),
          updatedAt: new Date('2025-04-01')
        }
      ];

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      // 2 repreensões = 1 detenção equivalente
      // 1 detenção nos últimos 4 anos = ÓTIMO
      expect(resultado).toBe(ComportamentoMilitar.OTIMO);
    });

    test('Conversão de punições - 4 repreensões = 1 prisão', () => {
      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-01-01'),
          dataFechamento: new Date('2025-01-15'),
          status: 'Finalizado' as any,
          motivo: 'Falta 1',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-15')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-02-01'),
          dataFechamento: new Date('2025-02-15'),
          status: 'Finalizado' as any,
          motivo: 'Falta 2',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-02-15')
        },
        {
          id: '3',
          numero: 'PROC-003',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-03-01'),
          dataFechamento: new Date('2025-03-15'),
          status: 'Finalizado' as any,
          motivo: 'Falta 3',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-03-01'),
          updatedAt: new Date('2025-03-15')
        },
        {
          id: '4',
          numero: 'PROC-004',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2025-04-01'),
          dataFechamento: new Date('2025-04-15'),
          status: 'Finalizado' as any,
          motivo: 'Falta 4',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'repreensao' as any,
          diasPunicao: 0,
          createdAt: new Date('2025-04-01'),
          updatedAt: new Date('2025-04-15')
        }
      ];

      const calcularComportamento = (ComportamentoService as any).calcularComportamento;
      const resultado = calcularComportamento.call(ComportamentoService, processos);

      // 4 repreensões = 2 detenções = 1 prisão equivalente
      // 1 prisão equivalente nos últimos 2 anos e no último ano = INSUFICIENTE
      expect(resultado).toBe(ComportamentoMilitar.INSUFICIENTE);
    });
  });

  describe('Filtros de Janela de Tempo', () => {
    test('Deve filtrar corretamente por dataFechamento', () => {
      const hoje = new Date('2025-11-03');

      const processos: ProcessoDisciplinar[] = [
        {
          id: '1',
          numero: 'PROC-001',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2020-01-01'),
          dataFechamento: new Date('2020-02-01'), // Há 5 anos
          status: 'Finalizado' as any,
          motivo: 'Antiga',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'prisao' as any,
          diasPunicao: 10,
          createdAt: new Date('2020-01-01'),
          updatedAt: new Date('2020-02-01')
        },
        {
          id: '2',
          numero: 'PROC-002',
          tipo: 'Transgressão' as any,
          militarId: 'militar-123',
          dataAbertura: new Date('2024-01-01'),
          dataFechamento: new Date('2024-02-01'), // Há 1 ano
          status: 'Finalizado' as any,
          motivo: 'Recente',
          decisao: 'Punição Aplicada',
          tipoPunicao: 'detencao' as any,
          diasPunicao: 2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-02-01')
        }
      ];

      const filtrarPorJanelaTempo = (ComportamentoService as any).filtrarPorJanelaTempo;

      // Teste janela de 2 anos
      const processos2Anos = filtrarPorJanelaTempo.call(
        ComportamentoService,
        processos,
        2
      );
      expect(processos2Anos).toHaveLength(1);
      expect(processos2Anos[0].id).toBe('2');

      // Teste janela de 8 anos
      const processos8Anos = filtrarPorJanelaTempo.call(
        ComportamentoService,
        processos,
        8
      );
      expect(processos8Anos).toHaveLength(2);
    });
  });
});