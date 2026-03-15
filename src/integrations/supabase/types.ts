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
      admin_permissions: {
        Row: {
          admin_user_id: string
          can_approve_drivers: boolean
          can_delete_users: boolean
          can_issue_refunds: boolean
          can_view_revenue: boolean
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_user_id: string
          can_approve_drivers?: boolean
          can_delete_users?: boolean
          can_issue_refunds?: boolean
          can_view_revenue?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_user_id?: string
          can_approve_drivers?: boolean
          can_delete_users?: boolean
          can_issue_refunds?: boolean
          can_view_revenue?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          actor_id: string
          actor_role: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          target_role: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          target_role: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          target_role?: string
          title?: string
        }
        Relationships: []
      }
      driver_cancellations: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          reason: string
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          reason: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          reason?: string
          trip_id?: string | null
        }
        Relationships: []
      }
      driver_commitment_scores: {
        Row: {
          driver_id: string
          id: string
          score: number
          total_accepts: number
          total_cancels: number
          updated_at: string
        }
        Insert: {
          driver_id: string
          id?: string
          score?: number
          total_accepts?: number
          total_cancels?: number
          updated_at?: string
        }
        Update: {
          driver_id?: string
          id?: string
          score?: number
          total_accepts?: number
          total_cancels?: number
          updated_at?: string
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          created_at: string
          document_type: string
          driver_id: string
          expiry_date: string | null
          file_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          driver_id: string
          expiry_date?: string | null
          file_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          driver_id?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          driver_id: string
          heading: number | null
          id: string
          is_online: boolean
          latitude: number
          longitude: number
          speed: number | null
          updated_at: string
        }
        Insert: {
          driver_id: string
          heading?: number | null
          id?: string
          is_online?: boolean
          latitude: number
          longitude: number
          speed?: number | null
          updated_at?: string
        }
        Update: {
          driver_id?: string
          heading?: number | null
          id?: string
          is_online?: boolean
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_payouts: {
        Row: {
          amount: number
          commission: number
          created_at: string
          driver_id: string
          id: string
          net_amount: number
          ride_id: string | null
          status: string
        }
        Insert: {
          amount: number
          commission?: number
          created_at?: string
          driver_id: string
          id?: string
          net_amount: number
          ride_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          commission?: number
          created_at?: string
          driver_id?: string
          id?: string
          net_amount?: number
          ride_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payouts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          flag_key: string
          flag_label: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          flag_key: string
          flag_label?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          flag_key?: string
          flag_label?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      locked_fares: {
        Row: {
          category_id: string
          currency: string
          destination: string
          distance_km: number
          expires_at: string
          fare_amount: number
          id: string
          is_active: boolean
          locked_at: string
          pickup: string
          user_id: string
        }
        Insert: {
          category_id: string
          currency?: string
          destination: string
          distance_km: number
          expires_at?: string
          fare_amount: number
          id?: string
          is_active?: boolean
          locked_at?: string
          pickup: string
          user_id: string
        }
        Update: {
          category_id?: string
          currency?: string
          destination?: string
          distance_km?: number
          expires_at?: string
          fare_amount?: number
          id?: string
          is_active?: boolean
          locked_at?: string
          pickup?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_items: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          reporter_id: string
          status: string
          trip_date: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          reporter_id: string
          status?: string
          trip_date?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          reporter_id?: string
          status?: string
          trip_date?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          payer_id: string
          ride_id: string
          status: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          payer_id: string
          ride_id: string
          status?: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          payer_id?: string
          ride_id?: string
          status?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          managed_by: string | null
          mpesa_phone: string | null
          phone: string | null
          safety_terms_accepted_at: string | null
          subscription_plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          managed_by?: string | null
          mpesa_phone?: string | null
          phone?: string | null
          safety_terms_accepted_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          managed_by?: string | null
          mpesa_phone?: string | null
          phone?: string | null
          safety_terms_accepted_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_uses: number
          discount_amount: number
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          discount_amount?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          discount_amount?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_id: string
          rater_id: string
          rater_role: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id: string
          rater_id: string
          rater_role: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id?: string
          rater_id?: string
          rater_role?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_paid: boolean
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
          trips_completed: number
        }
        Insert: {
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
          trips_completed?: number
        }
        Update: {
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
          trips_completed?: number
        }
        Relationships: []
      }
      regional_fare_tiers: {
        Row: {
          base_fare_basic: number
          base_fare_boda: number
          base_fare_xtra: number
          created_at: string
          id: string
          is_active: boolean
          per_km_rate: number
          region_name: string
          region_type: string
          updated_at: string
        }
        Insert: {
          base_fare_basic?: number
          base_fare_boda?: number
          base_fare_xtra?: number
          created_at?: string
          id?: string
          is_active?: boolean
          per_km_rate?: number
          region_name: string
          region_type?: string
          updated_at?: string
        }
        Update: {
          base_fare_basic?: number
          base_fare_boda?: number
          base_fare_xtra?: number
          created_at?: string
          id?: string
          is_active?: boolean
          per_km_rate?: number
          region_name?: string
          region_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ride_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          ride_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ride_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ride_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_history_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          cancel_reason: string | null
          cancelled_by: string | null
          category: string
          completed_at: string | null
          created_at: string
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_fare: number
          final_fare: number | null
          id: string
          otp_code: string | null
          payment_method: string
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          rider_id: string
          started_at: string | null
          status: string
          surge_multiplier: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_fare?: number
          final_fare?: number | null
          id?: string
          otp_code?: string | null
          payment_method?: string
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_id: string
          started_at?: string | null
          status?: string
          surge_multiplier?: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_fare?: number
          final_fare?: number | null
          id?: string
          otp_code?: string | null
          payment_method?: string
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_id?: string
          started_at?: string | null
          status?: string
          surge_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          label?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_trips: {
        Row: {
          category_id: string
          created_at: string
          destination: string
          id: string
          pickup: string
          scheduled_at: string
          status: string
          stops: Json | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          destination: string
          id?: string
          pickup: string
          scheduled_at: string
          status?: string
          stops?: Json | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          destination?: string
          id?: string
          pickup?: string
          scheduled_at?: string
          status?: string
          stops?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      shared_trips: {
        Row: {
          created_at: string
          destination: string
          driver_name: string | null
          id: string
          is_active: boolean
          pickup: string
          plate: string | null
          share_token: string
          user_id: string
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          destination: string
          driver_name?: string | null
          id?: string
          is_active?: boolean
          pickup: string
          plate?: string | null
          share_token: string
          user_id: string
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          destination?: string
          driver_name?: string | null
          id?: string
          is_active?: boolean
          pickup?: string
          plate?: string | null
          share_token?: string
          user_id?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          created_at: string
          id: string
          location_text: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_role: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_role?: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_role?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      surge_rules: {
        Row: {
          created_at: string
          day_of_week: number[] | null
          end_hour: number
          id: string
          is_active: boolean
          multiplier: number
          region_name: string
          start_hour: number
        }
        Insert: {
          created_at?: string
          day_of_week?: number[] | null
          end_hour: number
          id?: string
          is_active?: boolean
          multiplier?: number
          region_name: string
          start_hour: number
        }
        Update: {
          created_at?: string
          day_of_week?: number[] | null
          end_hour?: number
          id?: string
          is_active?: boolean
          multiplier?: number
          region_name?: string
          start_hour?: number
        }
        Relationships: []
      }
      trusted_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
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
      vehicles: {
        Row: {
          category: string
          color: string
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          is_approved: boolean
          make: string
          model: string
          plate_number: string
          updated_at: string
          year: number
        }
        Insert: {
          category?: string
          color: string
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          make: string
          model: string
          plate_number: string
          updated_at?: string
          year: number
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          make?: string
          model?: string
          plate_number?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          city: string
          created_at: string
          id: string
          phone: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          phone: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          label: string
          phone: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number
          id?: string
          label: string
          phone?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          label?: string
          phone?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_referral_bonus: {
        Args: {
          _referral_id: string
          _referred_id: string
          _referrer_id: string
        }
        Returns: undefined
      }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "rider"
        | "driver"
        | "admin"
        | "manager"
        | "super_admin"
        | "operations_manager"
        | "support_agent"
        | "finance"
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
        "rider",
        "driver",
        "admin",
        "manager",
        "super_admin",
        "operations_manager",
        "support_agent",
        "finance",
      ],
    },
  },
} as const
