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
import {
  createUserPhoto,
  togglePhotoLike,
  updateUserPhoto,
} from '@/lib/services/reviews-user-photos';
import { PlaceResults } from '@/types/place';
import {
  Camera,
  Edit2,
  Image as ImageIcon,
  Plus,
  Save,
  User,
  ThumbsUp,
  X,
  ZoomIn,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [likingPhotos, setLikingPhotos] = useState<Set<string>>(new Set());

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

  const handleTogglePhotoLike = async (photoId: string) => {
    if (!user) {
      toast.error('Please log in to like photos');
      return;
    }

    // Prevent multiple simultaneous requests
    if (likingPhotos.has(photoId)) {
      return;
    }

    setLikingPhotos((prev) => new Set(prev).add(photoId));

    try {
      await togglePhotoLike(photoId, user.id);
      toast.success('Photo liked');
      router.refresh();
    } catch (error) {
      console.error('Error toggling photo like:', error);
      toast.error('Failed to update like');
    } finally {
      setLikingPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  const startEditingPhoto = (photo: any) => {
    setEditingPhoto(photo);
    setEditCaption(photo.comment || '');
    setIsEditingPhoto(true);
  };

  const handleEditPhoto = async () => {
    if (!editingPhoto || !user) return;

    setIsSubmitting(true);

    try {
      await updateUserPhoto(editingPhoto.id, { comment: editCaption });
      toast.success('Photo updated successfully!');
      setIsEditingPhoto(false);
      setEditingPhoto(null);
      setEditCaption('');
      router.refresh();
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Failed to update photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditingPhoto = () => {
    setIsEditingPhoto(false);
    setEditingPhoto(null);
    setEditCaption('');
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

      {/* Photo Preview Modal */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl w-full p-2">
          <div className="relative">
            {previewPhoto && (
              <Image
                src={previewPhoto}
                alt="Photo preview"
                width={1000}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Edit Modal */}
      <Dialog open={isEditingPhoto} onOpenChange={cancelEditingPhoto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Caption{' '}
                <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Update your photo caption..."
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelEditingPhoto}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleEditPhoto} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Photo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => setPreviewPhoto(photo)}
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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
                  className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => setPreviewPhoto(photo)}
                >
                  <Image
                    src={photo}
                    alt={`Official photo ${index + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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
                        onClick={() => startEditingPhoto(photo)}
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
                          className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                          onClick={() => setPreviewPhoto(photoUrl)}
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Likes section */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleTogglePhotoLike(photo.id)}
                      disabled={likingPhotos.has(photo.id) || !isLoggedIn}
                      className={cn(
                        'flex items-center gap-1 text-sm transition-colors',
                        !isLoggedIn && 'cursor-not-allowed opacity-50',
                        likingPhotos.has(photo.id) && 'opacity-50',
                        photo.likes?.includes(user?.id || '')
                          ? 'text-blue-600 hover:text-blue-700'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <ThumbsUp
                        className={cn(
                          'h-4 w-4',
                          photo.likes?.includes(user?.id || '') &&
                            'fill-current'
                        )}
                      />
                      <span>{photo.likes?.length || 0}</span>
                    </button>
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
