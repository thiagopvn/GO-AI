import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ComportamentoMilitar,
  TipoPunicao,
  Transgressao,
  Militar,
  isPraca
} from '@/types';

interface PunicaoCalculada {
  repreensoes: number;
  detencoes: number;
  prisoes: number;
  prisoesEquivalentes: number; // Total convertido em prisões
}

export class ComportamentoService {
  // Converte todas as punições em prisões para facilitar o cálculo
  private static converterPunicoesEmPrisoes(punicoes: PunicaoCalculada): number {
    // 2 repreensões = 1 detenção
    // 2 detenções = 1 prisão
    // Logo, 4 repreensões = 1 prisão

    const detencoesDasRepreensoes = Math.floor(punicoes.repreensoes / 2);
    const totalDetencoes = punicoes.detencoes + detencoesDasRepreensoes;
    const prisoesDasDetencoes = Math.floor(totalDetencoes / 2);
    const totalPrisoes = punicoes.prisoes + prisoesDasDetencoes;

    return totalPrisoes;
  }

  // Busca transgressões de um militar em um período específico
  private static async buscarTransgressoesPorPeriodo(
    militarId: string,
    anosAnteriores: number
  ): Promise<Transgressao[]> {
    const dataLimite = new Date();
    dataLimite.setFullYear(dataLimite.getFullYear() - anosAnteriores);

    const q = query(
      collection(db, 'transgressoes'),
      where('militarId', '==', militarId),
      where('data', '>=', Timestamp.fromDate(dataLimite)),
      orderBy('data', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        // Verifica se os campos de data existem e são Timestamps válidos antes de converter
        data: docData.data && docData.data.toDate ? docData.data.toDate() : new Date(),
        createdAt: docData.createdAt && docData.createdAt.toDate ? docData.createdAt.toDate() : new Date(),
        updatedAt: docData.updatedAt && docData.updatedAt.toDate ? docData.updatedAt.toDate() : new Date()
      };
    }) as Transgressao[];
  }

  // Calcula o total de punições por tipo
  private static calcularPunicoes(transgressoes: Transgressao[]): PunicaoCalculada {
    const punicoes: PunicaoCalculada = {
      repreensoes: 0,
      detencoes: 0,
      prisoes: 0,
      prisoesEquivalentes: 0
    };

    transgressoes.forEach(transgressao => {
      switch (transgressao.tipoPunicao) {
        case TipoPunicao.REPREENSAO:
          punicoes.repreensoes++;
          break;
        case TipoPunicao.DETENCAO:
          punicoes.detencoes++;
          break;
        case TipoPunicao.PRISAO:
          punicoes.prisoes++;
          break;
      }
    });

    punicoes.prisoesEquivalentes = this.converterPunicoesEmPrisoes(punicoes);
    return punicoes;
  }

  // Calcula o comportamento baseado no histórico de transgressões
  public static async calcularComportamento(
    militar: Militar
  ): Promise<ComportamentoMilitar | null> {
    // Apenas praças possuem classificação de comportamento
    if (!isPraca(militar.patente)) {
      return null;
    }

    // Verificar comportamento EXCEPCIONAL (8 anos sem punições)
    const transgressoes8Anos = await this.buscarTransgressoesPorPeriodo(militar.id, 8);
    if (transgressoes8Anos.length === 0) {
      return ComportamentoMilitar.EXCEPCIONAL;
    }

    // Verificar comportamento ÓTIMO (4 anos com no máximo 1 detenção)
    const transgressoes4Anos = await this.buscarTransgressoesPorPeriodo(militar.id, 4);
    const punicoes4Anos = this.calcularPunicoes(transgressoes4Anos);

    // No máximo 1 detenção significa: 0 prisões e (0 ou 1 detenção ou 2 repreensões)
    if (punicoes4Anos.prisoes === 0 &&
        punicoes4Anos.detencoes <= 1 &&
        (punicoes4Anos.detencoes === 0 || punicoes4Anos.repreensoes === 0)) {
      return ComportamentoMilitar.OTIMO;
    }

    // Verificar comportamento BOM (2 anos com no máximo 2 prisões)
    const transgressoes2Anos = await this.buscarTransgressoesPorPeriodo(militar.id, 2);
    const punicoes2Anos = this.calcularPunicoes(transgressoes2Anos);

    if (punicoes2Anos.prisoesEquivalentes <= 2) {
      return ComportamentoMilitar.BOM;
    }

    // Verificar comportamento INSUFICIENTE e MAU (1 ano)
    const transgressoes1Ano = await this.buscarTransgressoesPorPeriodo(militar.id, 1);
    const punicoes1Ano = this.calcularPunicoes(transgressoes1Ano);

    if (punicoes1Ano.prisoesEquivalentes <= 2) {
      return ComportamentoMilitar.INSUFICIENTE;
    } else {
      return ComportamentoMilitar.MAU;
    }
  }

  // Atualiza o comportamento de um militar no Firestore
  public static async atualizarComportamento(militarId: string, novoComportamento: ComportamentoMilitar): Promise<void> {
    await updateDoc(doc(db, 'militares', militarId), {
      comportamento: novoComportamento,
      updatedAt: new Date()
    });
  }

  // Sobrecarga para aceitar objeto Militar
  public static async atualizarComportamentoDoMilitar(militar: Militar): Promise<void> {
    const novoComportamento = await this.calcularComportamento(militar);

    if (novoComportamento && novoComportamento !== militar.comportamento) {
      await this.atualizarComportamento(militar.id, novoComportamento);
    }
  }

  // Verifica e atualiza o comportamento de todos os militares (praças)
  public static async atualizarComportamentoTodos(): Promise<void> {
    const q = query(collection(db, 'militares'));
    const snapshot = await getDocs(q);

    const promises = snapshot.docs.map(async (docSnapshot) => {
      const militar = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        dataInclusao: docSnapshot.data().dataInclusao.toDate(),
        createdAt: docSnapshot.data().createdAt.toDate(),
        updatedAt: docSnapshot.data().updatedAt.toDate()
      } as Militar;

      if (isPraca(militar.patente)) {
        await this.atualizarComportamentoDoMilitar(militar);
      }
    });

    await Promise.all(promises);
  }

  // Define comportamento inicial para novo militar
  public static getComportamentoInicial(militar: Partial<Militar>): ComportamentoMilitar | null {
    if (militar.patente && isPraca(militar.patente)) {
      return ComportamentoMilitar.BOM;
    }
    return null;
  }

  // Versão síncrona para cálculo imediato baseado em parâmetros
  public static calcularNovoComportamento(
    comportamentoAtual: string,
    natureza: 'Leve' | 'Média' | 'Grave',
    diasPunicao: number
  ): string {
    // Lógica simplificada: quanto mais grave, pior o comportamento
    const niveis = ['Excepcional', 'Ótimo', 'Bom', 'Insuficiente', 'Mau'];
    let index = niveis.indexOf(comportamentoAtual);

    if (index === -1) index = 2; // Padrão: Bom

    // Reduz comportamento baseado na natureza
    if (natureza === 'Grave') {
      index = Math.min(index + 2, niveis.length - 1);
    } else if (natureza === 'Média') {
      index = Math.min(index + 1, niveis.length - 1);
    } else if (diasPunicao > 5) {
      index = Math.min(index + 1, niveis.length - 1);
    }

    return niveis[index];
  }
}