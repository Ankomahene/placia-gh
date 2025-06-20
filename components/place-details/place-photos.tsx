'use client';

import { PlaceImageField } from '@/components/place-form-components/place-image-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/use-user';
import { createUserPhoto } from '@/lib/services/reviews-user-photos';
import { PlaceResults } from '@/types/place';
import {
  Camera,
  Edit2,
  Image as ImageIcon,
  Plus,
  Save,
  User,
  ThumbsUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface PlacePhotosProps {
  place: PlaceResults;
  userUploadedPhotos?: any[];
  userPhotos?: any[];
  isLoggedIn: boolean;
}

export function PlacePhotos({
  place,
  userUploadedPhotos = [],
  userPhotos = [],
  isLoggedIn,
}: PlacePhotosProps) {
  const router = useRouter();
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine official and user photos
  const allPhotos = [
    ...(place.gallery || []),
    ...userUploadedPhotos.flatMap((photo) => photo.photos || []),
  ];

  const handleSubmitPhoto = async () => {
    if (!user) {
      toast.error('Please log in to upload photos');
      return;
    }

    if (!uploadedImageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    setIsSubmitting(true);

    try {
      await createUserPhoto({
        place_id: place.id,
        photos: [uploadedImageUrl], // Store as array
        comment: photoCaption.trim() || undefined,
      });

      toast.success('Photo uploaded successfully!');
      setUploadedImageUrl('');
      setPhotoCaption('');
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload photo'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Photos</h2>

        {isLoggedIn ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image upload using existing component */}
                <PlaceImageField
                  value={uploadedImageUrl}
                  onChange={setUploadedImageUrl}
                  label="Photo"
                  placeholder="Upload your photo"
                  variant="image"
                />

                {/* Caption input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Caption{' '}
                    <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add a caption for your photo..."
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setUploadedImageUrl('');
                      setPhotoCaption('');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitPhoto}
                    disabled={!uploadedImageUrl || isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Log in to upload
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Photo tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Photos ({allPhotos.length})</TabsTrigger>
          <TabsTrigger value="official">
            Official ({place.gallery?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="user">
            User Photos ({userUploadedPhotos.length})
          </TabsTrigger>
        </TabsList>

        {/* All photos */}
        <TabsContent value="all" className="mt-4">
          {allPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No photos available</p>
              {isLoggedIn && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add the first photo
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Official photos */}
        <TabsContent value="official" className="mt-4">
          {place.gallery && place.gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {place.gallery.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={photo}
                    alt={`Official photo ${index + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No official photos available</p>
            </div>
          )}
        </TabsContent>

        {/* User photos */}
        <TabsContent value="user" className="mt-4">
          {userUploadedPhotos.length > 0 ? (
            <div className="space-y-8">
              {userUploadedPhotos.map((photo) => (
                <div key={photo.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {photo.user?.avatar ? (
                        <Image
                          src={photo.user.avatar}
                          alt={photo.user.full_name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {photo.user?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Show edit button if this is user's own photo */}
                    {user && photo.user_id === user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => {
                          // TODO: Implement photo editing
                          toast.info('Photo editing coming soon!');
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {photo.comment && (
                    <p className="text-sm text-muted-foreground">
                      {photo.comment}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(photo.photos || []).map(
                      (photoUrl: string, index: number) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <Image
                            src={photoUrl}
                            alt={
                              photo.comment ||
                              `User uploaded photo ${index + 1}`
                            }
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    )}
                  </div>

                  {/* Likes section */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => {
                        if (!user) {
                          toast.error('Please log in to like photos');
                          return;
                        }
                        // TODO: Implement togglePhotoLike
                        toast.info('Photo likes coming soon!');
                      }}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {photo.likes?.length || 0}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No user photos yet</p>
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add the first photo
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-sm">Log in to upload photos</p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/auth/login">
                      <Button variant="outline" size="sm">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
