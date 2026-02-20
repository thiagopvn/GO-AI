import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Militar } from '@/types';

const COLLECTION = 'militares';

export class MilitarService {
  /**
   * Busca militar por RG exato
   */
  static async buscarPorRG(rg: string): Promise<Militar | null> {
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
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      dataInclusao: docSnap.data().dataInclusao?.toDate?.() || undefined,
    } as Militar;
  }

  /**
   * Cria novo militar
   */
  static async criarMilitar(data: Omit<Militar, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Atualiza militar existente
   */
  static async atualizarMilitar(id: string, data: Partial<Militar>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
