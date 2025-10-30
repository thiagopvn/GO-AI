import { Loader2 } from 'lucide-react';

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Carregando...' }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-3" />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}