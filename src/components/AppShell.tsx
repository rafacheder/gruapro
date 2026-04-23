import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, canManageData } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
  import { LayoutDashboard, Users, Cpu, ClipboardList, Plus, LogOut, Shield, ScrollText, Menu, AlertTriangle, CreditCard, FileText } from "lucide-react";
 import SyncStatusBadge from "./SyncStatusBadge";
 import { db } from "@/lib/db";
 import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Início", icon: LayoutDashboard, roles: ["master", "admin", "usuario"] as const },
  { to: "/clientes", label: "Clientes", icon: Users, roles: ["master", "admin", "usuario"] as const },
  { to: "/maquinas", label: "Máquinas", icon: Cpu, roles: ["master", "admin", "usuario"] as const },
  { to: "/leituras", label: "Leituras", icon: ClipboardList, roles: ["master", "admin", "usuario"] as const },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard, roles: ["master", "admin"] as const },
  { to: "/extratos", label: "Extratos", icon: FileText, roles: ["master", "admin"] as const },
  { to: "/usuarios", label: "Usuários", icon: Shield, roles: ["master", "admin"] as const },
   { to: "/audit", label: "Audit log", icon: ScrollText, roles: ["master"] as const },
   { to: "/reconciliar", label: "Reconciliação", icon: ClipboardList, roles: ["master"] as const },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { role, nome, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visible = navItems.filter((i) => role && (i.roles as readonly string[]).includes(role));

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => {
        const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground shadow-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

   const handleLogout = async () => {
     const pending = await db.pendingLeituras.count();
     if (pending > 0) {
       const confirmLogout = window.confirm(
         `Existem ${pending} leitura(s) aguardando sincronização. Se você sair agora, elas podem ser perdidas. Deseja sair mesmo assim?`
       );
       if (!confirmLogout) return;
     }
     await signOut();
     navigate("/login");
   };
           <div className="flex items-center gap-2">
             <SyncStatusBadge />
             <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent" onClick={() => navigate("/leituras/nova")}>
               <Plus className="h-5 w-5" />
             </Button>
           </div>

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-gradient-surface">
        <div className="px-6 py-5 border-b border-border">
          <div className="text-lg font-bold tracking-tight text-foreground">
            Grua<span className="text-accent">Pro</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Gestão de máquinas</div>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavList />
        </div>
         <div className="border-t border-border p-3 space-y-3">
           <div className="px-3">
             <SyncStatusBadge />
           </div>
           <div className="px-3 py-2 border-t border-border/50">
             <div className="text-xs text-muted-foreground">Logado como</div>
             <div className="text-sm font-medium truncate">{nome || "—"}</div>
             <div className="text-xs text-accent capitalize">{role}</div>
           </div>
           <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
             <LogOut className="h-4 w-4 mr-2" /> Sair
           </Button>
         </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gradient-surface border-border">
              <div className="px-6 py-5 border-b border-border">
                <div className="text-lg font-bold tracking-tight">
                  Grua<span className="text-accent">Pro</span>
                </div>
                <div className="text-xs text-muted-foreground">{nome}</div>
              </div>
              <div className="px-3 py-4">
                <NavList onClick={() => setOpen(false)} />
              </div>
              <div className="border-t border-border p-3">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="font-bold">
            Grua<span className="text-accent">Pro</span>
          </div>
          <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent" onClick={() => navigate("/leituras/nova")}>
            <Plus className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Bottom nav mobile (atalho) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border px-2 py-2 flex justify-around">
          {visible.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded text-xs",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}