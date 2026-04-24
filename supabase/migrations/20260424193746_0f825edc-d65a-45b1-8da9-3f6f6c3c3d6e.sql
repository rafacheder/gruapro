-- Cleanup old views
DROP VIEW IF EXISTS public.clientes_operador CASCADE;
DROP VIEW IF EXISTS public.maquinas_operador CASCADE;

-- Update leituras table policies
-- 1. SELECT: Everyone sees everything (necessary for comparative history)
DROP POLICY IF EXISTS leituras_select ON public.leituras;
DROP POLICY IF EXISTS leituras_select_all_auth ON public.leituras;
CREATE POLICY leituras_select_all_auth ON public.leituras
  FOR SELECT TO authenticated USING (true);

-- 2. INSERT: Users can only create their own readings
DROP POLICY IF EXISTS leituras_insert ON public.leituras;
DROP POLICY IF EXISTS leituras_insert_own ON public.leituras;
CREATE POLICY leituras_insert_own ON public.leituras
  FOR INSERT TO authenticated 
  WITH CHECK (usuario_id = auth.uid());

-- 3. UPDATE: Users edit their own, admins/masters edit all
DROP POLICY IF EXISTS leituras_admin_update ON public.leituras;
DROP POLICY IF EXISTS leituras_update ON public.leituras;
CREATE POLICY leituras_update ON public.leituras
  FOR UPDATE TO authenticated 
  USING (
    usuario_id = auth.uid() 
    OR has_role(auth.uid(), 'master') 
    OR has_role(auth.uid(), 'admin')
  );

-- 4. DELETE: Only admin and master
DROP POLICY IF EXISTS leituras_admin_delete ON public.leituras;
DROP POLICY IF EXISTS leituras_delete_admin_master ON public.leituras;
CREATE POLICY leituras_delete_admin_master ON public.leituras
  FOR DELETE TO authenticated 
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

-- Ensure clientes/maquinas are also fully readable
DROP POLICY IF EXISTS clientes_select_all_auth ON public.clientes;
CREATE POLICY clientes_select_all_auth ON public.clientes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS maquinas_select_all_auth ON public.maquinas;
CREATE POLICY maquinas_select_all_auth ON public.maquinas
  FOR SELECT TO authenticated USING (true);
