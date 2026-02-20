import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MilitarPermuta } from '@/types/permutas';

const COLLECTION = 'militares_permutas';

export class MilitarPermutaService {
  /**
   * Lista todos os militares de permutas
   */
  static async listarTodos(): Promise<MilitarPermuta[]> {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MilitarPermuta[];
    // Ordena client-side para evitar necessidade de índice
    return results.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  /**
   * Busca militar por RG exato
   */
  static async buscarPorRG(rg: string): Promise<MilitarPermuta | null> {
    const rgLimpo = rg.replace(/\D/g, '').trim();
    if (!rgLimpo) return null;

    const q = query(
      collection(db, COLLECTION),
      where('rg', '==', rgLimpo)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as MilitarPermuta;
  }

  /**
   * Cria novo militar de permuta
   */
  static async criar(data: Omit<MilitarPermuta, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
    const agora = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      criadoEm: agora,
      atualizadoEm: agora,
    });
    return docRef.id;
  }

  /**
   * Atualiza militar de permuta
   */
  static async atualizar(id: string, data: Partial<MilitarPermuta>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      atualizadoEm: new Date().toISOString(),
    });
  }

  /**
   * Exclui militar de permuta
   */
  static async excluir(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }

  /**
   * Importa militares em lote (para seed inicial)
   * Firestore batches suportam max 500 operações
   */
  static async importarEmLote(
    dados: Omit<MilitarPermuta, 'id' | 'criadoEm' | 'atualizadoEm'>[]
  ): Promise<number> {
    const agora = new Date().toISOString();
    let count = 0;

    // Divide em batches de 400 (margem de segurança)
    const BATCH_SIZE = 400;
    for (let i = 0; i < dados.length; i += BATCH_SIZE) {
      const chunk = dados.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const docRef = doc(collection(db, COLLECTION));
        batch.set(docRef, {
          ...item,
          criadoEm: agora,
          atualizadoEm: agora,
        });
      }

      await batch.commit();
      count += chunk.length;
    }

    return count;
  }

  /**
   * Verifica se a coleção está vazia
   */
  static async estaVazia(): Promise<boolean> {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  }
}
