'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import { auth, firestore, googleProvider } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getCountFromServer } from 'firebase/firestore';
import { Usuario } from '@/types';
import { toast } from 'sonner';

interface AuthContextData {
  user: User | null;
  userData: Usuario | null;
  loading: boolean;
  isApproved: boolean;
  isProfileComplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  signUp: (email: string, password: string, userData: Partial<Usuario>) => Promise<void>;
  completeProfile: (profileData: { nome: string; patente: string; unidade: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Buscar dados do usuário no Firestore
  const fetchUserData = async (uid: string): Promise<Usuario | null> => {
    try {
      const userDoc = await getDoc(doc(firestore, 'usuarios', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const usuario = {
          id: uid,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate(),
          dataAprovacao: data.dataAprovacao?.toDate(),
          // Backward compatibility: usuários existentes são aprovados
          aprovado: data.aprovado !== undefined ? data.aprovado : true,
          perfilCompleto: data.perfilCompleto !== undefined ? data.perfilCompleto : true,
          provedor: data.provedor || 'email'
        } as Usuario;
        setUserData(usuario);
        setIsApproved(usuario.aprovado === true);
        setIsProfileComplete(usuario.perfilCompleto === true);
        return usuario;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
      return null;
    }
  };

  // Login com email/senha
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Atualizar último login
      await updateDoc(doc(firestore, 'usuarios', user.uid), {
        lastLogin: serverTimestamp()
      });

      await fetchUserData(user.uid);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);

      if (error.code === 'auth/user-not-found') {
        toast.error('Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Senha incorreta');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email inválido');
      } else {
        toast.error('Erro ao fazer login');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const signInWithGoogleAuth = async (): Promise<{ isNewUser: boolean }> => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Verificar se já existe documento no Firestore
      const userDocRef = doc(firestore, 'usuarios', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Usuário existente - atualizar lastLogin e foto
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          fotoURL: firebaseUser.photoURL || null,
          updatedAt: serverTimestamp()
        });
        await fetchUserData(firebaseUser.uid);
        toast.success('Login realizado com sucesso!');
        return { isNewUser: false };
      } else {
        // Novo usuário Google - criar documento
        const usersCount = await getCountFromServer(collection(firestore, 'usuarios'));
        const isFirstUser = usersCount.data().count === 0;

        const newUserData: Record<string, any> = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          nome: firebaseUser.displayName || '',
          patente: '',
          unidade: '',
          ativo: true,
          aprovado: isFirstUser,
          provedor: 'google',
          perfilCompleto: false,
          fotoURL: firebaseUser.photoURL || null,
          perfil: isFirstUser ? 'admin' : 'usuario',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };

        if (isFirstUser) {
          newUserData.aprovadoPor = 'sistema';
          newUserData.aprovadoPorNome = 'Auto-aprovado (primeiro usuário)';
          newUserData.dataAprovacao = serverTimestamp();
        }

        await setDoc(userDocRef, newUserData);
        await fetchUserData(firebaseUser.uid);

        if (isFirstUser) {
          toast.success('Conta de administrador criada! Complete seu perfil.');
        } else {
          toast.success('Cadastro realizado! Complete seu perfil e aguarde aprovação.');
        }
        return { isNewUser: true };
      }
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelado');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup bloqueado pelo navegador. Permita popups para este site.');
      } else {
        toast.error('Erro ao fazer login com Google');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cadastro com email/senha
  const signUp = async (email: string, password: string, newUserData: Partial<Usuario>) => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Verificar se é o primeiro usuário (auto-aprovar)
      const usersCount = await getCountFromServer(collection(firestore, 'usuarios'));
      const isFirstUser = usersCount.data().count === 0;

      const userDoc: Record<string, any> = {
        ...newUserData,
        id: user.uid,
        email,
        aprovado: isFirstUser,
        provedor: 'email',
        perfilCompleto: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      if (isFirstUser) {
        userDoc.perfil = 'admin';
        userDoc.aprovadoPor = 'sistema';
        userDoc.aprovadoPorNome = 'Auto-aprovado (primeiro usuário)';
        userDoc.dataAprovacao = serverTimestamp();
      }

      await setDoc(doc(firestore, 'usuarios', user.uid), userDoc);
      await fetchUserData(user.uid);

      if (isFirstUser) {
        toast.success('Conta de administrador criada com sucesso!');
      } else {
        toast.success('Cadastro realizado! Aguardando aprovação.');
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);

      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este email já está em uso');
      } else if (error.code === 'auth/weak-password') {
        toast.error('A senha deve ter pelo menos 6 caracteres');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email inválido');
      } else {
        toast.error('Erro ao criar conta');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Completar perfil (para usuários Google)
  const completeProfile = async (profileData: { nome: string; patente: string; unidade: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      await updateDoc(doc(firestore, 'usuarios', user.uid), {
        nome: profileData.nome,
        patente: profileData.patente,
        unidade: profileData.unidade,
        perfilCompleto: true,
        updatedAt: serverTimestamp()
      });

      await fetchUserData(user.uid);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setIsApproved(false);
      setIsProfileComplete(false);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
      throw error;
    }
  };

  // Recuperar senha
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);

      if (error.code === 'auth/user-not-found') {
        toast.error('Usuário não encontrado');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email inválido');
      } else {
        toast.error('Erro ao enviar email de recuperação');
      }
      throw error;
    }
  };

  // Observar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await fetchUserData(firebaseUser.uid);
        if (!data) {
          setIsApproved(false);
          setIsProfileComplete(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsApproved(false);
        setIsProfileComplete(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isApproved,
        isProfileComplete,
        signIn,
        signInWithGoogle: signInWithGoogleAuth,
        signUp,
        completeProfile,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
