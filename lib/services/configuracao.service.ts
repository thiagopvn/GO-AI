import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Configuracao } from '@/types';

const COLLECTION_NAME = 'configuracoes';

// Configurações padrão do sistema
const CONFIGURACOES_PADRAO: Omit<Configuracao, 'id' | 'updatedAt' | 'updatedBy'>[] = [
  // Configurações Gerais
  {
    chave: 'nome_unidade',
    valor: 'Unidade Militar',
    tipo: 'texto',
    categoria: 'geral',
    descricao: 'Nome da unidade militar'
  },
  {
    chave: 'comandante_unidade',
    valor: 'Nome do Comandante',
    tipo: 'texto',
    categoria: 'geral',
    descricao: 'Nome do comandante da unidade'
  },
  {
    chave: 'email_notificacoes',
    valor: 'admin@unidade.mil.br',
    tipo: 'texto',
    categoria: 'geral',
    descricao: 'E-mail para notificações do sistema'
  },

  // Configurações de Prazos
  {
    chave: 'prazo_recurso_pad',
    valor: 5,
    tipo: 'numero',
    categoria: 'prazos',
    descricao: 'Prazo em dias úteis para recurso de PAD'
  },
  {
    chave: 'prazo_nota_pad',
    valor: 10,
    tipo: 'numero',
    categoria: 'prazos',
    descricao: 'Prazo em dias para apresentação de nota de punição'
  },
  {
    chave: 'prazo_inicial_sindicancia',
    valor: 30,
    tipo: 'numero',
    categoria: 'prazos',
    descricao: 'Prazo inicial padrão para sindicâncias em dias'
  },
  {
    chave: 'prazo_prorrogacao_sindicancia',
    valor: 30,
    tipo: 'numero',
    categoria: 'prazos',
    descricao: 'Prazo de prorrogação para sindicâncias em dias'
  },
  {
    chave: 'alerta_prazo_sindicancia',
    valor: 5,
    tipo: 'numero',
    categoria: 'prazos',
    descricao: 'Dias antes do vencimento para alertar sobre prazos'
  },

  // Configurações de Comportamento
  {
    chave: 'dias_excepcional_otimo',
    valor: 365,
    tipo: 'numero',
    categoria: 'comportamento',
    descricao: 'Dias necessários para mudar de Excepcional para Ótimo'
  },
  {
    chave: 'dias_otimo_bom',
    valor: 180,
    tipo: 'numero',
    categoria: 'comportamento',
    descricao: 'Dias necessários para mudar de Ótimo para Bom'
  },
  {
    chave: 'dias_bom_insuficiente',
    valor: 90,
    tipo: 'numero',
    categoria: 'comportamento',
    descricao: 'Dias necessários para mudar de Bom para Insuficiente'
  },
  {
    chave: 'dias_melhoria_comportamento',
    valor: 30,
    tipo: 'numero',
    categoria: 'comportamento',
    descricao: 'Dias fora da pauta para melhorar comportamento'
  },

  // Configurações de Documentos
  {
    chave: 'modelo_pad',
    valor: 'padrao',
    tipo: 'texto',
    categoria: 'documentos',
    descricao: 'Modelo de documento PAD a ser usado'
  },
  {
    chave: 'assinatura_digital',
    valor: false,
    tipo: 'booleano',
    categoria: 'documentos',
    descricao: 'Habilitar assinatura digital nos documentos'
  },
  {
    chave: 'backup_automatico',
    valor: true,
    tipo: 'booleano',
    categoria: 'documentos',
    descricao: 'Realizar backup automático dos documentos'
  },

  // Configurações de Notificações
  {
    chave: 'notificar_prazos',
    valor: true,
    tipo: 'booleano',
    categoria: 'notificacoes',
    descricao: 'Notificar sobre prazos próximos do vencimento'
  },
  {
    chave: 'notificar_transgressoes',
    valor: true,
    tipo: 'booleano',
    categoria: 'notificacoes',
    descricao: 'Notificar sobre novas transgressões'
  },
  {
    chave: 'notificar_comportamento',
    valor: true,
    tipo: 'booleano',
    categoria: 'notificacoes',
    descricao: 'Notificar sobre mudanças de comportamento'
  },
  {
    chave: 'notificar_sindicancias',
    valor: true,
    tipo: 'booleano',
    categoria: 'notificacoes',
    descricao: 'Notificar sobre novas sindicâncias'
  }
];

