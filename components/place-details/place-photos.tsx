'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Plus,
  Camera,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PlacePhotosProps {
  place: PlaceResults;
  isLoggedIn: boolean;
}

// Mock user uploaded photos
const mockUserPhotos = [
  {
    id: '1',
    user: 'John Doe',
    date: '2023-05-15',
    comment: 'Beautiful interior design',
    photos: [
      'https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg',
      'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg',
    ],
  },
  {
    id: '2',
    user: 'Jane Smith',
    date: '2023-06-10',
    comment: 'Great food and presentation',
    photos: [
      'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
      'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg',
    ],
  },
];

export function PlacePhotos({ place, isLoggedIn }: PlacePhotosProps) {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoComment, setPhotoComment] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Combine official and user photos
  const allPhotos = [
    ...(place.gallery || []),
    ...mockUserPhotos.flatMap(item => item.photos),
  ];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      
      // Create preview URLs
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    // In a real app, this would upload the photos to the server
    console.log('Uploading photos:', selectedFiles);
    console.log('Comment:', photoComment);
    
    // Reset form
    setSelectedFiles([]);
    setPhotoComment('');
    setPreviewUrls([]);
    setIsDialogOpen(false);
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Photos</h2>
        
        {isLoggedIn && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Photos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* File upload area */}
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag photos here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, GIF up to 10MB
                  </p>
                  <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
                
                {/* Preview selected files */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                        <Image 
                          src={url} 
                          alt={`Preview ${index}`} 
                          fill
                          className="object-cover"
                        />
                        <button 
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Comment input */}
                <Textarea 
                  placeholder="Add a comment about these photos..."
                  value={photoComment}
                  onChange={(e) => setPhotoComment(e.target.value)}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={selectedFiles.length === 0}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Photo tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Photos</TabsTrigger>
          <TabsTrigger value="official">Official</TabsTrigger>
          <TabsTrigger value="user">User Photos</TabsTrigger>
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
          {mockUserPhotos.length > 0 ? (
            <div className="space-y-8">
              {mockUserPhotos.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{item.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {item.comment && (
                    <p className="text-sm text-muted-foreground">{item.comment}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {item.photos.map((photo, photoIndex) => (
                      <div 
                        key={photoIndex} 
                        className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <Image 
                          src={photo} 
                          alt={`User photo ${photoIndex + 1}`} 
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No user photos yet</p>
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
      </Tabs>
    </div>
  );
}