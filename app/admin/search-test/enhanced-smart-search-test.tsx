'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Brain,
  MessageSquare,
  Code,
  Search,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  ChevronDown,
  RefreshCw,
  Send,
  Bot,
  User,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { PlaceResultsSummary } from '@/types/place';
import { StructuredSearchQuery } from '@/types/search';
import { convertMetersToKm } from '@/lib/utils';
import { useLocation } from '@/hooks/use-location';

// Custom hook for typing animation
const useTypingAnimation = (
  text: string,
  speed: number = 30,
  delay: number = 300
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');

    // Add initial delay before starting to type
    const delayTimer = setTimeout(() => {
      setIsTyping(true);

      let index = 0;
      const timer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, speed);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [text, speed, delay]);

  return { displayedText, isTyping };
};

// Typing message component
const TypingMessage = ({ message }: { message: ChatMessage }) => {
  const { displayedText, isTyping } = useTypingAnimation(
    message.content,
    25,
    100
  );

  return (
    <div className="text-sm">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse" />
      )}
    </div>
  );
};

// Typing indicator for when bot is thinking
const TypingIndicator = () => (
  <div className="flex items-center gap-1 text-sm text-gray-500">
    <span>Thinking</span>
    <div className="flex gap-1">
      <div
        className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  </div>
);

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  structuredQuery?: StructuredSearchQuery;
  searchResults?: SearchResultData;
  loading?: boolean;
  typing?: boolean;
  displayedContent?: string;
  originalQuery?: string;
}