export class ConfiguracaoService {
  // Inicializar configurações padrão
  static async inicializar(): Promise<void> {
    try {
      for (const config of CONFIGURACOES_PADRAO) {
        const docRef = doc(db, COLLECTION_NAME, config.chave);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            ...config,
            id: config.chave,
            updatedAt: serverTimestamp(),
            updatedBy: 'sistema'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
      throw error;
    }
  }

  // Obter configuração por chave
  static async obter(chave: string): Promise<any> {
    try {
      const docRef = doc(db, COLLECTION_NAME, chave);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const config = docSnap.data() as Configuracao;
        return config.valor;
      }

      // Retornar valor padrão se não existir
      const configPadrao = CONFIGURACOES_PADRAO.find(c => c.chave === chave);
      return configPadrao?.valor || null;
    } catch (error) {
      console.error('Erro ao obter configuração:', error);
      throw error;
    }
  }

  // Obter todas as configurações
  static async listar(): Promise<Configuracao[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Configuracao[];
    } catch (error) {
      console.error('Erro ao listar configurações:', error);
      throw error;
    }
  }

  // Obter configurações por categoria
  static async listarPorCategoria(categoria: Configuracao['categoria']): Promise<Configuracao[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('categoria', '==', categoria)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Configuracao[];
    } catch (error) {
      console.error('Erro ao listar configurações por categoria:', error);
      throw error;
    }
  }

  // Atualizar configuração
  static async atualizar(chave: string, valor: any, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, chave);
      await setDoc(docRef, {
        valor,
        updatedAt: serverTimestamp(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  // Atualizar múltiplas configurações
  static async atualizarMultiplas(
    configuracoes: { chave: string; valor: any }[],
    updatedBy: string
  ): Promise<void> {
    try {
      for (const config of configuracoes) {
        await this.atualizar(config.chave, config.valor, updatedBy);
      }
    } catch (error) {
      console.error('Erro ao atualizar múltiplas configurações:', error);
      throw error;
    }
  }

  // Resetar configuração para padrão
  static async resetar(chave: string): Promise<void> {
    try {
      const configPadrao = CONFIGURACOES_PADRAO.find(c => c.chave === chave);
      if (configPadrao) {
        await this.atualizar(chave, configPadrao.valor, 'sistema');
      }
    } catch (error) {
      console.error('Erro ao resetar configuração:', error);
      throw error;
    }
  }

  // Resetar todas as configurações
  static async resetarTodas(): Promise<void> {
    try {
      for (const config of CONFIGURACOES_PADRAO) {
        await this.atualizar(config.chave, config.valor, 'sistema');
      }
    } catch (error) {
      console.error('Erro ao resetar todas as configurações:', error);
      throw error;
    }
  }

  // Exportar configurações
  static async exportar(): Promise<Record<string, any>> {
    try {
      const configs = await this.listar();
      const exportData: Record<string, any> = {};

      for (const config of configs) {
        exportData[config.chave] = {
          valor: config.valor,
          tipo: config.tipo,
          categoria: config.categoria,
          descricao: config.descricao
        };
      }

      return exportData;
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      throw error;
    }
  }

  // Importar configurações
  static async importar(data: Record<string, any>, updatedBy: string): Promise<void> {
    try {
      for (const [chave, config] of Object.entries(data)) {
        if (CONFIGURACOES_PADRAO.find(c => c.chave === chave)) {
          await this.atualizar(chave, config.valor, updatedBy);
        }
      }
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      throw error;
    }
  }
}