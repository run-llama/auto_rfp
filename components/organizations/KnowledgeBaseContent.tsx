'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Tag,
  MoreHorizontal,
  FileText,
  ChevronRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
  };
}

interface KnowledgeBaseQuestion {
  id: string;
  text: string;
  topic?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  answer?: {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface KnowledgeBaseContentProps {
  params: Promise<{
    orgId: string;
  }>;
}

export function KnowledgeBaseContent({ params }: KnowledgeBaseContentProps) {
  const { orgId } = useParams() as { orgId: string };
  const { toast } = useToast();
  
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [questions, setQuestions] = useState<KnowledgeBaseQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [isCreateKBOpen, setIsCreateKBOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<KnowledgeBaseQuestion | null>(null);
  
  // Form states
  const [kbForm, setKbForm] = useState({ name: '', description: '' });
  const [questionForm, setQuestionForm] = useState({ 
    text: '', 
    topic: '', 
    tags: '', 
    answer: '' 
  });

  // Fetch knowledge bases
  const fetchKnowledgeBases = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organizations/${orgId}/knowledge-bases`);
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
        if (data.length > 0 && !selectedKnowledgeBase) {
          setSelectedKnowledgeBase(data[0]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load knowledge bases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, selectedKnowledgeBase, toast]);

  // Fetch questions for selected knowledge base
  const fetchQuestions = useCallback(async (kbId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/knowledge-bases/${kbId}/questions`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  useEffect(() => {
    if (selectedKnowledgeBase) {
      fetchQuestions(selectedKnowledgeBase.id);
    }
  }, [selectedKnowledgeBase, fetchQuestions]);

  // Create knowledge base
  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/organizations/${orgId}/knowledge-bases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kbForm),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Knowledge base created successfully",
        });
        setKbForm({ name: '', description: '' });
        setIsCreateKBOpen(false);
        fetchKnowledgeBases();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create knowledge base",
        variant: "destructive",
      });
    }
  };

  // Create/Update question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKnowledgeBase) return;

    try {
      const url = editingQuestion 
        ? `/api/organizations/${orgId}/knowledge-bases/${selectedKnowledgeBase.id}/questions/${editingQuestion.id}`
        : `/api/organizations/${orgId}/knowledge-bases/${selectedKnowledgeBase.id}/questions`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          tags: questionForm.tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: editingQuestion ? "Question updated successfully" : "Question created successfully",
        });
        setQuestionForm({ text: '', topic: '', tags: '', answer: '' });
        setIsCreateQuestionOpen(false);
        setEditingQuestion(null);
        fetchQuestions(selectedKnowledgeBase.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  // Filter questions based on search
  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-12">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Knowledge Base
          </h1>
          <p className="text-gray-600 mt-1">
            Manage pre-built questions and answers for common RFP responses
          </p>
        </div>
        <Dialog open={isCreateKBOpen} onOpenChange={setIsCreateKBOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Knowledge Base</DialogTitle>
              <DialogDescription>
                Create a new knowledge base to organize your questions and answers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateKB} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={kbForm.name}
                  onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
                  placeholder="e.g., Technical Questions, Compliance, Pricing"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={kbForm.description}
                  onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
                  placeholder="Describe what types of questions this knowledge base contains"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateKBOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {knowledgeBases.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No knowledge bases yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first knowledge base to start building your question and answer library
          </p>
          <Button onClick={() => setIsCreateKBOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Knowledge Base
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeBases.map((kb) => (
                <Card 
                  key={kb.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedKnowledgeBase?.id === kb.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedKnowledgeBase(kb)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{kb.name}</CardTitle>
                      <Badge variant="secondary">
                        {kb._count.questions} questions
                      </Badge>
                    </div>
                    {kb.description && (
                      <CardDescription>{kb.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      Updated {new Date(kb.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            {selectedKnowledgeBase ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedKnowledgeBase.name}</h2>
                    <p className="text-gray-600">{questions.length} questions</p>
                  </div>
                  <Dialog open={isCreateQuestionOpen} onOpenChange={setIsCreateQuestionOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuestion ? 'Edit Question' : 'Add New Question'}
                        </DialogTitle>
                        <DialogDescription>
                          Add a question and its corresponding answer to the knowledge base.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveQuestion} className="space-y-4">
                        <div>
                          <Label htmlFor="question-text">Question</Label>
                          <Textarea
                            id="question-text"
                            value={questionForm.text}
                            onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                            placeholder="Enter the question"
                            required
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="topic">Topic (Optional)</Label>
                            <Input
                              id="topic"
                              value={questionForm.topic}
                              onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                              placeholder="e.g., Technical, Security, Pricing"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input
                              id="tags"
                              value={questionForm.tags}
                              onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                              placeholder="tag1, tag2, tag3"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="answer">Answer</Label>
                          <Textarea
                            id="answer"
                            value={questionForm.answer}
                            onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                            placeholder="Enter the answer"
                            required
                            rows={6}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsCreateQuestionOpen(false);
                              setEditingQuestion(null);
                              setQuestionForm({ text: '', topic: '', tags: '', answer: '' });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingQuestion ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {searchQuery ? 'No matching questions' : 'No questions yet'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchQuery 
                          ? 'Try adjusting your search terms' 
                          : 'Start building your knowledge base by adding questions and answers'
                        }
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setIsCreateQuestionOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredQuestions.map((question) => (
                      <Card key={question.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-base font-medium">
                                {question.text}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                {question.topic && (
                                  <Badge variant="outline">{question.topic}</Badge>
                                )}
                                {question.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    <Tag className="mr-1 h-3 w-3" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingQuestion(question);
                                    setQuestionForm({
                                      text: question.text,
                                      topic: question.topic || '',
                                      tags: question.tags.join(', '),
                                      answer: question.answer?.text || '',
                                    });
                                    setIsCreateQuestionOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        {question.answer && (
                          <CardContent>
                            <Separator className="mb-4" />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4" />
                                Answer
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {question.answer.text}
                              </p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <ChevronRight className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a knowledge base</h3>
                <p className="text-gray-600">
                  Choose a knowledge base from the overview tab to view and manage its questions
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
