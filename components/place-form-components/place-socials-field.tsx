'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus, X, ExternalLink } from 'lucide-react';

interface Social {
  platform_name?: string;
  link: string;
}

interface PlaceSocialsFieldProps {
  value?: Social[] | null;
  onChange: (value: Social[]) => void;
  error?: string;
  className?: string;
  label?: string;
}

const SOCIAL_PLATFORMS = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Snapchat',
  'WhatsApp',
  'Telegram',
  'Other',
];

export function PlaceSocialsField({
  value = [],
  onChange,
  error,
  className,
  label = 'Social Media',
}: PlaceSocialsFieldProps) {
  const [newSocial, setNewSocial] = useState<Social>({
    platform_name: '',
    link: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Ensure value is always an array
  const socials = value || [];

  const addSocial = () => {
    if (newSocial.link.trim()) {
      onChange([
        ...socials,
        {
          platform_name: newSocial.platform_name || 'Other',
          link: newSocial.link.trim(),
        },
      ]);
      setNewSocial({ platform_name: '', link: '' });
      setIsAddingNew(false);
    }
  };

  const removeSocial = (index: number) => {
    onChange(socials.filter((_, i) => i !== index));
  };

  const updateSocial = (
    index: number,
    field: keyof Social,
    newValue: string
  ) => {
    const updated = [...socials];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          <span className="text-muted-foreground ml-1">(Optional)</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Social
        </Button>
      </div>

      {/* Existing socials */}
      {socials.length > 0 && (
        <div className="space-y-3">
          {socials.map((social, index) => (
            <div
              key={index}
              className="flex gap-2 items-start p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-2">
                <Select
                  value={social.platform_name || ''}
                  onValueChange={(platform) =>
                    updateSocial(index, 'platform_name', platform)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={social.link}
                    onChange={(e) =>
                      updateSocial(index, 'link', e.target.value)
                    }
                    placeholder="https://..."
                    className="flex-1"
                    onBlur={() => {
                      if (social.link && !isValidUrl(social.link)) {
                        const formatted = formatUrl(social.link);
                        if (isValidUrl(formatted)) {
                          updateSocial(index, 'link', formatted);
                        }
                      }
                    }}
                  />
                  {social.link && isValidUrl(social.link) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(social.link, '_blank')}
                      className="h-10 w-10"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSocial(index)}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new social form */}
      {isAddingNew && (
        <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
          <Label className="text-sm font-medium">Add Social Media</Label>

          <Select
            value={newSocial.platform_name || ''}
            onValueChange={(platform) =>
              setNewSocial({ ...newSocial, platform_name: platform })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="url"
            value={newSocial.link}
            onChange={(e) =>
              setNewSocial({ ...newSocial, link: e.target.value })
            }
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSocial.link.trim()) {
                e.preventDefault();
                addSocial();
              }
            }}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addSocial}
              disabled={!newSocial.link.trim()}
              size="sm"
            >
              Add Social
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewSocial({ platform_name: '', link: '' });
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {socials.length === 0 && !isAddingNew && (
        <p className="text-sm text-muted-foreground">
          No social media links added yet. Add your social media profiles to
          help visitors connect with you.
        </p>
      )}
    </div>
  );
}
