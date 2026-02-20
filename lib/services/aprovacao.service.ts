import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Usuario } from '@/types';
import { NotificacaoService } from './NotificacaoService';

const COLLECTION_NAME = 'usuarios';

const notificacaoService = new NotificacaoService();

export class AprovacaoService {
  static async listarPendentes(): Promise<Usuario[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('aprovado', '==', false),
        where('ativo', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dataAprovacao: doc.data().dataAprovacao?.toDate()
      })) as Usuario[];
    } catch (error) {
      console.error('Erro ao listar usuarios pendentes:', error);
      // Fallback: buscar todos e filtrar em memória
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          dataAprovacao: doc.data().dataAprovacao?.toDate()
        }) as Usuario)
        .filter(u => u.aprovado === false && u.ativo === true);
    }
  }

  static onPendentesChange(callback: (pendentes: Usuario[]) => void): () => void {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('aprovado', '==', false),
      where('ativo', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      const pendentes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dataAprovacao: doc.data().dataAprovacao?.toDate()
      })) as Usuario[];
      // Ordenar por data de criação (mais recentes primeiro)
      pendentes.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
      callback(pendentes);
    }, (error) => {
      console.error('Erro no listener de pendentes:', error);
      callback([]);
    });
  }

  static async aprovar(
    usuarioId: string,
    aprovadorId: string,
    aprovadorNome: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, usuarioId), {
        aprovado: true,
        aprovadoPor: aprovadorId,
        aprovadoPorNome: aprovadorNome,
        dataAprovacao: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await notificacaoService.criar({
        tipo: 'sistema',
        titulo: 'Acesso Aprovado',
        mensagem: `Seu acesso ao sistema foi aprovado por ${aprovadorNome}. Bem-vindo!`,
        lida: false,
        usuarioId: usuarioId,
        prioridade: 'alta',
        link: '/'
      });
    } catch (error) {
      console.error('Erro ao aprovar usuario:', error);
      throw error;
    }
  }

  static async rejeitar(
    usuarioId: string,
    motivo: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, usuarioId), {
        ativo: false,
        motivoRejeicao: motivo,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao rejeitar usuario:', error);
      throw error;
    }
  }

  static async contarPendentes(): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('aprovado', '==', false),
        where('ativo', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao contar pendentes:', error);
      return 0;
    }
  }
}
