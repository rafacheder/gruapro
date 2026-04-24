-- 1) Ajustar Clientes
DROP POLICY IF EXISTS clientes_insert_auth ON public.clientes;
DROP POLICY IF EXISTS clientes_update_auth ON public.clientes;
DROP POLICY IF EXISTS clientes_admin_insert ON public.clientes;
DROP POLICY IF EXISTS clientes_admin_update ON public.clientes;

CREATE POLICY clientes_insert_role ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

CREATE POLICY clientes_update_role ON public.clientes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

-- 2) Ajustar Maquinas
DROP POLICY IF EXISTS maquinas_insert_auth ON public.maquinas;
DROP POLICY IF EXISTS maquinas_update_auth ON public.maquinas;
DROP POLICY IF EXISTS maquinas_admin_insert ON public.maquinas;
DROP POLICY IF EXISTS maquinas_admin_update ON public.maquinas;

CREATE POLICY maquinas_insert_role ON public.maquinas
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

CREATE POLICY maquinas_update_role ON public.maquinas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

-- 3) Ajustar Pagamentos
DROP POLICY IF EXISTS pagamentos_insert_all_auth ON public.pagamentos;
DROP POLICY IF EXISTS "Admin and master can do everything on pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS pagamentos_delete_admin_master ON public.pagamentos;

CREATE POLICY pagamentos_insert_role ON public.pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

CREATE POLICY pagamentos_update_role ON public.pagamentos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'usuario'));

CREATE POLICY pagamentos_delete_admin_master ON public.pagamentos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));
