"use client"

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { RfpDocument, AnswerSource } from "@/types/api"
import { useMultiStepResponse } from "@/hooks/use-multi-step-response"

// Interfaces
interface AnswerData {
  text: string;
  sources?: AnswerSource[];
}

interface ProjectIndex {
  id: string;
  name: string;
}

interface QuestionsContextType {
  // UI state
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  selectedQuestion: string | null;
  setSelectedQuestion: (id: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Data state
  isLoading: boolean;
  error: string | null;
  rfpDocument: RfpDocument | null;
  project: any;
  answers: Record<string, AnswerData>;
  unsavedQuestions: Set<string>;
  
  // Process state
  savingQuestions: Set<string>;
  lastSaved: string | null;
  isGenerating: Record<string, boolean>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSource: AnswerSource | null;
  setSelectedSource: (source: AnswerSource | null) => void;
  isSourceModalOpen: boolean;
  setIsSourceModalOpen: (open: boolean) => void;
  selectedIndexes: Set<string>;
  setSelectedIndexes: (indexes: Set<string>) => void;
  availableIndexes: ProjectIndex[];
  isLoadingIndexes: boolean;
  organizationConnected: boolean;
  
  // Multi-step response state
  useMultiStep: boolean;
  setUseMultiStep: (use: boolean) => void;
  multiStepDialogOpen: boolean;
  setMultiStepDialogOpen: (open: boolean) => void;
  currentQuestionForMultiStep: string | null;
  currentQuestionText: string;
  
  // Multi-step response hook
  generateMultiStepResponse: (question: string) => Promise<void>;
  isMultiStepGenerating: boolean;
  multiStepSteps: any[];
  multiStepFinalResponse: string | null;
  multiStepSources: any[];
  resetMultiStepResponse: () => void;
  
  // Action handlers
  handleAnswerChange: (questionId: string, value: string) => void;
  handleGenerateAnswer: (questionId: string) => Promise<void>;
  saveAnswer: (questionId: string) => Promise<void>;
  saveAllAnswers: () => Promise<void>;
  handleExportAnswers: () => void;
  handleSourceClick: (source: AnswerSource) => void;
  handleAcceptMultiStepResponse: (response: string, sources: any[]) => void;
  handleCloseMultiStepDialog: () => void;
  
  // Utility functions
  getFilteredQuestions: (filterType?: string) => any[];
  getCounts: () => { all: number; answered: number; unanswered: number };
  getSelectedQuestionData: () => any;
  refreshQuestions: () => Promise<void>;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

export function useQuestions() {
  const context = useContext(QuestionsContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
}

interface QuestionsProviderProps {
  children: ReactNode;
  projectId: string;
}

export function QuestionsProvider({ children, projectId }: QuestionsProviderProps) {
  // UI state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfpDocument, setRfpDocument] = useState<RfpDocument | null>(null);
  const [project, setProject] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [unsavedQuestions, setUnsavedQuestions] = useState<Set<string>>(new Set());
  
  // Process state
  const [savingQuestions, setSavingQuestions] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<AnswerSource | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<string>>(new Set());
  const [availableIndexes, setAvailableIndexes] = useState<ProjectIndex[]>([]);
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false);
  const [organizationConnected, setOrganizationConnected] = useState(false);

  // Multi-step response state
  const [useMultiStep, setUseMultiStep] = useState(false);
  const [multiStepDialogOpen, setMultiStepDialogOpen] = useState(false);
  const [currentQuestionForMultiStep, setCurrentQuestionForMultiStep] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  
  // Use the multi-step response hook
  const {
    generateResponse: generateMultiStepResponse,
    isGenerating: isMultiStepGenerating,
    currentSteps: multiStepSteps,
    finalResponse: multiStepFinalResponse,
    sources: multiStepSources,
    reset: resetMultiStepResponse 
  } = useMultiStepResponse({
    projectId: projectId || "",
    indexIds: Array.from(selectedIndexes),
    onComplete: (finalResponse, steps, sources) => {
      handleAcceptMultiStepResponse(finalResponse, sources);
    }
  });

  // Load project data and questions when component mounts
  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided");
      setIsLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to load project");
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Error loading project:", error);
        setError("Failed to load project. Please try again.");
        setIsLoading(false);
      }
    };

