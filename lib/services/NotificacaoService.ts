import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type TipoNotificacao = 'prazo' | 'transgressao' | 'sindicancia' | 'comportamento' | 'sistema' | 'pad_prazo_vencido';
export type PrioridadeNotificacao = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Notificacao {
  id?: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  usuarioId?: string; // Se não definido, é para todos os usuários
  link?: string;
  prioridade: PrioridadeNotificacao;
  referencia?: {
    tipo: 'pad' | 'sindicancia' | 'militar' | 'processo';
    id: string;
  };
  createdAt?: Timestamp;
}

export class NotificacaoService {
  private collectionName = 'notificacoes';

  /**
   * Criar nova notificação
   */
  async criar(notificacao: Omit<Notificacao, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...notificacao,
        lida: false,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Buscar notificações de um usuário
   */
  async buscarPorUsuario(usuarioId: string, apenasNaoLidas = false): Promise<Notificacao[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('usuarioId', 'in', [usuarioId, null]),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (apenasNaoLidas) {
        q = query(
          collection(db, this.collectionName),
          where('usuarioId', 'in', [usuarioId, null]),
          where('lida', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notificacao));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Se falhar por índice, buscar todas e filtrar
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Notificacao))
        .filter(n => !n.usuarioId || n.usuarioId === usuarioId)
        .filter(n => !apenasNaoLidas || !n.lida);
    }
  }

  /**
   * Buscar todas as notificações (para admin)
   */
  async buscarTodas(limite = 100): Promise<Notificacao[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notificacao));
    } catch (error) {
      console.error('Erro ao buscar todas notificações:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(notificacaoId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, notificacaoId);
      await updateDoc(docRef, { lida: true });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações do usuário como lidas
   */
  async marcarTodasComoLidas(usuarioId: string): Promise<void> {
    try {
      const notificacoes = await this.buscarPorUsuario(usuarioId, true);
      for (const notificacao of notificacoes) {
        if (notificacao.id) {
          await this.marcarComoLida(notificacao.id);
        }
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  /**
   * Excluir notificação
   */
  async excluir(notificacaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, notificacaoId));
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  /**
   * Criar notificação de prazo de PAD vencido
   */
  async criarNotificacaoPrazoVencido(
    padNumero: string,
    militarNome: string,
    padId: string
  ): Promise<string> {
    return this.criar({
      tipo: 'pad_prazo_vencido',
      titulo: 'Prazo de PAD Vencido',
      mensagem: `O prazo de defesa do PAD nº ${padNumero} do militar ${militarNome} expirou sem resposta.`,
      lida: false,
      prioridade: 'urgente',
      link: `/processos?highlight=${padId}`,
      referencia: {
        tipo: 'pad',
        id: padId
      }
    });
  }

  /**
   * Criar notificação de prazo próximo do vencimento
   */
  async criarNotificacaoPrazoProximo(
    padNumero: string,
    militarNome: string,
    diasRestantes: number,
    padId: string
  ): Promise<string> {
    return this.criar({
      tipo: 'prazo',
      titulo: 'Prazo de PAD Próximo do Vencimento',
      mensagem: `O prazo de defesa do PAD nº ${padNumero} do militar ${militarNome} vence em ${diasRestantes} dia(s) útil(is).`,
      lida: false,
      prioridade: diasRestantes <= 1 ? 'alta' : 'media',
      link: `/processos?highlight=${padId}`,
      referencia: {
        tipo: 'pad',
        id: padId
      }
    });
  }

  /**
   * Listener em tempo real para notificações
   */
  onNotificacoesChange(
    usuarioId: string,
    callback: (notificacoes: Notificacao[]) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notificacoes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Notificacao))
        .filter(n => !n.usuarioId || n.usuarioId === usuarioId);
      callback(notificacoes);
    });
  }

  /**
   * Contar notificações não lidas
   */
  async contarNaoLidas(usuarioId: string): Promise<number> {
    try {
      const notificacoes = await this.buscarPorUsuario(usuarioId, true);
      return notificacoes.length;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }
}

// Instância singleton
export const notificacaoService = new NotificacaoService();
