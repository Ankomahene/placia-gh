'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Users, Zap } from 'lucide-react';

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
          <CardTitle className="flex items-center gap-2">
            Your Messages
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">
                Messaging System in Development
              </h3>
              <p className="text-muted-foreground">
                We&apos;re building a powerful messaging platform that will let
                you:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Connect with business owners directly</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span>Ask questions about places and services</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>Get real-time notifications</span>
              </div>
            </div>

            <div className="pt-4">
              <Button disabled className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Messaging
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Expected launch: Q3 2025
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
