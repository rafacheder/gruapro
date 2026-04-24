-- 1) Reverter views
DROP VIEW IF EXISTS public.clientes_operador CASCADE;
DROP VIEW IF EXISTS public.maquinas_operador CASCADE;

-- 2) Ajustar RLS em clientes
DROP POLICY IF EXISTS clientes_select_all_auth ON public.clientes;
DROP POLICY IF EXISTS clientes_select_admin_master ON public.clientes;
CREATE POLICY clientes_select_all_auth ON public.clientes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS clientes_insert_admin_master ON public.clientes;
CREATE POLICY clientes_insert_auth ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS clientes_update_admin_master ON public.clientes;
CREATE POLICY clientes_update_auth ON public.clientes
  FOR UPDATE TO authenticated USING (true);

-- 3) Ajustar RLS em maquinas
DROP POLICY IF EXISTS maquinas_select_all_auth ON public.maquinas;
DROP POLICY IF EXISTS maquinas_select_admin_master ON public.maquinas;
CREATE POLICY maquinas_select_all_auth ON public.maquinas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS maquinas_insert_admin_master ON public.maquinas;
CREATE POLICY maquinas_insert_auth ON public.maquinas
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS maquinas_update_admin_master ON public.maquinas;
CREATE POLICY maquinas_update_auth ON public.maquinas
  FOR UPDATE TO authenticated USING (true);

-- 4) Ajustar RLS em leituras (Ver apenas as próprias)
DROP POLICY IF EXISTS leituras_select_all_auth ON public.leituras;
CREATE POLICY leituras_select_restricted ON public.leituras
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'master') OR 
    has_role(auth.uid(), 'admin') OR 
    usuario_id = auth.uid()
  );

-- 5) Ajustar RLS em pagamentos (Bloquear cancelamento para 'usuario')
-- Primeiro SELECT para todos
DROP POLICY IF EXISTS pagamentos_select_all_auth ON public.pagamentos;
CREATE POLICY pagamentos_select_all_auth ON public.pagamentos
  FOR SELECT TO authenticated USING (true);

-- INSERT para todos (usuário pode registrar novos)
DROP POLICY IF EXISTS pagamentos_insert_all_auth ON public.pagamentos;
CREATE POLICY pagamentos_insert_all_auth ON public.pagamentos
  FOR INSERT TO authenticated WITH CHECK (true);

-- DELETE apenas para admin/master (cancelar pagamento)
DROP POLICY IF EXISTS pagamentos_delete_admin_master ON public.pagamentos;
CREATE POLICY pagamentos_delete_admin_master ON public.pagamentos
  FOR DELETE TO authenticated 
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));
