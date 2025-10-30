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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Notificacao } from '@/types';
import { ConfiguracaoService } from './configuracao.service';
import { SindicanciaService } from './sindicancia.service';
import { PADService } from './transgressao.service';

const COLLECTION_NAME = 'notificacoes';

export class NotificacaoService {
  // Criar nova notificação
  static async criar(
    notificacao: Omit<Notificacao, 'id' | 'createdAt' | 'lida'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
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

  // Listar notificações do usuário
  static async listar(usuarioId: string, limite?: number): Promise<Notificacao[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('usuarioId', '==', usuarioId),
        orderBy('createdAt', 'desc')
      );

      if (limite) {
        q = query(q, limit(limite));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Notificacao[];
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      throw error;
    }
  }

  // Listar notificações não lidas
  static async listarNaoLidas(usuarioId: string): Promise<Notificacao[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('usuarioId', '==', usuarioId),
        where('lida', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Notificacao[];
    } catch (error) {
      console.error('Erro ao listar notificações não lidas:', error);
      throw error;
    }
  }

  // Marcar como lida
  static async marcarComoLida(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        lida: true
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  // Marcar todas como lidas
  static async marcarTodasComoLidas(usuarioId: string): Promise<void> {
    try {
      const naoLidas = await this.listarNaoLidas(usuarioId);

      for (const notificacao of naoLidas) {
        await this.marcarComoLida(notificacao.id);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  // Excluir notificação
  static async excluir(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  // Limpar notificações antigas (mais de 30 dias)
  static async limparAntigas(): Promise<void> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('createdAt', '<', Timestamp.fromDate(dataLimite))
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      throw error;
    }
  }

  // Notificar sobre prazo de sindicância
  static async notificarPrazoSindicancia(
    sindicanciaId: string,
    encarregadoId: string,
    diasRestantes: number
  ): Promise<void> {
    try {
      const notificarPrazos = await ConfiguracaoService.obter('notificar_prazos');
      if (!notificarPrazos) return;

      const sindicancia = await SindicanciaService.buscarPorId(sindicanciaId);
      if (!sindicancia) return;

      await this.criar({
        tipo: 'prazo',
        titulo: `Prazo de Sindicância`,
        mensagem: `A ${sindicancia.tipo} Nº ${sindicancia.numero} tem apenas ${diasRestantes} dias restantes para conclusão.`,
        usuarioId: encarregadoId,
        prioridade: diasRestantes <= 3 ? 'alta' : 'media',
        link: `/sindicancias/${sindicanciaId}`
      });
    } catch (error) {
      console.error('Erro ao notificar prazo de sindicância:', error);
    }
  }

  // Notificar sobre nova transgressão
  static async notificarNovaTransgressao(
    militarId: string,
    militarNome: string,
    natureza: string
  ): Promise<void> {
    try {
      const notificarTransgressoes = await ConfiguracaoService.obter('notificar_transgressoes');
      if (!notificarTransgressoes) return;

      await this.criar({
        tipo: 'transgressao',
        titulo: `Nova Transgressão Registrada`,
        mensagem: `Foi registrada uma transgressão ${natureza} para o militar ${militarNome}.`,
        usuarioId: 'admin', // TODO: Definir usuários admins
        prioridade: natureza === 'Grave' ? 'alta' : 'media',
        link: `/transgressoes`
      });
    } catch (error) {
      console.error('Erro ao notificar nova transgressão:', error);
    }
  }

  // Notificar sobre mudança de comportamento
  static async notificarMudancaComportamento(
    militarId: string,
    militarNome: string,
    comportamentoAnterior: string,
    comportamentoNovo: string
  ): Promise<void> {
    try {
      const notificarComportamento = await ConfiguracaoService.obter('notificar_comportamento');
      if (!notificarComportamento) return;

      const melhorou = this.comportamentoMelhorou(comportamentoAnterior, comportamentoNovo);

      await this.criar({
        tipo: 'comportamento',
        titulo: melhorou ? 'Melhoria de Comportamento' : 'Rebaixamento de Comportamento',
        mensagem: `${militarNome} teve seu comportamento alterado de ${comportamentoAnterior} para ${comportamentoNovo}.`,
        usuarioId: 'admin', // TODO: Definir usuários admins
        prioridade: !melhorou && comportamentoNovo === 'Mau' ? 'alta' : 'media',
        link: `/militares/${militarId}`
      });
    } catch (error) {
      console.error('Erro ao notificar mudança de comportamento:', error);
    }
  }

  // Notificar sobre nova sindicância
  static async notificarNovaSindicancia(
    tipo: string,
    numero: string,
    encarregadoNome: string
  ): Promise<void> {
    try {
      const notificarSindicancias = await ConfiguracaoService.obter('notificar_sindicancias');
      if (!notificarSindicancias) return;

      await this.criar({
        tipo: 'sindicancia',
        titulo: `Nova ${tipo} Instaurada`,
        mensagem: `${tipo} Nº ${numero} foi instaurada sob responsabilidade de ${encarregadoNome}.`,
        usuarioId: 'admin', // TODO: Definir usuários admins
        prioridade: 'media',
        link: `/sindicancias`
      });
    } catch (error) {
      console.error('Erro ao notificar nova sindicância:', error);
    }
  }

  // Notificar sobre prazo de PAD
  static async notificarPrazoPAD(
    padId: string,
    militarNome: string,
    tipoPrazo: 'recurso' | 'nota',
    diasRestantes: number
  ): Promise<void> {
    try {
      const notificarPrazos = await ConfiguracaoService.obter('notificar_prazos');
      if (!notificarPrazos) return;

      const tipoTexto = tipoPrazo === 'recurso' ? 'recurso' : 'apresentação de nota';

      await this.criar({
        tipo: 'prazo',
        titulo: `Prazo de PAD`,
        mensagem: `O prazo para ${tipoTexto} do PAD de ${militarNome} vence em ${diasRestantes} dias.`,
        usuarioId: 'admin', // TODO: Definir usuários admins
        prioridade: diasRestantes <= 2 ? 'alta' : 'media',
        link: `/transgressoes`
      });
    } catch (error) {
      console.error('Erro ao notificar prazo de PAD:', error);
    }
  }

  // Verificar todos os prazos e criar notificações
  static async verificarPrazos(): Promise<void> {
    try {
      // Verificar prazos de sindicâncias
      const sindicanciasProximas = await SindicanciaService.verificarPrazos();
      for (const sindicancia of sindicanciasProximas) {
        const diasRestantes = Math.ceil(
          (sindicancia.dataLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        await this.notificarPrazoSindicancia(
          sindicancia.id,
          sindicancia.encarregadoId,
          diasRestantes
        );
      }

      // Verificar prazos de PADs
      const prazosVencidos = await PADService.verificarPrazos();

      for (const pad of prazosVencidos.recurso) {
        const diasRestantes = Math.ceil(
          (pad.prazoRecurso.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasRestantes > 0) {
          await this.notificarPrazoPAD(pad.id, pad.militarNome, 'recurso', diasRestantes);
        }
      }

      for (const pad of prazosVencidos.nota) {
        const diasRestantes = Math.ceil(
          (pad.prazoNota.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasRestantes > 0) {
          await this.notificarPrazoPAD(pad.id, pad.militarNome, 'nota', diasRestantes);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar prazos:', error);
    }
  }

  // Verificar se comportamento melhorou
  private static comportamentoMelhorou(anterior: string, novo: string): boolean {
    const ordem = ['Mau', 'Insuficiente', 'Bom', 'Ótimo', 'Excepcional'];
    return ordem.indexOf(novo) > ordem.indexOf(anterior);
  }
}