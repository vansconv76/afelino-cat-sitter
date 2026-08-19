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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      booking_visits: {
        Row: {
          booking_id: string
          created_at: string
          day_type: string
          id: string
          price: number
          visit_date: string
          visit_time: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          day_type?: string
          id?: string
          price?: number
          visit_date: string
          visit_time?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          day_type?: string
          id?: string
          price?: number
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_visits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          cat_count: number
          cat_ids: string[]
          created_at: string
          discount_amount: number
          discount_pct: number
          duration_minutes: number
          id: string
          neighborhood: string
          notes: string
          previsit: boolean
          previsit_fee: number
          status: string
          subtotal: number
          total: number
          tutor_id: string
          updated_at: string
          with_medication: boolean
        }
        Insert: {
          address?: string
          cat_count?: number
          cat_ids?: string[]
          created_at?: string
          discount_amount?: number
          discount_pct?: number
          duration_minutes?: number
          id?: string
          neighborhood?: string
          notes?: string
          previsit?: boolean
          previsit_fee?: number
          status?: string
          subtotal?: number
          total?: number
          tutor_id: string
          updated_at?: string
          with_medication?: boolean
        }
        Update: {
          address?: string
          cat_count?: number
          cat_ids?: string[]
          created_at?: string
          discount_amount?: number
          discount_pct?: number
          duration_minutes?: number
          id?: string
          neighborhood?: string
          notes?: string
          previsit?: boolean
          previsit_fee?: number
          status?: string
          subtotal?: number
          total?: number
          tutor_id?: string
          updated_at?: string
          with_medication?: boolean
        }
        Relationships: []
      }
      cats: {
        Row: {
          age_years: number | null
          created_at: string
          id: string
          medication_notes: string
          name: string
          needs_medication: boolean
          notes: string
          owner_id: string
          temperament: string
        }
        Insert: {
          age_years?: number | null
          created_at?: string
          id?: string
          medication_notes?: string
          name: string
          needs_medication?: boolean
          notes?: string
          owner_id: string
          temperament?: string
        }
        Update: {
          age_years?: number | null
          created_at?: string
          id?: string
          medication_notes?: string
          name?: string
          needs_medication?: boolean
          notes?: string
          owner_id?: string
          temperament?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          day: string
          name: string
        }
        Insert: {
          day: string
          name: string
        }
        Update: {
          day?: string
          name?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          key: string
          label: string
          sort_order: number
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          key: string
          label: string
          sort_order?: number
          unit?: string
          updated_at?: string
          value: number
        }
        Update: {
          key?: string
          label?: string
          sort_order?: number
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          full_name: string
          id: string
          neighborhood: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          full_name?: string
          id: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          full_name?: string
          id?: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          cat_names: string
          content: string
          created_at: string
          id: string
          neighborhood: string
          published: boolean
          rating: number
          sort_order: number
        }
        Insert: {
          author_name: string
          cat_names?: string
          content: string
          created_at?: string
          id?: string
          neighborhood?: string
          published?: boolean
          rating?: number
          sort_order?: number
        }
        Update: {
          author_name?: string
          cat_names?: string
          content?: string
          created_at?: string
          id?: string
          neighborhood?: string
          published?: boolean
          rating?: number
          sort_order?: number
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tutor"
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
      app_role: ["admin", "tutor"],
    },
  },
} as const
