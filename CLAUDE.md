# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIOP-GOCG is a military personnel management system for CBMERJ (Corpo de Bombeiros Militar do Estado do Rio de Janeiro). The application tracks disciplinary processes, investigations, and military behavior management using Firebase as the backend.

## Architecture

The project uses a modern Next.js 15 stack with:
- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Storage)
- **UI Components**: Radix UI primitives with shadcn/ui styling

### Key Directories
- `/app` - Next.js App Router pages
- `/components` - React components (UI components in `/components/ui`)
- `/lib/services` - Business logic services (7 domain-specific services)
- `/contexts` - React contexts (authentication)
- `/types` - TypeScript type definitions

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Core Services

The application's business logic is organized into 7 services:

1. **ComportamentoService** - Calculates military conduct levels based on punishment history
2. **ConfiguracaoService** - Manages system-wide configuration parameters
3. **SindicanciaService** - Handles investigation management and officer assignments
4. **TransgressaoService** - Records and manages disciplinary infractions
5. **PADService** - Manages Processo Administrativo Disciplinar (disciplinary processes)
6. **DocumentService** - Generates Word documents for official processes
7. **NotificacaoService** - Creates and manages system notifications

## Firebase Collections

- `usuarios` - User authentication data
- `militares` - Military personnel records
- `transgressoes` - Disciplinary infractions
- `sindicancias` - Investigation cases
- `processos` - General disciplinary processes
- `pads` - PAD documents
- `configuracoes` - System settings
- `notificacoes` - User notifications

## Important Technical Details

### Authentication Flow
- Uses Firebase Auth with email/password
- Protected routes check authentication via AuthContext
- Public routes: `/login`, `/register`
- All other routes require authentication

### Real-time Features
- Dashboard statistics use Firebase Realtime Database
- Live updates via `useRealtimeStats` hook
- Firestore listeners for data synchronization

### Document Generation
- Uses `docx` library to generate Word documents
- Documents stored in Firebase Storage
- Formatted for official military use (CBMERJ standards)

### Military Behavior Calculation
The system uses a point-based system where:
- 2 Repreensões = 1 Detenção
- 2 Detenções = 1 Prisão

Valid punishment types: Repreensão, Detenção, Prisão

Conduct levels: Excepcional, Ótimo, Bom, Insuficiente, Mau

### TypeScript Path Alias
- `@/*` maps to the project root
- Example: `import { Button } from '@/components/ui/button'`

## Testing

Currently, no testing framework is implemented. When adding tests, consider:
- Unit tests for behavior calculation logic
- Integration tests for Firebase operations
- Component tests for critical UI elements

## Common Patterns

### Service Usage
```typescript
import { TransgressaoService } from '@/lib/services/TransgressaoService';
const service = new TransgressaoService();
const transgressoes = await service.buscarPorMilitar(militarId);
```

### Protected Pages
All pages except login/register use `MainLayout` which includes:
- Authentication check
- Sidebar navigation
- Notification system

### Form Handling
Uses `react-hook-form` for form state management with TypeScript types:
```typescript
const form = useForm<FormData>({
  defaultValues: { /* ... */ }
});
```