    const fetchIndexes = async () => {
      setIsLoadingIndexes(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/indexes`);
        if (response.ok) {
          const data = await response.json();
          setOrganizationConnected(data.organizationConnected);
          if (data.organizationConnected) {
            // Use project's configured indexes as the available indexes for temporary selection
            const currentIndexes = data.currentIndexes || [] as ProjectIndex[];
            setAvailableIndexes(currentIndexes);
            
            // Initialize selection with all configured project indexes
            const currentIndexIds = new Set(currentIndexes.map((index: ProjectIndex) => index.id)) as Set<string>;
            setSelectedIndexes(currentIndexIds);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error("Error response from indexes API:", errorData);
          
          if (errorData.error?.includes('Invalid index IDs')) {
            setSelectedIndexes(new Set());
            toast({
              title: "Index Sync Issue",
              description: "Some project indexes are out of sync. Please reconfigure your document indexes in project settings.",
              variant: "destructive",
            });
          }
          
          setOrganizationConnected(true);
          setAvailableIndexes([]);
        }
      } catch (error) {
        console.error("Error loading indexes:", error);
        setOrganizationConnected(false);
        setAvailableIndexes([]);
        setSelectedIndexes(new Set());
      } finally {
        setIsLoadingIndexes(false);
      }
    };

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/questions/${projectId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load questions");
        }
        
        const data = await response.json();
        setRfpDocument(data);

        const answersResponse = await fetch(`/api/questions/${projectId}/answers`);
        if (answersResponse.ok) {
          const savedAnswers = await answersResponse.json();
          
          const normalizedAnswers: Record<string, AnswerData> = {};
          for (const [questionId, answerData] of Object.entries(savedAnswers)) {
            if (typeof answerData === 'string') {
              normalizedAnswers[questionId] = { text: answerData };
            } else {
              normalizedAnswers[questionId] = answerData as AnswerData;
            }
          }
          
          setAnswers(normalizedAnswers);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        setError("Failed to load questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    Promise.all([fetchProject(), fetchIndexes(), fetchQuestions()]).catch(error => {
      console.error("Error in parallel loading:", error);
    });
  }, [projectId]);

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => {
      const existing = prev[questionId] || { text: '' };
      return {
        ...prev,
        [questionId]: {
          ...existing,
          text: value
        }
      };
    });

    setUnsavedQuestions(prev => {
      const updated = new Set(prev);
      updated.add(questionId);
      return updated;
    });
  };

  // Modified generate answer handler to support multi-step
  const handleGenerateAnswer = async (questionId: string) => {
    const question = rfpDocument?.sections.flatMap(s => s.questions).find(q => q.id === questionId);
    
    if (!question) {
      toast({
        title: "Error",
        description: "Question not found",
        variant: "destructive",
      });
      return;
    }

    if (useMultiStep) {
      setCurrentQuestionForMultiStep(questionId);
      setCurrentQuestionText(question.question);
      setMultiStepDialogOpen(true);
      resetMultiStepResponse();
      
      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID not available",
          variant: "destructive",
        });
        return;
      }
      
      await generateMultiStepResponse(question.question);
    } else {
      setIsGenerating(prev => ({ ...prev, [questionId]: true }));
      
      try {
        const response = await fetch('/api/generate-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question.question,
            documentIds: project?.documentIds || [],
            selectedIndexIds: Array.from(selectedIndexes),
            useAllIndexes: false,
            projectId: project?.id
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to generate answer");
        }
        
        const result = await response.json();
        
        setAnswers(prev => ({
          ...prev,
          [questionId]: {
            text: result.response,
            sources: result.sources
          }
        }));

        setUnsavedQuestions(prev => {
          const updated = new Set(prev);
          updated.add(questionId);
          return updated;
        });
        
        toast({
          title: "Answer Generated",
          description: "AI-generated answer has been created. Please review and save it.",
        });
      } catch (error) {
        console.error('Error generating answer:', error);
        toast({
          title: "Generation Error",
          description: "Failed to generate answer. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(prev => ({ ...prev, [questionId]: false }));
      }
    }
  };

  // Handler for accepting multi-step response
  const handleAcceptMultiStepResponse = (response: string, sources: any[]) => {
    if (currentQuestionForMultiStep) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionForMultiStep]: {
          text: response,
          sources: sources
        }
      }));

      setUnsavedQuestions(prev => {
        const updated = new Set(prev);
        updated.add(currentQuestionForMultiStep);
        return updated;
      });
      
      toast({
        title: "Multi-Step Answer Generated",
        description: "AI-generated answer with step-by-step reasoning has been created. Please review and save it.",
      });
    }
  };

  const handleCloseMultiStepDialog = () => {
    setMultiStepDialogOpen(false);
    setCurrentQuestionForMultiStep(null);
    resetMultiStepResponse();
  };

  // Save a single answer
  const saveAnswer = async (questionId: string) => {
    if (!projectId || !answers[questionId]) return;

    setSavingQuestions(prev => {
      const updated = new Set(prev);
      updated.add(questionId);
      return updated;
    });
    
    try {
      const response = await fetch(`/api/questions/${projectId}/answers/${questionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers[questionId]),
      });
      
