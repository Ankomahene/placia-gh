'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Connect with business owners and other users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm">
              We&apos;re working on bringing you a seamless messaging experience.
              Check back soon!
            </p>
            <Button disabled>Start Messaging</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}