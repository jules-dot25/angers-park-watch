import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Calendar, Euro, RotateCcw, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ParkingAnnouncement, ANGERS_NEIGHBORHOODS } from '@/types/announcement';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnnouncementsTableProps {
  refreshTrigger: number;
}

export const AnnouncementsTable = ({ refreshTrigger }: AnnouncementsTableProps) => {
  const [announcements, setAnnouncements] = useState<ParkingAnnouncement[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [refreshTrigger]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parking_announcements')
        .select('*')
        .order('first_published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    if (selectedNeighborhood === 'all') {
      return announcements;
    }
    return announcements.filter(announcement => 
      announcement.neighborhood === selectedNeighborhood
    );
  }, [announcements, selectedNeighborhood]);

  const groupedByNeighborhood = useMemo(() => {
    const groups: Record<string, ParkingAnnouncement[]> = {};
    
    filteredAnnouncements.forEach(announcement => {
      if (!groups[announcement.neighborhood]) {
        groups[announcement.neighborhood] = [];
      }
      groups[announcement.neighborhood].push(announcement);
    });

    // Trier les annonces dans chaque groupe par date de première publication
    Object.keys(groups).forEach(neighborhood => {
      groups[neighborhood].sort((a, b) => 
        new Date(b.first_published_at).getTime() - new Date(a.first_published_at).getTime()
      );
    });

    return groups;
  }, [filteredAnnouncements]);

  const calculateDaysOnline = (announcement: ParkingAnnouncement): number => {
    const start = new Date(announcement.first_published_at);
    const end = announcement.removed_at 
      ? new Date(announcement.removed_at) 
      : new Date(announcement.last_seen_at);
    
    return Math.max(0, differenceInDays(end, start));
  };

  const getStatusBadge = (announcement: ParkingAnnouncement) => {
    if (announcement.is_active) {
      return <Badge className="status-active">En ligne</Badge>;
    } else {
      return <Badge className="status-inactive">Supprimée</Badge>;
    }
  };

  const getRepostBadge = (repostCount: number | null) => {
    if (repostCount && repostCount > 0) {
      return <Badge className="status-repost">{repostCount} repost{repostCount > 1 ? 's' : ''}</Badge>;
    }
    return null;
  };

  const activeCount = announcements.filter(a => a.is_active).length;
  const totalCount = announcements.length;
  const neighborhoodCounts = ANGERS_NEIGHBORHOODS.reduce((acc, neighborhood) => {
    acc[neighborhood] = announcements.filter(a => a.neighborhood === neighborhood).length;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Annonces actives</p>
                <p className="text-2xl font-bold text-success">{activeCount}</p>
              </div>
              <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total annonces</p>
                <p className="text-2xl font-bold text-primary">{totalCount}</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prix moyen</p>
                <p className="text-2xl font-bold text-accent">
                  {announcements.length > 0 
                    ? `${Math.round(announcements.reduce((sum, a) => sum + a.price, 0) / announcements.length)}€`
                    : '0€'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Euro className="h-4 w-4 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Annonces de parking à Angers
              </CardTitle>
              <CardDescription>
                {filteredAnnouncements.length} annonce{filteredAnnouncements.length !== 1 ? 's' : ''} 
                {selectedNeighborhood !== 'all' && ` dans le quartier ${selectedNeighborhood}`}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les quartiers</SelectItem>
                  {ANGERS_NEIGHBORHOODS.map(neighborhood => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood} ({neighborhoodCounts[neighborhood] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedNeighborhood === 'all' 
                  ? 'Aucune annonce trouvée. Importez du contenu HTML pour commencer.'
                  : `Aucune annonce trouvée dans le quartier ${selectedNeighborhood}.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByNeighborhood).map(([neighborhood, neighborhoodAnnouncements]) => (
                <div key={neighborhood}>
                  <h3 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">
                    {neighborhood} ({neighborhoodAnnouncements.length})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titre</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Première publication</TableHead>
                          <TableHead>Jours en ligne</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Reposts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {neighborhoodAnnouncements.map((announcement) => (
                          <TableRow key={announcement.id}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {announcement.title}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {announcement.address}
                            </TableCell>
                            <TableCell className="font-semibold text-accent">
                              {announcement.price}€
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(announcement.first_published_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {calculateDaysOnline(announcement)} jour{calculateDaysOnline(announcement) !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(announcement)}
                            </TableCell>
                            <TableCell>
                              {getRepostBadge(announcement.repost_count)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};