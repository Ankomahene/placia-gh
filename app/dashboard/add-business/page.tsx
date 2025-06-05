'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AddBusinessPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add Business</h1>
        <p className="text-muted-foreground mt-2">
          Help others discover great places by adding a business to our platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a New Business</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm">
              We&apos;re working hard to bring you the ability to add and manage
              businesses. Stay tuned for updates!
            </p>
            <Button disabled>Add Business</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}