      if (response.ok) {
        setUnsavedQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        
        const result = await response.json();
        setLastSaved(result.timestamp);
        
        toast({
          title: "Answer Saved",
          description: "Your answer has been saved successfully.",
        });
      } else {
        throw new Error(`Failed to save answer: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error saving answer for question ${questionId}:`, error);
      toast({
        title: "Save Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingQuestions(prev => {
        const updated = new Set(prev);
        updated.delete(questionId);
        return updated;
      });
    }
  };

  // Save all unsaved answers
  const saveAllAnswers = async () => {
    if (!projectId || unsavedQuestions.size === 0) return;
    
    const answersToSave: Record<string, AnswerData> = {};
    unsavedQuestions.forEach(questionId => {
      if (answers[questionId]) {
        answersToSave[questionId] = answers[questionId];
      }
    });

    setSavingQuestions(new Set(unsavedQuestions));
    
    try {
      const response = await fetch(`/api/questions/${projectId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answersToSave),
      });
      
      if (response.ok) {
        setUnsavedQuestions(new Set());
        
        const result = await response.json();
        setLastSaved(result.timestamp);
        
        toast({
          title: "All Answers Saved",
          description: `Successfully saved ${Object.keys(answersToSave).length} answers.`,
        });
      } else {
        throw new Error(`Failed to save answers: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving all answers:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingQuestions(new Set());
    }
  };

  // Export answers as CSV
  const handleExportAnswers = () => {
    if (!rfpDocument) return;

    const rows = [
      ['Section', 'Question', 'Answer'], // Header row
    ];

    rfpDocument.sections.forEach(section => {
      section.questions.forEach(question => {
        rows.push([
          section.title,
          question.question,
          answers[question.id]?.text || ''
        ]);
      });
    });

    const csvContent = rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${rfpDocument.documentName} - Answers.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Get the currently selected question data
  const getSelectedQuestionData = () => {
    if (!selectedQuestion || !rfpDocument) return null;
    
    for (const section of rfpDocument.sections) {
      const question = section.questions.find(q => q.id === selectedQuestion);
      if (question) {
        return {
          question,
          section
        };
      }
    }
    return null;
  };

  // Filter questions based on the search query and filter type
  const getFilteredQuestions = (filterType = "all") => {
    if (!rfpDocument) return [];
    
    const allQuestions = rfpDocument.sections.flatMap(section => {
      return section.questions.map(question => ({
        ...question,
        sectionTitle: section.title,
        sectionId: section.id
      }));
    });
    
    let statusFiltered = allQuestions;
    
    if (filterType === "answered") {
      statusFiltered = allQuestions.filter(q => 
        answers[q.id]?.text && answers[q.id].text.trim() !== ''
      );
    } else if (filterType === "unanswered") {
      statusFiltered = allQuestions.filter(q => 
        !answers[q.id]?.text || answers[q.id].text.trim() === ''
      );
    }
    
    if (!searchQuery) return statusFiltered;
    
    const query = searchQuery.toLowerCase();
    return statusFiltered.filter(q => 
      q.question.toLowerCase().includes(query) || 
      q.sectionTitle.toLowerCase().includes(query)
    );
  };

  // Count questions by status
  const getCounts = () => {
    if (!rfpDocument) return { all: 0, answered: 0, unanswered: 0 };
    
    const allQuestions = rfpDocument.sections.flatMap(s => s.questions);
    const answeredCount = allQuestions.filter(q => answers[q.id]?.text && answers[q.id].text.trim() !== '').length;
    
    return {
      all: allQuestions.length,
      answered: answeredCount,
      unanswered: allQuestions.length - answeredCount
    };
  };

  // Handle source click to open the modal
  const handleSourceClick = (source: AnswerSource) => {
    setSelectedSource(source);
    setIsSourceModalOpen(true);
  };

  // Refresh questions data
  const refreshQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/questions/${projectId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load questions");
      }
      
      const data = await response.json();
      setRfpDocument(data);

      const answersResponse = await fetch(`/api/questions/${projectId}/answers`);
      if (answersResponse.ok) {
        const savedAnswers = await answersResponse.json();
        
        const normalizedAnswers: Record<string, AnswerData> = {};
        for (const [questionId, answerData] of Object.entries(savedAnswers)) {
          if (typeof answerData === 'string') {
            normalizedAnswers[questionId] = { text: answerData };
          } else {
            normalizedAnswers[questionId] = answerData as AnswerData;
          }
        }
        
        setAnswers(normalizedAnswers);
      }
    } catch (error) {
      console.error("Error refreshing questions:", error);
      setError("Failed to refresh questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const value: QuestionsContextType = {
    // UI state
    showAIPanel,
    setShowAIPanel,
    selectedQuestion,
    setSelectedQuestion,
    activeTab,
    setActiveTab,
    
    // Data state
    isLoading,
    error,
    rfpDocument,
    project,
    answers,
    unsavedQuestions,
    
    // Process state
    savingQuestions,
    lastSaved,
    isGenerating,
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    isSourceModalOpen,
    setIsSourceModalOpen,
    selectedIndexes,
    setSelectedIndexes,
    availableIndexes,
    isLoadingIndexes,
    organizationConnected,
    
    // Multi-step response state
    useMultiStep,
    setUseMultiStep,
    multiStepDialogOpen,
    setMultiStepDialogOpen,
    currentQuestionForMultiStep,
    currentQuestionText,
    
    // Multi-step response hook
    generateMultiStepResponse,
    isMultiStepGenerating,
    multiStepSteps,
    multiStepFinalResponse,
    multiStepSources,
    resetMultiStepResponse,
    
    // Action handlers
    handleAnswerChange,
    handleGenerateAnswer,
    saveAnswer,
    saveAllAnswers,
    handleExportAnswers,
    handleSourceClick,
    handleAcceptMultiStepResponse,
    handleCloseMultiStepDialog,
    
    // Utility functions
    getFilteredQuestions,
    getCounts,
    getSelectedQuestionData,
    refreshQuestions,
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
} 