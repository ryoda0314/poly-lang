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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      pronunciation_runs: {
        Row: {
          asr_text: string
          created_at: string | null
          device_info: Json | null
          diffs: Json
          expected_text: string
          feedback: string | null
          id: string
          phrase_id: string
          score: number
          user_id: string
        }
        Insert: {
          asr_text: string
          created_at?: string | null
          device_info?: Json | null
          diffs?: Json
          expected_text: string
          feedback?: string | null
          id?: string
          phrase_id: string
          score: number
          user_id: string
        }
        Update: {
          asr_text?: string
          created_at?: string | null
          device_info?: Json | null
          diffs?: Json
          expected_text?: string
          feedback?: string | null
          id?: string
          phrase_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users" // referencing auth.users technically, but profiles is common
            referencedColumns: ["id"]
          },
        ]
      },
      awareness_memos: {
        Row: {
          confidence: string | null
          created_at: string | null
          id: string
          memo: string | null
          phrase_id: string
          token_index: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          phrase_id: string
          token_index: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          phrase_id?: string
          token_index?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "awareness_memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          gender: string | null
          id: string
          learning_language: string | null
          native_language: string | null
          settings: Json | null
          username: string | null
          role?: string | null
        }
        Insert: {
          created_at?: string | null
          gender?: string | null
          id: string
          learning_language?: string | null
          native_language?: string | null
          settings?: Json | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string | null
          id?: string
          learning_language?: string | null
          native_language?: string | null
          settings?: Json | null
          username?: string | null
        }
        Relationships: []
      },
      levels: {
        Row: {
          level: number
          xp_threshold: number
          title: string
          next_unlock_label: string
        }
        Insert: {
          level: number
          xp_threshold: number
          title: string
          next_unlock_label: string
        }
        Update: {
          level?: number
          xp_threshold?: number
          title?: string
          next_unlock_label?: string
        }
        Relationships: []
      },
      daily_quest_templates: {
        Row: {
          id: string
          quest_key: string
          title: string
          event_type: string
          required_count: number
          language_code: string | null
          level_min: number | null
          level_max: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          quest_key: string
          title: string
          event_type: string
          required_count?: number
          language_code?: string | null
          level_min?: number | null
          level_max?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          quest_key?: string
          title?: string
          event_type?: string
          required_count?: number
          language_code?: string | null
          level_min?: number | null
          level_max?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      },
      badges: {
        Row: {
          id: string
          badge_key: string
          title: string
          description: string
          icon: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          badge_key: string
          title: string
          description: string
          icon?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          badge_key?: string
          title?: string
          description?: string
          icon?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      },
      learning_events: {
        Row: {
          id: string
          user_id: string
          language_code: string
          event_type: string
          xp_delta: number
          occurred_at: string
          meta: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          language_code: string
          event_type: string
          xp_delta?: number
          occurred_at?: string
          meta?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          language_code?: string
          event_type?: string
          xp_delta?: number
          occurred_at?: string
          meta?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
