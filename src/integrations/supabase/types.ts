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
      admin_campuses: {
        Row: {
          campus_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campus_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          campus_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_campuses_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invites: {
        Row: {
          campus_id: string
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          campus_id: string
          code: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          campus_id?: string
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_requests: {
        Row: {
          city: string
          country: string
          created_at: string
          created_campus_id: string | null
          id: string
          name: string
          requester_user_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          created_campus_id?: string | null
          id?: string
          name: string
          requester_user_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          created_campus_id?: string | null
          id?: string
          name?: string
          requester_user_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_requests_created_campus_id_fkey"
            columns: ["created_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          name: string
          state: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          name: string
          state?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      carpool_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          passenger_id: string
          status: string
          travel_post_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          passenger_id: string
          status?: string
          travel_post_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          passenger_id?: string
          status?: string
          travel_post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_requests_travel_post_id_fkey"
            columns: ["travel_post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          owner_profile_id: string
          requester_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          owner_profile_id: string
          requester_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          owner_profile_id?: string
          requester_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      errand_photos: {
        Row: {
          created_at: string
          errand_id: string
          id: string
          path: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          errand_id: string
          id?: string
          path: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          errand_id?: string
          id?: string
          path?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "errand_photos_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errands"
            referencedColumns: ["id"]
          },
        ]
      }
      errands: {
        Row: {
          campus_id: string | null
          created_at: string
          description: string
          expires_at: string
          id: string
          price_cents: number | null
          requester_profile_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          created_at?: string
          description: string
          expires_at?: string
          id?: string
          price_cents?: number | null
          requester_profile_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          created_at?: string
          description?: string
          expires_at?: string
          id?: string
          price_cents?: number | null
          requester_profile_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "errands_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "errands_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_order_participants: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          participant_profile_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          participant_profile_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          participant_profile_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_order_participants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "group_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_order_participants_participant_profile_id_fkey"
            columns: ["participant_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_orders: {
        Row: {
          campus_id: string
          created_at: string
          creator_profile_id: string
          deadline_at: string | null
          description: string
          expires_at: string
          id: string
          order_for_at: string | null
          restaurant_name: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campus_id: string
          created_at?: string
          creator_profile_id: string
          deadline_at?: string | null
          description: string
          expires_at?: string
          id?: string
          order_for_at?: string | null
          restaurant_name?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campus_id?: string
          created_at?: string
          creator_profile_id?: string
          deadline_at?: string | null
          description?: string
          expires_at?: string
          id?: string
          order_for_at?: string | null
          restaurant_name?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_orders_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_orders_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_ticket_locations: {
        Row: {
          captured_at: string
          expires_at: string
          id: string
          lat: number
          lng: number
          ticket_id: string
        }
        Insert: {
          captured_at?: string
          expires_at?: string
          id?: string
          lat: number
          lng: number
          ticket_id: string
        }
        Update: {
          captured_at?: string
          expires_at?: string
          id?: string
          lat?: number
          lng?: number
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_ticket_locations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "help_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      help_tickets: {
        Row: {
          acknowledged_by: string | null
          campus_id: string
          category: Database["public"]["Enums"]["help_ticket_category"]
          created_at: string
          description: string
          id: string
          requester_user_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["help_ticket_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["help_ticket_urgency"]
        }
        Insert: {
          acknowledged_by?: string | null
          campus_id: string
          category: Database["public"]["Enums"]["help_ticket_category"]
          created_at?: string
          description: string
          id?: string
          requester_user_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["help_ticket_status"]
          updated_at?: string
          urgency: Database["public"]["Enums"]["help_ticket_urgency"]
        }
        Update: {
          acknowledged_by?: string | null
          campus_id?: string
          category?: Database["public"]["Enums"]["help_ticket_category"]
          created_at?: string
          description?: string
          id?: string
          requester_user_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["help_ticket_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["help_ticket_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "help_tickets_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_post_id: string | null
          related_ticket_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_post_id?: string | null
          related_ticket_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_post_id?: string | null
          related_ticket_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "travel_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "help_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          campus_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_verified: boolean
          trips_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          campus_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          trips_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          campus_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          trips_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_posts: {
        Row: {
          available_seats: number
          campus_id: string | null
          created_at: string
          departure_date: string
          departure_time: string
          driver_id: string
          from_location: string
          id: string
          notes: string | null
          price_cents: number | null
          status: string
          to_location: string
          total_seats: number
          transport_mode: string
          updated_at: string
        }
        Insert: {
          available_seats?: number
          campus_id?: string | null
          created_at?: string
          departure_date: string
          departure_time: string
          driver_id: string
          from_location: string
          id?: string
          notes?: string | null
          price_cents?: number | null
          status?: string
          to_location: string
          total_seats?: number
          transport_mode: string
          updated_at?: string
        }
        Update: {
          available_seats?: number
          campus_id?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string
          driver_id?: string
          from_location?: string
          id?: string
          notes?: string | null
          price_cents?: number | null
          status?: string
          to_location?: string
          total_seats?: number
          transport_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_posts_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_posts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Functions: {
      can_access_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      create_campus: {
        Args: {
          _city: string
          _country?: string
          _name: string
          _state?: string
        }
        Returns: string
      }
      current_user_campus_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_for_campus: {
        Args: { _campus_id: string; _user_id: string }
        Returns: boolean
      }
      is_requester_for_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_admin_invite: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "super_admin" | "admin"
      help_ticket_category:
        | "medical"
        | "safety"
        | "mental_health"
        | "lost_item"
        | "other"
      help_ticket_status: "open" | "acknowledged" | "in_progress" | "resolved"
      help_ticket_urgency: "low" | "medium" | "high" | "critical"
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
      app_role: ["super_admin", "admin"],
      help_ticket_category: [
        "medical",
        "safety",
        "mental_health",
        "lost_item",
        "other",
      ],
      help_ticket_status: ["open", "acknowledged", "in_progress", "resolved"],
      help_ticket_urgency: ["low", "medium", "high", "critical"],
    },
  },
} as const
