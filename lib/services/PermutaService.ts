import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PermutaDoc, PermutaInput, PermutaFiltros } from '@/types/permutas';

const COLLECTION = 'permutas';

export class PermutaService {
  /**
   * Cria uma única permuta
   */
  static async criarPermuta(input: PermutaInput, criadoPor: string): Promise<string> {
    const agora = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...input,
      enviada: false,
      arquivada: false,
      criadoPor,
      criadoEm: agora,
      atualizadoEm: agora,
    });
    return docRef.id;
  }

  /**
   * Cria múltiplas permutas em lote.
   * Se houver mais de 500, divide em batches.
   */
  static async criarPermutasEmLote(inputs: PermutaInput[], criadoPor: string): Promise<string[]> {
    const agora = new Date().toISOString();
    const ids: string[] = [];

    const BATCH_SIZE = 400;
    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const chunk = inputs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const input of chunk) {
        const docRef = doc(collection(db, COLLECTION));
        batch.set(docRef, {
          ...input,
          enviada: false,
          arquivada: false,
          criadoPor,
          criadoEm: agora,
          atualizadoEm: agora,
        });
        ids.push(docRef.id);
      }

      await batch.commit();
    }

    return ids;
  }

  /**
   * Atualiza uma permuta
   */
  static async atualizarPermuta(id: string, patch: Partial<PermutaDoc>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...patch,
      atualizadoEm: new Date().toISOString(),
    });
  }

  /**
   * Lista permutas com filtros.
   * Busca todos os documentos com orderBy('data','desc') e filtra client-side
   * para evitar necessidade de índices compostos no Firestore.
   */
  static async listarPermutas(filtros?: PermutaFiltros): Promise<PermutaDoc[]> {
    const q = query(collection(db, COLLECTION), orderBy('data', 'desc'));
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as PermutaDoc[];

    // Filtros client-side
    if (filtros?.arquivada !== undefined) {
      results = results.filter((p) => p.arquivada === filtros.arquivada);
    }

    if (filtros?.enviada !== undefined) {
      results = results.filter((p) => p.enviada === filtros.enviada);
    }

    if (filtros?.startDate) {
      results = results.filter((p) => p.data >= filtros.startDate!);
    }

    if (filtros?.endDate) {
      results = results.filter((p) => p.data <= filtros.endDate!);
    }

    if (filtros?.search) {
      const s = filtros.search.toLowerCase();
      const sDigits = s.replace(/\D/g, '');
      results = results.filter((p) => {
        const entraMatch =
          (sDigits && p.militarEntraRg.includes(sDigits)) ||
          p.militarEntraData?.nome?.toLowerCase().includes(s);
        const saiMatch =
          (sDigits && p.militarSaiRg.includes(sDigits)) ||
          p.militarSaiData?.nome?.toLowerCase().includes(s);
        return entraMatch || saiMatch;
      });
    }

    return results;
  }

  /**
   * Marca permutas como enviadas para a ajudância
   */
  static async marcarComoEnviadas(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    const agora = new Date().toISOString();

    for (const id of ids) {
      const docRef = doc(db, COLLECTION, id);
      batch.update(docRef, {
        enviada: true,
        dataEnvio: agora,
        atualizadoEm: agora,
      });
    }

    await batch.commit();
  }

  /**
   * Arquiva permutas
   */
  static async arquivar(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    const agora = new Date().toISOString();

    for (const id of ids) {
      const docRef = doc(db, COLLECTION, id);
      batch.update(docRef, {
        arquivada: true,
        dataArquivamento: agora,
        atualizadoEm: agora,
      });
    }

    await batch.commit();
  }

  /**
   * Desarquiva permutas
   */
  static async desarquivar(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    const agora = new Date().toISOString();

    for (const id of ids) {
      const docRef = doc(db, COLLECTION, id);
      batch.update(docRef, {
        arquivada: false,
        dataArquivamento: undefined,
        atualizadoEm: agora,
      });
    }

    await batch.commit();
  }
}
