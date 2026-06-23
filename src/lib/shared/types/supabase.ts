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
    PostgrestVersion: "14.5"
  }
  ai: {
    Tables: {
      agent_observations: {
        Row: {
          ad_account_id: string | null
          business_id: string
          confidence_score: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          evidence_json: Json
          id: string
          observation_text: string
          observation_type: string
          source: string
          title: string | null
        }
        Insert: {
          ad_account_id?: string | null
          business_id: string
          confidence_score?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          evidence_json?: Json
          id?: string
          observation_text: string
          observation_type: string
          source?: string
          title?: string | null
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          evidence_json?: Json
          id?: string
          observation_text?: string
          observation_type?: string
          source?: string
          title?: string | null
        }
        Relationships: []
      }
      ai_generation_runs: {
        Row: {
          ad_account_id: string | null
          business_id: string
          created_at: string
          error_message: string | null
          fallback_reason: string | null
          id: string
          input_hash: string
          latency_ms: number
          metadata_json: Json
          model: string
          output_json: Json
          platform_integration_id: string | null
          prompt_version: string
          queue_item_id: string | null
          schema_name: string
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          ad_account_id?: string | null
          business_id: string
          created_at?: string
          error_message?: string | null
          fallback_reason?: string | null
          id?: string
          input_hash: string
          latency_ms?: number
          metadata_json?: Json
          model: string
          output_json?: Json
          platform_integration_id?: string | null
          prompt_version: string
          queue_item_id?: string | null
          schema_name: string
          source_id?: string | null
          source_type: string
          status?: string
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string
          created_at?: string
          error_message?: string | null
          fallback_reason?: string | null
          id?: string
          input_hash?: string
          latency_ms?: number
          metadata_json?: Json
          model?: string
          output_json?: Json
          platform_integration_id?: string | null
          prompt_version?: string
          queue_item_id?: string | null
          schema_name?: string
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: []
      }
      business_agent_profiles: {
        Row: {
          assessment_status: string
          best_audience_patterns_json: Json
          best_budget_patterns_json: Json
          best_creative_patterns_json: Json
          best_objectives_json: Json
          best_time_patterns_json: Json
          business_id: string
          confidence_score: number | null
          created_at: string
          failure_patterns_json: Json
          forbidden_patterns_json: Json
          history_available: boolean
          history_end_date: string | null
          history_start_date: string | null
          id: string
          last_assessed_at: string | null
          last_learning_update_at: string | null
          playbook_markdown: string | null
          primary_platform: string | null
          recommended_defaults_json: Json
          updated_at: string
        }
        Insert: {
          assessment_status?: string
          best_audience_patterns_json?: Json
          best_budget_patterns_json?: Json
          best_creative_patterns_json?: Json
          best_objectives_json?: Json
          best_time_patterns_json?: Json
          business_id: string
          confidence_score?: number | null
          created_at?: string
          failure_patterns_json?: Json
          forbidden_patterns_json?: Json
          history_available?: boolean
          history_end_date?: string | null
          history_start_date?: string | null
          id?: string
          last_assessed_at?: string | null
          last_learning_update_at?: string | null
          playbook_markdown?: string | null
          primary_platform?: string | null
          recommended_defaults_json?: Json
          updated_at?: string
        }
        Update: {
          assessment_status?: string
          best_audience_patterns_json?: Json
          best_budget_patterns_json?: Json
          best_creative_patterns_json?: Json
          best_objectives_json?: Json
          best_time_patterns_json?: Json
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          failure_patterns_json?: Json
          forbidden_patterns_json?: Json
          history_available?: boolean
          history_end_date?: string | null
          history_start_date?: string | null
          id?: string
          last_assessed_at?: string | null
          last_learning_update_at?: string | null
          playbook_markdown?: string | null
          primary_platform?: string | null
          recommended_defaults_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      business_assessments: {
        Row: {
          assessment_json: Json
          business_id: string
          created_at: string
          digest_json: Json
          id: string
          scope: string
        }
        Insert: {
          assessment_json?: Json
          business_id: string
          created_at?: string
          digest_json?: Json
          id?: string
          scope?: string
        }
        Update: {
          assessment_json?: Json
          business_id?: string
          created_at?: string
          digest_json?: Json
          id?: string
          scope?: string
        }
        Relationships: []
      }
      creative_feature_snapshots: {
        Row: {
          ad_account_id: string
          ad_id: string | null
          adset_id: string | null
          body_text: string | null
          business_id: string
          campaign_id: string | null
          created_at: string
          creative_id: string
          cta_type: string | null
          feature_json: Json
          has_branding: boolean | null
          has_discount: boolean | null
          has_price: boolean | null
          has_social_proof: boolean | null
          has_testimonial: boolean | null
          has_urgency: boolean | null
          headline_text: string | null
          hook_style: string | null
          id: string
          landing_page_type: string | null
          message_angle_tags: string[]
          offer_type: string | null
          primary_format: string | null
          snapshot_date: string
          visual_style_tags: string[]
        }
        Insert: {
          ad_account_id: string
          ad_id?: string | null
          adset_id?: string | null
          body_text?: string | null
          business_id: string
          campaign_id?: string | null
          created_at?: string
          creative_id: string
          cta_type?: string | null
          feature_json?: Json
          has_branding?: boolean | null
          has_discount?: boolean | null
          has_price?: boolean | null
          has_social_proof?: boolean | null
          has_testimonial?: boolean | null
          has_urgency?: boolean | null
          headline_text?: string | null
          hook_style?: string | null
          id?: string
          landing_page_type?: string | null
          message_angle_tags?: string[]
          offer_type?: string | null
          primary_format?: string | null
          snapshot_date?: string
          visual_style_tags?: string[]
        }
        Update: {
          ad_account_id?: string
          ad_id?: string | null
          adset_id?: string | null
          body_text?: string | null
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          creative_id?: string
          cta_type?: string | null
          feature_json?: Json
          has_branding?: boolean | null
          has_discount?: boolean | null
          has_price?: boolean | null
          has_social_proof?: boolean | null
          has_testimonial?: boolean | null
          has_urgency?: boolean | null
          headline_text?: string | null
          hook_style?: string | null
          id?: string
          landing_page_type?: string | null
          message_angle_tags?: string[]
          offer_type?: string | null
          primary_format?: string | null
          snapshot_date?: string
          visual_style_tags?: string[]
        }
        Relationships: []
      }
      trend_findings: {
        Row: {
          ad_account_id: string
          ad_id: string | null
          adset_id: string | null
          business_id: string
          campaign_id: string | null
          confidence: string
          converted_to_queue_at: string | null
          created_at: string
          dedupe_key: string
          detected_at: string
          dismissed_at: string | null
          finding_type: string
          first_detected_at: string
          id: string
          last_detected_at: string
          metric_snapshot_json: Json
          platform_integration_id: string
          reason: string | null
          recommended_action_json: Json
          resolved_at: string | null
          severity: string
          snapshot_hash: string
          source: string
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          ad_id?: string | null
          adset_id?: string | null
          business_id: string
          campaign_id?: string | null
          confidence?: string
          converted_to_queue_at?: string | null
          created_at?: string
          dedupe_key: string
          detected_at?: string
          dismissed_at?: string | null
          finding_type: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          metric_snapshot_json?: Json
          platform_integration_id: string
          reason?: string | null
          recommended_action_json?: Json
          resolved_at?: string | null
          severity?: string
          snapshot_hash: string
          source?: string
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          ad_id?: string | null
          adset_id?: string | null
          business_id?: string
          campaign_id?: string | null
          confidence?: string
          converted_to_queue_at?: string | null
          created_at?: string
          dedupe_key?: string
          detected_at?: string
          dismissed_at?: string | null
          finding_type?: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          metric_snapshot_json?: Json
          platform_integration_id?: string
          reason?: string | null
          recommended_action_json?: Json
          resolved_at?: string | null
          severity?: string
          snapshot_hash?: string
          source?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_sync_jobs: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          ad_account_id: string
          ads_synced: number
          adsets_synced: number
          business_id: string
          campaigns_synced: number
          created_at: string
          creatives_synced: number
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json
          performance_rows_synced: number
          platform_integration_id: string
          requested_end_date: string | null
          requested_start_date: string | null
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          ad_account_id: string
          ads_synced?: number
          adsets_synced?: number
          business_id: string
          campaigns_synced?: number
          created_at?: string
          creatives_synced?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          performance_rows_synced?: number
          platform_integration_id: string
          requested_end_date?: string | null
          requested_start_date?: string | null
          started_at?: string | null
          status?: string
          sync_type: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          ad_account_id?: string
          ads_synced?: number
          adsets_synced?: number
          business_id?: string
          campaigns_synced?: number
          created_at?: string
          creatives_synced?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          performance_rows_synced?: number
          platform_integration_id?: string
          requested_end_date?: string | null
          requested_start_date?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_sync_jobs_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_sync_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_sync_jobs_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_account_intelligence_snapshots: {
        Row: {
          ad_account_id: string
          business_id: string
          created_at: string
          id: string
          snapshot_json: Json
          snapshot_month: string
        }
        Insert: {
          ad_account_id: string
          business_id: string
          created_at?: string
          id?: string
          snapshot_json?: Json
          snapshot_month: string
        }
        Update: {
          ad_account_id?: string
          business_id?: string
          created_at?: string
          id?: string
          snapshot_json?: Json
          snapshot_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_intelligence_snapshots_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_intelligence_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_account_performance_monthly: {
        Row: {
          ad_account_id: string
          calls: number
          clicks: number
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          frequency: number | null
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          month_start: string
          reach: number
          spend: number
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          frequency?: number | null
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          month_start: string
          reach?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          frequency?: number | null
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          month_start?: string
          reach?: number
          spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_performance_monthly_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_account_signals: {
        Row: {
          ad_account_id: string | null
          business_id: string
          created_at: string
          detected_at: string
          evidence_json: Json
          first_detected_at: string
          id: string
          last_detected_at: string
          payload_json: Json
          platform_integration_id: string | null
          reason: string
          recommended_action_json: Json
          resolved_at: string | null
          severity: string
          signal_type: string
          source_assessment_id: string | null
          source_digest_hash: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_account_id?: string | null
          business_id: string
          created_at?: string
          detected_at?: string
          evidence_json?: Json
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          payload_json?: Json
          platform_integration_id?: string | null
          reason: string
          recommended_action_json?: Json
          resolved_at?: string | null
          severity?: string
          signal_type: string
          source_assessment_id?: string | null
          source_digest_hash: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string
          created_at?: string
          detected_at?: string
          evidence_json?: Json
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          payload_json?: Json
          platform_integration_id?: string | null
          reason?: string
          recommended_action_json?: Json
          resolved_at?: string | null
          severity?: string
          signal_type?: string
          source_assessment_id?: string | null
          source_digest_hash?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_signals_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_signals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_signals_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_account_sync_state: {
        Row: {
          ad_account_id: string
          created_at: string
          dimensions_synced_at: string | null
          first_activity_date: string | null
          first_full_sync_at: string | null
          first_full_sync_completed: boolean
          has_meaningful_history: boolean
          historical_data_available: boolean
          id: string
          insights_synced_through: string | null
          last_failed_sync_job_id: string | null
          last_incremental_sync_at: string | null
          last_successful_sync_job_id: string | null
          latest_activity_date: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          created_at?: string
          dimensions_synced_at?: string | null
          first_activity_date?: string | null
          first_full_sync_at?: string | null
          first_full_sync_completed?: boolean
          has_meaningful_history?: boolean
          historical_data_available?: boolean
          id?: string
          insights_synced_through?: string | null
          last_failed_sync_job_id?: string | null
          last_incremental_sync_at?: string | null
          last_successful_sync_job_id?: string | null
          latest_activity_date?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          created_at?: string
          dimensions_synced_at?: string | null
          first_activity_date?: string | null
          first_full_sync_at?: string | null
          first_full_sync_completed?: boolean
          has_meaningful_history?: boolean
          historical_data_available?: boolean
          id?: string
          insights_synced_through?: string | null
          last_failed_sync_job_id?: string | null
          last_incremental_sync_at?: string | null
          last_successful_sync_job_id?: string | null
          latest_activity_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_sync_state_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: true
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_sync_state_last_failed_sync_job_id_fkey"
            columns: ["last_failed_sync_job_id"]
            isOneToOne: false
            referencedRelation: "account_sync_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_sync_state_last_successful_sync_job_id_fkey"
            columns: ["last_successful_sync_job_id"]
            isOneToOne: false
            referencedRelation: "account_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          business_id: string
          created_at: string
          currency_code: string | null
          external_account_id: string
          id: string
          last_synced: string | null
          name: string | null
          platform_id: string
          status: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency_code?: string | null
          external_account_id: string
          id?: string
          last_synced?: string | null
          name?: string | null
          platform_id: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency_code?: string | null
          external_account_id?: string
          id?: string
          last_synced?: string | null
          name?: string | null
          platform_id?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_audience_breakdowns_summary: {
        Row: {
          ad_account_id: string
          breakdown_type: string
          calls: number
          clicks: number
          created_at: string
          currency_code: string | null
          dimension_1_key: string
          dimension_1_value: string
          dimension_2_key: string
          dimension_2_value: string
          entity_id: string
          entity_level: string
          first_day: string | null
          id: string
          impression_device: string | null
          impressions: number
          inline_link_clicks: number
          last_day: string | null
          leads: number
          messages: number
          objective: string | null
          platform_position: string | null
          publisher_platform: string | null
          reach: number
          source: string
          spend: number
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          breakdown_type: string
          calls?: number
          clicks?: number
          created_at?: string
          currency_code?: string | null
          dimension_1_key: string
          dimension_1_value: string
          dimension_2_key?: string
          dimension_2_value?: string
          entity_id: string
          entity_level: string
          first_day?: string | null
          id?: string
          impression_device?: string | null
          impressions?: number
          inline_link_clicks?: number
          last_day?: string | null
          leads?: number
          messages?: number
          objective?: string | null
          platform_position?: string | null
          publisher_platform?: string | null
          reach?: number
          source?: string
          spend?: number
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          breakdown_type?: string
          calls?: number
          clicks?: number
          created_at?: string
          currency_code?: string | null
          dimension_1_key?: string
          dimension_1_value?: string
          dimension_2_key?: string
          dimension_2_value?: string
          entity_id?: string
          entity_level?: string
          first_day?: string | null
          id?: string
          impression_device?: string | null
          impressions?: number
          inline_link_clicks?: number
          last_day?: string | null
          leads?: number
          messages?: number
          objective?: string | null
          platform_position?: string | null
          publisher_platform?: string | null
          reach?: number
          source?: string
          spend?: number
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_audience_breakdowns_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          ad_account_id: string
          asset_feed_spec: Json
          business_id: string
          created_at: string
          creative_type: string | null
          cta_type: string | null
          description: string | null
          headline: string | null
          id: string
          image_hash: string | null
          image_url: string | null
          instagram_actor_id: string | null
          link_url: string | null
          name: string | null
          object_story_id: string | null
          object_story_spec: Json
          page_id: string | null
          platform_creative_id: string
          platform_integration_id: string | null
          primary_text: string | null
          raw: Json
          thumbnail_url: string | null
          updated_at: string
          video_id: string | null
        }
        Insert: {
          ad_account_id: string
          asset_feed_spec?: Json
          business_id: string
          created_at?: string
          creative_type?: string | null
          cta_type?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          instagram_actor_id?: string | null
          link_url?: string | null
          name?: string | null
          object_story_id?: string | null
          object_story_spec?: Json
          page_id?: string | null
          platform_creative_id: string
          platform_integration_id?: string | null
          primary_text?: string | null
          raw?: Json
          thumbnail_url?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          ad_account_id?: string
          asset_feed_spec?: Json
          business_id?: string
          created_at?: string
          creative_type?: string | null
          cta_type?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          instagram_actor_id?: string | null
          link_url?: string | null
          name?: string | null
          object_story_id?: string | null
          object_story_spec?: Json
          page_id?: string | null
          platform_creative_id?: string
          platform_integration_id?: string | null
          primary_text?: string | null
          raw?: Json
          thumbnail_url?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entities: {
        Row: {
          ad_account_id: string
          adset_id: string | null
          business_id: string
          campaign_id: string | null
          created_at: string
          created_time: string | null
          creative_external_id: string | null
          entity_level: string
          external_id: string
          id: string
          name: string | null
          objective: string | null
          optimization_goal: string | null
          parent_external_id: string | null
          parent_id: string | null
          platform_id: string
          platform_integration_id: string | null
          raw: Json
          status: string | null
          updated_at: string
          updated_time: string | null
        }
        Insert: {
          ad_account_id: string
          adset_id?: string | null
          business_id: string
          campaign_id?: string | null
          created_at?: string
          created_time?: string | null
          creative_external_id?: string | null
          entity_level: string
          external_id: string
          id?: string
          name?: string | null
          objective?: string | null
          optimization_goal?: string | null
          parent_external_id?: string | null
          parent_id?: string | null
          platform_id: string
          platform_integration_id?: string | null
          raw?: Json
          status?: string | null
          updated_at?: string
          updated_time?: string | null
        }
        Update: {
          ad_account_id?: string
          adset_id?: string | null
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          created_time?: string | null
          creative_external_id?: string | null
          entity_level?: string
          external_id?: string
          id?: string
          name?: string | null
          objective?: string | null
          optimization_goal?: string | null
          parent_external_id?: string | null
          parent_id?: string | null
          platform_id?: string
          platform_integration_id?: string | null
          raw?: Json
          status?: string | null
          updated_at?: string
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_performance_daily: {
        Row: {
          ad_account_id: string
          calls: number
          clicks: number
          created_at: string
          currency_code: string | null
          day: string
          entity_id: string
          entity_level: string
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          objective: string | null
          reach: number
          source: string
          spend: number
          status: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          calls?: number
          clicks?: number
          created_at?: string
          currency_code?: string | null
          day: string
          entity_id: string
          entity_level: string
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          calls?: number
          clicks?: number
          created_at?: string
          currency_code?: string | null
          day?: string
          entity_id?: string
          entity_level?: string
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_performance_hourly: {
        Row: {
          ad_account_id: string
          advertiser_time_bucket: string | null
          calls: number
          clicks: number
          cpc: number
          cpm: number
          created_at: string
          ctr: number
          currency_code: string | null
          day: string
          day_of_week: number | null
          entity_id: string
          entity_level: string
          hour_of_day: number
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          objective: string | null
          reach: number
          source: string
          spend: number
          time_basis: string
          updated_at: string
          week_start: string | null
        }
        Insert: {
          ad_account_id: string
          advertiser_time_bucket?: string | null
          calls?: number
          clicks?: number
          cpc?: number
          cpm?: number
          created_at?: string
          ctr?: number
          currency_code?: string | null
          day: string
          day_of_week?: number | null
          entity_id: string
          entity_level: string
          hour_of_day: number
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          time_basis?: string
          updated_at?: string
          week_start?: string | null
        }
        Update: {
          ad_account_id?: string
          advertiser_time_bucket?: string | null
          calls?: number
          clicks?: number
          cpc?: number
          cpm?: number
          created_at?: string
          ctr?: number
          currency_code?: string | null
          day?: string
          day_of_week?: number | null
          entity_id?: string
          entity_level?: string
          hour_of_day?: number
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          time_basis?: string
          updated_at?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entity_performance_hourly_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_performance_monthly: {
        Row: {
          ad_account_id: string
          calls: number
          clicks: number
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          currency_code: string | null
          entity_id: string
          entity_level: string
          frequency: number | null
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          month_start: string
          objective: string | null
          reach: number
          source: string
          spend: number
          status: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          currency_code?: string | null
          entity_id: string
          entity_level: string
          frequency?: number | null
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          month_start: string
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          currency_code?: string | null
          entity_id?: string
          entity_level?: string
          frequency?: number | null
          impressions?: number
          inline_link_clicks?: number
          leads?: number
          messages?: number
          month_start?: string
          objective?: string | null
          reach?: number
          source?: string
          spend?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_entity_performance_monthly_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_monthly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_monthly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_monthly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_monthly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_performance_summary: {
        Row: {
          ad_account_id: string
          best_day: string | null
          calls: number
          clicks: number
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          entity_id: string
          entity_level: string
          first_day: string | null
          frequency: number | null
          history_status: string
          impressions: number
          inline_link_clicks: number
          last_day: string | null
          leads: number
          messages: number
          reach: number
          spend: number
          summary_source: string
          synced_at: string | null
          updated_at: string
          worst_day: string | null
        }
        Insert: {
          ad_account_id: string
          best_day?: string | null
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          entity_id: string
          entity_level: string
          first_day?: string | null
          frequency?: number | null
          history_status?: string
          impressions?: number
          inline_link_clicks?: number
          last_day?: string | null
          leads?: number
          messages?: number
          reach?: number
          spend?: number
          summary_source?: string
          synced_at?: string | null
          updated_at?: string
          worst_day?: string | null
        }
        Update: {
          ad_account_id?: string
          best_day?: string | null
          calls?: number
          clicks?: number
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          entity_id?: string
          entity_level?: string
          first_day?: string | null
          frequency?: number | null
          history_status?: string
          impressions?: number
          inline_link_clicks?: number
          last_day?: string | null
          leads?: number
          messages?: number
          reach?: number
          spend?: number
          summary_source?: string
          synced_at?: string | null
          updated_at?: string
          worst_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entity_performance_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      business_data_policies: {
        Row: {
          allow_ad_level_audience: boolean
          allow_ad_level_hourly: boolean
          allowed_breakdowns: string[]
          audience_history_days: number
          business_id: string
          created_at: string
          daily_history_days: number
          hourly_history_days: number
          id: string
          include_audience_breakdowns: boolean
          include_hourly_breakdowns: boolean
          intelligence_retention_months: number
          manual_refresh_limit_per_day: number
          max_ad_accounts: number
          plan_key: string
          retention_months: number
          updated_at: string
        }
        Insert: {
          allow_ad_level_audience?: boolean
          allow_ad_level_hourly?: boolean
          allowed_breakdowns?: string[]
          audience_history_days?: number
          business_id: string
          created_at?: string
          daily_history_days?: number
          hourly_history_days?: number
          id?: string
          include_audience_breakdowns?: boolean
          include_hourly_breakdowns?: boolean
          intelligence_retention_months?: number
          manual_refresh_limit_per_day?: number
          max_ad_accounts?: number
          plan_key?: string
          retention_months?: number
          updated_at?: string
        }
        Update: {
          allow_ad_level_audience?: boolean
          allow_ad_level_hourly?: boolean
          allowed_breakdowns?: string[]
          audience_history_days?: number
          business_id?: string
          created_at?: string
          daily_history_days?: number
          hourly_history_days?: number
          id?: string
          include_audience_breakdowns?: boolean
          include_hourly_breakdowns?: boolean
          intelligence_retention_months?: number
          manual_refresh_limit_per_day?: number
          max_ad_accounts?: number
          plan_key?: string
          retention_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_data_policies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          ad_goals: string[] | null
          average_customer_value: string | null
          booking_link: string | null
          business_location: string | null
          business_name: string
          created_at: string
          customer_radius: string | null
          description: string | null
          id: string
          industry: string | null
          lead_quality_signal: string | null
          lead_type: string | null
          meta_ads_status: string | null
          meta_page_id: string | null
          meta_page_instagram_account_id: string | null
          meta_page_instagram_account_name: string | null
          meta_page_instagram_account_picture_url: string | null
          meta_page_instagram_account_username: string | null
          meta_page_name: string | null
          meta_page_picture_url: string | null
          monthly_budget: string | null
          most_valuable_service: string | null
          onboarding_completed: boolean
          onboarding_step: number
          organization_id: string | null
          page_phone: string | null
          preferred_contact_method: string | null
          preferred_platforms: string[] | null
          primary_goal: string | null
          promoted_services: string[] | null
          recommendation_style: string | null
          safety_preference: string | null
          target_cost_per_lead: string | null
          updated_at: string
          watch_signals: string[] | null
          website: string | null
          whatsapp_number: string | null
          whatsapp_number_source: string | null
          whatsapp_setup_completed: boolean
        }
        Insert: {
          ad_goals?: string[] | null
          average_customer_value?: string | null
          booking_link?: string | null
          business_location?: string | null
          business_name: string
          created_at?: string
          customer_radius?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          lead_quality_signal?: string | null
          lead_type?: string | null
          meta_ads_status?: string | null
          meta_page_id?: string | null
          meta_page_instagram_account_id?: string | null
          meta_page_instagram_account_name?: string | null
          meta_page_instagram_account_picture_url?: string | null
          meta_page_instagram_account_username?: string | null
          meta_page_name?: string | null
          meta_page_picture_url?: string | null
          monthly_budget?: string | null
          most_valuable_service?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          organization_id?: string | null
          page_phone?: string | null
          preferred_contact_method?: string | null
          preferred_platforms?: string[] | null
          primary_goal?: string | null
          promoted_services?: string[] | null
          recommendation_style?: string | null
          safety_preference?: string | null
          target_cost_per_lead?: string | null
          updated_at?: string
          watch_signals?: string[] | null
          website?: string | null
          whatsapp_number?: string | null
          whatsapp_number_source?: string | null
          whatsapp_setup_completed?: boolean
        }
        Update: {
          ad_goals?: string[] | null
          average_customer_value?: string | null
          booking_link?: string | null
          business_location?: string | null
          business_name?: string
          created_at?: string
          customer_radius?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          lead_quality_signal?: string | null
          lead_type?: string | null
          meta_ads_status?: string | null
          meta_page_id?: string | null
          meta_page_instagram_account_id?: string | null
          meta_page_instagram_account_name?: string | null
          meta_page_instagram_account_picture_url?: string | null
          meta_page_instagram_account_username?: string | null
          meta_page_name?: string | null
          meta_page_picture_url?: string | null
          monthly_budget?: string | null
          most_valuable_service?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          organization_id?: string | null
          page_phone?: string | null
          preferred_contact_method?: string | null
          preferred_platforms?: string[] | null
          primary_goal?: string | null
          promoted_services?: string[] | null
          recommendation_style?: string | null
          safety_preference?: string | null
          target_cost_per_lead?: string | null
          updated_at?: string
          watch_signals?: string[] | null
          website?: string | null
          whatsapp_number?: string | null
          whatsapp_number_source?: string | null
          whatsapp_setup_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_queue_items: {
        Row: {
          ad_account_id: string
          business_id: string
          campaign_draft_id: string | null
          child_blueprints_json: Json
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          destination_href: string | null
          dismissed_at: string | null
          due_date: string | null
          id: string
          item_type: string
          materialized_from_blueprint_key: string | null
          parent_queue_item_id: string | null
          payload_json: Json
          platform_integration_id: string
          priority: string
          scheduled_for: string | null
          source_signal_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          updated_by_user_id: string | null
          workflow_key: string | null
        }
        Insert: {
          ad_account_id: string
          business_id: string
          campaign_draft_id?: string | null
          child_blueprints_json?: Json
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          destination_href?: string | null
          dismissed_at?: string | null
          due_date?: string | null
          id?: string
          item_type?: string
          materialized_from_blueprint_key?: string | null
          parent_queue_item_id?: string | null
          payload_json?: Json
          platform_integration_id: string
          priority?: string
          scheduled_for?: string | null
          source_signal_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          updated_by_user_id?: string | null
          workflow_key?: string | null
        }
        Update: {
          ad_account_id?: string
          business_id?: string
          campaign_draft_id?: string | null
          child_blueprints_json?: Json
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          destination_href?: string | null
          dismissed_at?: string | null
          due_date?: string | null
          id?: string
          item_type?: string
          materialized_from_blueprint_key?: string | null
          parent_queue_item_id?: string | null
          payload_json?: Json
          platform_integration_id?: string
          priority?: string
          scheduled_for?: string | null
          source_signal_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by_user_id?: string | null
          workflow_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_queue_items_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_queue_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_queue_items_parent_queue_item_id_fkey"
            columns: ["parent_queue_item_id"]
            isOneToOne: false
            referencedRelation: "calendar_queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_queue_items_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_queue_templates: {
        Row: {
          ad_account_id: string | null
          business_id: string | null
          created_at: string
          id: string
          is_enabled: boolean
          item_type: string
          payload_json: Json
          template_key: string
          title: string
          updated_at: string
        }
        Insert: {
          ad_account_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          item_type?: string
          payload_json?: Json
          template_key: string
          title: string
          updated_at?: string
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          item_type?: string
          payload_json?: Json
          template_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_queue_templates_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_queue_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_drafts: {
        Row: {
          ad_account_id: string | null
          business_id: string
          created_at: string
          created_by_user_id: string | null
          draft_json: Json
          id: string
          payload_json: Json
          platform_integration_id: string | null
          review_notes: string | null
          source_action_id: string | null
          status: string
          title: string
          updated_at: string
          updated_by_user_id: string | null
          version: number
        }
        Insert: {
          ad_account_id?: string | null
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          draft_json?: Json
          id?: string
          payload_json?: Json
          platform_integration_id?: string | null
          review_notes?: string | null
          source_action_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by_user_id?: string | null
          version?: number
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          draft_json?: Json
          id?: string
          payload_json?: Json
          platform_integration_id?: string | null
          review_notes?: string | null
          source_action_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by_user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_drafts_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_drafts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_drafts_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_job_progress: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          job_id: string
          progress_json: Json
          status: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          job_id: string
          progress_json?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          job_id?: string
          progress_json?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_job_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_workspace_credentials: {
        Row: {
          business_id: string
          client_id: string
          client_secret_secret_id: string
          configured_by_user_id: string | null
          created_at: string
          developer_token_secret_id: string
          login_customer_id: string | null
          scopes: string
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          client_secret_secret_id: string
          configured_by_user_id?: string | null
          created_at?: string
          developer_token_secret_id: string
          login_customer_id?: string | null
          scopes?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          client_secret_secret_id?: string
          configured_by_user_id?: string | null
          created_at?: string
          developer_token_secret_id?: string
          login_customer_id?: string | null
          scopes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_workspace_credentials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_pages: {
        Row: {
          business_id: string
          created_at: string
          id: string
          instagram_business_account_id: string | null
          name: string | null
          page_id: string
          platform_integration_id: string | null
          raw: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          instagram_business_account_id?: string | null
          name?: string | null
          page_id: string
          platform_integration_id?: string | null
          raw?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          instagram_business_account_id?: string | null
          name?: string | null
          page_id?: string
          platform_integration_id?: string | null
          raw?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_pages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_pages_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          notification_id: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          preferences_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferences_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferences_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          business_id: string
          created_at: string
          dedupe_key: string | null
          id: string
          link: string | null
          message: string
          payload_json: Json
          read: boolean
          read_at: string | null
          severity: string
          source_id: string | null
          source_type: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          link?: string | null
          message: string
          payload_json?: Json
          read?: boolean
          read_at?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          link?: string | null
          message?: string
          payload_json?: Json
          read?: boolean
          read_at?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          id: string
          platform_id: string
          return_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at: string
          id?: string
          platform_id: string
          return_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          platform_id?: string
          return_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          primary_language: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          primary_language?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          primary_language?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          status: string
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_integrations: {
        Row: {
          access_token_secret_id: string | null
          business_id: string
          connected_at: string | null
          connected_by_user_id: string | null
          created_at: string
          disconnected_at: string | null
          id: string
          integration_details: Json
          last_error: string | null
          last_synced_at: string | null
          platform_id: string
          refresh_token_secret_id: string | null
          scopes: string[]
          status: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_secret_id?: string | null
          business_id: string
          connected_at?: string | null
          connected_by_user_id?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          integration_details?: Json
          last_error?: string | null
          last_synced_at?: string | null
          platform_id: string
          refresh_token_secret_id?: string | null
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_secret_id?: string | null
          business_id?: string
          connected_at?: string | null
          connected_by_user_id?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          integration_details?: Json
          last_error?: string | null
          last_synced_at?: string | null
          platform_id?: string
          refresh_token_secret_id?: string | null
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_integrations_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_token_secrets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          api_info: Json
          created_at: string
          id: string
          is_enabled: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          api_info?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          api_info?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recomendations: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          id: string
          payload_json: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payload_json?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payload_json?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_subscriptions: {
        Row: {
          ad_account_id: string | null
          business_id: string
          created_at: string
          id: string
          is_enabled: boolean
          report_type: string
          schedule_json: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ad_account_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          report_type?: string
          schedule_json?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          report_type?: string
          schedule_json?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_subscriptions_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string
          id: string
          last_name?: string
          phone_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ad_dims: {
        Row: {
          ad_account_id: string | null
          adset_external_id: string | null
          adset_id: string | null
          business_id: string | null
          campaign_id: string | null
          created_at: string | null
          created_time: string | null
          creative_id: string | null
          external_id: string | null
          id: string | null
          name: string | null
          platform_id: string | null
          platform_integration_id: string | null
          raw: Json | null
          status: string | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          ad_account_id?: string | null
          adset_external_id?: string | null
          adset_id?: string | null
          business_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_time?: string | null
          creative_id?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          ad_account_id?: string | null
          adset_external_id?: string | null
          adset_id?: string | null
          business_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_time?: string | null
          creative_id?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_performance_summary_enriched: {
        Row: {
          ad_account_id: string | null
          adset_id: string | null
          best_day: string | null
          business_id: string | null
          calls: number | null
          campaign_id: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          entity_id: string | null
          entity_level: string | null
          external_id: string | null
          first_day: string | null
          frequency: number | null
          history_status: string | null
          impressions: number | null
          inline_link_clicks: number | null
          last_day: string | null
          leads: number | null
          messages: number | null
          name: string | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          summary_source: string | null
          synced_at: string | null
          updated_at: string | null
          worst_day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entity_report_daily_v: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_performance_summary: {
        Row: {
          ad_account_id: string | null
          adset_id: string | null
          best_day: string | null
          business_id: string | null
          calls: number | null
          campaign_id: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          entity_id: string | null
          entity_level: string | null
          external_id: string | null
          first_day: string | null
          frequency: number | null
          history_status: string | null
          impressions: number | null
          inline_link_clicks: number | null
          last_day: string | null
          leads: number | null
          messages: number | null
          name: string | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          summary_source: string | null
          synced_at: string | null
          updated_at: string | null
          worst_day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      adset_dims: {
        Row: {
          ad_account_id: string | null
          business_id: string | null
          campaign_external_id: string | null
          campaign_id: string | null
          created_at: string | null
          created_time: string | null
          external_id: string | null
          id: string | null
          name: string | null
          optimization_goal: string | null
          platform_id: string | null
          platform_integration_id: string | null
          raw: Json | null
          status: string | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          ad_account_id?: string | null
          business_id?: string | null
          campaign_external_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_time?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          optimization_goal?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string | null
          campaign_external_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_time?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          optimization_goal?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      adset_performance_summary: {
        Row: {
          ad_account_id: string | null
          adset_id: string | null
          best_day: string | null
          business_id: string | null
          calls: number | null
          campaign_id: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          entity_id: string | null
          entity_level: string | null
          external_id: string | null
          first_day: string | null
          frequency: number | null
          history_status: string | null
          impressions: number | null
          inline_link_clicks: number | null
          last_day: string | null
          leads: number | null
          messages: number | null
          name: string | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          summary_source: string | null
          synced_at: string | null
          updated_at: string | null
          worst_day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      adsets_performance_daily: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_dims: {
        Row: {
          ad_account_id: string | null
          business_id: string | null
          created_at: string | null
          created_time: string | null
          external_id: string | null
          id: string | null
          name: string | null
          objective: string | null
          platform_id: string | null
          platform_integration_id: string | null
          raw: Json | null
          status: string | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          ad_account_id?: string | null
          business_id?: string | null
          created_at?: string | null
          created_time?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          objective?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          ad_account_id?: string | null
          business_id?: string | null
          created_at?: string | null
          created_time?: string | null
          external_id?: string | null
          id?: string | null
          name?: string | null
          objective?: string | null
          platform_id?: string | null
          platform_integration_id?: string | null
          raw?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_performance_summary: {
        Row: {
          ad_account_id: string | null
          adset_id: string | null
          best_day: string | null
          business_id: string | null
          calls: number | null
          campaign_id: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          entity_id: string | null
          entity_level: string | null
          external_id: string | null
          first_day: string | null
          frequency: number | null
          history_status: string | null
          impressions: number | null
          inline_link_clicks: number | null
          last_day: string | null
          leads: number | null
          messages: number | null
          name: string | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          summary_source: string | null
          synced_at: string | null
          updated_at: string | null
          worst_day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns_performance_daily: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_audience_breakdowns_daily: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          breakdown_type: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          created_at: string | null
          currency_code: string | null
          dimension_1_key: string | null
          dimension_1_value: string | null
          dimension_2_key: string | null
          dimension_2_value: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          first_day: string | null
          id: string | null
          impression_device: string | null
          impressions: number | null
          inline_link_clicks: number | null
          last_day: string | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_position: string | null
          publisher_platform: string | null
          reach: number | null
          source: string | null
          spend: number | null
          synced_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_audience_breakdowns_summary_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_audience_breakdowns_summary_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_hourly_performance: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          advertiser_time_bucket: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          day_of_week: number | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          hour_of_day: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          reach: number | null
          source: string | null
          spend: number | null
          time_basis: string | null
          updated_at: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_hourly_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      report_ad_daily_v: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      report_adset_daily_v: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      report_campaign_daily_v: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
      report_entity_daily_v: {
        Row: {
          ad_account_id: string | null
          ad_external_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_external_id: string | null
          adset_id: string | null
          adset_name: string | null
          business_id: string | null
          calls: number | null
          campaign_external_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          currency_code: string | null
          day: string | null
          entity_external_id: string | null
          entity_id: string | null
          entity_level: string | null
          entity_name: string | null
          frequency: number | null
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          messages: number | null
          objective: string | null
          platform_id: string | null
          reach: number | null
          results: number | null
          source: string | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entities_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "ad_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "adset_dims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_entity_performance_daily_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "campaign_dims"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_calendar_queue_workflow: {
        Args: { p_queue_item_id: string; p_user_id?: string }
        Returns: {
          ad_account_id: string
          business_id: string
          campaign_draft_id: string | null
          child_blueprints_json: Json
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          destination_href: string | null
          dismissed_at: string | null
          due_date: string | null
          id: string
          item_type: string
          materialized_from_blueprint_key: string | null
          parent_queue_item_id: string | null
          payload_json: Json
          platform_integration_id: string
          priority: string
          scheduled_for: string | null
          source_signal_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          updated_by_user_id: string | null
          workflow_key: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "calendar_queue_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      can_access_business: { Args: { p_business_id: string }; Returns: boolean }
      can_manage_business: { Args: { p_business_id: string }; Returns: boolean }
      claim_account_sync_job: {
        Args: { allowed_sync_types?: string[]; target_job_id?: string }
        Returns: {
          actual_end_date: string | null
          actual_start_date: string | null
          ad_account_id: string
          ads_synced: number
          adsets_synced: number
          business_id: string
          campaigns_synced: number
          created_at: string
          creatives_synced: number
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json
          performance_rows_synced: number
          platform_integration_id: string
          requested_end_date: string | null
          requested_start_date: string | null
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "account_sync_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_organization_with_owner: {
        Args: {
          org_name: string
          org_primary_language?: string
          org_type: Database["public"]["Enums"]["organization_type"]
        }
        Returns: string
      }
      get_org_role: {
        Args: { p_organization_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_platform_token: { Args: { secret_id: string }; Returns: string }
      get_report_breakdown_rows: {
        Args: {
          p_ad_account_ids: string[]
          p_adset_external_ids?: string[]
          p_campaign_external_ids?: string[]
          p_date_from: string
          p_date_to: string
          p_entity_external_ids?: string[]
          p_entity_level: string
        }
        Returns: {
          ad_account_id: string
          adset_external_id: string
          adset_name: string
          calls: number
          campaign_external_id: string
          campaign_name: string
          clicks: number
          currency_code: string
          end_date: string
          entity_external_id: string
          entity_id: string
          entity_level: string
          entity_name: string
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          objective: string
          reach: number
          spend: number
          start_date: string
          status: string
        }[]
      }
      get_report_metric_rows: {
        Args: {
          p_ad_account_ids: string[]
          p_adset_external_ids?: string[]
          p_campaign_external_ids?: string[]
          p_date_from: string
          p_date_to: string
          p_entity_external_ids?: string[]
          p_entity_level: string
        }
        Returns: {
          calls: number
          clicks: number
          currency_code: string
          day: string
          impressions: number
          inline_link_clicks: number
          leads: number
          messages: number
          reach: number
          spend: number
        }[]
      }
      store_platform_token: {
        Args: {
          secret_description?: string
          secret_name: string
          secret_value: string
        }
        Returns: string
      }
      upsert_platform_token: {
        Args: {
          secret_description?: string
          secret_name: string
          secret_value: string
        }
        Returns: string
      }
    }
    Enums: {
      org_role: "owner" | "admin" | "member" | "viewer"
      organization_type: "agency" | "business"
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
  ai: {
    Enums: {},
  },
  public: {
    Enums: {
      org_role: ["owner", "admin", "member", "viewer"],
      organization_type: ["agency", "business"],
    },
  },
} as const