interface SearchResultData {
  results: PlaceResultsSummary[];
  count: number;
  executionTime: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const sampleQueries = [
  'Find me restaurants near Kotoka International Airport',
  'I want budget-friendly places in Accra',
  'Show me highly rated hotels in East Legon',
  'Find the best coffee shops within 2km of my location',
  'Look for expensive restaurants with great ratings',
];

export default function EnhancedSmartSearchTest() {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  // Search states for Full Search tab
  const [isLoading, setIsLoading] = useState(false);

  // Chat states for pagination
  const [chatLoadingMore, setChatLoadingMore] = useState(false);

  const {
    latitude,
    longitude,
    address,
    loading: locationLoading,
    refetch: refetchLocation,
  } = useLocation();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const userLocation =
    latitude && longitude ? { lat: latitude, lng: longitude } : undefined;

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const testOpenAIParser = async (query: string) => {
    try {
      const response = await fetch('/api/search/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalQuery: query,
          userLocation,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setJsonOutput(data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Parser test failed');
      }
    } catch (error) {
      console.error('Parser test error:', error);
      throw error;
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userQuery = chatInput.trim();
    setChatInput('');

    // Add user message
    addChatMessage({
      type: 'user',
      content: userQuery,
    });

    // Add thinking indicator
    const thinkingMessageId = addChatMessage({
      type: 'bot',
      content: '',
      loading: true,
    });

    try {
      // First, test the OpenAI parser
      const parserResult = await testOpenAIParser(userQuery);

      // Remove thinking message
      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== thinkingMessageId)
      );

      // Add bot response with conversational message and typing animation
      addChatMessage({
        type: 'bot',
        content: parserResult.conversationalResponse,
        structuredQuery: parserResult.structuredQuery,
        loading: true,
        typing: true,
        originalQuery: userQuery,
      });

      // Wait for typing animation to complete before searching
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          parserResult.conversationalResponse.length * 25 + 500
        )
      );

      // Then run chat search (this will handle the results internally)
      await performChatSearch(userQuery);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addChatMessage({
        type: 'bot',
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
      });
      setError(errorMessage);
    }
  };

  const handleSearchTest = async () => {
    if (!searchQuery.trim()) return;
    await performSearch(searchQuery);
  };

  const handleLoadMore = async () => {
    if (!lastSearchQuery) return;
    await performSearch(lastSearchQuery, true);
  };

  const handleChatLoadMore = async (
    messageId: string,
    currentResults: SearchResultData
  ) => {
    // Find the message to get the original query
    const message = chatMessages.find((msg) => msg.id === messageId);
    const originalQuery = message?.originalQuery || '';

    if (!originalQuery || chatLoadingMore) return;

    setChatLoadingMore(true);

    try {
      const response = await fetch('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: originalQuery,
          userLocation,
          limit: 20,
          offset: currentResults.results.length,
          useCache: true, // Use cache for load more requests
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the specific chat message with merged results
        updateChatMessage(messageId, {
          searchResults: {
            ...data,
            results: [...currentResults.results, ...data.results],
            pagination: {
              ...data.pagination,
              offset: currentResults.results.length,
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to load more chat results:', error);
    } finally {
      setChatLoadingMore(false);
    }
  };

  const generateSuccessMessage = (results: SearchResultData): string => {
    const count = results.count;
    const hasMore = results.pagination.hasMore;

    if (count === 0) {
      return "I couldn't find any places matching your criteria. You might want to try broadening your search or checking the spelling.";
    }

    let message = `Great! I found ${count} place${count > 1 ? 's' : ''} for you`;

    if (hasMore) {
      message += `. There are more results available - you can load more to see additional options`;
    }

    message += `. Here are the top results:`;

    return message;
  };

  const renderPlaceCard = (place: PlaceResultsSummary) => (
    <Card key={place.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{place.name}</h3>
          <div className="flex items-center gap-2">
            {place.rate_average && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">
                  {place.rate_average.toFixed(1)}
                </span>
                {place.rate_count && (
                  <span className="text-xs text-gray-500">
                    ({place.rate_count})
                  </span>
                )}
              </div>
            )}
            {place.price_level && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">{'$'.repeat(place.price_level)}</span>
              </div>
            )}
          </div>
        </div>

        {place.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {place.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {place.location?.street_address ||
                `${place.city?.name || ''} ${place.region?.name || ''}`.trim() ||
                `${place.location?.lat.toFixed(4)}, ${place.location?.lng.toFixed(4)}`}
            </span>
          </div>
          {place.distance && (
            <span className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              {convertMetersToKm(place.distance)} km
            </span>
          )}
          {place.open_now !== undefined && place.open_now !== 'unknown' && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span
                className={place.open_now ? 'text-green-600' : 'text-red-600'}
              >
                {place.open_now ? 'Open now' : 'Closed'}
              </span>
            </div>
          )}
        </div>

        {place.features && place.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature.label}
              </Badge>
            ))}
            {place.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{place.features.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const performSearch = async (
    searchQuery: string,
    loadMore: boolean = false
  ) => {
    const currentOffset = loadMore ? searchResult?.results?.length || 0 : 0;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
      setSearchResult(null);
      setError(null);
    }

    try {
      const response = await fetch('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          userLocation,
          limit: 20,
          offset: currentOffset,
          useCache: loadMore, // Use cache for load more requests
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (loadMore && searchResult) {
          // Merge with existing results
          setSearchResult({
            ...data,
            results: [...searchResult.results, ...data.results],
          });
        } else {
          // New search
          setSearchResult(data);
          setLastSearchQuery(searchQuery);
        }
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      if (!loadMore) {
        setSearchResult(null);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const performChatSearch = async (
    searchQuery: string,
    loadMore: boolean = false
  ) => {
    try {
      const response = await fetch('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          userLocation,
          limit: 20,
          offset: 0,
          useCache: false, // Always fresh search for chat
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Add to chat messages
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          content: `Found ${data.count} places in ${data.executionTime}ms`,
          timestamp: new Date(),
          searchResults: {
            results: data.results,
            count: data.count,
            executionTime: data.executionTime,
            pagination: data.pagination,
          },
          originalQuery: searchQuery,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Chat search error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Smart Search Testing Lab
        </h1>
        <p className="text-muted-foreground">
          Test and explore AI-powered conversational place search
        </p>
      </div>

      {/* Location Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Location Status:
              </span>
              {locationLoading ? (
                <span className="text-blue-700">Detecting...</span>
              ) : userLocation ? (
                <span className="text-green-700">
                  {address ||
                    `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
                </span>
              ) : (
                <span className="text-orange-700">Location not available</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLocation()}
              disabled={locationLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversational Testing
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Full Search Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Interface */}
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Interface
                </CardTitle>
                <CardDescription>
                  Test conversational search with natural language
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 mb-4 border rounded-lg p-4 h-[360px]">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Start a conversation by asking about places!</p>
                      </div>
                    )}
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.type === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user'
                                ? 'bg-blue-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            {message.type === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.typing && message.type === 'bot' ? (
                              <TypingMessage message={message} />
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                            {message.loading && !message.content && (
                              <TypingIndicator />
                            )}
                            {message.loading && message.content && (
                              <div className="flex items-center gap-2 mt-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs opacity-70">
                                  Searching...
                                </span>
                              </div>
                            )}
                            {message.searchResults && (
                              <div className="mt-3 space-y-2">
                                {message.searchResults.results
                                  .slice(0, 2)
                                  .map((place) => (
                                    <div
                                      key={place.id}
                                      className="bg-white rounded-lg p-3 border"
                                    >
                                      <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                          {place.name}
                                        </h4>
                                        {place.rate_average && (
                                          <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                            <span className="text-xs">
                                              {place.rate_average.toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 truncate">
                                        {place.location?.street_address ||
                                          `${place.city?.name || ''} ${
                                            place.region?.name || ''
                                          }`.trim()}
                                      </p>
                                    </div>
                                  ))}
                                {message.searchResults.count > 2 && (
                                  <div className="text-xs opacity-70 space-y-2">
                                    <p>
                                      Showing{' '}
                                      {Math.min(
                                        2,
                                        message.searchResults.results.length
                                      )}{' '}
                                      of {message.searchResults.count} results
                                    </p>
                                    {message.searchResults.pagination
                                      ?.hasMore && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() =>
                                          handleChatLoadMore(
                                            message.id,
                                            message.searchResults!
                                          )
                                        }
                                        disabled={chatLoadingMore}
                                      >
                                        {chatLoadingMore ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Loading...
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            Load more
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div ref={chatEndRef} />
                </ScrollArea>

                <div className="space-y-2 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about places..."
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && handleChatSubmit()
                      }
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleChatSubmit}
                      disabled={isLoading || !chatInput.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sampleQueries.slice(0, 3).map((query, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setChatInput(query)}
                        disabled={isLoading}
                      >
                        {query.slice(0, 30)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JSON Output */}
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Query Analysis
                </CardTitle>
                <CardDescription>
                  Real-time OpenAI parsing output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {jsonOutput ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Structured Query
                        </h4>
                        <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(jsonOutput.structuredQuery, null, 2)}
                        </pre>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Bot Response
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm">
                          {jsonOutput.conversationalResponse}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Processing Time</h4>
                        <Badge variant="outline">
                          {jsonOutput.processingTime}ms
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Code className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Query analysis will appear here</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Full Search Testing
              </CardTitle>
              <CardDescription>
                Test the complete search flow from query to results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a natural language search query..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchTest()}
                />
                <Button
                  onClick={handleSearchTest}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Test Search
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(query)}
                    disabled={isLoading}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Search Results showing {searchResult.results.length} of{' '}
                    {searchResult.count}
                  </span>
                  <Badge variant="outline">
                    {searchResult.executionTime}ms
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResult.results?.map((place: PlaceResultsSummary) =>
                    renderPlaceCard(place)
                  )}

                  {searchResult.pagination?.hasMore && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Showing {searchResult.results.length} of{' '}
                        {searchResult.count} results
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Load More Results
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
