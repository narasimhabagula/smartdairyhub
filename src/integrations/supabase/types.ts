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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          animal_type: string | null
          contact_phone: string | null
          created_at: string
          farmer_id: string
          id: string
          location: string | null
          mode: string
          notes: string | null
          prescription: string | null
          scheduled_at: string | null
          status: string
          symptoms: string
          updated_at: string
          vet_id: string
        }
        Insert: {
          animal_type?: string | null
          contact_phone?: string | null
          created_at?: string
          farmer_id: string
          id?: string
          location?: string | null
          mode?: string
          notes?: string | null
          prescription?: string | null
          scheduled_at?: string | null
          status?: string
          symptoms: string
          updated_at?: string
          vet_id: string
        }
        Update: {
          animal_type?: string | null
          contact_phone?: string | null
          created_at?: string
          farmer_id?: string
          id?: string
          location?: string | null
          mode?: string
          notes?: string | null
          prescription?: string | null
          scheduled_at?: string | null
          status?: string
          symptoms?: string
          updated_at?: string
          vet_id?: string
        }
        Relationships: []
      }
      cattle_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cattle_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "cattle_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      cattle_listings: {
        Row: {
          age: string | null
          breed: string
          contact_phone: string | null
          created_at: string
          description: string | null
          district: string | null
          health_status: string | null
          id: string
          image_url: string | null
          listing_type: string
          location: string | null
          milk_yield: string | null
          name: string
          photos: string[]
          price: number
          seller_id: string
          state: string | null
          status: string
          type: string
          updated_at: string
          vaccination_status: string | null
          video_url: string | null
          village: string | null
        }
        Insert: {
          age?: string | null
          breed: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          health_status?: string | null
          id?: string
          image_url?: string | null
          listing_type?: string
          location?: string | null
          milk_yield?: string | null
          name: string
          photos?: string[]
          price: number
          seller_id: string
          state?: string | null
          status?: string
          type: string
          updated_at?: string
          vaccination_status?: string | null
          video_url?: string | null
          village?: string | null
        }
        Update: {
          age?: string | null
          breed?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          health_status?: string | null
          id?: string
          image_url?: string | null
          listing_type?: string
          location?: string | null
          milk_yield?: string | null
          name?: string
          photos?: string[]
          price?: number
          seller_id?: string
          state?: string | null
          status?: string
          type?: string
          updated_at?: string
          vaccination_status?: string | null
          video_url?: string | null
          village?: string | null
        }
        Relationships: []
      }
      cattle_reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cattle_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "cattle_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dairy_companies: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          pin_code: string | null
          state: string | null
          updated_at: string
          verified: boolean
          village: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          pin_code?: string | null
          state?: string | null
          updated_at?: string
          verified?: boolean
          village?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          pin_code?: string | null
          state?: string | null
          updated_at?: string
          verified?: boolean
          village?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      milk_rates: {
        Row: {
          collection_timing: string | null
          company_id: string
          created_at: string
          effective_date: string
          fat: number
          id: string
          milk_type: string
          notes: string | null
          price_per_litre: number
          snf: number
          updated_at: string
        }
        Insert: {
          collection_timing?: string | null
          company_id: string
          created_at?: string
          effective_date?: string
          fat: number
          id?: string
          milk_type: string
          notes?: string | null
          price_per_litre: number
          snf: number
          updated_at?: string
        }
        Update: {
          collection_timing?: string | null
          company_id?: string
          created_at?: string
          effective_date?: string
          fat?: number
          id?: string
          milk_type?: string
          notes?: string | null
          price_per_litre?: number
          snf?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milk_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dairy_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      milk_records: {
        Row: {
          amount: number | null
          created_at: string
          date: string
          fat: number
          id: string
          liters: number
          rate: number | null
          shift: string
          snf: number
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          date?: string
          fat: number
          id?: string
          liters: number
          rate?: number | null
          shift: string
          snf: number
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          date?: string
          fat?: number
          id?: string
          liters?: number
          rate?: number | null
          shift?: string
          snf?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          shipping_address: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          shipping_address?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          shipping_address?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          approval_status: string
          approved: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          photos: string[]
          price: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          stock: number
          unit: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          approval_status?: string
          approved?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          photos?: string[]
          price: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          stock?: number
          unit?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          approval_status?: string
          approved?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          photos?: string[]
          price?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          stock?: number
          unit?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          language: string | null
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          language?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          language?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schemes: {
        Row: {
          active: boolean
          apply_url: string | null
          benefits: string | null
          category: string
          created_at: string
          description: string
          eligibility: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          apply_url?: string | null
          benefits?: string | null
          category: string
          created_at?: string
          description: string
          eligibility?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          apply_url?: string | null
          benefits?: string | null
          category?: string
          created_at?: string
          description?: string
          eligibility?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vet_doctors: {
        Row: {
          address: string | null
          available: boolean
          created_at: string
          district: string | null
          email: string | null
          google_maps_url: string | null
          hospital_name: string | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          phone: string
          qualification: string | null
          rating: number | null
          specialization: string | null
          status: string
          suggested_by: string | null
          total_ratings: number | null
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          available?: boolean
          created_at?: string
          district?: string | null
          email?: string | null
          google_maps_url?: string | null
          hospital_name?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          phone: string
          qualification?: string | null
          rating?: number | null
          specialization?: string | null
          status?: string
          suggested_by?: string | null
          total_ratings?: number | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          available?: boolean
          created_at?: string
          district?: string | null
          email?: string | null
          google_maps_url?: string | null
          hospital_name?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          phone?: string
          qualification?: string | null
          rating?: number | null
          specialization?: string | null
          status?: string
          suggested_by?: string | null
          total_ratings?: number | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      vet_profiles: {
        Row: {
          available: boolean
          bio: string | null
          consultation_fee: number | null
          created_at: string
          experience_years: number | null
          id: string
          license_number: string | null
          qualification: string | null
          specialization: string | null
          updated_at: string
          user_id: string
          verification_status: string
          vet_doctor_id: string | null
        }
        Insert: {
          available?: boolean
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          license_number?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          vet_doctor_id?: string | null
        }
        Update: {
          available?: boolean
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          license_number?: string | null
          qualification?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          vet_doctor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_profiles_vet_doctor_id_fkey"
            columns: ["vet_doctor_id"]
            isOneToOne: false
            referencedRelation: "vet_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review: string | null
          user_id: string
          vet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
          vet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_ratings_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vet_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_stock: {
        Args: { _product_id: string; _qty: number }
        Returns: boolean
      }
      get_display_names: {
        Args: { _ids: string[] }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      get_vet_contact: {
        Args: { _vet_id: string }
        Returns: {
          email: string
          phone: string
        }[]
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
      app_role: "admin" | "farmer" | "buyer" | "vet" | "mediator" | "industry"
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
      app_role: ["admin", "farmer", "buyer", "vet", "mediator", "industry"],
    },
  },
} as const
