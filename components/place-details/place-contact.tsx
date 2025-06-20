'use client';

import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter,
  MessageSquare
} from 'lucide-react';

interface PlaceContactProps {
  place: PlaceResults;
}

export function PlaceContact({ place }: PlaceContactProps) {
  // Get social media icon
  const getSocialIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };
  
  // Check if there's any contact information
  const hasContactInfo = place.contacts?.length || place.email || place.website || (place.socials && place.socials.length > 0);
  
  if (!hasContactInfo) return null;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone */}
        {place.contacts && place.contacts.length > 0 && (
          <div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              asChild
            >
              <a href={`tel:${place.contacts[0]}`}>
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                {place.contacts[0]}
              </a>
            </Button>
          </div>
        )}
        
        {/* Email */}
        {place.email && (
          <div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              asChild
            >
              <a href={`mailto:${place.email}`}>
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                {place.email}
              </a>
            </Button>
          </div>
        )}
        
        {/* Website */}
        {place.website && (
          <div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              asChild
            >
              <a 
                href={place.website} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4 mr-2 text-purple-600" />
                {place.website.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            </Button>
          </div>
        )}
        
        {/* Social media */}
        {place.socials && place.socials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.socials.map((social, index) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm"
                asChild
              >
                <a 
                  href={social.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  {getSocialIcon(social.platform_name || '')}
                  <span>{social.platform_name || 'Visit'}</span>
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}