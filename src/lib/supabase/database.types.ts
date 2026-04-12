/**
 * Supabase schema types.
 *
 * Mirrors `supabase/migrations/0001_initial_schema.sql` 1:1.
 * When the schema changes, regenerate with:
 *   npx supabase gen types typescript --project-id <id> --schema public
 * …and overwrite this file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
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
        Update: Partial<Database['public']['Tables']['authors']['Insert']>;
        Relationships: [];
      };

      tags: {
        Row: {
          slug: string;
          label: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          slug: string;
          label: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
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
          author_id: string;
          reading_time_minutes: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary: string;
          content: string;
          cover_image_url?: string | null;
          category: Database['public']['Enums']['news_category'];
          status?: Database['public']['Enums']['news_status'];
          author_id: string;
          reading_time_minutes?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['news_articles']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'news_articles_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'authors';
            referencedColumns: ['id'];
          },
        ];
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
        Update: Partial<
          Database['public']['Tables']['news_article_tags']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'news_article_tags_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'news_article_tags_tag_slug_fkey';
            columns: ['tag_slug'];
            referencedRelation: 'tags';
            referencedColumns: ['slug'];
          },
        ];
      };

      monthly_reviews: {
        Row: {
          id: string;
          period: string;
          title: string;
          summary: string;
          cover_image_url: string | null;
          highlights: Json;
          metrics: Json;
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
          highlights?: Json;
          metrics?: Json;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['monthly_reviews']['Insert']
        >;
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
        Update: Partial<
          Database['public']['Tables']['monthly_review_articles']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'monthly_review_articles_review_id_fkey';
            columns: ['review_id'];
            referencedRelation: 'monthly_reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_review_articles_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: { [_ in never]: never };

    Functions: { [_ in never]: never };

    Enums: {
      news_category:
        | 'announcement'
        | 'product'
        | 'ecosystem'
        | 'engineering'
        | 'community';
      news_status: 'draft' | 'published' | 'archived';
    };

    CompositeTypes: { [_ in never]: never };
  };
}
