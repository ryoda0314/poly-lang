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
      announcement_reads: {
        Row: {
          announcement_id: string
          dismissed: boolean | null
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed?: boolean | null
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed?: boolean | null
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          content_i18n: Json | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          new_user_days: number | null
          starts_at: string | null
          target_audience: string
          title: string
          title_i18n: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_i18n?: Json | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          new_user_days?: number | null
          starts_at?: string | null
          target_audience?: string
          title: string
          title_i18n?: Json | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_i18n?: Json | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          new_user_days?: number | null
          starts_at?: string | null
          target_audience?: string
          title?: string
          title_i18n?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_token_usage: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      awareness_memos: {
        Row: {
          attempted_at: string | null
          confidence: string | null
          created_at: string | null
          id: string
          language_code: string
          last_reviewed_at: string | null
          length: number
          memo: string | null
          next_review_at: string | null
          phrase_id: string
          status: Database["public"]["Enums"]["verification_status_type"]
          strength: number
          token_index: number
          token_text: string | null
          updated_at: string | null
          usage_count: number
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempted_at?: string | null
          confidence?: string | null
          created_at?: string | null
          id?: string
          language_code?: string
          last_reviewed_at?: string | null
          length?: number
          memo?: string | null
          next_review_at?: string | null
          phrase_id: string
          status?: Database["public"]["Enums"]["verification_status_type"]
          strength?: number
          token_index: number
          token_text?: string | null
          updated_at?: string | null
          usage_count?: number
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempted_at?: string | null
          confidence?: string | null
          created_at?: string | null
          id?: string
          language_code?: string
          last_reviewed_at?: string | null
          length?: number
          memo?: string | null
          next_review_at?: string | null
          phrase_id?: string
          status?: Database["public"]["Enums"]["verification_status_type"]
          strength?: number
          token_index?: number
          token_text?: string | null
          updated_at?: string | null
          usage_count?: number
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_key: string
          created_at: string | null
          description: string
          icon: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          badge_key: string
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          badge_key?: string
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      bible_verse_translations: {
        Row: {
          book_id: string
          chapter: number
          created_at: string | null
          id: string
          source_text: string
          target_language: string
          translation: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string | null
          id?: string
          source_text: string
          target_language?: string
          translation: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string | null
          id?: string
          source_text?: string
          target_language?: string
          translation?: string
          verse?: number
        }
        Relationships: []
      }
      character_progress: {
        Row: {
          character_id: string
          correct_count: number
          created_at: string
          ease_factor: number
          id: string
          incorrect_count: number
          interval_days: number
          language_code: string
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
          script_set_id: string
          status: string
          strength: number
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          language_code: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          script_set_id: string
          status?: string
          strength?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          language_code?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          script_set_id?: string
          status?: string
          strength?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_quest_templates: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean
          language_code: string | null
          level_max: number | null
          level_min: number | null
          quest_key: string
          required_count: number
          title: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean
          language_code?: string | null
          level_max?: number | null
          level_min?: number | null
          quest_key: string
          required_count?: number
          title: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          language_code?: string | null
          level_max?: number | null
          level_min?: number | null
          quest_key?: string
          required_count?: number
          title?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          audio_count: number | null
          chat_count: number
          correction_count: number | null
          created_at: string
          date: string
          etymology_count: number
          explanation_count: number | null
          explorer_count: number | null
          expression_count: number
          extension_count: number
          extraction_count: number | null
          grammar_count: number
          id: string
          script_count: number
          sentence_count: number
          user_id: string
          vocab_count: number
        }
        Insert: {
          audio_count?: number | null
          chat_count?: number
          correction_count?: number | null
          created_at?: string
          date?: string
          etymology_count?: number
          explanation_count?: number | null
          explorer_count?: number | null
          expression_count?: number
          extension_count?: number
          extraction_count?: number | null
          grammar_count?: number
          id?: string
          script_count?: number
          sentence_count?: number
          user_id: string
          vocab_count?: number
        }
        Update: {
          audio_count?: number | null
          chat_count?: number
          correction_count?: number | null
          created_at?: string
          date?: string
          etymology_count?: number
          explanation_count?: number | null
          explorer_count?: number | null
          expression_count?: number
          extension_count?: number
          extraction_count?: number | null
          grammar_count?: number
          id?: string
          script_count?: number
          sentence_count?: number
          user_id?: string
          vocab_count?: number
        }
        Relationships: []
      }
      distribution_claims: {
        Row: {
          claimed_at: string | null
          event_id: string
          id: string
          period_key: string
          rewards_granted: Json | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          event_id: string
          id?: string
          period_key: string
          rewards_granted?: Json | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          event_id?: string
          id?: string
          period_key?: string
          rewards_granted?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "distribution_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_events: {
        Row: {
          claim_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_i18n: Json | null
          expires_at: string | null
          id: string
          recurrence: string
          rewards: Json
          scheduled_at: string
          status: string
          title: string
          title_i18n: Json | null
        }
        Insert: {
          claim_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_i18n?: Json | null
          expires_at?: string | null
          id?: string
          recurrence?: string
          rewards: Json
          scheduled_at: string
          status?: string
          title: string
          title_i18n?: Json | null
        }
        Update: {
          claim_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_i18n?: Json | null
          expires_at?: string | null
          id?: string
          recurrence?: string
          rewards?: Json
          scheduled_at?: string
          status?: string
          title?: string
          title_i18n?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etymology_derivations: {
        Row: {
          child_word: string
          created_at: string | null
          id: string
          parent_word: string
          relationship_type: string
          target_language: string
        }
        Insert: {
          child_word: string
          created_at?: string | null
          id?: string
          parent_word: string
          relationship_type: string
          target_language?: string
        }
        Update: {
          child_word?: string
          created_at?: string | null
          id?: string
          parent_word?: string
          relationship_type?: string
          target_language?: string
        }
        Relationships: []
      }
      etymology_entries: {
        Row: {
          cognates: Json | null
          compound_tree: Json | null
          confidence: Json | null
          created_at: string | null
          definition: string | null
          etymology_story: string | null
          etymology_summary: string | null
          first_known_use: string | null
          has_wiktionary_data: boolean
          id: string
          learning_hints: Json | null
          nuance_notes: Json | null
          origin_language: string | null
          part_breakdown: Json | null
          pronunciation: string | null
          raw_wikitext: string | null
          source_type: string
          target_language: string
          tree_data: Json | null
          updated_at: string | null
          word: string
        }
        Insert: {
          cognates?: Json | null
          compound_tree?: Json | null
          confidence?: Json | null
          created_at?: string | null
          definition?: string | null
          etymology_story?: string | null
          etymology_summary?: string | null
          first_known_use?: string | null
          has_wiktionary_data?: boolean
          id?: string
          learning_hints?: Json | null
          nuance_notes?: Json | null
          origin_language?: string | null
          part_breakdown?: Json | null
          pronunciation?: string | null
          raw_wikitext?: string | null
          source_type?: string
          target_language?: string
          tree_data?: Json | null
          updated_at?: string | null
          word: string
        }
        Update: {
          cognates?: Json | null
          compound_tree?: Json | null
          confidence?: Json | null
          created_at?: string | null
          definition?: string | null
          etymology_story?: string | null
          etymology_summary?: string | null
          first_known_use?: string | null
          has_wiktionary_data?: boolean
          id?: string
          learning_hints?: Json | null
          nuance_notes?: Json | null
          origin_language?: string | null
          part_breakdown?: Json | null
          pronunciation?: string | null
          raw_wikitext?: string | null
          source_type?: string
          target_language?: string
          tree_data?: Json | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
      }
      etymology_search_history: {
        Row: {
          id: string
          searched_at: string | null
          target_language: string
          user_id: string
          word: string
        }
        Insert: {
          id?: string
          searched_at?: string | null
          target_language?: string
          user_id: string
          word: string
        }
        Update: {
          id?: string
          searched_at?: string | null
          target_language?: string
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      etymology_wikitext_stock: {
        Row: {
          created_at: string
          raw_wikitext: string
          target_language: string
          word: string
        }
        Insert: {
          created_at?: string
          raw_wikitext: string
          target_language: string
          word: string
        }
        Update: {
          created_at?: string
          raw_wikitext?: string
          target_language?: string
          word?: string
        }
        Relationships: []
      }
      etymology_word_parts: {
        Row: {
          created_at: string | null
          examples: string[] | null
          id: string
          learning_hint: string | null
          meaning: string
          origin_language: string
          part: string
          part_type: string
        }
        Insert: {
          created_at?: string | null
          examples?: string[] | null
          id?: string
          learning_hint?: string | null
          meaning: string
          origin_language: string
          part: string
          part_type: string
        }
        Update: {
          created_at?: string | null
          examples?: string[] | null
          id?: string
          learning_hint?: string | null
          meaning?: string
          origin_language?: string
          part?: string
          part_type?: string
        }
        Relationships: []
      }
      extraction_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          extracted_phrases: Json | null
          id: string
          image_data: string
          native_lang: string
          notification_sent: boolean | null
          options: Json | null
          phrase_count: number | null
          phrase_set_id: string | null
          started_at: string | null
          status: string
          target_lang: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_phrases?: Json | null
          id?: string
          image_data: string
          native_lang: string
          notification_sent?: boolean | null
          options?: Json | null
          phrase_count?: number | null
          phrase_set_id?: string | null
          started_at?: string | null
          status?: string
          target_lang: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_phrases?: Json | null
          id?: string
          image_data?: string
          native_lang?: string
          notification_sent?: boolean | null
          options?: Json | null
          phrase_count?: number | null
          phrase_set_id?: string | null
          started_at?: string | null
          status?: string
          target_lang?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_phrase_set_id_fkey"
            columns: ["phrase_set_id"]
            isOneToOne: false
            referencedRelation: "phrase_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      furigana_cache: {
        Row: {
          created_at: string | null
          id: string
          kanji: string
          reading: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kanji: string
          reading: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kanji?: string
          reading?: string
        }
        Relationships: []
      }
      ipa_cache: {
        Row: {
          id: string
          text_hash: string
          original_text: string
          mode: string
          ipa: string
          created_at: string | null
        }
        Insert: {
          id?: string
          text_hash: string
          original_text: string
          mode: string
          ipa: string
          created_at?: string | null
        }
        Update: {
          id?: string
          text_hash?: string
          original_text?: string
          mode?: string
          ipa?: string
          created_at?: string | null
        }
        Relationships: []
      }
      grammar_diagnostic_sessions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          generated_patterns: Json
          id: string
          known_count: number | null
          language_code: string
          native_language: string
          total_patterns: number
          unknown_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          generated_patterns: Json
          id?: string
          known_count?: number | null
          language_code: string
          native_language: string
          total_patterns: number
          unknown_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          generated_patterns?: Json
          id?: string
          known_count?: number | null
          language_code?: string
          native_language?: string
          total_patterns?: number
          unknown_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      grammar_patterns: {
        Row: {
          category: string
          created_at: string | null
          example_sentence: string
          id: string
          language_code: string
          pattern_template: string
          session_id: string | null
          status: string | null
          translation: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          example_sentence: string
          id?: string
          language_code: string
          pattern_template: string
          session_id?: string | null
          status?: string | null
          translation: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          example_sentence?: string
          id?: string
          language_code?: string
          pattern_template?: string
          session_id?: string | null
          status?: string | null
          translation?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_patterns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "grammar_diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji_hanja_mappings: {
        Row: {
          additional_readings: Json | null
          confidence: string | null
          created_at: string | null
          hanja: string
          hanja_meaning: string | null
          id: string
          kanji: string
          korean_reading: string
          source: string
          usage_examples: Json | null
          word_type: string
        }
        Insert: {
          additional_readings?: Json | null
          confidence?: string | null
          created_at?: string | null
          hanja: string
          hanja_meaning?: string | null
          id?: string
          kanji: string
          korean_reading: string
          source: string
          usage_examples?: Json | null
          word_type: string
        }
        Update: {
          additional_readings?: Json | null
          confidence?: string | null
          created_at?: string | null
          hanja?: string
          hanja_meaning?: string | null
          id?: string
          kanji?: string
          korean_reading?: string
          source?: string
          usage_examples?: Json | null
          word_type?: string
        }
        Relationships: []
      }
      learning_events: {
        Row: {
          collection_id: string | null
          created_at: string | null
          event_type: string
          id: string
          language_code: string
          meta: Json
          occurred_at: string
          user_id: string
          xp_delta: number
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          language_code: string
          meta?: Json
          occurred_at?: string
          user_id: string
          xp_delta?: number
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          language_code?: string
          meta?: Json
          occurred_at?: string
          user_id?: string
          xp_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "phrase_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          level: number
          next_unlock_label: string
          title: string
          xp_threshold: number
        }
        Insert: {
          level: number
          next_unlock_label: string
          title: string
          xp_threshold: number
        }
        Update: {
          level?: number
          next_unlock_label?: string
          title?: string
          xp_threshold?: number
        }
        Relationships: []
      }
      long_text_sentences: {
        Row: {
          created_at: string | null
          id: string
          long_text_id: string
          position: number
          text: string
          tokens: string[] | null
          translation: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          long_text_id: string
          position: number
          text: string
          tokens?: string[] | null
          translation?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          long_text_id?: string
          position?: number
          text?: string
          tokens?: string[] | null
          translation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "long_text_sentences_long_text_id_fkey"
            columns: ["long_text_id"]
            isOneToOne: false
            referencedRelation: "long_texts"
            referencedColumns: ["id"]
          },
        ]
      }
      long_texts: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty_level: string | null
          full_text: string
          id: string
          is_published: boolean | null
          language_code: string
          sentence_count: number | null
          title: string
          title_translation: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          full_text: string
          id?: string
          is_published?: boolean | null
          language_code: string
          sentence_count?: number | null
          title: string
          title_translation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          full_text?: string
          id?: string
          is_published?: boolean | null
          language_code?: string
          sentence_count?: number | null
          title?: string
          title_translation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "long_texts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_jpy: number
          coins_granted: number
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          product_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount_jpy: number
          coins_granted?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          product_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount_jpy?: number
          coins_granted?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_collections: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          language_code: string
          name: string
          position: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          language_code: string
          name: string
          position?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          language_code?: string
          name?: string
          position?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrase_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_set_item_reviews: {
        Row: {
          correct_count: number
          created_at: string
          ease_factor: number
          id: string
          incorrect_count: number
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string | null
          phrase_set_item_id: string
          review_count: number
          status: string
          strength: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          phrase_set_item_id: string
          review_count?: number
          status?: string
          strength?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          phrase_set_item_id?: string
          review_count?: number
          status?: string
          strength?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrase_set_item_reviews_phrase_set_item_id_fkey"
            columns: ["phrase_set_item_id"]
            isOneToOne: false
            referencedRelation: "phrase_set_items"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_set_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          hanja_meaning: string | null
          hanja_text: string | null
          id: string
          kanji_text: string | null
          korean_reading: string | null
          phrase_set_id: string
          position: number | null
          target_text: string
          tokens: string[] | null
          translation: string
          updated_at: string | null
          word_type: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          hanja_meaning?: string | null
          hanja_text?: string | null
          id?: string
          kanji_text?: string | null
          korean_reading?: string | null
          phrase_set_id: string
          position?: number | null
          target_text: string
          tokens?: string[] | null
          translation: string
          updated_at?: string | null
          word_type?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          hanja_meaning?: string | null
          hanja_text?: string | null
          id?: string
          kanji_text?: string | null
          korean_reading?: string | null
          phrase_set_id?: string
          position?: number | null
          target_text?: string
          tokens?: string[] | null
          translation?: string
          updated_at?: string | null
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phrase_set_items_phrase_set_id_fkey"
            columns: ["phrase_set_id"]
            isOneToOne: false
            referencedRelation: "phrase_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_set_progress: {
        Row: {
          avg_strength: number
          created_at: string
          due_count: number
          id: string
          last_studied_at: string | null
          learning_count: number
          mastered_count: number
          new_count: number
          phrase_set_id: string
          reviewing_count: number
          session_count: number
          total_correct: number
          total_reviews: number
          total_study_time_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_strength?: number
          created_at?: string
          due_count?: number
          id?: string
          last_studied_at?: string | null
          learning_count?: number
          mastered_count?: number
          new_count?: number
          phrase_set_id: string
          reviewing_count?: number
          session_count?: number
          total_correct?: number
          total_reviews?: number
          total_study_time_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_strength?: number
          created_at?: string
          due_count?: number
          id?: string
          last_studied_at?: string | null
          learning_count?: number
          mastered_count?: number
          new_count?: number
          phrase_set_id?: string
          reviewing_count?: number
          session_count?: number
          total_correct?: number
          total_reviews?: number
          total_study_time_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrase_set_progress_phrase_set_id_fkey"
            columns: ["phrase_set_id"]
            isOneToOne: false
            referencedRelation: "phrase_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      phrase_sets: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          language_code: string
          name: string
          phrase_count: number | null
          position: number | null
          set_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          language_code: string
          name: string
          phrase_count?: number | null
          position?: number | null
          set_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          language_code?: string
          name?: string
          phrase_count?: number | null
          position?: number | null
          set_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrase_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audio_credits: number
          chat_credits: number
          coins: number | null
          correction_credits: number
          created_at: string | null
          email_verified: boolean | null
          etymology_credits: number
          explanation_credits: number
          explorer_credits: number
          expression_credits: number
          extension_credits: number
          extraction_credits: number
          gender: string | null
          grammar_credits: number
          id: string
          learning_language: string | null
          native_language: string | null
          role: string | null
          script_credits: number
          sentence_credits: number | null
          settings: Json | null
          subscription_plan: string | null
          username: string | null
          vocab_credits: number
          avatar_url: string | null
        }
        Insert: {
          audio_credits?: number
          chat_credits?: number
          coins?: number | null
          correction_credits?: number
          created_at?: string | null
          email_verified?: boolean | null
          etymology_credits?: number
          explanation_credits?: number
          explorer_credits?: number
          expression_credits?: number
          extension_credits?: number
          extraction_credits?: number
          gender?: string | null
          grammar_credits?: number
          id: string
          learning_language?: string | null
          native_language?: string | null
          role?: string | null
          script_credits?: number
          sentence_credits?: number | null
          settings?: Json | null
          subscription_plan?: string | null
          username?: string | null
          vocab_credits?: number
          avatar_url?: string | null
        }
        Update: {
          audio_credits?: number
          chat_credits?: number
          coins?: number | null
          correction_credits?: number
          created_at?: string | null
          email_verified?: boolean | null
          etymology_credits?: number
          explanation_credits?: number
          explorer_credits?: number
          expression_credits?: number
          extension_credits?: number
          extraction_credits?: number
          gender?: string | null
          grammar_credits?: number
          id?: string
          learning_language?: string | null
          native_language?: string | null
          role?: string | null
          script_credits?: number
          sentence_credits?: number | null
          settings?: Json | null
          subscription_plan?: string | null
          username?: string | null
          vocab_credits?: number
          avatar_url?: string | null
        }
        Relationships: []
      }
      pronunciation_language_requests: {
        Row: {
          id: string
          user_id: string
          language_code: string
          language_name: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          language_code: string
          language_name: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          language_code?: string
          language_name?: string
          message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      pronunciation_runs: {
        Row: {
          asr_text: string
          created_at: string | null
          device_info: Json | null
          diffs: Json
          expected_text: string
          feedback: string | null
          id: string
          phrase_id: string
          score: number
          user_id: string
        }
        Insert: {
          asr_text: string
          created_at?: string | null
          device_info?: Json | null
          diffs?: Json
          expected_text: string
          feedback?: string | null
          id?: string
          phrase_id: string
          score: number
          user_id: string
        }
        Update: {
          asr_text?: string
          created_at?: string | null
          device_info?: Json | null
          diffs?: Json
          expected_text?: string
          feedback?: string | null
          id?: string
          phrase_id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      script_practice_sessions: {
        Row: {
          character_count: number
          completed_at: string | null
          correct_count: number | null
          created_at: string | null
          duration_seconds: number | null
          generated_exercises: Json | null
          id: string
          incorrect_count: number | null
          language_code: string
          practice_type: string
          script_set_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          character_count: number
          completed_at?: string | null
          correct_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          generated_exercises?: Json | null
          id?: string
          incorrect_count?: number | null
          language_code: string
          practice_type: string
          script_set_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          character_count?: number
          completed_at?: string | null
          correct_count?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          generated_exercises?: Json | null
          id?: string
          incorrect_count?: number | null
          language_code?: string
          practice_type?: string
          script_set_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sentence_analysis_cache: {
        Row: {
          analysis_result: Json
          created_at: string | null
          id: string
          sentence_normalized: string
        }
        Insert: {
          analysis_result: Json
          created_at?: string | null
          id?: string
          sentence_normalized: string
        }
        Update: {
          analysis_result?: Json
          created_at?: string | null
          id?: string
          sentence_normalized?: string
        }
        Relationships: []
      }
      slang_terms: {
        Row: {
          created_at: string | null
          definition: string
          id: string
          language_code: string
          status: string
          term: string
          vote_count_down: number | null
          vote_count_up: number | null
        }
        Insert: {
          created_at?: string | null
          definition: string
          id?: string
          language_code: string
          status?: string
          term: string
          vote_count_down?: number | null
          vote_count_up?: number | null
        }
        Update: {
          created_at?: string | null
          definition?: string
          id?: string
          language_code?: string
          status?: string
          term?: string
          vote_count_down?: number | null
          vote_count_up?: number | null
        }
        Relationships: []
      }
      slang_votes: {
        Row: {
          age_group: string | null
          created_at: string | null
          gender: string | null
          id: string
          slang_term_id: string
          user_id: string
          vote: boolean
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          slang_term_id: string
          user_id: string
          vote: boolean
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          slang_term_id?: string
          user_id?: string
          vote?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "slang_votes_slang_term_id_fkey"
            columns: ["slang_term_id"]
            isOneToOne: false
            referencedRelation: "slang_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          accuracy_percentage: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          items_correct: number
          items_incorrect: number
          items_mastered: number
          items_reviewed: number
          language_code: string
          new_items_learned: number
          phrase_set_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          items_correct?: number
          items_incorrect?: number
          items_mastered?: number
          items_reviewed?: number
          language_code: string
          new_items_learned?: number
          phrase_set_id?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          items_correct?: number
          items_incorrect?: number
          items_mastered?: number
          items_reviewed?: number
          language_code?: string
          new_items_learned?: number
          phrase_set_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_phrase_set_id_fkey"
            columns: ["phrase_set_id"]
            isOneToOne: false
            referencedRelation: "phrase_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          status: string
          type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          category: string
          created_at?: string | null
          id?: string
          message: string
          status?: string
          type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          status?: string
          type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          learning_language: string
          native_language: string
          steps: Json | null
          title: string
          tutorial_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          learning_language: string
          native_language: string
          steps?: Json | null
          title: string
          tutorial_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          learning_language?: string
          native_language?: string
          steps?: Json | null
          title?: string
          tutorial_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_learning_stats: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          language_code: string
          last_study_date: string | null
          learning_items: number
          longest_streak: number
          mastered_items: number
          streak_start_date: string | null
          total_correct: number
          total_items: number
          total_reviews: number
          total_sessions: number
          total_study_time_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          language_code: string
          last_study_date?: string | null
          learning_items?: number
          longest_streak?: number
          mastered_items?: number
          streak_start_date?: string | null
          total_correct?: number
          total_items?: number
          total_reviews?: number
          total_sessions?: number
          total_study_time_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          language_code?: string
          last_study_date?: string | null
          learning_items?: number
          longest_streak?: number
          mastered_items?: number
          streak_start_date?: string | null
          total_correct?: number
          total_items?: number
          total_reviews?: number
          total_sessions?: number
          total_study_time_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_days: {
        Row: {
          created_at: string | null
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          login_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          login_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_long_text_progress: {
        Row: {
          completed_at: string | null
          completed_sentences: number[] | null
          current_sentence: number | null
          id: string
          last_accessed_at: string | null
          long_text_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_sentences?: number[] | null
          current_sentence?: number | null
          id?: string
          last_accessed_at?: string | null
          long_text_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_sentences?: number[] | null
          current_sentence?: number | null
          id?: string
          last_accessed_at?: string | null
          long_text_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_long_text_progress_long_text_id_fkey"
            columns: ["long_text_id"]
            isOneToOne: false
            referencedRelation: "long_texts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_long_text_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          current_level: number | null
          id: string
          language_code: string
          last_activity_at: string | null
          user_id: string
          xp_total: number | null
        }
        Insert: {
          current_level?: number | null
          id?: string
          language_code: string
          last_activity_at?: string | null
          user_id: string
          xp_total?: number | null
        }
        Update: {
          current_level?: number | null
          id?: string
          language_code?: string
          last_activity_at?: string | null
          user_id?: string
          xp_total?: number | null
        }
        Relationships: []
      }
      user_sentence_history: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          sentence: string
          sentence_normalized: string
          sentence_pattern_label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          sentence: string
          sentence_normalized: string
          sentence_pattern_label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          sentence?: string
          sentence_normalized?: string
          sentence_pattern_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vocabulary: {
        Row: {
          correct_count: number | null
          created_at: string | null
          id: string
          language_code: string
          mastery_level: number | null
          miss_count: number | null
          reading: string | null
          set_id: string | null
          source_topic: string | null
          target_text: string
          translation: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct_count?: number | null
          created_at?: string | null
          id?: string
          language_code: string
          mastery_level?: number | null
          miss_count?: number | null
          reading?: string | null
          set_id?: string | null
          source_topic?: string | null
          target_text: string
          translation: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct_count?: number | null
          created_at?: string | null
          id?: string
          language_code?: string
          mastery_level?: number | null
          miss_count?: number | null
          reading?: string | null
          set_id?: string | null
          source_topic?: string | null
          target_text?: string
          translation?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocabulary_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_generation_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          generated_words: Json
          id: string
          language_code: string
          session_results: Json | null
          topic: string
          user_id: string
          word_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          generated_words: Json
          id?: string
          language_code: string
          session_results?: Json | null
          topic: string
          user_id: string
          word_count: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          generated_words?: Json
          id?: string
          language_code?: string
          session_results?: Json | null
          topic?: string
          user_id?: string
          word_count?: number
        }
        Relationships: []
      }
      vocabulary_sets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          language_code: string
          name: string
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          language_code: string
          name: string
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      xp_settings: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          is_active: boolean | null
          label_ja: string | null
          updated_at: string | null
          xp_value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          is_active?: boolean | null
          label_ja?: string | null
          updated_at?: string | null
          xp_value?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          is_active?: boolean | null
          label_ja?: string | null
          updated_at?: string | null
          xp_value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_distribution: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
      get_localized_text: {
        Args: { p_fallback: string; p_i18n: Json; p_locale?: string }
        Returns: string
      }
      increment_coins: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      verification_status_type: "unverified" | "attempted" | "verified"
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
      verification_status_type: ["unverified", "attempted", "verified"],
    },
  },
} as const
