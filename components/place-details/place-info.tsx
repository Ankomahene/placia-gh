'use client';

import { PlaceResults } from '@/types/place';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter,
  Check
} from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';

interface PlaceInfoProps {
  place: PlaceResults;
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  // Format opening hours for display
  const formatOpenHours = () => {
    if (!place.open_hours || place.open_hours.length === 0) {
      return <p className="text-muted-foreground">No opening hours available</p>;
    }
    
    // Sort days of the week
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedHours = [...place.open_hours].sort((a, b) => 
      daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)
    );
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sortedHours.map((hours, index) => (
          <div key={index} className="flex justify-between">
            <span className="font-medium">{hours.day}</span>
            <span>{hours.from} - {hours.to}</span>
          </div>
        ))}
      </div>
    );
  };
  
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
  
  return (
    <div className="p-6 space-y-8">
      {/* Description */}
      <div>
        <h2 className="text-xl font-semibold mb-3">About</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {place.description}
        </p>
      </div>
      
      <Separator />
      
      {/* Features and amenities */}
      {(place.features && place.features.length > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Features & Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {place.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                {feature.icon ? (
                  <IconRenderer icon={feature.icon} className="h-4 w-4 text-primary" />
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Services */}
      {(place.services && place.services.length > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {place.services.map((service, index) => (
              <div key={index} className="flex items-center gap-2">
                {service.icon ? (
                  <IconRenderer icon={service.icon} className="h-4 w-4 text-primary" />
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <span>{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Accessibility */}
      {(place.accessibility && place.accessibility.length > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Accessibility</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {place.accessibility.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.icon ? (
                  <IconRenderer icon={item.icon} className="h-4 w-4 text-primary" />
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Separator />
      
      {/* Location details */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Location</h2>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{place.location?.street_address}</p>
              <p className="text-muted-foreground">
                {place.city?.name}{place.city && place.region && ', '}{place.region?.name}
                {(place.city || place.region) && place.country && ', '}{place.country?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tags */}
      {place.tags && place.tags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Separator />
      
      {/* Opening hours */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Opening Hours</h2>
        {formatOpenHours()}
      </div>
      
      {/* Contact information */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
        <div className="space-y-3">
          {place.contacts && place.contacts.length > 0 && (
            <div className="flex items-start gap-2">
              <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                {place.contacts.map((contact, index) => (
                  <p key={index} className="font-medium">{contact}</p>
                ))}
              </div>
            </div>
          )}
          
          {place.email && (
            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="font-medium">{place.email}</p>
            </div>
          )}
          
          {place.website && (
            <div className="flex items-start gap-2">
              <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <a 
                href={place.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {place.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Social media */}
      {place.socials && place.socials.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Social Media</h2>
          <div className="space-y-3">
            {place.socials.map((social, index) => (
              <div key={index} className="flex items-center gap-2">
                {getSocialIcon(social.platform_name || '')}
                <a 
                  href={social.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {social.platform_name || 'Visit'}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}