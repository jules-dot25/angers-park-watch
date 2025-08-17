import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeboncoinParser } from '@/utils/htmlParser';
import { supabase } from '@/integrations/supabase/client';
import { ParsedAnnouncement, ANGERS_NEIGHBORHOODS } from '@/types/announcement';

interface ImportSectionProps {
  onImportComplete: () => void;
}

export const ImportSection = ({ onImportComplete }: ImportSectionProps) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processAnnouncements = async (parsedAnnouncements: ParsedAnnouncement[]) => {
    let newCount = 0;
    let updatedCount = 0;
    
    for (const parsed of parsedAnnouncements) {
      try {
        // Recherche d'une annonce existante (même titre + adresse + prix)
        const { data: existingAnnouncements } = await supabase
          .from('parking_announcements')
          .select('*')
          .eq('title', parsed.title)
          .eq('address', parsed.address)
          .eq('price', parsed.price);

        if (existingAnnouncements && existingAnnouncements.length > 0) {
          // Annonce existante : mise à jour de last_seen_at
          const existing = existingAnnouncements[0];
          
          if (!existing.is_active) {
            // C'est un repost ! Créer une nouvelle période
            await supabase
              .from('publication_periods')
              .insert({
                announcement_id: existing.id,
                published_at: new Date().toISOString(),
              });
            
            // Mettre à jour l'annonce comme active et incrémenter repost_count
            await supabase
              .from('parking_announcements')
              .update({
                is_active: true,
                last_seen_at: new Date().toISOString(),
                repost_count: (existing.repost_count || 0) + 1,
                removed_at: null
              })
              .eq('id', existing.id);
          } else {
            // Mise à jour simple de last_seen_at
            await supabase
              .from('parking_announcements')
              .update({
                last_seen_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          }
          
          updatedCount++;
        } else {
          // Nouvelle annonce
          const { data: newAnnouncement } = await supabase
            .from('parking_announcements')
            .insert({
              title: parsed.title,
              address: parsed.address,
              neighborhood: parsed.neighborhood,
              price: parsed.price,
              first_published_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              is_active: true,
              repost_count: 0,
              total_days_online: 0
            })
            .select()
            .single();

          if (newAnnouncement) {
            // Créer la première période de publication
            await supabase
              .from('publication_periods')
              .insert({
                announcement_id: newAnnouncement.id,
                published_at: new Date().toISOString(),
              });
          }
          
          newCount++;
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'annonce:', error);
      }
    }

    // Marquer les annonces non vues comme supprimées
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    await supabase
      .from('parking_announcements')
      .update({
        is_active: false,
        removed_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .lt('last_seen_at', oneDayAgo.toISOString());

    return { newCount, updatedCount };
  };

  const handleImport = async () => {
    if (!htmlContent.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller le code HTML avant d'importer.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Parser le HTML
      const parsedAnnouncements = LeboncoinParser.parseHTML(htmlContent);
      
      if (parsedAnnouncements.length === 0) {
        toast({
          title: "Aucune annonce trouvée",
          description: "Aucune annonce de parking à Angers n'a été détectée dans le HTML fourni.",
          variant: "destructive",
        });
        return;
      }

      // Traiter les annonces
      const { newCount, updatedCount } = await processAnnouncements(parsedAnnouncements);
      
      // Enregistrer le log d'import
      await supabase
        .from('import_logs')
        .insert({
          announcements_found: parsedAnnouncements.length,
          new_announcements: newCount,
          updated_announcements: updatedCount,
          html_content: htmlContent.substring(0, 10000) // Limiter la taille
        });

      toast({
        title: "Import réussi !",
        description: `${parsedAnnouncements.length} annonces trouvées. ${newCount} nouvelles, ${updatedCount} mises à jour.`,
      });

      setHtmlContent('');
      onImportComplete();
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur s'est produite lors du traitement du HTML.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import du code HTML Leboncoin
        </CardTitle>
        <CardDescription>
          Collez ici le code source complet de la page Leboncoin avec les annonces de parking à Angers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="import-zone">
          <FileText className="h-12 w-12 text-primary/60 mx-auto mb-4" />
          <Textarea
            placeholder="Collez ici le code HTML de la page Leboncoin..."
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="min-h-32 font-mono text-sm"
            disabled={isProcessing}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {htmlContent.length > 0 && `${htmlContent.length.toLocaleString()} caractères`}
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={!htmlContent.trim() || isProcessing}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Analyser et importer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};