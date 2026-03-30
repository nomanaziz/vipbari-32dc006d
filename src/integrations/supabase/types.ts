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
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_presets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          permissions: Json
          scope: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          permissions?: Json
          scope?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          permissions?: Json
          scope?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_tolet: boolean
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          is_verified: boolean
          language: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_tolet?: boolean
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          language?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_tolet?: boolean
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          language?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          area: string
          block: string
          created_at: string
          district: string
          division: string
          has_cctv: boolean
          has_dish: boolean
          has_garage: boolean
          has_gas_supply: boolean
          has_generator: boolean
          has_internet: boolean
          has_lift: boolean
          has_parking: boolean
          has_rooftop_access: boolean
          has_security: boolean
          has_water_supply: boolean
          house_number: string
          id: string
          map_url: string | null
          name: string
          nearest_electricity_office: string
          nearest_fire_service: string
          nearest_police_station: string
          owner_id: string
          postal_code: string
          property_type: string
          road_number: string
          sector: string
          thana: string
          tolet_phone: string
          total_rooms: number
          updated_at: string
        }
        Insert: {
          address?: string
          area?: string
          block?: string
          created_at?: string
          district?: string
          division?: string
          has_cctv?: boolean
          has_dish?: boolean
          has_garage?: boolean
          has_gas_supply?: boolean
          has_generator?: boolean
          has_internet?: boolean
          has_lift?: boolean
          has_parking?: boolean
          has_rooftop_access?: boolean
          has_security?: boolean
          has_water_supply?: boolean
          house_number?: string
          id?: string
          map_url?: string | null
          name: string
          nearest_electricity_office?: string
          nearest_fire_service?: string
          nearest_police_station?: string
          owner_id: string
          postal_code?: string
          property_type?: string
          road_number?: string
          sector?: string
          thana?: string
          tolet_phone?: string
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          address?: string
          area?: string
          block?: string
          created_at?: string
          district?: string
          division?: string
          has_cctv?: boolean
          has_dish?: boolean
          has_garage?: boolean
          has_gas_supply?: boolean
          has_generator?: boolean
          has_internet?: boolean
          has_lift?: boolean
          has_parking?: boolean
          has_rooftop_access?: boolean
          has_security?: boolean
          has_water_supply?: boolean
          house_number?: string
          id?: string
          map_url?: string | null
          name?: string
          nearest_electricity_office?: string
          nearest_fire_service?: string
          nearest_police_station?: string
          owner_id?: string
          postal_code?: string
          property_type?: string
          road_number?: string
          sector?: string
          thana?: string
          tolet_phone?: string
          total_rooms?: number
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          area_sqft: number
          available_from: string | null
          balconies: number
          bathrooms: number
          bedrooms: number
          created_at: string
          description: string
          floor: number
          has_dining_room: boolean
          has_drawing_room: boolean
          has_kitchen: boolean
          has_roof_access: boolean
          id: string
          is_tolet: boolean
          property_id: string
          rent_amount: number
          room_number: string
          room_type: string
          status: string
          tenant_id: string | null
          tolet_slot_used: boolean | null
          updated_at: string
        }
        Insert: {
          area_sqft?: number
          available_from?: string | null
          balconies?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          description?: string
          floor?: number
          has_dining_room?: boolean
          has_drawing_room?: boolean
          has_kitchen?: boolean
          has_roof_access?: boolean
          id?: string
          is_tolet?: boolean
          property_id: string
          rent_amount?: number
          room_number: string
          room_type?: string
          status?: string
          tenant_id?: string | null
          tolet_slot_used?: boolean | null
          updated_at?: string
        }
        Update: {
          area_sqft?: number
          available_from?: string | null
          balconies?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          description?: string
          floor?: number
          has_dining_room?: boolean
          has_drawing_room?: boolean
          has_kitchen?: boolean
          has_roof_access?: boolean
          id?: string
          is_tolet?: boolean
          property_id?: string
          rent_amount?: number
          room_number?: string
          room_type?: string
          status?: string
          tenant_id?: string | null
          tolet_slot_used?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description_bn: string
          description_en: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name_bn: string
          name_en: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_bn?: string
          description_en?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name_bn?: string
          name_en?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_bn?: string
          description_en?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name_bn?: string
          name_en?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          advance_balance: number | null
          billing_type: string
          created_at: string
          date_of_birth: string | null
          doc_back_url: string | null
          doc_front_url: string | null
          doc_number: string | null
          doc_type: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          id: string
          last_meter_reading: number | null
          meter_number: string | null
          move_in_date: string | null
          move_out_date: string | null
          nid: string | null
          occupation: string | null
          owner_id: string
          permanent_address: string | null
          permanent_district: string | null
          permanent_division: string | null
          permanent_thana: string | null
          permanent_village: string | null
          phone: string
          photo_url: string | null
          present_address: string | null
          present_district: string | null
          present_division: string | null
          present_thana: string | null
          present_village: string | null
          room_id: string | null
          secondary_phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          advance_balance?: number | null
          billing_type?: string
          created_at?: string
          date_of_birth?: string | null
          doc_back_url?: string | null
          doc_front_url?: string | null
          doc_number?: string | null
          doc_type?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_meter_reading?: number | null
          meter_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          nid?: string | null
          occupation?: string | null
          owner_id: string
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_division?: string | null
          permanent_thana?: string | null
          permanent_village?: string | null
          phone: string
          photo_url?: string | null
          present_address?: string | null
          present_district?: string | null
          present_division?: string | null
          present_thana?: string | null
          present_village?: string | null
          room_id?: string | null
          secondary_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          advance_balance?: number | null
          billing_type?: string
          created_at?: string
          date_of_birth?: string | null
          doc_back_url?: string | null
          doc_front_url?: string | null
          doc_number?: string | null
          doc_type?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_meter_reading?: number | null
          meter_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          nid?: string | null
          occupation?: string | null
          owner_id?: string
          permanent_address?: string | null
          permanent_district?: string | null
          permanent_division?: string | null
          permanent_thana?: string | null
          permanent_village?: string | null
          phone?: string
          photo_url?: string | null
          present_address?: string | null
          present_district?: string | null
          present_division?: string | null
          present_thana?: string | null
          present_village?: string | null
          room_id?: string | null
          secondary_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role:
        | "landlord"
        | "tenant"
        | "staff"
        | "admin"
        | "employee"
        | "landlord_staff"
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
      app_role: [
        "landlord",
        "tenant",
        "staff",
        "admin",
        "employee",
        "landlord_staff",
      ],
    },
  },
} as const
