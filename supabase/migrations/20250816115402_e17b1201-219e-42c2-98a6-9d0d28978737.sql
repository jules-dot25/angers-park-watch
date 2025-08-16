-- Create table for parking announcements
CREATE TABLE public.parking_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  price INTEGER NOT NULL,
  first_published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removed_at TIMESTAMP WITH TIME ZONE,
  total_days_online INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking publication periods (for reposts)
CREATE TABLE public.publication_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.parking_announcements(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  removed_at TIMESTAMP WITH TIME ZONE,
  days_online INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for import logs
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  announcements_found INTEGER NOT NULL DEFAULT 0,
  new_announcements INTEGER NOT NULL DEFAULT 0,
  updated_announcements INTEGER NOT NULL DEFAULT 0,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (but make it public for now since no auth mentioned)
ALTER TABLE public.parking_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create public policies (allow all operations for now)
CREATE POLICY "Allow all operations on parking_announcements" 
ON public.parking_announcements 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on publication_periods" 
ON public.publication_periods 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on import_logs" 
ON public.import_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_parking_announcements_updated_at
BEFORE UPDATE ON public.parking_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_parking_announcements_neighborhood ON public.parking_announcements(neighborhood);
CREATE INDEX idx_parking_announcements_active ON public.parking_announcements(is_active);
CREATE INDEX idx_parking_announcements_title_address_price ON public.parking_announcements(title, address, price);
CREATE INDEX idx_publication_periods_announcement_id ON public.publication_periods(announcement_id);