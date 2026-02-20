import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
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
   * Cria múltiplas permutas em lote
   */
  static async criarPermutasEmLote(inputs: PermutaInput[], criadoPor: string): Promise<string[]> {
    const agora = new Date().toISOString();
    const batch = writeBatch(db);
    const ids: string[] = [];

    for (const input of inputs) {
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
   * Lista permutas com filtros
   */
  static async listarPermutas(filtros?: PermutaFiltros): Promise<PermutaDoc[]> {
    const constraints: Parameters<typeof query>[1][] = [];

    // Firestore only allows one inequality filter, so we handle search client-side
    if (filtros?.arquivada !== undefined) {
      constraints.push(where('arquivada', '==', filtros.arquivada));
    }

    if (filtros?.enviada !== undefined) {
      constraints.push(where('enviada', '==', filtros.enviada));
    }

    if (filtros?.startDate) {
      constraints.push(where('data', '>=', filtros.startDate));
    }

    if (filtros?.endDate) {
      constraints.push(where('data', '<=', filtros.endDate));
    }

    constraints.push(orderBy('data', 'desc'));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as PermutaDoc[];

    // Filtro client-side por busca (RG ou nome)
    if (filtros?.search) {
      const searchLower = filtros.search.toLowerCase().replace(/\D/g, '') || filtros.search.toLowerCase();
      results = results.filter((p) => {
        const entraMatch =
          p.militarEntraRg.includes(searchLower) ||
          p.militarEntraData?.nome?.toLowerCase().includes(filtros.search!.toLowerCase());
        const saiMatch =
          p.militarSaiRg.includes(searchLower) ||
          p.militarSaiData?.nome?.toLowerCase().includes(filtros.search!.toLowerCase());
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
