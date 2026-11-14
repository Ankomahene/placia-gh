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
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      area_mentions: {
        Row: {
          district_id: number | null
          id: number
          lat: number
          lon: number
          name: string
          places: number
          refreshed_at: string
        }
        Insert: {
          district_id?: number | null
          id?: never
          lat: number
          lon: number
          name: string
          places: number
          refreshed_at?: string
        }
        Update: {
          district_id?: number | null
          id?: never
          lat?: number
          lon?: number
          name?: string
          places?: number
          refreshed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_mentions_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          icon: string | null
          id: number
          name: string
          parent_id: number | null
          slug: string
          sort_order: number
          synonyms: string[]
        }
        Insert: {
          icon?: string | null
          id?: never
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number
          synonyms?: string[]
        }
        Update: {
          icon?: string | null
          id?: never
          name?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number
          synonyms?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          ai_review: Json | null
          created_at: string
          id: string
          kind: string
          payload: Json
          place_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_review?: Json | null
          created_at?: string
          id?: string
          kind: string
          payload: Json
          place_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_review?: Json | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          place_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          boundary: unknown
          centroid: unknown
          id: number
          name: string
          region_id: number
          slug: string
        }
        Insert: {
          boundary?: unknown
          centroid?: unknown
          id?: never
          name: string
          region_id: number
          slug: string
        }
        Update: {
          boundary?: unknown
          centroid?: unknown
          id?: never
          name?: string
          region_id?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          config: Json
          created_at: string
          git_sha: string | null
          id: number
          metrics: Json
          notes: string | null
          suite: string
        }
        Insert: {
          config?: Json
          created_at?: string
          git_sha?: string | null
          id?: never
          metrics: Json
          notes?: string | null
          suite: string
        }
        Update: {
          config?: Json
          created_at?: string
          git_sha?: string | null
          id?: never
          metrics?: Json
          notes?: string | null
          suite?: string
        }
        Relationships: []
      }
      ingest_runs: {
        Row: {
          finished_at: string | null
          id: number
          source_versions: Json
          started_at: string
          stats: Json
          status: string
        }
        Insert: {
          finished_at?: string | null
          id?: never
          source_versions?: Json
          started_at: string
          stats?: Json
          status?: string
        }
        Update: {
          finished_at?: string | null
          id?: never
          source_versions?: Json
          started_at?: string
          stats?: Json
          status?: string
        }
        Relationships: []
      }
      localities: {
        Row: {
          alt_names: string[]
          district_id: number | null
          id: number
          kind: string
          location: unknown
          name: string
          population: number | null
          region_id: number | null
          source: string
          source_id: string
        }
        Insert: {
          alt_names?: string[]
          district_id?: number | null
          id?: never
          kind: string
          location: unknown
          name: string
          population?: number | null
          region_id?: number | null
          source: string
          source_id: string
        }
        Update: {
          alt_names?: string[]
          district_id?: number | null
          id?: never
          kind?: string
          location?: unknown
          name?: string
          population?: number | null
          region_id?: number | null
          source?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "localities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "localities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      place_acronyms: {
        Row: {
          acronym: string
          expansion: string
          explicit: boolean
          phrase: string
          places: number
          refreshed_at: string
          refs: number
          score: number
        }
        Insert: {
          acronym: string
          expansion: string
          explicit: boolean
          phrase: string
          places: number
          refreshed_at?: string
          refs: number
          score: number
        }
        Update: {
          acronym?: string
          expansion?: string
          explicit?: boolean
          phrase?: string
          places?: number
          refreshed_at?: string
          refs?: number
          score?: number
        }
        Relationships: []
      }
      place_embeddings: {
        Row: {
          embedded_at: string
          embedding: unknown
          place_id: string
        }
        Insert: {
          embedded_at?: string
          embedding: unknown
          place_id: string
        }
        Update: {
          embedded_at?: string
          embedding?: unknown
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_embeddings_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: true
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_photos: {
        Row: {
          cloudinary_public_id: string
          created_at: string
          height: number | null
          id: string
          place_id: string
          status: string
          user_id: string | null
          width: number | null
        }
        Insert: {
          cloudinary_public_id: string
          created_at?: string
          height?: number | null
          id?: string
          place_id: string
          status?: string
          user_id?: string | null
          width?: number | null
        }
        Update: {
          cloudinary_public_id?: string
          created_at?: string
          height?: number | null
          id?: string
          place_id?: string
          status?: string
          user_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "place_photos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_sources: {
        Row: {
          category_raw: string | null
          fetched_at: string
          fields: Json
          id: number
          location: unknown
          match_score: number | null
          name: string
          place_id: string | null
          source: string
          source_confidence: number | null
          source_id: string
        }
        Insert: {
          category_raw?: string | null
          fetched_at?: string
          fields?: Json
          id?: never
          location: unknown
          match_score?: number | null
          name: string
          place_id?: string | null
          source: string
          source_confidence?: number | null
          source_id: string
        }
        Update: {
          category_raw?: string | null
          fetched_at?: string
          fields?: Json
          id?: never
          location?: unknown
          match_score?: number | null
          name?: string
          place_id?: string | null
          source?: string
          source_confidence?: number | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_sources_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          alt_names: string[]
          attributes: Json
          category_id: number | null
          confidence: number
          cover_photo_id: string | null
          created_at: string
          description: string | null
          district_id: number | null
          email: string | null
          id: string
          locality_id: number | null
          location: unknown
          name: string
          opening_hours: Json | null
          phone: string | null
          photo_count: number
          price_level: number | null
          region_id: number | null
          search_tsv: unknown
          slug: string
          socials: Json
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          alt_names?: string[]
          attributes?: Json
          category_id?: number | null
          confidence?: number
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          district_id?: number | null
          email?: string | null
          id?: string
          locality_id?: number | null
          location: unknown
          name: string
          opening_hours?: Json | null
          phone?: string | null
          photo_count?: number
          price_level?: number | null
          region_id?: number | null
          search_tsv?: unknown
          slug: string
          socials?: Json
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          alt_names?: string[]
          attributes?: Json
          category_id?: number | null
          confidence?: number
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          district_id?: number | null
          email?: string | null
          id?: string
          locality_id?: number | null
          location?: unknown
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          photo_count?: number
          price_level?: number | null
          region_id?: number | null
          search_tsv?: unknown
          slug?: string
          socials?: Json
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          trust_score: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          trust_score?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          trust_score?: number
        }
        Relationships: []
      }
      regions: {
        Row: {
          boundary: unknown
          capital: string | null
          centroid: unknown
          id: number
          name: string
          slug: string
        }
        Insert: {
          boundary?: unknown
          capital?: string | null
          centroid?: unknown
          id?: never
          name: string
          slug: string
        }
        Update: {
          boundary?: unknown
          capital?: string | null
          centroid?: unknown
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      search_events: {
        Row: {
          ai_latency_ms: number | null
          coarse_location: unknown
          created_at: string
          error: string | null
          id: number
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          parse_path: string | null
          parsed: Json | null
          provider: string | null
          query: string
          result_count: number | null
          session_id: string | null
          top_place_ids: string[] | null
          total_latency_ms: number | null
        }
        Insert: {
          ai_latency_ms?: number | null
          coarse_location?: unknown
          created_at?: string
          error?: string | null
          id?: never
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          parse_path?: string | null
          parsed?: Json | null
          provider?: string | null
          query: string
          result_count?: number | null
          session_id?: string | null
          top_place_ids?: string[] | null
          total_latency_ms?: number | null
        }
        Update: {
          ai_latency_ms?: number | null
          coarse_location?: unknown
          created_at?: string
          error?: string | null
          id?: never
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          parse_path?: string | null
          parsed?: Json | null
          provider?: string | null
          query?: string
          result_count?: number | null
          session_id?: string | null
          top_place_ids?: string[] | null
          total_latency_ms?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acronym_variants: { Args: { p_words: string[] }; Returns: string[] }
      admin_data_quality: { Args: never; Returns: Json }
      admin_overview: { Args: never; Returns: Json }
      embedding_queue: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          input: string
        }[]
      }
      ingest_prune: { Args: { p_since: string }; Returns: Json }
      ingest_slugs: { Args: never; Returns: Json }
      normalize_text: { Args: { t: string }; Returns: string }
      ping: { Args: never; Returns: string }
      place_embedding_input: { Args: { p_id: string }; Returns: string }
      refresh_area_mentions: { Args: never; Returns: number }
      refresh_place_acronyms: { Args: never; Returns: number }
      search_context: { Args: never; Returns: Json }
      search_places: {
        Args: {
          p_categories?: number[]
          p_district_id?: number
          p_embedding?: unknown
          p_lat?: number
          p_limit?: number
          p_lon?: number
          p_offset?: number
          p_radius_m?: number
          p_region_id?: number
          p_text?: string
          p_weights?: Json
        }
        Returns: {
          address: string
          arms: Json
          category: string
          confidence: number
          distance_m: number
          district: string
          id: string
          lat: number
          locality: string
          lon: number
          name: string
          opening_hours: Json
          score: number
          slug: string
        }[]
      }
      set_embeddings: {
        Args: { p_ids: string[]; p_vectors: string[] }
        Returns: number
      }
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
