/**
 * Confluence Cloud API types
 * Based on Confluence REST API v1
 */

export interface ConfluenceSpace {
  id: string | number;
  key: string;
  name: string;
  type: string;
  status?: string;
  description?: {
    plain?: {
      value: string;
    };
  };
}

export interface ConfluenceAncestor {
  id: string;
  type: string;
  status: string;
  title: string;
}

export interface ConfluencePage {
  id: string;
  type: string;
  status: string;
  title: string;
  space?: {
    id?: number;
    key?: string;
    name?: string;
  };
  ancestors?: ConfluenceAncestor[];
  version?: {
    when: string;
    number: number;
  };
}

export interface ConfluencePageWithBody extends ConfluencePage {
  body?: {
    storage?: {
      value: string;
      representation: string;
    };
  };
}

export interface PageListResponse {
  results: ConfluencePage[];
  start: number;
  limit: number;
  size: number;
  totalSize?: number; // Total count across all pages (CQL search API)
  _links?: {
    next?: string;
  };
}

export interface SpaceListResponse {
  results: ConfluenceSpace[];
  start: number;
  limit: number;
  size: number;
  _links?: {
    next?: string;
  };
}
