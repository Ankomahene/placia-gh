'use client';

import { useState } from 'react';
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
  MessageSquare,
  Code,
  RefreshCw,
  Send,
  Bot,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface ConversationMessage {
  id: string;
  type: 'user' | 'analysis';
  content: string;
  timestamp: Date;
  analysis?: {
    is_followup: boolean;
    followup_type: 'refinement' | 'category_change' | 'new_search';
    refined_query: string;
    confidence: number;
  };
}

interface ConversationTest {
  id: string;
  name: string;
  queries: string[];
  description: string;
}

const predefinedTests: ConversationTest[] = [
  {
    id: 'restaurant-flow',
    name: 'Restaurant Search Flow',
    queries: [
      'Find me restaurants near Kotoka international airport',
      'Find me budget friendly ones and show them from cheapest to expensive',
      'What about hotels instead?',
      'Show me the highest rated ones first',
    ],
    description: 'Tests restaurant search with refinements and category change',
  },
  {
    id: 'pharmacy-flow',
    name: 'Different Location Flow',
    queries: [
      'Hotels near Kotoka international airport',
      'I want to find 24-hour pharmacies with parking nearby Achimota',
    ],
    description:
      'Tests detection of completely new search with different location',
  },
  {
    id: 'price-refinement',
    name: 'Price Refinement Flow',
    queries: [
      'Restaurants in Accra',
      'Show me expensive ones',
      'Actually, show me budget friendly ones instead',
      'What about cafes?',
    ],
    description: 'Tests price refinement and category changes',
  },
];

// API call function to analyze conversation flow
async function analyzeConversationFlowAPI(
  currentQuery: string,
  previousQuery?: string
) {
  const response = await fetch('/api/conversation-flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentQuery,
      previousQuery,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze conversation flow');
  }

  const result = await response.json();
  return result.data;
}

export default function ConversationFlowTest() {
  const [activeTab, setActiveTab] = useState('interactive');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ConversationTest | null>(
    null
  );
  const [runningTest, setRunningTest] = useState(false);

  const addMessage = (
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ) => {
    const newMessage: ConversationMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const handleSingleQuery = async () => {
    if (!currentInput.trim()) return;

    setIsLoading(true);

    // Add user message
    addMessage({
      type: 'user',
      content: currentInput,
    });

    try {
      // Get previous query for context
      const previousQuery = conversation
        .filter((msg) => msg.type === 'user')
        .slice(-1)[0]?.content;

      // Analyze conversation flow via API
      const analysis = await analyzeConversationFlowAPI(
        currentInput,
        previousQuery
      );

      // Add analysis message
      addMessage({
        type: 'analysis',
        content: analysis.refined_query,
        analysis,
      });

      setCurrentInput('');
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      addMessage({
        type: 'analysis',
        content: 'Error analyzing conversation flow',
        analysis: {
          is_followup: false,
          followup_type: 'new_search',
          refined_query: currentInput,
          confidence: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPredefinedTest = async (test: ConversationTest) => {
    setSelectedTest(test);
    setRunningTest(true);
    setConversation([]);

    try {
      let previousQuery: string | undefined;

      for (let i = 0; i < test.queries.length; i++) {
        const query = test.queries[i];

        // Add user message
        addMessage({
          type: 'user',
          content: query,
        });

        // Small delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Analyze conversation flow via API
        const analysis = await analyzeConversationFlowAPI(query, previousQuery);

        // Add analysis message
        addMessage({
          type: 'analysis',
          content: analysis.refined_query,
          analysis,
        });

        // Update previous query for next iteration
        previousQuery = query;

        // Small delay between queries
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error running test:', error);
      addMessage({
        type: 'analysis',
        content: 'Error running predefined test',
        analysis: {
          is_followup: false,
          followup_type: 'new_search',
          refined_query: 'Error occurred',
          confidence: 0,
        },
      });
    } finally {
      setRunningTest(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setSelectedTest(null);
  };

  const renderAnalysisCard = (message: ConversationMessage) => {
    if (!message.analysis) return null;

    const { is_followup, followup_type, refined_query, confidence } =
      message.analysis;

    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              Analysis Result
            </CardTitle>
            <Badge
              variant={is_followup ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {is_followup ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {is_followup ? 'Follow-up' : 'New Search'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Refined Query
            </h4>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{refined_query}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Follow-up Type
              </h4>
              <Badge variant="outline" className="capitalize">
                {followup_type.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Confidence
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              View JSON Output
            </summary>
            <div className="mt-2 p-3 bg-slate-950 text-slate-50 rounded-md text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(message.analysis, null, 2)}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Conversation Flow Analysis
        </h2>
        <p className="text-muted-foreground">
          Test the AI&apos;s ability to detect follow-up queries and refine
          natural language queries
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Interactive Test
          </TabsTrigger>
          <TabsTrigger value="predefined" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Predefined Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Interactive Conversation Test
              </CardTitle>
              <CardDescription>
                Enter queries one by one to test conversation flow detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a search query..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSingleQuery()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSingleQuery}
                  disabled={isLoading || !currentInput.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={clearConversation} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {conversation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {conversation.map((message, index) => (
                      <div key={message.id}>
                        {message.type === 'user' ? (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">
                                User Query #{Math.floor(index / 2) + 1}
                              </p>
                              <div className="p-3 bg-blue-50 rounded-md">
                                <p>{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="ml-11">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm text-muted-foreground">
                                Analysis
                              </p>
                            </div>
                            {renderAnalysisCard(message)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predefinedTests.map((test) => (
              <Card
                key={test.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {test.queries.length} queries
                    </p>
                    <div className="space-y-1">
                      {test.queries.slice(0, 2).map((query, index) => (
                        <p
                          key={index}
                          className="text-xs text-muted-foreground truncate"
                        >
                          {index + 1}. {query}
                        </p>
                      ))}
                      {test.queries.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          ... and {test.queries.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => runPredefinedTest(test)}
                    disabled={runningTest}
                    className="w-full"
                    size="sm"
                  >
                    {runningTest && selectedTest?.id === test.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      'Run Test'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {conversation.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Test Results: {selectedTest?.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedTest?.description}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={clearConversation}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {conversation.map((message, index) => (
                      <div key={message.id}>
                        {message.type === 'user' ? (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">
                                Query #{Math.floor(index / 2) + 1}
                              </p>
                              <div className="p-3 bg-blue-50 rounded-md">
                                <p>{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="ml-11">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm text-muted-foreground">
                                Analysis
                              </p>
                            </div>
                            {renderAnalysisCard(message)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
