-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'usuario');
CREATE TYPE public.maquina_status AS ENUM ('ativa', 'manutencao', 'removida', 'desativada');
CREATE TYPE public.leitura_status AS ENUM ('pendente_pagamento', 'pago', 'cancelado');
CREATE TYPE public.manutencao_tipo AS ENUM ('preventiva', 'corretiva');
CREATE TYPE public.pagamento_forma AS ENUM ('dinheiro', 'pix', 'transferencia', 'outro');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES (separate table — required for security)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: highest role of user
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'master' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'usuario' THEN 3
  END
  LIMIT 1
$$;

-- =========================================
-- CLIENTES
-- =========================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_ponto TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  telefone_responsavel TEXT NOT NULL,
  email TEXT,
  cep TEXT NOT NULL,
  rua TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  percentual_comissao NUMERIC NOT NULL CHECK (percentual_comissao >= 0 AND percentual_comissao <= 100),
  data_inicio_contrato DATE,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- =========================================
-- MAQUINAS
-- =========================================
CREATE TABLE public.maquinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  codigo_identificacao TEXT NOT NULL UNIQUE,
  modelo TEXT,
  data_instalacao DATE,
  status public.maquina_status NOT NULL DEFAULT 'ativa',
  qr_code_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PELUCIAS TIPOS (catálogo — preparado para futuro)
-- =========================================
CREATE TABLE public.pelucias_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pelucias_tipos ENABLE ROW LEVEL SECURITY;

-- =========================================
-- MAQUINA ESTOQUE (preparado para futuro)
-- =========================================
CREATE TABLE public.maquina_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  pelucia_tipo_id UUID NOT NULL REFERENCES public.pelucias_tipos(id) ON DELETE RESTRICT,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(maquina_id, pelucia_tipo_id)
);

ALTER TABLE public.maquina_estoque ENABLE ROW LEVEL SECURITY;

-- =========================================
-- LEITURAS
-- =========================================
CREATE TABLE public.leituras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  data_leitura TIMESTAMPTZ NOT NULL DEFAULT now(),
  valor_faturado NUMERIC NOT NULL CHECK (valor_faturado >= 0),
  pelucias_saidas INTEGER NOT NULL DEFAULT 0 CHECK (pelucias_saidas >= 0),
  valor_comissao NUMERIC NOT NULL,
  valor_liquido NUMERIC NOT NULL,
  percentual_aplicado NUMERIC NOT NULL,
  assinatura_base64 TEXT,
  observacoes TEXT,
  status public.leitura_status NOT NULL DEFAULT 'pendente_pagamento',
  aprovada_por UUID REFERENCES auth.users(id),
  offline_synced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leituras_maquina ON public.leituras(maquina_id, data_leitura DESC);
CREATE INDEX idx_leituras_cliente ON public.leituras(cliente_id, data_leitura DESC);
CREATE INDEX idx_leituras_usuario ON public.leituras(usuario_id, data_leitura DESC);

-- =========================================
-- LEITURA FOTOS
-- =========================================
CREATE TABLE public.leitura_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leitura_id UUID NOT NULL REFERENCES public.leituras(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  ordem INTEGER NOT NULL CHECK (ordem >= 1 AND ordem <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leitura_fotos ENABLE ROW LEVEL SECURITY;

-- =========================================
-- LEITURA PELUCIAS DETALHE (preparado para futuro)
-- =========================================
CREATE TABLE public.leitura_pelucias_detalhe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leitura_id UUID NOT NULL REFERENCES public.leituras(id) ON DELETE CASCADE,
  pelucia_tipo_id UUID NOT NULL REFERENCES public.pelucias_tipos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0)
);

ALTER TABLE public.leitura_pelucias_detalhe ENABLE ROW LEVEL SECURITY;

-- =========================================
-- REPOSICOES (preparado para futuro)
-- =========================================
CREATE TABLE public.reposicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  pelucia_tipo_id UUID NOT NULL REFERENCES public.pelucias_tipos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  data_reposicao TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT
);

ALTER TABLE public.reposicoes ENABLE ROW LEVEL SECURITY;

-- =========================================
-- MANUTENCOES (preparado para futuro)
-- =========================================
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  tipo public.manutencao_tipo NOT NULL,
  descricao TEXT NOT NULL,
  custo NUMERIC,
  data_manutencao TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  resolvida BOOLEAN NOT NULL DEFAULT FALSE,
  fotos_urls TEXT[]
);

ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PAGAMENTOS (preparado para futuro)
-- =========================================
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  valor NUMERIC NOT NULL CHECK (valor > 0),
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  forma_pagamento public.pagamento_forma NOT NULL,
  comprovante_url TEXT,
  leituras_cobertas UUID[],
  observacoes TEXT,
  registrado_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PERMISSIONS (matriz customizável — preparado para futuro)
-- =========================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  recurso TEXT NOT NULL,
  permitido BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role, recurso)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- AUDIT LOG (insert-only)
-- =========================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID,
  dados_antes JSONB,
  dados_depois JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_log_user ON public.audit_log(usuario_id, created_at DESC);
