 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Combobox, ComboboxOption } from "@/components/ui/combobox";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Button } from "@/components/ui/button";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Badge } from "@/components/ui/badge";
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
 import { CalendarIcon, Filter, X } from "lucide-react";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { cn } from "@/lib/utils";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface FilterState {
   clienteId: string;
   maquinaId: string;
   status: string;
   startDate: Date | undefined;
   endDate: Date | undefined;
   operadorId: string;
 }
 
 interface ReadingFiltersProps {
   filters: FilterState;
   onFiltersChange: (filters: FilterState) => void;
   onClearFilters: () => void;
 }
 
 export function ReadingFilters({ filters, onFiltersChange, onClearFilters }: ReadingFiltersProps) {
   const { role } = useAuth();
   const isAdmin = role === 'admin' || role === 'master';
   
   const [clientes, setClientes] = useState<ComboboxOption[]>([]);
   const [maquinas, setMaquinas] = useState<ComboboxOption[]>([]);
   const [operadores, setOperadores] = useState<ComboboxOption[]>([]);
   const [allMaquinas, setAllMaquinas] = useState<any[]>([]);
 
   useEffect(() => {
     const fetchOptions = async () => {
       // Fetch Clients
       const { data: clientsData } = await supabase
         .from("clientes")
         .select("id, nome_ponto")
         .eq("ativo", true)
         .order("nome_ponto");
       
       if (clientsData) {
         setClientes(clientsData.map(c => ({ value: c.id, label: c.nome_ponto })));
       }
 
       // Fetch Machines
       const { data: machinesData } = await supabase
         .from("maquinas")
         .select("id, codigo_identificacao, cliente_id");
       
       if (machinesData) {
         setAllMaquinas(machinesData);
       }
 
       // Fetch Operators (Admin/Master only)
       if (isAdmin) {
         // Step 1: Get user IDs that have made at least one reading
         const { data: leiturasUsers } = await supabase
           .from("leituras")
           .select("usuario_id");
         
         const userIdsWithReadings = Array.from(new Set((leiturasUsers || []).map(l => l.usuario_id)));
 
         if (userIdsWithReadings.length > 0) {
           // Step 2: Get profiles for those users who are admin or usuario
           const { data: profilesData } = await supabase
             .from("profiles")
             .select(`
               id, 
               nome_completo
             `)
             .in("id", userIdsWithReadings);
           
           if (profilesData) {
             setOperadores(profilesData.map(p => ({ value: p.id, label: p.nome_completo || p.id })));
           }
         }
       }
     };
 
     fetchOptions();
   }, [isAdmin]);
 
   useEffect(() => {
     if (allMaquinas.length > 0) {
       const filtered = filters.clienteId 
         ? allMaquinas.filter(m => m.cliente_id === filters.clienteId)
         : allMaquinas;
       setMaquinas(filtered.map(m => ({ value: m.id, label: m.codigo_identificacao })));
       
       // Reset maquinaId if it's not in the filtered list
       if (filters.maquinaId && !filtered.find(m => m.id === filters.maquinaId)) {
         onFiltersChange({ ...filters, maquinaId: "" });
       }
     }
   }, [filters.clienteId, allMaquinas]);
 
   const handleFilterChange = (key: keyof FilterState, value: any) => {
     onFiltersChange({ ...filters, [key]: value });
   };
 
   const isFilterActive = filters.clienteId || filters.maquinaId || filters.status !== "all" || filters.startDate || filters.endDate || filters.operadorId;
 
   const FilterForm = ({ className }: { className?: string }) => (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4", className)}>
        <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
         <label className="text-xs font-medium">Cliente</label>
         <Combobox
           options={clientes}
           value={filters.clienteId}
           onValueChange={(v) => handleFilterChange("clienteId", v)}
           placeholder="Todos os clientes"
         />
       </div>
 
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
         <label className="text-xs font-medium">Máquina</label>
         <Combobox
           options={maquinas}
           value={filters.maquinaId}
           onValueChange={(v) => handleFilterChange("maquinaId", v)}
           placeholder="Todas as máquinas"
         />
       </div>
 
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
         <label className="text-xs font-medium">Status</label>
         <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
           <SelectTrigger>
             <SelectValue placeholder="Status" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Todos</SelectItem>
             <SelectItem value="pendente">Pendente</SelectItem>
             <SelectItem value="pago">Pago</SelectItem>
             <SelectItem value="cancelado">Cancelado</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
         <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
          <label className="text-xs font-medium">Período inicial e final</label>
         <div className="flex gap-2">
           <Popover>
             <PopoverTrigger asChild>
               <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !filters.startDate && "text-muted-foreground")}>
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {filters.startDate ? format(filters.startDate, "dd/MM/yy") : "Início"}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="start">
               <Calendar mode="single" selected={filters.startDate} onSelect={(v) => handleFilterChange("startDate", v)} locale={ptBR} />
             </PopoverContent>
           </Popover>
           <Popover>
             <PopoverTrigger asChild>
               <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !filters.endDate && "text-muted-foreground")}>
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {filters.endDate ? format(filters.endDate, "dd/MM/yy") : "Fim"}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="start">
               <Calendar mode="single" selected={filters.endDate} onSelect={(v) => handleFilterChange("endDate", v)} locale={ptBR} />
             </PopoverContent>
           </Popover>
         </div>
       </div>
 
       {isAdmin && (
          <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
           <label className="text-xs font-medium">Operador</label>
           <Select value={filters.operadorId} onValueChange={(v) => handleFilterChange("operadorId", v)}>
             <SelectTrigger>
               <SelectValue placeholder="Todos os operadores" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos</SelectItem>
               {operadores.map(o => (
                 <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       )}
     </div>
   );
 
   return (
     <div className="space-y-4">
       {/* Desktop Filters */}
       <div className="hidden md:block">
         <FilterForm />
       </div>
 
       {/* Mobile Filters */}
       <div className="md:hidden flex gap-2">
         <Sheet>
           <SheetTrigger asChild>
             <Button variant="outline" className="w-full">
               <Filter className="mr-2 h-4 w-4" />
               Filtros
               {isFilterActive && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px]">!</Badge>}
             </Button>
           </SheetTrigger>
           <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
             <SheetHeader>
               <SheetTitle>Filtros</SheetTitle>
             </SheetHeader>
             <div className="py-6">
               <FilterForm className="grid-cols-1" />
             </div>
             <div className="flex gap-2">
               {isFilterActive && (
                 <Button variant="ghost" className="flex-1" onClick={onClearFilters}>
                   Limpar
                 </Button>
               )}
               <Button className="flex-1 bg-accent" onClick={() => document.body.click()}>
                 Aplicar
               </Button>
             </div>
           </SheetContent>
         </Sheet>
       </div>
 
       {/* Active Filter Chips */}
       <div className="flex flex-wrap gap-2">
         {filters.clienteId && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Cliente: {clientes.find(c => c.value === filters.clienteId)?.label}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("clienteId", "")} />
           </Badge>
         )}
         {filters.maquinaId && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Máquina: {maquinas.find(m => m.value === filters.maquinaId)?.label}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("maquinaId", "")} />
           </Badge>
         )}
         {filters.status !== "all" && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Status: {filters.status}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", "all")} />
           </Badge>
         )}
         {filters.startDate && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Início: {format(filters.startDate, "dd/MM/yy")}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("startDate", undefined)} />
           </Badge>
         )}
         {filters.endDate && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Fim: {format(filters.endDate, "dd/MM/yy")}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("endDate", undefined)} />
           </Badge>
         )}
         {filters.operadorId && filters.operadorId !== "all" && (
           <Badge variant="secondary" className="gap-1 px-2 py-1">
             Operador: {operadores.find(o => o.value === filters.operadorId)?.label}
             <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("operadorId", "all")} />
           </Badge>
         )}
         {isFilterActive && (
           <Button variant="link" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClearFilters}>
             Limpar filtros
           </Button>
         )}
       </div>
     </div>
   );
 }