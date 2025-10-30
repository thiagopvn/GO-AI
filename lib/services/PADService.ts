import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { ConclusaoPadData } from '@/components/modals/ConcluirPadModal';
import { DocumentService } from './DocumentService';

export interface PAD {
  id?: string;
  numeroProcesso: string;
  militarId: string;
  militarNome: string;
  militarPosto: string;
  dataAbertura: Timestamp;
  dataConclusao?: Timestamp;
  status: 'em_andamento' | 'finalizado' | 'arquivado';
  descricao: string;

  // Dados da conclusão
  decisao?: 'justificar' | 'justificar_parte' | 'punir';
  justificativa?: string;
  observacoes?: string;

  // Dados de punição
  atenuantes?: string[];
  agravantes?: string[];
  reincidenciaVerbalVezes?: number;
  classificacao?: 'leve' | 'media' | 'grave';
  tipoPunicao?: 'advertencia' | 'repreensao' | 'detencao' | 'prisao';
  diasPunicao?: number;
  dataInicioPunicao?: Timestamp;

  // Documento gerado
  documentoUrl?: string;

  // Metadados
  criadoPor: string;
  atualizadoEm?: Timestamp;
  concluidoPor?: string;
}

export class PADService {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  async criar(pad: Omit<PAD, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'pads'), {
        ...pad,
        dataAbertura: serverTimestamp(),
        status: 'em_andamento',
        atualizadoEm: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar PAD:', error);
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<PAD | null> {
    try {
      const docRef = doc(db, 'pads', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PAD;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar PAD:', error);
      throw error;
    }
  }

  async buscarTodos(): Promise<PAD[]> {
    try {
      const q = query(
        collection(db, 'pads'),
        orderBy('dataAbertura', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PAD));
    } catch (error) {
      console.error('Erro ao buscar PADs:', error);
      throw error;
    }
  }

  async buscarPorMilitar(militarId: string): Promise<PAD[]> {
    try {
      const q = query(
        collection(db, 'pads'),
        where('militarId', '==', militarId),
        orderBy('dataAbertura', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PAD));
    } catch (error) {
      console.error('Erro ao buscar PADs do militar:', error);
      throw error;
    }
  }

  async concluir(
    padId: string,
    conclusao: ConclusaoPadData,
    comandanteInfo: {
      nome: string;
      posto: string;
      rg: string;
      funcao: string;
      uid: string;
    }
  ): Promise<void> {
    try {
      // Buscar dados do PAD
      const pad = await this.buscarPorId(padId);
      if (!pad) {
        throw new Error('PAD não encontrado');
      }

      // Gerar documento Word
      const documentBlob = await this.documentService.gerarDespacho({
        conclusao,
        militarNome: pad.militarNome,
        militarPosto: pad.militarPosto,
        processoNumero: pad.numeroProcesso,
        comandanteNome: comandanteInfo.nome,
        comandantePosto: comandanteInfo.posto,
        comandanteRG: comandanteInfo.rg,
        comandanteFuncao: comandanteInfo.funcao
      });

      // Upload do documento para o Firebase Storage
      const fileName = `despachos/PAD_${pad.numeroProcesso}_${Date.now()}.docx`;
      const storageRef = ref(storage, fileName);
      const uploadResult = await uploadBytes(storageRef, documentBlob);
      const documentUrl = await getDownloadURL(uploadResult.ref);

      // Atualizar dados do PAD no Firestore
      const padRef = doc(db, 'pads', padId);
      await updateDoc(padRef, {
        status: 'finalizado',
        dataConclusao: serverTimestamp(),
        decisao: conclusao.decisao,
        justificativa: conclusao.justificativa || null,
        observacoes: conclusao.observacoes || null,
        atenuantes: conclusao.atenuantes || null,
        agravantes: conclusao.agravantes || null,
        reincidenciaVerbalVezes: conclusao.reincidenciaVerbalVezes || null,
        classificacao: conclusao.classificacao || null,
        tipoPunicao: conclusao.tipoPunicao || null,
        diasPunicao: conclusao.diasPunicao || 0,
        dataInicioPunicao: conclusao.dataInicioPunicao
          ? Timestamp.fromDate(conclusao.dataInicioPunicao)
          : null,
        documentoUrl: documentUrl,
        concluidoPor: comandanteInfo.uid,
        atualizadoEm: serverTimestamp()
      });

      // Se houver punição, criar registro na coleção de transgressões
      if (conclusao.decisao === 'punir' && conclusao.tipoPunicao) {
        await this.criarTransgressao(pad, conclusao, comandanteInfo.uid);
      }

    } catch (error) {
      console.error('Erro ao concluir PAD:', error);
      throw error;
    }
  }

  private async criarTransgressao(
    pad: PAD,
    conclusao: ConclusaoPadData,
    userId: string
  ): Promise<void> {
    try {
      const transgressaoData = {
        militarId: pad.militarId,
        militarNome: pad.militarNome,
        militarPosto: pad.militarPosto,
        padId: pad.id,
        numeroProcesso: pad.numeroProcesso,
        data: Timestamp.fromDate(new Date()),
        descricao: `Transgressão disciplinar referente ao PAD ${pad.numeroProcesso}`,
        classificacao: conclusao.classificacao,
        tipoPunicao: conclusao.tipoPunicao,
        diasPunicao: conclusao.diasPunicao || 0,
        dataInicioPunicao: conclusao.dataInicioPunicao
          ? Timestamp.fromDate(conclusao.dataInicioPunicao)
          : null,
        atenuantes: conclusao.atenuantes || [],
        agravantes: conclusao.agravantes || [],
        observacoes: conclusao.observacoes || '',
        criadoPor: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transgressoes'), transgressaoData);
    } catch (error) {
      console.error('Erro ao criar registro de transgressão:', error);
      // Não lançar erro aqui para não interromper a conclusão do PAD
    }
  }

  async editarPunicao(
    padId: string,
    diasPunicao: number,
    dataInicioPunicao: Date
  ): Promise<void> {
    try {
      const padRef = doc(db, 'pads', padId);
      await updateDoc(padRef, {
        diasPunicao,
        dataInicioPunicao: Timestamp.fromDate(dataInicioPunicao),
        atualizadoEm: serverTimestamp()
      });

      // Atualizar também na coleção de transgressões se existir
      const q = query(
        collection(db, 'transgressoes'),
        where('padId', '==', padId)
      );

      const querySnapshot = await getDocs(q);
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, {
          diasPunicao,
          dataInicioPunicao: Timestamp.fromDate(dataInicioPunicao),
          atualizadoEm: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erro ao editar punição:', error);
      throw error;
    }
  }

  async arquivar(padId: string): Promise<void> {
    try {
      const padRef = doc(db, 'pads', padId);
      await updateDoc(padRef, {
        status: 'arquivado',
        atualizadoEm: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao arquivar PAD:', error);
      throw error;
    }
  }

  async excluir(padId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pads', padId));
    } catch (error) {
      console.error('Erro ao excluir PAD:', error);
      throw error;
    }
  }
}