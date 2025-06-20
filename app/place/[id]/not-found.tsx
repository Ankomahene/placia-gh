import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Search } from 'lucide-react';

export default function PlaceNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
          <MapPin className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold">Place Not Found</h1>
        
        <p className="text-muted-foreground">
          The place you're looking for doesn't exist or may have been removed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/">
              <Search className="h-4 w-4 mr-2" />
              Search Places
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}