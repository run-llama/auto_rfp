# Refactor Large Context Providers for Better Performance

## 🟠 High Priority - Performance

### Summary
The `questions-provider.tsx` file is 726 lines long with 40+ state variables in a single context, causing unnecessary re-renders and performance issues. The `organization-context.tsx` also has complex useEffect dependencies leading to infinite loop workarounds.

### Impact
- Every state change triggers re-render of entire component tree
- Poor performance when editing questions or switching tabs
- Difficult to debug which state changes cause re-renders
- Hard to maintain and extend functionality
- Memory leaks from improper cleanup
- Hacky workarounds like refs to prevent infinite loops

### Current State

#### Problem 1: Massive Questions Provider (726 lines)

```typescript
// app/projects/[projectId]/questions/components/questions-provider.tsx
export function QuestionsProvider({ children }: QuestionsProviderProps) {
  // UI State (should be separate context)
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'order' | 'section'>('order');
  const [filterText, setFilterText] = useState('');

  // Data State (should be separate context)
  const [rfpDocument, setRfpDocument] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Source[]>([]);
  const [originalAnswers, setOriginalAnswers] = useState<Record<string, string>>({});

  // Loading States (should be separate context)
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Response State (should be separate context)
  const [currentSteps, setCurrentSteps] = useState<GenerationStep[]>([]);
  const [finalResponse, setFinalResponse] = useState<string>('');

  // ... 30+ more state variables

  // Expensive computation without memoization (lines 563-593)
  const getFilteredQuestions = () => {
    if (!rfpDocument?.questions) return [];

    let filtered = rfpDocument.questions;

    // Filter by tab
    if (selectedTab !== "all") {
      filtered = filtered.filter(q => q.section === selectedTab);
    }

    // Filter by text
    if (filterText) {
      filtered = filtered.filter(q =>
        q.text.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'section') {
      filtered = [...filtered].sort((a, b) => a.section.localeCompare(b.section));
    }

    return filtered; // Recalculated on EVERY render!
  };

  // Huge context value causes everything to re-render
  const value = {
    rfpDocument,
    answers,
    sources,
    selectedTab,
    setSelectedTab,
    activeQuestion,
    setActiveQuestion,
    isEditing,
    setIsEditing,
    // ... 40+ more values
    handleSave,
    handleGenerate,
    handleReset,
    getFilteredQuestions,
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
}
```

**What happens:**
- Change `selectedTab` → entire tree re-renders
- Type in filter → entire tree re-renders
- Generate response → entire tree re-renders
- Save answer → entire tree re-renders

#### Problem 2: Infinite Loop Workarounds

```typescript
// context/organization-context.tsx (lines 134-231)
export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const lastProcessedPathRef = useRef<string>(''); // Workaround!

  useEffect(() => {
    // Comment says: "Removed currentOrganization to prevent infinite loop"
    // This is a sign of improper dependency management!

    if (lastProcessedPathRef.current === pathname) {
      return; // Using ref to prevent re-execution
    }

    lastProcessedPathRef.current = pathname;

    // Complex logic that should be refactored
    const orgId = extractOrgIdFromPath(pathname);
    if (orgId && orgId !== currentOrganization?.id) {
      setCurrentOrganization(organizations.find(o => o.id === orgId));
    }
  }, [pathname]); // Missing currentOrganization from deps because it causes loops!
}
```

### Implementation Strategy

#### Step 1: Split Questions Context into Multiple Contexts

Create separate contexts for different concerns:

**File: `contexts/questions/QuestionsDataContext.tsx`**
```typescript
// Data-only context (rarely changes)
interface QuestionsDataContextValue {
  rfpDocument: RFPDocument | null;
  answers: Record<string, Answer>;
  sources: Source[];
  isLoading: boolean;
}

const QuestionsDataContext = createContext<QuestionsDataContextValue | null>(null);

export function QuestionsDataProvider({ projectId, children }) {
  const [rfpDocument, setRfpDocument] = useState<RFPDocument | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data once on mount
  useEffect(() => {
    loadQuestionsData(projectId);
  }, [projectId]);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ rfpDocument, answers, sources, isLoading }),
    [rfpDocument, answers, sources, isLoading]
  );

  return (
    <QuestionsDataContext.Provider value={value}>
      {children}
    </QuestionsDataContext.Provider>
  );
}

export function useQuestionsData() {
  const context = useContext(QuestionsDataContext);
  if (!context) {
    throw new Error('useQuestionsData must be used within QuestionsDataProvider');
  }
  return context;
}
```

