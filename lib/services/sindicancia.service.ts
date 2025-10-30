import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Sindicancia, DistribuicaoSindicancia } from '@/types';

const COLLECTION_NAME = 'sindicancias';
const OFICIAIS_COLLECTION = 'militares';

export class SindicanciaService {
  // Criar nova sindicância
  static async criar(sindicancia: Omit<Sindicancia, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...sindicancia,
        dataInstauracao: Timestamp.fromDate(new Date(sindicancia.dataInstauracao)),
        dataLimite: Timestamp.fromDate(new Date(sindicancia.dataLimite)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Atualizar contador do oficial encarregado
      await this.atualizarContadorOficial(sindicancia.encarregadoId, 1);

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar sindicância:', error);
      throw error;
    }
  }

  // Listar todas as sindicâncias
  static async listar(): Promise<Sindicancia[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('dataInstauracao', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataInstauracao: doc.data().dataInstauracao?.toDate(),
        dataLimite: doc.data().dataLimite?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Sindicancia[];
    } catch (error) {
      console.error('Erro ao listar sindicâncias:', error);
      throw error;
    }
  }

  // Buscar sindicância por ID
  static async buscarPorId(id: string): Promise<Sindicancia | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataInstauracao: data.dataInstauracao?.toDate(),
          dataLimite: data.dataLimite?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Sindicancia;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar sindicância:', error);
      throw error;
    }
  }

  // Atualizar sindicância
  static async atualizar(id: string, sindicancia: Partial<Sindicancia>): Promise<void> {
    try {
      const updateData: any = {
        ...sindicancia,
        updatedAt: serverTimestamp()
      };

      if (sindicancia.dataInstauracao) {
        updateData.dataInstauracao = Timestamp.fromDate(new Date(sindicancia.dataInstauracao));
      }
      if (sindicancia.dataLimite) {
        updateData.dataLimite = Timestamp.fromDate(new Date(sindicancia.dataLimite));
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
    } catch (error) {
      console.error('Erro ao atualizar sindicância:', error);
      throw error;
    }
  }

  // Excluir sindicância
  static async excluir(id: string): Promise<void> {
    try {
      const sindicancia = await this.buscarPorId(id);
      if (sindicancia && sindicancia.status === 'Em Andamento') {
        await this.atualizarContadorOficial(sindicancia.encarregadoId, -1);
      }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Erro ao excluir sindicância:', error);
      throw error;
    }
  }

  // Buscar sindicâncias por encarregado
  static async buscarPorEncarregado(encarregadoId: string): Promise<Sindicancia[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('encarregadoId', '==', encarregadoId),
        orderBy('dataInstauracao', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataInstauracao: doc.data().dataInstauracao?.toDate(),
        dataLimite: doc.data().dataLimite?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Sindicancia[];
    } catch (error) {
      console.error('Erro ao buscar sindicâncias por encarregado:', error);
      throw error;
    }
  }

  // Obter distribuição de sindicâncias entre oficiais
  static async obterDistribuicao(): Promise<DistribuicaoSindicancia[]> {
    try {
      const postosOficiais = ['Aspirante', '2º Tenente', '1º Tenente', 'Capitão', 'Major', 'Tenente Coronel', 'Coronel'];

      // Buscar todos os militares ativos
      const militaresSnapshot = await getDocs(
        collection(db, OFICIAIS_COLLECTION)
      );

      // Filtrar apenas oficiais (verifica tanto postoGraduacao quanto patente)
      const oficiais = militaresSnapshot.docs.filter(doc => {
        const data = doc.data();
        const posto = data.postoGraduacao || data.patente || '';
        const isAtivo = data.status === 'Ativo' || !data.status;
        return isAtivo && postosOficiais.includes(posto);
      });

      const distribuicao: DistribuicaoSindicancia[] = [];

      for (const oficialDoc of oficiais) {
        const oficial = oficialDoc.data();

        // Buscar sindicâncias deste oficial
        const sindicancias = await this.buscarPorEncarregado(oficialDoc.id);
        const emAndamento = sindicancias.filter(s => s.status === 'Em Andamento').length;
        const ultimaSindicancia = sindicancias.length > 0
          ? sindicancias[0].dataInstauracao
          : undefined;

        distribuicao.push({
          oficialId: oficialDoc.id,
          oficialNome: oficial.nomeCompleto || oficial.nome,
          oficialPosto: oficial.postoGraduacao || oficial.patente,
          totalSindicancias: sindicancias.length,
          sindicanciasEmAndamento: emAndamento,
          ultimaSindicancia,
          disponivel: emAndamento < 3 // Máximo 3 sindicâncias simultâneas
        });
      }

      // Ordenar por menor número de sindicâncias e última atribuição mais antiga
      distribuicao.sort((a, b) => {
        if (a.totalSindicancias !== b.totalSindicancias) {
          return a.totalSindicancias - b.totalSindicancias;
        }
        if (!a.ultimaSindicancia) return -1;
        if (!b.ultimaSindicancia) return 1;
        return a.ultimaSindicancia.getTime() - b.ultimaSindicancia.getTime();
      });

      return distribuicao;
    } catch (error) {
      console.error('Erro ao obter distribuição:', error);
      throw error;
    }
  }

  // Atualizar contador de sindicâncias do oficial
  private static async atualizarContadorOficial(oficialId: string, incremento: number): Promise<void> {
    try {
      const oficialRef = doc(db, OFICIAIS_COLLECTION, oficialId);
      const oficialDoc = await getDoc(oficialRef);
      
      if (oficialDoc.exists()) {
        const contadorAtual = oficialDoc.data().totalSindicancias || 0;
        await updateDoc(oficialRef, {
          totalSindicancias: contadorAtual + incremento,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar contador do oficial:', error);
    }
  }

  // Verificar sindicâncias próximas do prazo
  static async verificarPrazos(): Promise<Sindicancia[]> {
    try {
      const sindicancias = await this.listar();
      const hoje = new Date();
      const sindicanciasCriticas: Sindicancia[] = [];

      for (const sindicancia of sindicancias) {
        if (sindicancia.status === 'Em Andamento') {
          const diasRestantes = Math.ceil(
            (sindicancia.dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diasRestantes <= 5) {
            sindicanciasCriticas.push(sindicancia);
          }
        }
      }

      return sindicanciasCriticas;
    } catch (error) {
      console.error('Erro ao verificar prazos:', error);
      throw error;
    }
  }
}
