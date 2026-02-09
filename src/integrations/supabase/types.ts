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
      ai_insights: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          insight_type: string
          metadata: Json | null
          player_id: string | null
          report_id: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          insight_type: string
          metadata?: Json | null
          player_id?: string | null
          report_id?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          metadata?: Json | null
          player_id?: string | null
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "scouting_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          show_default_branding: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_default_branding?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_default_branding?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_attribute_weights: {
        Row: {
          created_at: string
          id: string
          mental_weight: number
          physical_weight: number
          position: string
          tactical_weight: number
          technical_weight: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mental_weight?: number
          physical_weight?: number
          position: string
          tactical_weight?: number
          technical_weight?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mental_weight?: number
          physical_weight?: number
          position?: string
          tactical_weight?: number
          technical_weight?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_development_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          note_type: string
          player_id: string
          rating_snapshot: number | null
          scout_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          note_type?: string
          player_id: string
          rating_snapshot?: number | null
          scout_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          note_type?: string
          player_id?: string
          rating_snapshot?: number | null
          scout_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_development_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          current_club: string | null
          date_of_birth: string | null
          full_name: string
          height_cm: number | null
          id: string
          nationality: string | null
          notes: string | null
          photo_url: string | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_foot: string | null
          scout_id: string
          secondary_position:
            | Database["public"]["Enums"]["player_position"]
            | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          current_club?: string | null
          date_of_birth?: string | null
          full_name: string
          height_cm?: number | null
          id?: string
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_foot?: string | null
          scout_id: string
          secondary_position?:
            | Database["public"]["Enums"]["player_position"]
            | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          current_club?: string | null
          date_of_birth?: string | null
          full_name?: string
          height_cm?: number | null
          id?: string
          nationality?: string | null
          notes?: string | null
          photo_url?: string | null
          position?: Database["public"]["Enums"]["player_position"]
          preferred_foot?: string | null
          scout_id?: string
          secondary_position?:
            | Database["public"]["Enums"]["player_position"]
            | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          gdpr_consent: boolean
          gdpr_consent_date: string | null
          id: string
          organization: string | null
          photo_url: string | null
          subscription_started_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          team_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          id: string
          organization?: string | null
          photo_url?: string | null
          subscription_started_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          team_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          id?: string
          organization?: string | null
          photo_url?: string | null
          subscription_started_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          team_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          tier_upgrade: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tier_upgrade?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          tier_upgrade?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          name: string
          query: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          query: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          query?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scouting_reports: {
        Row: {
          competition_level: Database["public"]["Enums"]["competition_level"]
          created_at: string
          id: string
          is_draft: boolean | null
          is_private: boolean
          match_date: string
          match_details: string | null
          mental_aggression: number | null
          mental_composure: number | null
          mental_concentration: number | null
          mental_leadership: number | null
          mental_work_rate: number | null
          minutes_observed: number | null
          opposition: string | null
          overall_rating: number | null
          physical_agility: number | null
          physical_balance: number | null
          physical_pace: number | null
          physical_stamina: number | null
          physical_strength: number | null
          player_id: string
          potential_rating: number | null
          recommendation: string | null
          scout_id: string
          strengths: string | null
          tactical_awareness: number | null
          tactical_decision_making: number | null
          tactical_defensive_contribution: number | null
          tactical_off_ball_movement: number | null
          tactical_positioning: number | null
          technical_crossing: number | null
          technical_dribbling: number | null
          technical_first_touch: number | null
          technical_heading: number | null
          technical_passing: number | null
          technical_shooting: number | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          competition_level: Database["public"]["Enums"]["competition_level"]
          created_at?: string
          id?: string
          is_draft?: boolean | null
          is_private?: boolean
          match_date: string
          match_details?: string | null
          mental_aggression?: number | null
          mental_composure?: number | null
          mental_concentration?: number | null
          mental_leadership?: number | null
          mental_work_rate?: number | null
          minutes_observed?: number | null
          opposition?: string | null
          overall_rating?: number | null
          physical_agility?: number | null
          physical_balance?: number | null
          physical_pace?: number | null
          physical_stamina?: number | null
          physical_strength?: number | null
          player_id: string
          potential_rating?: number | null
          recommendation?: string | null
          scout_id: string
          strengths?: string | null
          tactical_awareness?: number | null
          tactical_decision_making?: number | null
          tactical_defensive_contribution?: number | null
          tactical_off_ball_movement?: number | null
          tactical_positioning?: number | null
          technical_crossing?: number | null
          technical_dribbling?: number | null
          technical_first_touch?: number | null
          technical_heading?: number | null
          technical_passing?: number | null
          technical_shooting?: number | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          competition_level?: Database["public"]["Enums"]["competition_level"]
          created_at?: string
          id?: string
          is_draft?: boolean | null
          is_private?: boolean
          match_date?: string
          match_details?: string | null
          mental_aggression?: number | null
          mental_composure?: number | null
          mental_concentration?: number | null
          mental_leadership?: number | null
          mental_work_rate?: number | null
          minutes_observed?: number | null
          opposition?: string | null
          overall_rating?: number | null
          physical_agility?: number | null
          physical_balance?: number | null
          physical_pace?: number | null
          physical_stamina?: number | null
          physical_strength?: number | null
          player_id?: string
          potential_rating?: number | null
          recommendation?: string | null
          scout_id?: string
          strengths?: string | null
          tactical_awareness?: number | null
          tactical_decision_making?: number | null
          tactical_defensive_contribution?: number | null
          tactical_off_ball_movement?: number | null
          tactical_positioning?: number | null
          technical_crossing?: number | null
          technical_dribbling?: number | null
          technical_first_touch?: number | null
          technical_heading?: number | null
          technical_passing?: number | null
          technical_shooting?: number | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scouting_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      video_clips: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          report_id: string
          thumbnail_url: string | null
          timestamp_end: number | null
          timestamp_start: number | null
          title: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          report_id: string
          thumbnail_url?: string | null
          timestamp_end?: number | null
          timestamp_start?: number | null
          title: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          report_id?: string
          thumbnail_url?: string | null
          timestamp_end?: number | null
          timestamp_start?: number | null
          title?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_clips_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "scouting_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_players: {
        Row: {
          added_at: string
          id: string
          notes: string | null
          player_id: string
          priority: number | null
          watchlist_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          notes?: string | null
          player_id: string
          priority?: number | null
          watchlist_id: string
        }
        Update: {
          added_at?: string
          id?: string
          notes?: string | null
          player_id?: string
          priority?: number | null
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_players_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      can_create_player: { Args: { _user_id: string }; Returns: boolean }
      can_create_report: { Args: { _user_id: string }; Returns: boolean }
      cancel_subscription: { Args: { _user_id: string }; Returns: boolean }
      get_comparison_limit: { Args: { _user_id: string }; Returns: number }
      get_monthly_report_count: { Args: { _user_id: string }; Returns: number }
      get_player_count: { Args: { _user_id: string }; Returns: number }
      get_subscription_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_in_trial: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_promo_code:
        | { Args: { _code: string; _user_id: string }; Returns: Json }
        | { Args: { _code: string; _user_id: string }; Returns: Json }
      start_pro_trial: { Args: { _user_id: string }; Returns: boolean }
      upgrade_subscription: {
        Args: {
          _tier: Database["public"]["Enums"]["subscription_tier"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_promo_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "scout" | "admin"
      competition_level:
        | "amateur"
        | "semi_pro"
        | "professional"
        | "youth_academy"
        | "international"
      player_position:
        | "goalkeeper"
        | "centre_back"
        | "full_back"
        | "defensive_midfielder"
        | "central_midfielder"
        | "attacking_midfielder"
        | "winger"
        | "striker"
      subscription_tier: "free" | "pro" | "team" | "agency"
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
      app_role: ["scout", "admin"],
      competition_level: [
        "amateur",
        "semi_pro",
        "professional",
        "youth_academy",
        "international",
      ],
      player_position: [
        "goalkeeper",
        "centre_back",
        "full_back",
        "defensive_midfielder",
        "central_midfielder",
        "attacking_midfielder",
        "winger",
        "striker",
      ],
      subscription_tier: ["free", "pro", "team", "agency"],
    },
  },
} as const