**File: `contexts/questions/QuestionsUIContext.tsx`**
```typescript
// UI state context (changes frequently)
interface QuestionsUIContextValue {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  activeQuestion: string | null;
  setActiveQuestion: (id: string | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  filterText: string;
  setFilterText: (text: string) => void;
  sortBy: 'order' | 'section';
  setSortBy: (sort: 'order' | 'section') => void;
}

const QuestionsUIContext = createContext<QuestionsUIContextValue | null>(null);

export function QuestionsUIProvider({ children }) {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'section'>('order');

  const value = useMemo(
    () => ({
      selectedTab,
      setSelectedTab,
      activeQuestion,
      setActiveQuestion,
      isEditing,
      setIsEditing,
      filterText,
      setFilterText,
      sortBy,
      setSortBy,
    }),
    [selectedTab, activeQuestion, isEditing, filterText, sortBy]
  );

  return (
    <QuestionsUIContext.Provider value={value}>
      {children}
    </QuestionsUIContext.Provider>
  );
}

export function useQuestionsUI() {
  const context = useContext(QuestionsUIContext);
  if (!context) {
    throw new Error('useQuestionsUI must be used within QuestionsUIProvider');
  }
  return context;
}
```

**File: `contexts/questions/QuestionsActionsContext.tsx`**
```typescript
// Actions context (stable functions)
interface QuestionsActionsContextValue {
  saveAnswer: (questionId: string, answer: string) => Promise<void>;
  generateResponse: (questionId: string) => Promise<void>;
  deleteAnswer: (questionId: string) => Promise<void>;
  refreshQuestions: () => Promise<void>;
}

const QuestionsActionsContext = createContext<QuestionsActionsContextValue | null>(null);

export function QuestionsActionsProvider({ children }) {
  const { rfpDocument, answers } = useQuestionsData();

  // Wrap in useCallback to maintain referential equality
  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    await api.saveAnswer(questionId, answer);
    // Update data context
  }, []);

  const generateResponse = useCallback(async (questionId: string) => {
    await api.generateResponse(questionId);
  }, []);

  const deleteAnswer = useCallback(async (questionId: string) => {
    await api.deleteAnswer(questionId);
  }, []);

  const refreshQuestions = useCallback(async () => {
    await api.refreshQuestions();
  }, []);

  const value = useMemo(
    () => ({ saveAnswer, generateResponse, deleteAnswer, refreshQuestions }),
    [saveAnswer, generateResponse, deleteAnswer, refreshQuestions]
  );

  return (
    <QuestionsActionsContext.Provider value={value}>
      {children}
    </QuestionsActionsContext.Provider>
  );
}

export function useQuestionsActions() {
  const context = useContext(QuestionsActionsContext);
  if (!context) {
    throw new Error('useQuestionsActions must be used within QuestionsActionsProvider');
  }
  return context;
}
```

**File: `contexts/questions/index.tsx`**
```typescript
// Compose all providers
export function QuestionsProvider({ projectId, children }) {
  return (
    <QuestionsDataProvider projectId={projectId}>
      <QuestionsUIProvider>
        <QuestionsActionsProvider>
          {children}
        </QuestionsActionsProvider>
      </QuestionsUIProvider>
    </QuestionsDataProvider>
  );
}

// Re-export hooks
export { useQuestionsData } from './QuestionsDataContext';
export { useQuestionsUI } from './QuestionsUIContext';
export { useQuestionsActions } from './QuestionsActionsContext';
```

#### Step 2: Fix Organization Context Infinite Loops

**Before:**
```typescript
// context/organization-context.tsx
const lastProcessedPathRef = useRef<string>(''); // Hack!

useEffect(() => {
  if (lastProcessedPathRef.current === pathname) return;
  lastProcessedPathRef.current = pathname;

  // Logic...
}, [pathname]); // Missing deps!
```

