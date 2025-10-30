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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { Transgressao, PAD } from '@/types';

const TRANSGRESSOES_COLLECTION = 'transgressoes';
const PADS_COLLECTION = 'pads';

export class TransgressaoService {
  // Criar nova transgressão
  static async criar(transgressao: Omit<Transgressao, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TRANSGRESSOES_COLLECTION), {
        ...transgressao,
        data: Timestamp.fromDate(new Date(transgressao.data)),
        dataInicioCumprimento: transgressao.dataInicioCumprimento
          ? Timestamp.fromDate(new Date(transgressao.dataInicioCumprimento))
          : null,
        dataFimCumprimento: transgressao.dataFimCumprimento
          ? Timestamp.fromDate(new Date(transgressao.dataFimCumprimento))
          : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar transgressão:', error);
      throw error;
    }
  }

  // Listar todas as transgressões
  static async listar(): Promise<Transgressao[]> {
    try {
      const q = query(collection(db, TRANSGRESSOES_COLLECTION), orderBy('data', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate(),
        dataInicioCumprimento: doc.data().dataInicioCumprimento?.toDate(),
        dataFimCumprimento: doc.data().dataFimCumprimento?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Transgressao[];
    } catch (error) {
      console.error('Erro ao listar transgressões:', error);
      throw error;
    }
  }

  // Buscar transgressões por militar
  static async buscarPorMilitar(militarId: string): Promise<Transgressao[]> {
    try {
      const q = query(
        collection(db, TRANSGRESSOES_COLLECTION),
        where('militarId', '==', militarId),
        orderBy('data', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate(),
        dataInicioCumprimento: doc.data().dataInicioCumprimento?.toDate(),
        dataFimCumprimento: doc.data().dataFimCumprimento?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Transgressao[];
    } catch (error) {
      console.error('Erro ao buscar transgressões:', error);
      throw error;
    }
  }

  // Buscar transgressão por ID
  static async buscarPorId(id: string): Promise<Transgressao | null> {
    try {
      const docSnap = await getDoc(doc(db, TRANSGRESSOES_COLLECTION, id));

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          data: data.data?.toDate(),
          dataInicioCumprimento: data.dataInicioCumprimento?.toDate(),
          dataFimCumprimento: data.dataFimCumprimento?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Transgressao;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar transgressão:', error);
      throw error;
    }
  }

  // Atualizar transgressão
  static async atualizar(id: string, transgressao: Partial<Transgressao>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        ...transgressao,
        updatedAt: serverTimestamp()
      };

      if (transgressao.data) {
        updateData.data = Timestamp.fromDate(new Date(transgressao.data));
      }
      if (transgressao.dataInicioCumprimento) {
        updateData.dataInicioCumprimento = Timestamp.fromDate(new Date(transgressao.dataInicioCumprimento));
      }
      if (transgressao.dataFimCumprimento) {
        updateData.dataFimCumprimento = Timestamp.fromDate(new Date(transgressao.dataFimCumprimento));
      }

      await updateDoc(doc(db, TRANSGRESSOES_COLLECTION, id), updateData);
    } catch (error) {
      console.error('Erro ao atualizar transgressão:', error);
      throw error;
    }
  }

  // Verificar atrasos no cumprimento
  static async verificarAtrasos(): Promise<Transgressao[]> {
    try {
      const transgressoes = await this.listar();
      const hoje = new Date();
      const atrasadas: Transgressao[] = [];

      for (const transgressao of transgressoes) {
        if (transgressao.status === 'Aguardando' && transgressao.dataFimCumprimento) {
          const diasAtraso = Math.ceil(
            (hoje.getTime() - transgressao.dataFimCumprimento.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasAtraso > 0) {
            atrasadas.push(transgressao);
          }
        }
      }

      return atrasadas;
    } catch (error) {
      console.error('Erro ao verificar atrasos:', error);
      throw error;
    }
  }
}

// Serviço para PADs
export class PADService {
  // Criar novo PAD
  static async criar(pad: Omit<PAD, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PADS_COLLECTION), {
        ...pad,
        dataEmissao: Timestamp.fromDate(new Date(pad.dataEmissao)),
        prazoRecurso: Timestamp.fromDate(new Date(pad.prazoRecurso)),
        prazoNota: Timestamp.fromDate(new Date(pad.prazoNota)),
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar PAD:', error);
      throw error;
    }
  }

  // Gerar documento PAD
  static async gerarDocumento(padId: string, documentoBlob: Blob): Promise<string> {
    try {
      const fileName = `pads/PAD_${padId}_${Date.now()}.docx`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, documentoBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Atualizar PAD com URL do documento
      await updateDoc(doc(db, PADS_COLLECTION, padId), {
        documentoUrl: downloadURL,
        updatedAt: serverTimestamp()
      });

      return downloadURL;
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      throw error;
    }
  }

  // Listar PADs
  static async listar(): Promise<PAD[]> {
    try {
      const q = query(collection(db, PADS_COLLECTION), orderBy('dataEmissao', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataEmissao: doc.data().dataEmissao?.toDate(),
        prazoRecurso: doc.data().prazoRecurso?.toDate(),
        prazoNota: doc.data().prazoNota?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        recurso: doc.data().recurso ? {
          ...doc.data().recurso,
          data: doc.data().recurso.data?.toDate()
        } : undefined,
        nota: doc.data().nota ? {
          ...doc.data().nota,
          data: doc.data().nota.data?.toDate()
        } : undefined
      })) as PAD[];
    } catch (error) {
      console.error('Erro ao listar PADs:', error);
      throw error;
    }
  }

  // Buscar PADs por militar
  static async buscarPorMilitar(militarId: string): Promise<PAD[]> {
    try {
      const q = query(
        collection(db, PADS_COLLECTION),
        where('militarId', '==', militarId),
        orderBy('dataEmissao', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataEmissao: doc.data().dataEmissao?.toDate(),
        prazoRecurso: doc.data().prazoRecurso?.toDate(),
        prazoNota: doc.data().prazoNota?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        recurso: doc.data().recurso ? {
          ...doc.data().recurso,
          data: doc.data().recurso.data?.toDate()
        } : undefined,
        nota: doc.data().nota ? {
          ...doc.data().nota,
          data: doc.data().nota.data?.toDate()
        } : undefined
      })) as PAD[];
    } catch (error) {
      console.error('Erro ao buscar PADs:', error);
      throw error;
    }
  }

  // Registrar recurso
  static async registrarRecurso(padId: string, recurso: { motivo: string; decisao?: string }): Promise<void> {
    try {
      await updateDoc(doc(db, PADS_COLLECTION, padId), {
        recurso: {
          ...recurso,
          data: serverTimestamp()
        },
        status: 'Recorrido',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao registrar recurso:', error);
      throw error;
    }
  }

  // Registrar nota
  static async registrarNota(padId: string, conteudo: string): Promise<void> {
    try {
      await updateDoc(doc(db, PADS_COLLECTION, padId), {
        nota: {
          conteudo,
          data: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao registrar nota:', error);
      throw error;
    }
  }

  // Verificar prazos de PADs
  static async verificarPrazos(): Promise<{ recurso: PAD[], nota: PAD[] }> {
    try {
      const pads = await this.listar();
      const hoje = new Date();
      const prazosVencidos = {
        recurso: [] as PAD[],
        nota: [] as PAD[]
      };

      for (const pad of pads) {
        if (pad.status === 'Emitido') {
          // Verificar prazo de recurso (5 dias úteis)
          if (!pad.recurso && pad.prazoRecurso.getTime() < hoje.getTime()) {
            prazosVencidos.recurso.push(pad);
          }

          // Verificar prazo de nota (10 dias)
          if (!pad.nota && pad.prazoNota.getTime() < hoje.getTime()) {
            prazosVencidos.nota.push(pad);
          }
        }
      }

      return prazosVencidos;
    } catch (error) {
      console.error('Erro ao verificar prazos:', error);
      throw error;
    }
  }
}