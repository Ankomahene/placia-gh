'use client';

import { useState, useRef, useEffect } from 'react';
import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceChatProps {
  place: PlaceResults;
  isLoggedIn: boolean;
}

// Mock chat messages
const mockMessages = [
  {
    id: '1',
    sender: 'business',
    content: 'Hello! How can we help you today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '2',
    sender: 'user',
    content: 'Hi, I was wondering if you have any availability this weekend?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
  },
  {
    id: '3',
    sender: 'business',
    content: 'Yes, we have some slots available on Saturday afternoon and Sunday morning. Would you like to make a reservation?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
  },
];

export function PlaceChat({ place, isLoggedIn }: PlaceChatProps) {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simulate business reply after a short delay
    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        sender: 'business',
        content: 'Thank you for your message! We\'ll get back to you shortly.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };
  
  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat with Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Please log in to chat with this business</p>
          </div>
          <Button variant="outline" className="w-full">Log In</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn(
      "transition-all duration-300",
      isExpanded ? "fixed bottom-4 right-4 z-50 w-80 md:w-96 shadow-xl" : ""
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat with Business
          </CardTitle>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="p-3 h-80 flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-3">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex gap-2",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === 'business' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={place.logo || undefined} alt={place.name} />
                      <AvatarFallback>{place.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div 
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === 'user' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="flex gap-2">
              <Input 
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}