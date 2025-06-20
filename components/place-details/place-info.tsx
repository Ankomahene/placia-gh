'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  formatHoursSimple,
  getCurrentDay,
  getMutedBackground,
  getMutedBackgroundHover,
  isValidHours,
  sortOpeningHours,
} from '@/lib/utils/place-utils';
import { PlaceResults } from '@/types/place';
import {
  Check,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';

interface PlaceInfoProps {
  place: PlaceResults;
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  const currentDay = getCurrentDay();

  // Format opening hours for compact display (place-info style)
  const formatOpenHoursCompact = () => {
    if (!place.open_hours || place.open_hours.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No opening hours available
        </p>
      );
    }

    // Filter valid hours and sort them
    const validHours = place.open_hours.filter(isValidHours);
    if (validHours.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          Valid opening hours not available
        </p>
      );
    }

    const sortedHours = sortOpeningHours(validHours);

    return (
      <div className="grid grid-cols-1 gap-1">
        {sortedHours.map((hours, index) => {
          const isToday = hours.day === currentDay;

          return (
            <div
              key={index}
              className={cn(
                'flex justify-between py-1 px-2 text-sm rounded',
                isToday
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <span className={cn(isToday ? 'font-semibold' : 'font-medium')}>
                {hours.day}
              </span>
              <span className={cn(isToday ? 'font-semibold' : '')}>
                {formatHoursSimple(hours)}
              </span>
            </div>
          );
        })}
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
      {place.description && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            About
          </h2>
          <div className={cn('rounded-lg p-4', getMutedBackground())}>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {place.description}
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Features and amenities */}
      {place.features && place.features.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {place.features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  getMutedBackgroundHover()
                )}
              >
                {feature.icon ? (
                  <IconRenderer
                    icon={feature.icon}
                    className="h-5 w-5 text-primary"
                  />
                ) : (
                  <Check className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {place.services && place.services.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {place.services.map((service, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  getMutedBackgroundHover()
                )}
              >
                {service.icon ? (
                  <IconRenderer
                    icon={service.icon}
                    className="h-5 w-5 text-primary"
                  />
                ) : (
                  <Check className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility */}
      {place.accessibility && place.accessibility.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Accessibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {place.accessibility.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  getMutedBackgroundHover()
                )}
              >
                {item.icon ? (
                  <IconRenderer
                    icon={item.icon}
                    className="h-5 w-5 text-primary"
                  />
                ) : (
                  <Check className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Location details */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Location Details</h2>
        <Card
          className={cn(
            'border-0 shadow-2xs border-l-2 border-primary/40 rounded-sm',
            getMutedBackground()
          )}
        >
          <CardContent className="px-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-lg">
                  {place.location?.street_address}
                </p>
                <p className="text-muted-foreground">
                  {place.city?.name}
                  {place.city && place.region && ', '}
                  {place.region?.name}
                  {(place.city || place.region) && place.country && ', '}
                  {place.country?.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {place.tags && place.tags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 text-sm"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Opening hours */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
        {formatOpenHoursCompact()}
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
                  <p key={index} className="font-medium">
                    {contact}
                  </p>
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
          <h2 className="text-xl font-semibold mb-4">Social Media</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {place.socials.map((social, index) => (
              <a
                key={index}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors group',
                  getMutedBackgroundHover()
                )}
              >
                {getSocialIcon(social.platform_name || '')}
                <span className="font-medium group-hover:text-primary transition-colors">
                  {social.platform_name || 'Visit'}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
