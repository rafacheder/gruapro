import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import SyncManager from "@/components/SyncManager";

const Profile = lazy(() => import("./pages/Profile.tsx"));
const PublicMachine = lazy(() => import("./pages/PublicMachine.tsx"));
const ClientesList = lazy(() => import("@/features/clientes/ClientesList"));
const ClienteForm = lazy(() => import("@/features/clientes/ClienteForm"));
const ClienteDetalhe = lazy(() => import("@/features/clientes/ClienteDetalhe"));
const MaquinasList = lazy(() => import("@/features/maquinas/MaquinasList"));
const MaquinaForm = lazy(() => import("@/features/maquinas/MaquinaForm"));
const MaquinaDetalhe = lazy(() => import("@/features/maquinas/MaquinaDetalhe"));
const LeiturasList = lazy(() => import("@/features/leituras/LeiturasList"));
const NovaLeitura = lazy(() => import("@/features/leituras/NovaLeitura"));
const LeituraDetalhe = lazy(() => import("@/features/leituras/LeituraDetalhe"));
const RelatorioConsolidado = lazy(() => import("@/features/leituras/RelatorioConsolidado"));
const UsuariosList = lazy(() => import("@/features/usuarios/UsuariosList"));
const AuditLog = lazy(() => import("@/features/audit/AuditLog"));
const PagamentosList = lazy(() => import("@/features/pagamentos/PagamentosList"));
const PagamentoDetalhe = lazy(() => import("@/features/pagamentos/PagamentoDetalhe"));
const ReconciliacaoView = lazy(() => import("@/features/pagamentos/ReconciliacaoView"));
const ExtratosView = lazy(() => import("@/features/extratos/ExtratosView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-accent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SyncManager />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/maquina/:id" element={<PublicMachine />} />
              <Route path="/" element={<Shell><Dashboard /></Shell>} />
              <Route path="/clientes" element={<Shell><ClientesList /></Shell>} />
              <Route path="/clientes/novo" element={<Shell><ClienteForm /></Shell>} />
              <Route path="/clientes/:id" element={<Shell><ClienteDetalhe /></Shell>} />
              <Route path="/clientes/:id/editar" element={<Shell><ClienteForm /></Shell>} />
              <Route path="/maquinas" element={<Shell><MaquinasList /></Shell>} />
              <Route path="/maquinas/nova" element={<Shell><MaquinaForm /></Shell>} />
              <Route path="/maquinas/:id" element={<Shell><MaquinaDetalhe /></Shell>} />
              <Route path="/maquinas/:id/editar" element={<Shell><MaquinaForm /></Shell>} />
              <Route path="/leituras" element={<Shell><LeiturasList /></Shell>} />
              <Route path="/leituras/nova" element={<Shell><NovaLeitura /></Shell>} />
              <Route path="/leituras/:id" element={<Shell><LeituraDetalhe /></Shell>} />
              <Route path="/leituras/consolidado" element={<Shell><RelatorioConsolidado /></Shell>} />
              <Route path="/usuarios" element={
                <ProtectedRoute requireRoles={["master", "admin"]}>
                  <AppShell><UsuariosList /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/pagamentos" element={<Shell><PagamentosList /></Shell>} />
              <Route path="/pagamentos/:id" element={<Shell><PagamentoDetalhe /></Shell>} />
              <Route path="/reconciliar" element={
                <ProtectedRoute requireRoles={["master"]}>
                  <AppShell><ReconciliacaoView /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/extratos" element={
                <ProtectedRoute requireRoles={["master", "admin"]}>
                  <AppShell><ExtratosView /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute requireRoles={["master"]}>
                  <AppShell><AuditLog /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/perfil" element={<Shell><Profile /></Shell>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
