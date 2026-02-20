'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Patente } from '@/types';

export default function CompletarPerfilPage() {
  const { user, userData, isProfileComplete, isApproved, completeProfile, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    patente: '',
    unidade: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Se perfil já está completo, redirecionar
    if (isProfileComplete) {
      if (isApproved) {
        router.push('/');
      } else {
        router.push('/aguardando-aprovacao');
      }
      return;
    }

    // Pré-preencher nome do Google
    if (userData || user) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || userData?.nome || user?.displayName || ''
      }));
    }
  }, [user, userData, isProfileComplete, isApproved, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.patente || !formData.unidade) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setSaving(true);
      await completeProfile({
        nome: formData.nome,
        patente: formData.patente,
        unidade: formData.unidade
      });

      // Após completar perfil, verificar aprovação
      // O isApproved pode não ter atualizado ainda, então verificamos userData
      if (isApproved) {
        router.push('/');
      } else {
        router.push('/aguardando-aprovacao');
      }
    } catch {
      // Erro tratado no contexto
    } finally {
      setSaving(false);
    }
  };

  const patentes = Object.values(Patente);

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="absolute inset-0 bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-16 w-16 ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900">
              <AvatarImage src={userData?.fotoURL || user?.photoURL || ''} />
              <AvatarFallback className="bg-slate-700 text-white text-lg">
                {userData?.nome?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Complete seu Perfil
          </CardTitle>
          <CardDescription className="text-slate-400">
            Precisamos de algumas informações adicionais para seu cadastro
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-200">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patente" className="text-slate-200">
                Patente
              </Label>
              <Select
                value={formData.patente}
                onValueChange={(value) => setFormData({ ...formData, patente: value })}
                disabled={saving}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione sua patente" />
                </SelectTrigger>
                <SelectContent>
                  {patentes.map((patente) => (
                    <SelectItem key={patente} value={patente}>
                      {patente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade" className="text-slate-200">
                Unidade
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="unidade"
                  type="text"
                  placeholder="Ex: 1º GBM - Humaitá"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
