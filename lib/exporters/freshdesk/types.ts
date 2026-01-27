/**
 * Freshdesk API response types
 */

export interface FreshdeskCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FreshdeskFolder {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface FreshdeskArticle {
  id: number;
  title: string;
  description: string;
  folder_id: number;
  status: number; // 1 = Draft, 2 = Published
  type: number;
  tags: string[];
  thumbs_up: number;
  thumbs_down: number;
  created_at: string;
  updated_at: string;
  // Language fields - Freshdesk may use either
  language?: string;
  language_code?: string;
}
