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
      attachments: {
        Row: {
          ai_extracted: Json | null
          created_at: string
          entry_id: string | null
          id: string
          kind: string
          storage_path: string
          user_id: string
        }
        Insert: {
          ai_extracted?: Json | null
          created_at?: string
          entry_id?: string | null
          id?: string
          kind: string
          storage_path: string
          user_id: string
        }
        Update: {
          ai_extracted?: Json | null
          created_at?: string
          entry_id?: string | null
          id?: string
          kind?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          account_email: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          emailed_at: string | null
          id: string
          message: string
          name: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          email: string
          emailed_at?: string | null
          id?: string
          message: string
          name: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          emailed_at?: string | null
          id?: string
          message?: string
          name?: string
          topic?: string | null
        }
        Relationships: []
      }
      ehr_connections: {
        Row: {
          access_token: string | null
          auth_mode: string
          created_at: string
          fhir_base_url: string
          id: string
          last_synced_at: string | null
          patient_id: string | null
          patient_name: string | null
          provider_name: string
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auth_mode?: string
          created_at?: string
          fhir_base_url: string
          id?: string
          last_synced_at?: string | null
          patient_id?: string | null
          patient_name?: string | null
          provider_name: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          auth_mode?: string
          created_at?: string
          fhir_base_url?: string
          id?: string
          last_synced_at?: string | null
          patient_id?: string | null
          patient_name?: string | null
          provider_name?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          ai_data: Json | null
          ai_summary: string | null
          body: string
          created_at: string
          doctor: string | null
          entry_date: string
          entry_type: string
          external_id: string | null
          external_provider: string | null
          id: string
          mood: number | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          visit_type: string | null
        }
        Insert: {
          ai_data?: Json | null
          ai_summary?: string | null
          body: string
          created_at?: string
          doctor?: string | null
          entry_date?: string
          entry_type?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          mood?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          visit_type?: string | null
        }
        Update: {
          ai_data?: Json | null
          ai_summary?: string | null
          body?: string
          created_at?: string
          doctor?: string | null
          entry_date?: string
          entry_type?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          mood?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          visit_type?: string | null
        }
        Relationships: []
      }
      entry_medications: {
        Row: {
          entry_id: string
          medication_id: string
        }
        Insert: {
          entry_id: string
          medication_id: string
        }
        Update: {
          entry_id?: string
          medication_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_medications_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          content: Json
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          code: string | null
          created_at: string
          external_id: string | null
          external_provider: string | null
          id: string
          interpretation: string | null
          name: string
          observed_at: string | null
          panel: string | null
          reference_range: string | null
          source: string
          unit: string | null
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          interpretation?: string | null
          name: string
          observed_at?: string | null
          panel?: string | null
          reference_range?: string | null
          source?: string
          unit?: string | null
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          interpretation?: string | null
          name?: string
          observed_at?: string | null
          panel?: string | null
          reference_range?: string | null
          source?: string
          unit?: string | null
          user_id?: string
          value?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dose: string | null
          ended_on: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          name: string
          notes: string | null
          purpose: string | null
          schedule: string | null
          started_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          ended_on?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          name: string
          notes?: string | null
          purpose?: string | null
          schedule?: string | null
          started_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          ended_on?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          name?: string
          notes?: string | null
          purpose?: string | null
          schedule?: string | null
          started_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          demographics: Json | null
          display_name: string | null
          family_history: Json | null
          health_consent_at: string | null
          health_consent_version: string | null
          id: string
          last_checkin_date: string | null
          reminder_time: string | null
          streak_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          demographics?: Json | null
          display_name?: string | null
          family_history?: Json | null
          health_consent_at?: string | null
          health_consent_version?: string | null
          id: string
          last_checkin_date?: string | null
          reminder_time?: string | null
          streak_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          demographics?: Json | null
          display_name?: string | null
          family_history?: Json | null
          health_consent_at?: string | null
          health_consent_version?: string | null
          id?: string
          last_checkin_date?: string | null
          reminder_time?: string | null
          streak_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          all_day: boolean
          created_at: string
          done: boolean
          end_at: string | null
          entry_id: string | null
          external_id: string | null
          external_provider: string | null
          id: string
          kind: string
          location: string | null
          notes: string | null
          prep_prompted_at: string | null
          prep_questions: Json | null
          recurrence_rule: string | null
          reflection_entry_id: string | null
          reflection_prompted_at: string | null
          source: string
          start_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          done?: boolean
          end_at?: string | null
          entry_id?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          prep_prompted_at?: string | null
          prep_questions?: Json | null
          recurrence_rule?: string | null
          reflection_entry_id?: string | null
          reflection_prompted_at?: string | null
          source?: string
          start_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          done?: boolean
          end_at?: string | null
          entry_id?: string | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          prep_prompted_at?: string | null
          prep_questions?: Json | null
          recurrence_rule?: string | null
          reflection_entry_id?: string | null
          reflection_prompted_at?: string | null
          source?: string
          start_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_reflection_entry_id_fkey"
            columns: ["reflection_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals: {
        Row: {
          created_at: string
          external_id: string | null
          external_provider: string | null
          id: string
          note: string | null
          recorded_at: string
          source: string
          type: string
          unit: string | null
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          note?: string | null
          recorded_at?: string
          source?: string
          type: string
          unit?: string | null
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          note?: string | null
          recorded_at?: string
          source?: string
          type?: string
          unit?: string | null
          user_id?: string
          value?: number | null
          value_text?: string | null
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
