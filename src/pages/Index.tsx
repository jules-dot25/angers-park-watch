import { useState } from 'react';
import { ImportSection } from '@/components/ImportSection';
import { AnnouncementsTable } from '@/components/AnnouncementsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, TrendingUp, Clock, RotateCcw } from 'lucide-react';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Angers Park Watch
              </h1>
              <p className="text-muted-foreground mt-1">
                Suivi et analyse des annonces de parkings à Angers
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Leboncoin • Angers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Section d'import */}
        <ImportSection onImportComplete={handleImportComplete} />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dashboard-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Analyse automatique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Extraction automatique des informations : titre, adresse, quartier, prix et dates
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-accent" />
                Détection des reposts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Identification automatique des annonces republiées avec historique complet
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-success/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-success" />
                Suivi temporel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Calcul de la durée en ligne et analyse des patterns de publication
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des annonces */}
        <AnnouncementsTable refreshTrigger={refreshTrigger} />
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Angers Park Watch - Analyse des annonces de parking</p>
            <div className="flex items-center gap-4">
              <span>Quartiers d'Angers couverts</span>
              <div className="flex gap-1">
                {['Centre-ville', 'La Fayette', 'Lac-de-Maine', 'Belle-Beille'].map((quarter, index) => (
                  <span key={quarter} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {quarter}
                  </span>
                ))}
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  +6 autres
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;