/**
 * Supabase schema types.
 *
 * Mirrors `supabase/migrations/` 1:1.
 * When the schema changes, regenerate with:
 *   npx supabase gen types typescript --project-id <id> --schema public
 * …and overwrite this file.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      monitored_accounts: {
        Row: {
          id: string;
          stellar_address: string;
          label: string;
          account_type: string;
          monitor_events: string[];
          active: boolean;
          last_cursor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stellar_address: string;
          label: string;
          account_type: string;
          monitor_events?: string[];
          active?: boolean;
          last_cursor?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stellar_address?: string;
          label?: string;
          account_type?: string;
          monitor_events?: string[];
          active?: boolean;
          last_cursor?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          account_id: string;
          source_account: string;
          event_type: string;
          significance: string;
          raw_data: Json;
          summary: string | null;
          processed: boolean;
          draft_article_id: string | null;
          detected_at: string;
          tx_hash: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          source_account: string;
          event_type: string;
          significance: string;
          raw_data?: Json;
          summary?: string | null;
          processed?: boolean;
          draft_article_id?: string | null;
          detected_at?: string;
          tx_hash?: string | null;
        };
        Update: {
          id?: string;
          account_id?: string;
          source_account?: string;
          event_type?: string;
          significance?: string;
          raw_data?: Json;
          summary?: string | null;
          processed?: boolean;
          draft_article_id?: string | null;
          detected_at?: string;
          tx_hash?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          email: string;
          created_at: string;
          role: Database['public']['Enums']['editorial_role'];
          author_id: string | null;
          display_name: string | null;
        };
        Insert: {
          email: string;
          created_at?: string;
          role?: Database['public']['Enums']['editorial_role'];
          author_id?: string | null;
          display_name?: string | null;
        };
        Update: {
          email?: string;
          created_at?: string;
          role?: Database['public']['Enums']['editorial_role'];
          author_id?: string | null;
          display_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_users_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'authors';
            referencedColumns: ['id'];
          },
        ];
      };
      article_reviews: {
        Row: {
          id: string;
          article_id: string;
          version_number: number | null;
          state: Database['public']['Enums']['review_state'];
          requested_by: string;
          reviewer_email: string | null;
          comment: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          article_id: string;
          version_number?: number | null;
          state?: Database['public']['Enums']['review_state'];
          requested_by: string;
          reviewer_email?: string | null;
          comment?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          article_id?: string;
          version_number?: number | null;
          state?: Database['public']['Enums']['review_state'];
          requested_by?: string;
          reviewer_email?: string | null;
          comment?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_reviews_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
        ];
      };
      editorial_audit_log: {
        Row: {
          id: string;
          actor_email: string;
          action: string;
          entity: string;
          entity_id: string | null;
          from_status: string | null;
          to_status: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_email: string;
          action: string;
          entity: string;
          entity_id?: string | null;
          from_status?: string | null;
          to_status?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_email?: string;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          from_status?: string | null;
          to_status?: string | null;
          metadata?: Json;
          created_at?: string;
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
          source_locale: Database['public']['Enums']['content_locale'];
          reading_time_minutes: number;
          published_at: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          author_id: string;
          /** Generated column: sha256 of title\nsummary\ncontent. */
          translation_source_hash: string;
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
          source_locale?: Database['public']['Enums']['content_locale'];
          reading_time_minutes?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
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
          source_locale?: Database['public']['Enums']['content_locale'];
          reading_time_minutes?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id?: string;
        };
        Relationships: [];
      };
      article_translations: {
        Row: {
          id: string;
          article_id: string;
          locale: Database['public']['Enums']['content_locale'];
          slug: string;
          title: string;
          summary: string;
          content: string;
          source_content_hash: string;
          source_field_hashes: Json;
          translated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          locale: Database['public']['Enums']['content_locale'];
          slug: string;
          title: string;
          summary: string;
          content: string;
          source_content_hash: string;
          source_field_hashes?: Json;
          translated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          locale?: Database['public']['Enums']['content_locale'];
          slug?: string;
          title?: string;
          summary?: string;
          content?: string;
          source_content_hash?: string;
          source_field_hashes?: Json;
          translated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_translations_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
        ];
      };
      monthly_review_translations: {
        Row: {
          id: string;
          review_id: string;
          locale: Database['public']['Enums']['content_locale'];
          title: string;
          summary: string;
          highlights: Json;
          source_content_hash: string;
          translated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          locale: Database['public']['Enums']['content_locale'];
          title: string;
          summary: string;
          highlights?: Json;
          source_content_hash: string;
          translated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          locale?: Database['public']['Enums']['content_locale'];
          title?: string;
          summary?: string;
          highlights?: Json;
          source_content_hash?: string;
          translated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_review_translations_review_id_fkey';
            columns: ['review_id'];
            referencedRelation: 'monthly_reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      tag_translations: {
        Row: {
          tag_slug: string;
          locale: Database['public']['Enums']['content_locale'];
          label: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tag_slug: string;
          locale: Database['public']['Enums']['content_locale'];
          label: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tag_slug?: string;
          locale?: Database['public']['Enums']['content_locale'];
          label?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tag_translations_tag_slug_fkey';
            columns: ['tag_slug'];
            referencedRelation: 'tags';
            referencedColumns: ['slug'];
          },
        ];
      };
      author_translations: {
        Row: {
          author_id: string;
          locale: Database['public']['Enums']['content_locale'];
          role: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          locale: Database['public']['Enums']['content_locale'];
          role?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          locale?: Database['public']['Enums']['content_locale'];
          role?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'author_translations_author_id_fkey';
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
          source_locale: Database['public']['Enums']['content_locale'];
          published_at: string;
          created_at: string;
          updated_at: string;
          /** Generated column: sha256 of title\nsummary. */
          translation_source_hash: string;
        };
        Insert: {
          id?: string;
          period: string;
          title: string;
          summary: string;
          cover_image_url?: string | null;
          highlights?: Json | null;
          metrics?: Json | null;
          source_locale?: Database['public']['Enums']['content_locale'];
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
          source_locale?: Database['public']['Enums']['content_locale'];
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
      media_library: {
        Row: {
          id: string;
          bucket: string;
          path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          variants: Json;
          content_hash: string | null;
          stellar_tx_hash: string | null;
          uploaded_by: string;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket: string;
          path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          variants?: Json;
          content_hash?: string | null;
          stellar_tx_hash?: string | null;
          uploaded_by: string;
          usage_count?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media_library']['Insert']>;
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
          author_credential_id: string | null;
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
          author_credential_id?: string | null;
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
          author_credential_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'article_attestations_author_credential_id_fkey';
            columns: ['author_credential_id'];
            referencedRelation: 'author_credentials';
            referencedColumns: ['id'];
          },
        ];
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

      stellar_embeds_cache: {
        Row: {
          entity_id: string;
          entity_type: string;
          network: string;
          resolved_data: Json;
          resolved_at: string;
          expires_at: string | null;
        };
        Insert: {
          entity_id: string;
          entity_type: string;
          network: string;
          resolved_data: Json;
          resolved_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['stellar_embeds_cache']['Insert']>;
        Relationships: [];
      };

      article_versions: {
        Row: {
          id: string;
          article_id: string;
          version_number: number;
          title: string;
          summary: string;
          content: string;
          category: Database['public']['Enums']['news_category'];
          diff_summary: Json | null;
          edited_by: string | null;
          content_hash: string;
          previous_hash: string | null;
          stellar_tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          version_number: number;
          title: string;
          summary: string;
          content: string;
          category: Database['public']['Enums']['news_category'];
          diff_summary?: Json | null;
          edited_by?: string | null;
          content_hash: string;
          previous_hash?: string | null;
          stellar_tx_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['article_versions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'article_versions_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'news_articles';
            referencedColumns: ['id'];
          },
        ];
      };
      acta_issuer_identity: {
        Row: {
          id: string;
          controller: string;
          did: string;
          payload: Json;
          network: 'testnet' | 'mainnet';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          controller: string;
          did: string;
          payload: Json;
          network: 'testnet' | 'mainnet';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['acta_issuer_identity']['Insert']>;
        Relationships: [];
      };
      author_identities: {
        Row: {
          author_id: string;
          did: string;
          stellar_address: string;
          vault_contract_id: string | null;
          network: 'testnet' | 'mainnet';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          did: string;
          stellar_address: string;
          vault_contract_id?: string | null;
          network: 'testnet' | 'mainnet';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['author_identities']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'author_identities_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'authors';
            referencedColumns: ['id'];
          },
        ];
      };
      author_credentials: {
        Row: {
          id: string;
          author_id: string;
          vc_id: string;
          role: string;
          status: Database['public']['Enums']['author_credential_status'];
          issuer_did: string;
          subject_did: string;
          network: 'testnet' | 'mainnet';
          issue_tx_id: string | null;
          revoke_tx_id: string | null;
          issued_at: string | null;
          revoked_at: string | null;
          revocation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          vc_id: string;
          role: string;
          status?: Database['public']['Enums']['author_credential_status'];
          issuer_did: string;
          subject_did: string;
          network: 'testnet' | 'mainnet';
          issue_tx_id?: string | null;
          revoke_tx_id?: string | null;
          issued_at?: string | null;
          revoked_at?: string | null;
          revocation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['author_credentials']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'author_credentials_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'authors';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      next_article_version_number: {
        Args: { p_article_id: string };
        Returns: number;
      };
      latest_article_content_hash: {
        Args: { p_article_id: string };
        Returns: string | null;
      };
      current_editorial_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database['public']['Enums']['editorial_role'] | null;
      };
      can_publish: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      owns_article: {
        Args: { target_article: string };
        Returns: boolean;
      };
      search_articles: {
        Args: {
          p_query: string;
          p_locale?: Database['public']['Enums']['content_locale'];
        };
        Returns: {
          article_id: string;
          rank: number;
          matched_locale: Database['public']['Enums']['content_locale'];
        }[];
      };
    };
    Enums: {
      news_status: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
      news_category: 'announcement' | 'product' | 'ecosystem' | 'engineering' | 'community';
      editorial_role: 'owner' | 'editor' | 'author' | 'contributor';
      review_state: 'requested' | 'approved' | 'changes_requested';
      content_locale: 'en' | 'es';
      author_credential_status: 'pending' | 'active' | 'revoked' | 'failed';
    };
    CompositeTypes: Record<string, never>;
  };
}
