import { ParsedAnnouncement, ANGERS_NEIGHBORHOODS, AngersNeighborhood } from '@/types/announcement';

export class LeboncoinParser {
  private static detectNeighborhood(address: string): AngersNeighborhood {
    const normalizedAddress = address.toLowerCase();
    
    // Mapping des termes clés vers les quartiers
    const neighborhoodMap: Record<string, AngersNeighborhood> = {
      'centre-ville': 'Centre-ville',
      'centre ville': 'Centre-ville',
      'centre': 'Centre-ville',
      'lafayette': 'La Fayette',
      'la fayette': 'La Fayette',
      'lac de maine': 'Lac-de-Maine',
      'lac-de-maine': 'Lac-de-Maine',
      'belle-beille': 'Belle-Beille',
      'belle beille': 'Belle-Beille',
      'bellebeille': 'Belle-Beille',
      'monplaisir': 'Monplaisir',
      'justices': 'Justices',
      'doutre': 'Doutre',
      'hauts-de-chaises': 'Hauts-de-Chaises',
      'hauts de chaises': 'Hauts-de-Chaises',
      'roseraie': 'Roseraie',
      'grand-pigeon': 'Grand-Pigeon',
      'grand pigeon': 'Grand-Pigeon',
    };

    for (const [keyword, neighborhood] of Object.entries(neighborhoodMap)) {
      if (normalizedAddress.includes(keyword)) {
        return neighborhood;
      }
    }

    return 'Autres';
  }

  private static extractPrice(priceText: string): number {
    // Extrait le prix du texte (format "500 €" ou "500€")
    const priceMatch = priceText.replace(/\s/g, '').match(/(\d+)€?/);
    return priceMatch ? parseInt(priceMatch[1], 10) : 0;
  }

  private static cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  static parseHTML(htmlContent: string): ParsedAnnouncement[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const announcements: ParsedAnnouncement[] = [];
    
    // Sélecteurs pour les annonces Leboncoin (peut nécessiter ajustement selon la structure)
    const adElements = doc.querySelectorAll('[data-qa-id="aditem_container"], .styles_adCard__ILIC2, .aditem');
    
    adElements.forEach((element) => {
      try {
        // Extraction du titre
        const titleElement = element.querySelector('[data-qa-id="aditem_title"], .aditem-title, h3, .title');
        const title = titleElement?.textContent?.trim() || '';
        
        // Extraction de l'adresse
        const locationElement = element.querySelector('[data-qa-id="aditem_location"], .aditem-location, .location');
        const address = locationElement?.textContent?.trim() || '';
        
        // Extraction du prix
        const priceElement = element.querySelector('[data-qa-id="aditem_price"], .aditem-price, .price');
        const priceText = priceElement?.textContent?.trim() || '0';
        const price = this.extractPrice(priceText);
        
        // Filtrage pour les annonces de parking uniquement
        const titleLower = title.toLowerCase();
        const isParkingAd = titleLower.includes('parking') || 
                           titleLower.includes('garage') || 
                           titleLower.includes('place') ||
                           titleLower.includes('box') ||
                           titleLower.includes('stationnement');
        
        // Filtrage pour Angers uniquement
        const addressLower = address.toLowerCase();
        const isAngersAd = addressLower.includes('angers') || 
                          addressLower.includes('49000') || 
                          addressLower.includes('49100');
        
        if (isParkingAd && isAngersAd && title && address && price > 0) {
          const neighborhood = this.detectNeighborhood(address);
          
          announcements.push({
            title: this.cleanText(title),
            address: this.cleanText(address),
            neighborhood,
            price
          });
        }
      } catch (error) {
        console.warn('Erreur lors du parsing d\'une annonce:', error);
      }
    });
    
    // Recherche alternative avec des sélecteurs plus génériques
    if (announcements.length === 0) {
      const alternativeElements = doc.querySelectorAll('div[class*="ad"], div[class*="item"], article, .listing-item');
      
      alternativeElements.forEach((element) => {
        try {
          const textContent = element.textContent?.toLowerCase() || '';
          
          // Vérification si l'élément contient des mots-clés de parking et Angers
          if ((textContent.includes('parking') || textContent.includes('garage') || textContent.includes('place')) &&
              (textContent.includes('angers') || textContent.includes('49000') || textContent.includes('49100'))) {
            
            // Extraction plus brutale du contenu
            const links = element.querySelectorAll('a');
            const priceElements = element.querySelectorAll('*');
            
            let title = '';
            let address = '';
            let price = 0;
            
            // Recherche du titre dans les liens
            links.forEach(link => {
              const linkText = link.textContent?.trim() || '';
              if (linkText.length > title.length && linkText.length < 200) {
                title = linkText;
              }
            });
            
            // Recherche du prix
            priceElements.forEach(el => {
              const text = el.textContent?.trim() || '';
              const priceMatch = text.match(/(\d+)\s*€/);
              if (priceMatch && parseInt(priceMatch[1]) > price) {
                price = parseInt(priceMatch[1]);
              }
            });
            
            // Recherche de l'adresse
            const textNodes = Array.from(element.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim())
              .filter(text => text && text.length > 5);
            
            for (const text of textNodes) {
              if (text?.toLowerCase().includes('angers')) {
                address = text;
                break;
              }
            }
            
            if (title && address && price > 0) {
              const neighborhood = this.detectNeighborhood(address);
              
              announcements.push({
                title: this.cleanText(title),
                address: this.cleanText(address),
                neighborhood,
                price
              });
            }
          }
        } catch (error) {
          console.warn('Erreur lors du parsing alternatif:', error);
        }
      });
    }
    
    // Dédoublonnage basé sur titre + adresse + prix
    const uniqueAnnouncements = announcements.filter((announcement, index, array) => {
      return array.findIndex(a => 
        a.title.toLowerCase() === announcement.title.toLowerCase() &&
        a.address.toLowerCase() === announcement.address.toLowerCase() &&
        a.price === announcement.price
      ) === index;
    });
    
    return uniqueAnnouncements;
  }
}