**After:**
```typescript
// context/organization-context.tsx
export function OrganizationProvider({ children }) {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Load organizations once
  useEffect(() => {
    loadOrganizations().then(setOrganizations);
  }, []);

  // Update current org when path changes
  useEffect(() => {
    const orgIdFromPath = extractOrgIdFromPath(pathname);
    if (orgIdFromPath !== currentOrgId) {
      setCurrentOrgId(orgIdFromPath);
    }
  }, [pathname, currentOrgId]); // All deps included - no infinite loop!

  // Derive current organization (no state needed)
  const currentOrganization = useMemo(
    () => organizations.find(o => o.id === currentOrgId) ?? null,
    [organizations, currentOrgId]
  );

  const value = useMemo(
    () => ({ currentOrganization, organizations, setCurrentOrgId }),
    [currentOrganization, organizations]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
```

#### Step 3: Update Components to Use Split Contexts

**Before:**
```typescript
function QuestionsList() {
  const {
    rfpDocument,
    answers,
    selectedTab,
    filterText,
    getFilteredQuestions,
    handleSave
  } = useQuestions(); // Gets entire context

  const questions = getFilteredQuestions(); // Not memoized!

  return questions.map(q => <QuestionCard key={q.id} question={q} />);
}
```

**After:**
```typescript
function QuestionsList() {
  // Only subscribe to what you need
  const { rfpDocument } = useQuestionsData();
  const { selectedTab, filterText, sortBy } = useQuestionsUI();

  // Memoize expensive computation
  const filteredQuestions = useMemo(() => {
    if (!rfpDocument?.questions) return [];

    let filtered = rfpDocument.questions;

    if (selectedTab !== "all") {
      filtered = filtered.filter(q => q.section === selectedTab);
    }

    if (filterText) {
      filtered = filtered.filter(q =>
        q.text.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (sortBy === 'section') {
      filtered = [...filtered].sort((a, b) => a.section.localeCompare(b.section));
    }

    return filtered;
  }, [rfpDocument, selectedTab, filterText, sortBy]);

  return filteredQuestions.map(q => <QuestionCard key={q.id} question={q} />);
}

// This component only re-renders when UI state changes
function FilterBar() {
  const { filterText, setFilterText } = useQuestionsUI();
  // Doesn't re-render when data changes!

  return <input value={filterText} onChange={e => setFilterText(e.target.value)} />;
}
```

### Acceptance Criteria
- [ ] Split `questions-provider.tsx` into separate contexts:
  - [ ] `QuestionsDataContext` (rfpDocument, answers, sources)
  - [ ] `QuestionsUIContext` (selectedTab, activeQuestion, filterText, etc.)
  - [ ] `QuestionsActionsContext` (handleSave, handleGenerate, etc.)
- [ ] Add proper memoization with `useMemo` for expensive computations
- [ ] Add `useCallback` for all action handlers
- [ ] Remove `lastProcessedPathRef` workaround from organization context
- [ ] Fix all useEffect dependency arrays (no missing deps)
- [ ] Update all components to use specific context hooks
- [ ] Verify no infinite loops occur
- [ ] Add comments explaining state management patterns
- [ ] Document context usage in CONTRIBUTING.md
- [ ] Measure performance improvement with React DevTools Profiler

### Files to Update
- `app/projects/[projectId]/questions/components/questions-provider.tsx` (split into multiple files)
- `context/organization-context.tsx` (fix infinite loops)
- All components using `useQuestions()` hook
- All components using `useOrganization()` hook

### Testing
- [ ] Test that changing filter doesn't re-render question cards
- [ ] Test that changing tab works correctly
- [ ] Test that editing answer doesn't re-render entire list
- [ ] Test that organization switching works without infinite loops
- [ ] Use React DevTools Profiler to measure re-renders before/after
- [ ] Verify no console warnings about missing dependencies
- [ ] Test all user flows still work correctly

### Estimated Effort
8-12 hours
- 3-4 hours: Split questions context into multiple contexts
- 2-3 hours: Fix organization context infinite loops
- 2-3 hours: Update all components to use new hooks
- 1-2 hours: Testing and performance verification

### Related Issues
- HIGH-005 (Add memoization to expensive operations)
- HIGH-010 (Fix infinite loop in organization context)
- MED-012 (Extract complex transaction logic)
