export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          email: string;
        };
        Insert: {
          email: string;
        };
        Update: {
          email?: string;
        };
        Relationships: [];
      };
      authors: {
        Row: {
          id: string;
          slug: string;
          name: string;
          role: string | null;
          bio: string | null;
          avatar_url: string | null;
          social: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          role?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          social?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          role?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          social?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          slug: string;
          label: string;
          description: string | null;
        };
        Insert: {
          slug: string;
          label: string;
          description?: string | null;
        };
        Update: {
          slug?: string;
          label?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      news_articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string;
          content: string;
          cover_image_url: string | null;
          category: Database['public']['Enums']['news_category'];
          status: Database['public']['Enums']['news_status'];
          reading_time_minutes: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          author_id: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary: string;
          content: string;
          cover_image_url?: string | null;
          category: Database['public']['Enums']['news_category'];
          status: Database['public']['Enums']['news_status'];
          reading_time_minutes?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          summary?: string;
          content?: string;
          cover_image_url?: string | null;
          category?: Database['public']['Enums']['news_category'];
          status?: Database['public']['Enums']['news_status'];
          reading_time_minutes?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id?: string;
        };
        Relationships: [];
      };
      news_article_tags: {
        Row: {
          article_id: string;
          tag_slug: string;
        };
        Insert: {
          article_id: string;
          tag_slug: string;
        };
        Update: {
          article_id?: string;
          tag_slug?: string;
        };
        Relationships: [];
      };
      monthly_reviews: {
        Row: {
          id: string;
          period: string;
          title: string;
          summary: string;
          cover_image_url: string | null;
          highlights: Json | null;
          metrics: Json | null;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          title: string;
          summary: string;
          cover_image_url?: string | null;
          highlights?: Json | null;
          metrics?: Json | null;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period?: string;
          title?: string;
          summary?: string;
          cover_image_url?: string | null;
          highlights?: Json | null;
          metrics?: Json | null;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_review_articles: {
        Row: {
          review_id: string;
          article_id: string;
          position: number;
        };
        Insert: {
          review_id: string;
          article_id: string;
          position?: number;
        };
        Update: {
          review_id?: string;
          article_id?: string;
          position?: number;
        };
        Relationships: [];
      };
      article_attestations: {
        Row: {
          id: string;
          article_id: string;
          version: number;
          content_hash: string;
          stellar_tx_hash: string | null;
          ledger: number | null;
          network: 'testnet' | 'mainnet';
          status: 'pending' | 'confirmed' | 'failed';
          previous_attestation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          version: number;
          content_hash: string;
          stellar_tx_hash?: string | null;
          ledger?: number | null;
          network: 'testnet' | 'mainnet';
          status: 'pending' | 'confirmed' | 'failed';
          previous_attestation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          version?: number;
          content_hash?: string;
          stellar_tx_hash?: string | null;
          ledger?: number | null;
          network?: 'testnet' | 'mainnet';
          status?: 'pending' | 'confirmed' | 'failed';
          previous_attestation_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      ecosystem_snapshots: {
        Row: {
          id: string;
          period: string;
          network: string;
          horizon_metrics: Json;
          soroban_metrics: Json;
          collected_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          network: string;
          horizon_metrics?: Json;
          soroban_metrics?: Json;
          collected_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ecosystem_snapshots']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      news_status: 'draft' | 'published' | 'archived';
      news_category: 'announcement' | 'product' | 'ecosystem' | 'engineering' | 'community';
    };
    CompositeTypes: Record<string, never>;
  };
}
