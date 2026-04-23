export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          acao: string
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          created_at: string
          created_by: string | null
          data_inicio_contrato: string | null
          email: string | null
          estado: string
          id: string
          latitude: number | null
          longitude: number | null
          nome_ponto: string
          nome_responsavel: string
          numero: string
          observacoes: string | null
          percentual_comissao: number
          rua: string
          telefone_responsavel: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          created_at?: string
          created_by?: string | null
          data_inicio_contrato?: string | null
          email?: string | null
          estado: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_ponto: string
          nome_responsavel: string
          numero: string
          observacoes?: string | null
          percentual_comissao: number
          rua: string
          telefone_responsavel: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          created_at?: string
          created_by?: string | null
          data_inicio_contrato?: string | null
          email?: string | null
          estado?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_ponto?: string
          nome_responsavel?: string
          numero?: string
          observacoes?: string | null
          percentual_comissao?: number
          rua?: string
          telefone_responsavel?: string
          updated_at?: string
        }
        Relationships: []
      }
      leitura_fotos: {
        Row: {
          created_at: string
          foto_url: string
          id: string
          leitura_id: string
          ordem: number
        }
        Insert: {
          created_at?: string
          foto_url: string
          id?: string
          leitura_id: string
          ordem: number
        }
        Update: {
          created_at?: string
          foto_url?: string
          id?: string
          leitura_id?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "leitura_fotos_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "leituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_fotos_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "vw_leituras_com_anterior"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_fotos_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "vw_ultimas_leituras_por_maquina"
            referencedColumns: ["id"]
          },
        ]
      }
      leitura_pelucias_detalhe: {
        Row: {
          id: string
          leitura_id: string
          pelucia_tipo_id: string
          quantidade: number
        }
        Insert: {
          id?: string
          leitura_id: string
          pelucia_tipo_id: string
          quantidade: number
        }
        Update: {
          id?: string
          leitura_id?: string
          pelucia_tipo_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "leitura_pelucias_detalhe_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "leituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_pelucias_detalhe_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "vw_leituras_com_anterior"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_pelucias_detalhe_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: false
            referencedRelation: "vw_ultimas_leituras_por_maquina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_pelucias_detalhe_pelucia_tipo_id_fkey"
            columns: ["pelucia_tipo_id"]
            isOneToOne: false
            referencedRelation: "pelucias_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      leituras: {
        Row: {
          aprovada_por: string | null
          assinatura_base64: string | null
          cliente_id: string
          created_at: string
          data_leitura: string
          id: string
          maquina_id: string
          observacoes: string | null
          offline_synced: boolean
          pelucias_saidas: number
          percentual_aplicado: number
          status: Database["public"]["Enums"]["leitura_status"]
          updated_at: string
          usuario_id: string
          valor_comissao: number
          valor_faturado: number
          valor_liquido: number
        }
        Insert: {
          aprovada_por?: string | null
          assinatura_base64?: string | null
          cliente_id: string
          created_at?: string
          data_leitura?: string
          id?: string
          maquina_id: string
          observacoes?: string | null
          offline_synced?: boolean
          pelucias_saidas?: number
          percentual_aplicado: number
          status?: Database["public"]["Enums"]["leitura_status"]
          updated_at?: string
          usuario_id: string
          valor_comissao: number
          valor_faturado: number
          valor_liquido: number
        }
        Update: {
          aprovada_por?: string | null
          assinatura_base64?: string | null
          cliente_id?: string
          created_at?: string
          data_leitura?: string
          id?: string
          maquina_id?: string
          observacoes?: string | null
          offline_synced?: boolean
          pelucias_saidas?: number
          percentual_aplicado?: number
          status?: Database["public"]["Enums"]["leitura_status"]
          updated_at?: string
          usuario_id?: string
          valor_comissao?: number
          valor_faturado?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "leituras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_usuario_id_profiles_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          custo: number | null
          data_manutencao: string
          descricao: string
          fotos_urls: string[] | null
          id: string
          maquina_id: string
          resolvida: boolean
          tipo: Database["public"]["Enums"]["manutencao_tipo"]
          usuario_id: string
        }
        Insert: {
          custo?: number | null
          data_manutencao?: string
          descricao: string
          fotos_urls?: string[] | null
          id?: string
          maquina_id: string
          resolvida?: boolean
          tipo: Database["public"]["Enums"]["manutencao_tipo"]
          usuario_id: string
        }
        Update: {
          custo?: number | null
          data_manutencao?: string
          descricao?: string
          fotos_urls?: string[] | null
          id?: string
          maquina_id?: string
          resolvida?: boolean
          tipo?: Database["public"]["Enums"]["manutencao_tipo"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
        ]
      }
      maquina_estoque: {
        Row: {
          id: string
          maquina_id: string
          pelucia_tipo_id: string
          quantidade_atual: number
          quantidade_minima: number
          updated_at: string
        }
        Insert: {
          id?: string
          maquina_id: string
          pelucia_tipo_id: string
          quantidade_atual?: number
          quantidade_minima?: number
          updated_at?: string
        }
        Update: {
          id?: string
          maquina_id?: string
          pelucia_tipo_id?: string
          quantidade_atual?: number
          quantidade_minima?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maquina_estoque_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquina_estoque_pelucia_tipo_id_fkey"
            columns: ["pelucia_tipo_id"]
            isOneToOne: false
            referencedRelation: "pelucias_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinas: {
        Row: {
          cliente_id: string
          codigo_identificacao: string
          created_at: string
          data_instalacao: string | null
          id: string
          modelo: string | null
          observacoes: string | null
          qr_code_url: string | null
          status: Database["public"]["Enums"]["maquina_status"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          codigo_identificacao: string
          created_at?: string
          data_instalacao?: string | null
          id?: string
          modelo?: string | null
          observacoes?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["maquina_status"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          codigo_identificacao?: string
          created_at?: string
          data_instalacao?: string | null
          id?: string
          modelo?: string | null
          observacoes?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["maquina_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maquinas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamento_leituras: {
        Row: {
          created_at: string | null
          id: string
          leitura_id: string
          pagamento_id: string
          valor_aplicado: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          leitura_id: string
          pagamento_id: string
          valor_aplicado: number
        }
        Update: {
          created_at?: string | null
          id?: string
          leitura_id?: string
          pagamento_id?: string
          valor_aplicado?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamento_leituras_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: true
            referencedRelation: "leituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_leituras_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: true
            referencedRelation: "vw_leituras_com_anterior"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_leituras_leitura_id_fkey"
            columns: ["leitura_id"]
            isOneToOne: true
            referencedRelation: "vw_ultimas_leituras_por_maquina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_leituras_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          cliente_id: string
          comprovante_url: string | null
          created_at: string
          data_pagamento: string
          forma_pagamento: Database["public"]["Enums"]["pagamento_forma"]
          id: string
          leituras_cobertas: string[] | null
          observacoes: string | null
          registrado_por: string
          valor: number
        }
        Insert: {
          cliente_id: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          forma_pagamento: Database["public"]["Enums"]["pagamento_forma"]
          id?: string
          leituras_cobertas?: string[] | null
          observacoes?: string | null
          registrado_por: string
          valor: number
        }
        Update: {
          cliente_id?: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          forma_pagamento?: Database["public"]["Enums"]["pagamento_forma"]
          id?: string
          leituras_cobertas?: string[] | null
          observacoes?: string | null
          registrado_por?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pelucias_tipos: {
        Row: {
          ativo: boolean
          created_at: string
          custo_unitario: number
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number
          id?: string
          nome?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          permitido: boolean
          recurso: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permitido?: boolean
          recurso: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permitido?: boolean
          recurso?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reposicoes: {
        Row: {
          data_reposicao: string
          id: string
          maquina_id: string
          observacoes: string | null
          pelucia_tipo_id: string
          quantidade: number
          usuario_id: string
        }
        Insert: {
          data_reposicao?: string
          id?: string
          maquina_id: string
          observacoes?: string | null
          pelucia_tipo_id: string
          quantidade: number
          usuario_id: string
        }
        Update: {
          data_reposicao?: string
          id?: string
          maquina_id?: string
          observacoes?: string | null
          pelucia_tipo_id?: string
          quantidade?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposicoes_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposicoes_pelucia_tipo_id_fkey"
            columns: ["pelucia_tipo_id"]
            isOneToOne: false
            referencedRelation: "pelucias_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_leituras_com_anterior: {
        Row: {
          aprovada_por: string | null
          assinatura_base64: string | null
          cliente_id: string | null
          created_at: string | null
          data_leitura: string | null
          data_leitura_pre_previa: string | null
          data_leitura_previa: string | null
          id: string | null
          leitura_previa_id: string | null
          maquina_id: string | null
          observacoes: string | null
          offline_synced: boolean | null
          pelucias_saidas: number | null
          pelucias_saidas_previa: number | null
          percentual_aplicado: number | null
          rn_desc: number | null
          status: Database["public"]["Enums"]["leitura_status"] | null
          updated_at: string | null
          usuario_id: string | null
          valor_comissao: number | null
          valor_faturado: number | null
          valor_faturado_previo: number | null
          valor_liquido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leituras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_usuario_id_profiles_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ultimas_leituras_por_maquina: {
        Row: {
          aprovada_por: string | null
          assinatura_base64: string | null
          cliente_id: string | null
          created_at: string | null
          data_leitura: string | null
          id: string | null
          maquina_id: string | null
          observacoes: string | null
          offline_synced: boolean | null
          pelucias_saidas: number | null
          percentual_aplicado: number | null
          rn: number | null
          status: Database["public"]["Enums"]["leitura_status"] | null
          updated_at: string | null
          usuario_id: string | null
          valor_comissao: number | null
          valor_faturado: number | null
          valor_liquido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leituras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_usuario_id_profiles_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "admin" | "usuario"
      leitura_status: "pendente" | "pago" | "cancelado"
      manutencao_tipo: "preventiva" | "corretiva"
      maquina_status: "ativa" | "manutencao" | "removida" | "desativada"
      pagamento_forma: "dinheiro" | "pix" | "transferencia" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master", "admin", "usuario"],
      leitura_status: ["pendente", "pago", "cancelado"],
      manutencao_tipo: ["preventiva", "corretiva"],
      maquina_status: ["ativa", "manutencao", "removida", "desativada"],
      pagamento_forma: ["dinheiro", "pix", "transferencia", "outro"],
    },
  },
} as const
