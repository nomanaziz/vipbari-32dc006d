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
      accounting_entries: {
        Row: {
          amount: number
          bill_id: string | null
          category: string
          created_at: string
          description: string
          entry_date: string
          id: string
          owner_id: string
          payment_id: string | null
          type: string
        }
        Insert: {
          amount?: number
          bill_id?: string | null
          category: string
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          owner_id: string
          payment_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          bill_id?: string | null
          category?: string
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          owner_id?: string
          payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          clicks: number
          created_at: string
          id: string
          image_url: string
          impressions: number
          is_active: boolean
          link_url: string
          placement: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          ad_type?: string
          clicks?: number
          created_at?: string
          id?: string
          image_url?: string
          impressions?: number
          is_active?: boolean
          link_url?: string
          placement?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          clicks?: number
          created_at?: string
          id?: string
          image_url?: string
          impressions?: number
          is_active?: boolean
          link_url?: string
          placement?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_issues: {
        Row: {
          asset_id: string
          created_at: string
          description: string | null
          id: string
          owner_id: string
          priority: string
          reported_by: string | null
          resolved_at: string | null
          status: string
          title: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_issues_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          amount: number
          asset_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          maintenance_date: string
          owner_id: string
          schedule_type: string
          status: string
        }
        Insert: {
          amount?: number
          asset_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          maintenance_date?: string
          owner_id: string
          schedule_type?: string
          status?: string
        }
        Update: {
          amount?: number
          asset_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          maintenance_date?: string
          owner_id?: string
          schedule_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          condition: string
          created_at: string
          document_url: string | null
          floor: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          owner_id: string
          property_id: string | null
          purchase_date: string | null
          room_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          condition?: string
          created_at?: string
          document_url?: string | null
          floor?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          owner_id: string
          property_id?: string | null
          purchase_date?: string | null
          room_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          document_url?: string | null
          floor?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          property_id?: string | null
          purchase_date?: string | null
          room_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          advance: number
          created_at: string
          due_date: string | null
          electricity_charge: number
          garage_charge: number
          gas_charge: number
          generator_charge: number
          id: string
          month: string
          other_charges: number
          owner_id: string
          received_amount: number
          rent_amount: number
          room_id: string
          security_charge: number
          service_charge: number
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string
          vat: number
          water_charge: number
          wifi_charge: number
        }
        Insert: {
          advance?: number
          created_at?: string
          due_date?: string | null
          electricity_charge?: number
          garage_charge?: number
          gas_charge?: number
          generator_charge?: number
          id?: string
          month: string
          other_charges?: number
          owner_id: string
          received_amount?: number
          rent_amount?: number
          room_id: string
          security_charge?: number
          service_charge?: number
          status?: string
          tenant_id: string
          total_amount?: number
          updated_at?: string
          vat?: number
          water_charge?: number
          wifi_charge?: number
        }
        Update: {
          advance?: number
          created_at?: string
          due_date?: string | null
          electricity_charge?: number
          garage_charge?: number
          gas_charge?: number
          generator_charge?: number
          id?: string
          month?: string
          other_charges?: number
          owner_id?: string
          received_amount?: number
          rent_amount?: number
          room_id?: string
          security_charge?: number
          service_charge?: number
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          vat?: number
          water_charge?: number
          wifi_charge?: number
        }
        Relationships: [
          {
            foreignKeyName: "bills_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_balances: {
        Row: {
          boost_type: string
          created_at: string
          id: string
          total_count: number
          used_count: number
          user_id: string
        }
        Insert: {
          boost_type?: string
          created_at?: string
          id?: string
          total_count?: number
          used_count?: number
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          id?: string
          total_count?: number
          used_count?: number
          user_id?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content_bn: string
          content_en: string
          created_at: string
          id: string
          is_published: boolean
          section: string
          slug: string
          sort_order: number
          title_bn: string
          title_en: string
          updated_at: string
        }
        Insert: {
          content_bn?: string
          content_en?: string
          created_at?: string
          id?: string
          is_published?: boolean
          section?: string
          slug: string
          sort_order?: number
          title_bn?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          content_bn?: string
          content_en?: string
          created_at?: string
          id?: string
          is_published?: boolean
          section?: string
          slug?: string
          sort_order?: number
          title_bn?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          owner_id: string
          priority: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          owner_id: string
          priority?: string
          status?: string
          tenant_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          priority?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          room_id: string | null
          tenant_user_id: string | null
          updated_at: string
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          room_id?: string | null
          tenant_user_id?: string | null
          updated_at?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          room_id?: string | null
          tenant_user_id?: string | null
          updated_at?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      garages: {
        Row: {
          assignment_type: string
          created_at: string
          description: string
          external_tenant_name: string | null
          external_tenant_phone: string | null
          garage_number: string
          garage_type: string
          id: string
          is_tolet: boolean
          owner_id: string
          property_id: string
          rent_amount: number
          room_id: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          created_at?: string
          description?: string
          external_tenant_name?: string | null
          external_tenant_phone?: string | null
          garage_number: string
          garage_type?: string
          id?: string
          is_tolet?: boolean
          owner_id: string
          property_id: string
          rent_amount?: number
          room_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          description?: string
          external_tenant_name?: string | null
          external_tenant_phone?: string | null
          garage_number?: string
          garage_type?: string
          id?: string
          is_tolet?: boolean
          owner_id?: string
          property_id?: string
          rent_amount?: number
          room_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          duration_days: number
          expires_at: string | null
          guest_name: string
          id: string
          notes: string | null
          phone: string
          qr_code: string | null
          status: string
          tenant_id: string
          verified_at: string | null
          verified_by: string | null
          visit_date: string
          visitor_type: string
        }
        Insert: {
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          phone?: string
          qr_code?: string | null
          status?: string
          tenant_id: string
          verified_at?: string | null
          verified_by?: string | null
          visit_date?: string
          visitor_type?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          phone?: string
          qr_code?: string | null
          status?: string
          tenant_id?: string
          verified_at?: string | null
          verified_by?: string | null
          visit_date?: string
          visitor_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_sections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          section_group: string
          section_key: string
          sort_order: number
          updated_at: string
          value_bn: string
          value_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          section_group?: string
          section_key: string
          sort_order?: number
          updated_at?: string
          value_bn?: string
          value_en?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          section_group?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
          value_bn?: string
          value_en?: string
        }
        Relationships: []
      }
      landlord_discounts: {
        Row: {
          applied_by: string
          created_at: string
          discount_percent: number
          discount_type: string
          id: string
          is_active: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_by: string
          created_at?: string
          discount_percent?: number
          discount_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_by?: string
          created_at?: string
          discount_percent?: number
          discount_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landlord_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          owner_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          owner_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          owner_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      leases: {
        Row: {
          advance_amount: number | null
          created_at: string | null
          end_date: string | null
          id: string
          monthly_rent: number | null
          notes: string | null
          notice_period: string | null
          owner_id: string
          property_id: string | null
          room_id: string | null
          security_deposit: number | null
          start_date: string | null
          status: string | null
          tenant_id: string | null
          tenant_name: string
          unit_flat: string | null
          updated_at: string | null
        }
        Insert: {
          advance_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          notes?: string | null
          notice_period?: string | null
          owner_id: string
          property_id?: string | null
          room_id?: string | null
          security_deposit?: number | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          tenant_name?: string
          unit_flat?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          notes?: string | null
          notice_period?: string | null
          owner_id?: string
          property_id?: string | null
          room_id?: string | null
          security_deposit?: number | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          tenant_name?: string
          unit_flat?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          billing_type: string
          created_at: string
          id: string
          last_reading: number | null
          meter_number: string
          meter_type: string
          owner_id: string
          room_id: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          billing_type?: string
          created_at?: string
          id?: string
          last_reading?: number | null
          meter_number: string
          meter_type?: string
          owner_id: string
          room_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          id?: string
          last_reading?: number | null
          meter_number?: string
          meter_type?: string
          owner_id?: string
          room_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string
          id: string
          owner_id: string
          target_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          owner_id: string
          target_id?: string | null
          target_type?: string
          title?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          target_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
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
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          bkash_number: string
          branch_name: string
          created_at: string
          id: string
          nagad_number: string
          owner_id: string
          routing_number: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          bank_name?: string
          bkash_number?: string
          branch_name?: string
          created_at?: string
          id?: string
          nagad_number?: string
          owner_id: string
          routing_number?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          bkash_number?: string
          branch_name?: string
          created_at?: string
          id?: string
          nagad_number?: string
          owner_id?: string
          routing_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          payment_date: string
          payment_method: string
          rejection_note: string | null
          status: string
          tenant_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          payment_date?: string
          payment_method?: string
          rejection_note?: string | null
          status?: string
          tenant_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          payment_date?: string
          payment_method?: string
          rejection_note?: string | null
          status?: string
          tenant_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          common_bathrooms: number
          common_kitchens: number
          common_stoves: number
          common_washrooms: number
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
          utilities_included: boolean
        }
        Insert: {
          address?: string
          area?: string
          block?: string
          common_bathrooms?: number
          common_kitchens?: number
          common_stoves?: number
          common_washrooms?: number
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
          utilities_included?: boolean
        }
        Update: {
          address?: string
          area?: string
          block?: string
          common_bathrooms?: number
          common_kitchens?: number
          common_stoves?: number
          common_washrooms?: number
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
          utilities_included?: boolean
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          property_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          property_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          property_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_staff: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          property_id: string
          staff_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          property_id: string
          staff_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          property_id?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_staff_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_transfers: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          include_tenants: boolean
          new_property_id: string | null
          property_id: string
          room_id: string | null
          source_listing_id: string | null
          status: string
          to_user_id: string
          transfer_scope: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          include_tenants?: boolean
          new_property_id?: string | null
          property_id: string
          room_id?: string | null
          source_listing_id?: string | null
          status?: string
          to_user_id: string
          transfer_scope?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          include_tenants?: boolean
          new_property_id?: string | null
          property_id?: string
          room_id?: string | null
          source_listing_id?: string | null
          status?: string
          to_user_id?: string
          transfer_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_transfers_new_property_id_fkey"
            columns: ["new_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transfers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transfers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transfers_source_listing_id_fkey"
            columns: ["source_listing_id"]
            isOneToOne: false
            referencedRelation: "sale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth?: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      room_boosts: {
        Row: {
          boost_type: string
          created_at: string
          expires_at: string
          id: string
          owner_id: string
          room_id: string
          starts_at: string
        }
        Insert: {
          boost_type?: string
          created_at?: string
          expires_at: string
          id?: string
          owner_id: string
          room_id: string
          starts_at?: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string
          room_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_boosts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          room_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          room_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          room_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
      salary_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          notes: string
          owner_id: string
          payment_date: string
          staff_assignment_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          notes?: string
          owner_id: string
          payment_date?: string
          staff_assignment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          notes?: string
          owner_id?: string
          payment_date?: string
          staff_assignment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_buy_requests: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_buy_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "sale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "sale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_favorites: {
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
            foreignKeyName: "sale_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "sale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_listing_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "sale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_listings: {
        Row: {
          area: string
          area_sqft: number
          bathrooms: number
          bedrooms: number
          contact_phone: string
          contact_whatsapp: string
          created_at: string
          description: string
          district: string
          division: string
          floor: number
          id: string
          location_address: string
          owner_id: string
          price: number
          property_id: string | null
          property_type: string
          room_id: string | null
          sale_scope: string
          sale_slot_used: boolean
          show_contact_phone: boolean
          status: string
          thana: string
          title: string
          transfer_status: string
          transferred_at: string | null
          updated_at: string
          views_count: number
        }
        Insert: {
          area?: string
          area_sqft?: number
          bathrooms?: number
          bedrooms?: number
          contact_phone?: string
          contact_whatsapp?: string
          created_at?: string
          description?: string
          district?: string
          division?: string
          floor?: number
          id?: string
          location_address?: string
          owner_id: string
          price?: number
          property_id?: string | null
          property_type?: string
          room_id?: string | null
          sale_scope?: string
          sale_slot_used?: boolean
          show_contact_phone?: boolean
          status?: string
          thana?: string
          title?: string
          transfer_status?: string
          transferred_at?: string | null
          updated_at?: string
          views_count?: number
        }
        Update: {
          area?: string
          area_sqft?: number
          bathrooms?: number
          bedrooms?: number
          contact_phone?: string
          contact_whatsapp?: string
          created_at?: string
          description?: string
          district?: string
          division?: string
          floor?: number
          id?: string
          location_address?: string
          owner_id?: string
          price?: number
          property_id?: string | null
          property_type?: string
          room_id?: string | null
          sale_scope?: string
          sale_slot_used?: boolean
          show_contact_phone?: boolean
          status?: string
          thana?: string
          title?: string
          transfer_status?: string
          transferred_at?: string | null
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_listings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sale_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_actions: {
        Row: {
          action_type: string
          cancelled_at: string | null
          created_at: string
          executed_at: string | null
          id: string
          owner_id: string
          remarks: string | null
          scheduled_date: string
          status: string
          tenant_id: string
        }
        Insert: {
          action_type?: string
          cancelled_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          owner_id: string
          remarks?: string | null
          scheduled_date: string
          status?: string
          tenant_id: string
        }
        Update: {
          action_type?: string
          cancelled_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          owner_id?: string
          remarks?: string | null
          scheduled_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_clock_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          service_id: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          service_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_clock_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_name: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          description: string | null
          id: string
          is_daily_help: boolean
          owner_id: string
          payment_frequency: string
          photo_url: string | null
          price: number
          property_id: string | null
          room_id: string | null
          service_type: string
          status: string
          updated_at: string
          website_link: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          description?: string | null
          id?: string
          is_daily_help?: boolean
          owner_id: string
          payment_frequency?: string
          photo_url?: string | null
          price?: number
          property_id?: string | null
          room_id?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          website_link?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          description?: string | null
          id?: string
          is_daily_help?: boolean
          owner_id?: string
          payment_frequency?: string
          photo_url?: string | null
          price?: number
          property_id?: string | null
          room_id?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          website_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sms_balances: {
        Row: {
          created_at: string
          id: string
          total_count: number
          used_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_count?: number
          used_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_count?: number
          used_count?: number
          user_id?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          landlord_id: string | null
          preset_id: string | null
          scope: string
          staff_type: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          landlord_id?: string | null
          preset_id?: string | null
          scope?: string
          staff_type?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          landlord_id?: string | null
          preset_id?: string | null
          scope?: string
          staff_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "permission_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_details: {
        Row: {
          created_at: string
          date_of_birth: string | null
          doc_type: string
          id: string
          joining_date: string | null
          nid_number: string
          permanent_address: string
          photo_url: string | null
          present_address: string
          salary: number
          staff_assignment_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          doc_type?: string
          id?: string
          joining_date?: string | null
          nid_number?: string
          permanent_address?: string
          photo_url?: string | null
          present_address?: string
          salary?: number
          staff_assignment_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          doc_type?: string
          id?: string
          joining_date?: string | null
          nid_number?: string
          permanent_address?: string
          photo_url?: string | null
          present_address?: string
          salary?: number
          staff_assignment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_details_staff_assignment_id_fkey"
            columns: ["staff_assignment_id"]
            isOneToOne: true
            referencedRelation: "staff_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          coupon_code: string | null
          created_at: string
          discount_percent: number
          duration_months: number
          id: string
          metadata: Json | null
          payment_method: string | null
          product_type: string
          room_count: number
          status: string
          tolet_count: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number
          duration_months?: number
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          product_type?: string
          room_count?: number
          status?: string
          tolet_count?: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number
          duration_months?: number
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          product_type?: string
          room_count?: number
          status?: string
          tolet_count?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tenant_edit_requests: {
        Row: {
          approve_by: string
          created_at: string
          field_changes: Json
          id: string
          requested_by: string
          resolved_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          approve_by: string
          created_at?: string
          field_changes?: Json
          id?: string
          requested_by: string
          resolved_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          approve_by?: string
          created_at?: string
          field_changes?: Json
          id?: string
          requested_by?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_edit_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          room_id: string | null
          status: string
          tenant_id: string
          tenant_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          room_id?: string | null
          status?: string
          tenant_id: string
          tenant_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          room_id?: string | null
          status?: string
          tenant_id?: string
          tenant_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          age: number | null
          created_at: string
          doc_url: string | null
          gender: string | null
          id: string
          name: string
          nid: string | null
          occupation: string | null
          phone: string | null
          photo_url: string | null
          relation: string
          status: string
          tenant_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          doc_url?: string | null
          gender?: string | null
          id?: string
          name: string
          nid?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          relation?: string
          status?: string
          tenant_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          doc_url?: string | null
          gender?: string | null
          id?: string
          name?: string
          nid?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          relation?: string
          status?: string
          tenant_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          advance_balance: number | null
          billing_type: string
          created_at: string
          current_landlord_name: string
          current_landlord_phone: string
          date_of_birth: string | null
          doc_back_url: string | null
          doc_front_url: string | null
          doc_number: string | null
          doc_type: string | null
          domestic_worker_address: string
          domestic_worker_name: string
          domestic_worker_nid: string
          domestic_worker_phone: string
          driver_address: string
          driver_name: string
          driver_nid: string
          driver_phone: string
          education: string
          email: string
          emergency_address: string
          emergency_contact: string | null
          emergency_name: string
          emergency_phone: string
          emergency_relation: string
          father_name: string
          full_name: string
          gender: string | null
          id: string
          last_meter_reading: number | null
          living_since: string
          marital_status: string
          meter_number: string | null
          move_in_date: string | null
          move_out_date: string | null
          nid: string | null
          occupation: string | null
          owner_id: string
          passport_number: string
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
          prev_landlord_address: string
          prev_landlord_name: string
          prev_landlord_phone: string
          prev_leave_reason: string
          release_notes: string | null
          release_reason: string | null
          released_at: string | null
          religion: string
          room_id: string | null
          secondary_phone: string | null
          status: string
          updated_at: string
          user_id: string | null
          workplace_address: string
        }
        Insert: {
          advance_balance?: number | null
          billing_type?: string
          created_at?: string
          current_landlord_name?: string
          current_landlord_phone?: string
          date_of_birth?: string | null
          doc_back_url?: string | null
          doc_front_url?: string | null
          doc_number?: string | null
          doc_type?: string | null
          domestic_worker_address?: string
          domestic_worker_name?: string
          domestic_worker_nid?: string
          domestic_worker_phone?: string
          driver_address?: string
          driver_name?: string
          driver_nid?: string
          driver_phone?: string
          education?: string
          email?: string
          emergency_address?: string
          emergency_contact?: string | null
          emergency_name?: string
          emergency_phone?: string
          emergency_relation?: string
          father_name?: string
          full_name: string
          gender?: string | null
          id?: string
          last_meter_reading?: number | null
          living_since?: string
          marital_status?: string
          meter_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          nid?: string | null
          occupation?: string | null
          owner_id: string
          passport_number?: string
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
          prev_landlord_address?: string
          prev_landlord_name?: string
          prev_landlord_phone?: string
          prev_leave_reason?: string
          release_notes?: string | null
          release_reason?: string | null
          released_at?: string | null
          religion?: string
          room_id?: string | null
          secondary_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workplace_address?: string
        }
        Update: {
          advance_balance?: number | null
          billing_type?: string
          created_at?: string
          current_landlord_name?: string
          current_landlord_phone?: string
          date_of_birth?: string | null
          doc_back_url?: string | null
          doc_front_url?: string | null
          doc_number?: string | null
          doc_type?: string | null
          domestic_worker_address?: string
          domestic_worker_name?: string
          domestic_worker_nid?: string
          domestic_worker_phone?: string
          driver_address?: string
          driver_name?: string
          driver_nid?: string
          driver_phone?: string
          education?: string
          email?: string
          emergency_address?: string
          emergency_contact?: string | null
          emergency_name?: string
          emergency_phone?: string
          emergency_relation?: string
          father_name?: string
          full_name?: string
          gender?: string | null
          id?: string
          last_meter_reading?: number | null
          living_since?: string
          marital_status?: string
          meter_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          nid?: string | null
          occupation?: string | null
          owner_id?: string
          passport_number?: string
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
          prev_landlord_address?: string
          prev_landlord_name?: string
          prev_landlord_phone?: string
          prev_leave_reason?: string
          release_notes?: string | null
          release_reason?: string | null
          released_at?: string | null
          religion?: string
          room_id?: string | null
          secondary_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workplace_address?: string
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
      tolet_requests: {
        Row: {
          created_at: string
          id: string
          landlord_user_id: string
          message: string | null
          room_id: string
          status: string
          tenant_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_user_id: string
          message?: string | null
          room_id: string
          status?: string
          tenant_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_user_id?: string
          message?: string | null
          room_id?: string
          status?: string
          tenant_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tolet_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          category: string
          created_at: string
          description_bn: string
          description_en: string
          id: string
          is_published: boolean
          sort_order: number
          thumbnail_url: string
          title_bn: string
          title_en: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_bn?: string
          description_en?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          thumbnail_url?: string
          title_bn?: string
          title_en?: string
          updated_at?: string
          youtube_url?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_bn?: string
          description_en?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          thumbnail_url?: string
          title_bn?: string
          title_en?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
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
      user_subscriptions: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_percent: number
          duration_months: number
          expires_at: string | null
          id: string
          plan_id: string
          product_type: string
          room_count: number
          sale_listing_count: number
          starts_at: string
          status: string
          tolet_count: number
          tolet_price_per_unit: number
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number
          duration_months?: number
          expires_at?: string | null
          id?: string
          plan_id: string
          product_type?: string
          room_count?: number
          sale_listing_count?: number
          starts_at?: string
          status?: string
          tolet_count?: number
          tolet_price_per_unit?: number
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number
          duration_months?: number
          expires_at?: string | null
          id?: string
          plan_id?: string
          product_type?: string
          room_count?: number
          sale_listing_count?: number
          starts_at?: string
          status?: string
          tolet_count?: number
          tolet_price_per_unit?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_current_tenant_notice_context: {
        Args: never
        Returns: {
          fallback_owner_id: string
          linked_owner_id: string
          property_id: string
          tenant_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
