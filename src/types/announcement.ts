export interface ParkingAnnouncement {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  price: number;
  first_published_at: string;
  last_seen_at: string;
  removed_at: string | null;
  total_days_online: number | null;
  repost_count: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface PublicationPeriod {
  id: string;
  announcement_id: string;
  published_at: string;
  removed_at: string | null;
  days_online: number | null;
  created_at: string;
}

export interface ImportLog {
  id: string;
  import_date: string;
  announcements_found: number;
  new_announcements: number;
  updated_announcements: number;
  html_content: string | null;
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