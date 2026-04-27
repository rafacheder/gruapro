 import Profile from "./pages/Profile.tsx";
             <Route path="/perfil" element={<Shell><Profile /></Shell>} />
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import RelatorioConsolidado from "@/features/leituras/RelatorioConsolidado";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PublicMachine from "./pages/PublicMachine.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
 import ProtectedRoute from "@/components/ProtectedRoute";
 import AppShell from "@/components/AppShell";
 import SyncManager from "@/components/SyncManager";
import ClientesList from "@/features/clientes/ClientesList";
import ClienteForm from "@/features/clientes/ClienteForm";
import ClienteDetalhe from "@/features/clientes/ClienteDetalhe";
import MaquinasList from "@/features/maquinas/MaquinasList";
import MaquinaForm from "@/features/maquinas/MaquinaForm";
import MaquinaDetalhe from "@/features/maquinas/MaquinaDetalhe";
import LeiturasList from "@/features/leituras/LeiturasList";
import NovaLeitura from "@/features/leituras/NovaLeitura";
import LeituraDetalhe from "@/features/leituras/LeituraDetalhe";
import UsuariosList from "@/features/usuarios/UsuariosList";
import AuditLog from "@/features/audit/AuditLog";
import PagamentosList from "@/features/pagamentos/PagamentosList";
 import PagamentoDetalhe from "@/features/pagamentos/PagamentoDetalhe";
 import ReconciliacaoView from "@/features/pagamentos/ReconciliacaoView";
import ExtratosView from "@/features/extratos/ExtratosView";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <SyncManager />
       <Toaster />
       <Sonner />
       <BrowserRouter>
         <AuthProvider>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
