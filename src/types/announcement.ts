export interface ParkingAnnouncement {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  price: number;
  first_published_at: string;
  last_seen_at: string;
  removed_at?: string;
  total_days_online: number;
  repost_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicationPeriod {
  id: string;
  announcement_id: string;
  published_at: string;
  removed_at?: string;
  days_online: number;
  created_at: string;
}

export interface ImportLog {
  id: string;
  import_date: string;
  announcements_found: number;
  new_announcements: number;
  updated_announcements: number;
  html_content?: string;
  created_at: string;
}

export interface ParsedAnnouncement {
  title: string;
  address: string;
  neighborhood: string;
  price: number;
}

export const ANGERS_NEIGHBORHOODS = [
  'Centre-ville',
  'La Fayette',
  'Lac-de-Maine',
  'Belle-Beille',
  'Monplaisir',
  'Justices',
  'Doutre',
  'Hauts-de-Chaises',
  'Roseraie',
  'Grand-Pigeon',
  'Autres'
] as const;

export type AngersNeighborhood = typeof ANGERS_NEIGHBORHOODS[number];