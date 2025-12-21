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
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          neighborhood: string
          number: string
          reference: string | null
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          number: string
          reference?: string | null
          state?: string
          street: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          number?: string
          reference?: string | null
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          order_number: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          order_number?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          order_number?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      api_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          environment: string | null
          id: string
          is_active: boolean | null
          name: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closing_amount: number | null
          created_at: string | null
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_amount: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string
          type: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method: string
          type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_preferences: {
        Row: {
          created_at: string | null
          id: string
          last_payment_method: string | null
          promo_notifications: boolean | null
          push_notifications: boolean | null
          save_payment_method: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_payment_method?: string | null
          promo_notifications?: boolean | null
          push_notifications?: boolean | null
          save_payment_method?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_payment_method?: string | null
          promo_notifications?: boolean | null
          push_notifications?: boolean | null
          save_payment_method?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          estimated_time: number | null
          fee: number | null
          id: string
          is_active: boolean | null
          min_order: number | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_time?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_time?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      establishment_settings: {
        Row: {
          accent_color: string | null
          address: string | null
          average_prep_time: number | null
          average_rating: number | null
          banner: string | null
          banner_text: string | null
          base_delivery_fee: number | null
          city: string | null
          created_at: string | null
          delivery_area: string | null
          delivery_fee: number | null
          description: string | null
          distance_fee_enabled: boolean | null
          establishment_latitude: number | null
          establishment_longitude: number | null
          estimated_delivery_time: number | null
          id: string
          is_delivery_enabled: boolean | null
          is_open: boolean | null
          logo: string | null
          max_delivery_radius: number | null
          min_distance_included: number | null
          min_order_value: number | null
          name: string
          neighborhood: string | null
          peak_time_adjustment: number | null
          phone: string | null
          price_per_km: number | null
          primary_color: string | null
          selected_theme: string | null
          show_banner: boolean | null
          state: string | null
          total_reviews: number | null
          updated_at: string | null
          use_banner_as_login_bg: boolean | null
          use_gradient: boolean | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          average_prep_time?: number | null
          average_rating?: number | null
          banner?: string | null
          banner_text?: string | null
          base_delivery_fee?: number | null
          city?: string | null
          created_at?: string | null
          delivery_area?: string | null
          delivery_fee?: number | null
          description?: string | null
          distance_fee_enabled?: boolean | null
          establishment_latitude?: number | null
          establishment_longitude?: number | null
          estimated_delivery_time?: number | null
          id?: string
          is_delivery_enabled?: boolean | null
          is_open?: boolean | null
          logo?: string | null
          max_delivery_radius?: number | null
          min_distance_included?: number | null
          min_order_value?: number | null
          name?: string
          neighborhood?: string | null
          peak_time_adjustment?: number | null
          phone?: string | null
          price_per_km?: number | null
          primary_color?: string | null
          selected_theme?: string | null
          show_banner?: boolean | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          use_banner_as_login_bg?: boolean | null
          use_gradient?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          average_prep_time?: number | null
          average_rating?: number | null
          banner?: string | null
          banner_text?: string | null
          base_delivery_fee?: number | null
          city?: string | null
          created_at?: string | null
          delivery_area?: string | null
          delivery_fee?: number | null
          description?: string | null
          distance_fee_enabled?: boolean | null
          establishment_latitude?: number | null
          establishment_longitude?: number | null
          estimated_delivery_time?: number | null
          id?: string
          is_delivery_enabled?: boolean | null
          is_open?: boolean | null
          logo?: string | null
          max_delivery_radius?: number | null
          min_distance_included?: number | null
          min_order_value?: number | null
          name?: string
          neighborhood?: string | null
          peak_time_adjustment?: number | null
          phone?: string | null
          price_per_km?: number | null
          primary_color?: string | null
          selected_theme?: string | null
          show_banner?: boolean | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          use_banner_as_login_bg?: boolean | null
          use_gradient?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_cost: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_cost: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_cost?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          minimum_redemption: number | null
          points_per_real: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_redemption?: number | null
          points_per_real?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_redemption?: number | null
          points_per_real?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          additions: string[] | null
          id: string
          notes: string | null
          order_id: string | null
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          additions?: string[] | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          additions?: string[] | null
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cash_register_id: string | null
          change_amount: number | null
          change_for: number | null
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string | null
          customer_address: string
          customer_id: string
          customer_latitude: number | null
          customer_longitude: number | null
          customer_name: string
          customer_phone: string
          delivery_fee: number | null
          id: string
          motoboy_id: string | null
          mp_checkout_url: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_qr_code: string | null
          needs_change: boolean | null
          notes: string | null
          order_number: number
          order_type: string | null
          payment_method: string
          payment_status: string | null
          status: string
          subtotal: number
          table_number: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cash_register_id?: string | null
          change_amount?: number | null
          change_for?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          customer_address: string
          customer_id: string
          customer_latitude?: number | null
          customer_longitude?: number | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number | null
          id?: string
          motoboy_id?: string | null
          mp_checkout_url?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_qr_code?: string | null
          needs_change?: boolean | null
          notes?: string | null
          order_number?: number
          order_type?: string | null
          payment_method: string
          payment_status?: string | null
          status?: string
          subtotal: number
          table_number?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cash_register_id?: string | null
          change_amount?: number | null
          change_for?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          customer_address?: string
          customer_id?: string
          customer_latitude?: number | null
          customer_longitude?: number | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number | null
          id?: string
          motoboy_id?: string | null
          mp_checkout_url?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_qr_code?: string | null
          needs_change?: boolean | null
          notes?: string | null
          order_number?: number
          order_type?: string | null
          payment_method?: string
          payment_status?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_change: number | null
          name: string
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_change?: number | null
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_change?: number | null
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          allow_pickup: boolean | null
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_available: boolean | null
          name: string
          preparation_time: number | null
          price: number
          sort_order: number | null
          tag: string | null
          updated_at: string | null
        }
        Insert: {
          allow_pickup?: boolean | null
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          sort_order?: number | null
          tag?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_pickup?: boolean | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          sort_order?: number | null
          tag?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sound_settings: {
        Row: {
          enabled: boolean | null
          id: string
          max_repeat_duration_seconds: number | null
          min_interval_seconds: number | null
          panel_type: string
          repeat_enabled: boolean | null
          repeat_interval_seconds: number | null
          sound_type: string | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          max_repeat_duration_seconds?: number | null
          min_interval_seconds?: number | null
          panel_type: string
          repeat_enabled?: boolean | null
          repeat_interval_seconds?: number | null
          sound_type?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          enabled?: boolean | null
          id?: string
          max_repeat_duration_seconds?: number | null
          min_interval_seconds?: number | null
          panel_type?: string
          repeat_enabled?: boolean | null
          repeat_interval_seconds?: number | null
          sound_type?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      app_role: "client" | "admin" | "kitchen" | "motoboy"
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
      app_role: ["client", "admin", "kitchen", "motoboy"],
    },
  },
} as const