CREATE INDEX idx_audit_log_table ON public.audit_log(tabela, created_at DESC);

-- Trigger to prevent UPDATE/DELETE on audit_log
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is insert-only';
END;
$$;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();

-- =========================================
-- TIMESTAMPS TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_maquinas BEFORE UPDATE ON public.maquinas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_leituras BEFORE UPDATE ON public.leituras FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_master BOOLEAN := FALSE;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  -- Master bootstrap: rafatcheder@gmail.com gets master role on first signup
  IF NEW.email = 'rafatcheder@gmail.com' THEN
    _is_master := TRUE;
  END IF;

  IF _is_master THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'master')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Default role: usuario
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'usuario')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- RLS POLICIES
-- =========================================

-- PROFILES: everyone authenticated can read, users update their own, master/admin can update any
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

-- USER_ROLES: users can see own roles, master/admin can see all
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'master')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Only master can insert/update/delete roles (admin can grant only 'usuario' role)
CREATE POLICY "user_roles_master_all" ON public.user_roles
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'master')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'master')
  );

CREATE POLICY "user_roles_admin_manage_user" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND role = 'usuario'
  );

CREATE POLICY "user_roles_admin_delete_user" ON public.user_roles
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') AND role = 'usuario'
  );

-- CLIENTES
CREATE POLICY "clientes_select_all_auth" ON public.clientes
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "clientes_admin_insert" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "clientes_admin_update" ON public.clientes
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "clientes_admin_delete" ON public.clientes
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

-- MAQUINAS
CREATE POLICY "maquinas_select_all_auth" ON public.maquinas
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "maquinas_admin_insert" ON public.maquinas
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "maquinas_admin_update" ON public.maquinas
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "maquinas_admin_delete" ON public.maquinas
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

-- LEITURAS
-- usuario: vê apenas as próprias; admin/master: vê todas
CREATE POLICY "leituras_select" ON public.leituras
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid()
    OR public.has_role(auth.uid(), 'master')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leituras_insert" ON public.leituras
  FOR INSERT TO authenticated WITH CHECK (
    usuario_id = auth.uid()
  );

-- Apenas admin/master pode editar leitura (qualquer)
CREATE POLICY "leituras_admin_update" ON public.leituras
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leituras_admin_delete" ON public.leituras
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

-- LEITURA FOTOS: same as leituras
CREATE POLICY "leitura_fotos_select" ON public.leitura_fotos
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.leituras l
      WHERE l.id = leitura_id
      AND (
        l.usuario_id = auth.uid()
        OR public.has_role(auth.uid(), 'master')
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "leitura_fotos_insert" ON public.leitura_fotos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leituras l
      WHERE l.id = leitura_id AND l.usuario_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leitura_fotos_admin_delete" ON public.leitura_fotos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
  );

-- PELUCIAS_TIPOS, MAQUINA_ESTOQUE, REPOSICOES, MANUTENCOES, PAGAMENTOS, PERMISSIONS:
-- estrutura preparada — bloqueada para usuário comum, admin/master tudo
CREATE POLICY "pelucias_tipos_select" ON public.pelucias_tipos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "pelucias_tipos_admin" ON public.pelucias_tipos FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "maquina_estoque_select" ON public.maquina_estoque FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "maquina_estoque_admin" ON public.maquina_estoque FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "leitura_pel_det_select" ON public.leitura_pelucias_detalhe FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "leitura_pel_det_insert" ON public.leitura_pelucias_detalhe FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "reposicoes_select" ON public.reposicoes FOR SELECT TO authenticated USING (
  usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "reposicoes_insert" ON public.reposicoes FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "manutencoes_select" ON public.manutencoes FOR SELECT TO authenticated USING (
  usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'master')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "manutencoes_insert" ON public.manutencoes FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "manutencoes_admin_update" ON public.manutencoes FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "pagamentos_select" ON public.pagamentos FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "pagamentos_admin" ON public.pagamentos FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "permissions_select" ON public.permissions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "permissions_master" ON public.permissions FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'master')
) WITH CHECK (
  public.has_role(auth.uid(), 'master')
);

-- AUDIT LOG: master vê tudo; admin vê próprias e de usuarios; usuario vê só as próprias
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated USING (
    usuario_id = auth.uid()
    OR public.has_role(auth.uid(), 'master')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- =========================================
-- STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('leitura-fotos', 'leitura-fotos', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', FALSE)
ON CONFLICT DO NOTHING;

-- Storage policies for leitura-fotos
CREATE POLICY "leitura_fotos_storage_read" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'leitura-fotos');

CREATE POLICY "leitura_fotos_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leitura-fotos');

CREATE POLICY "leitura_fotos_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'leitura-fotos'
    AND (public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin'))
  );

-- Storage policies for comprovantes (private)
CREATE POLICY "comprovantes_storage_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'comprovantes'
    AND (public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (
    bucket_id = 'comprovantes'
    AND (public.has_role(auth.uid(), 'master') OR public.has_role(auth.uid(), 'admin'))
  );