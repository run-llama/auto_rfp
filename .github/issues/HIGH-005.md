# Add Memoization to Expensive Operations

## 🟠 High Priority - Performance

### Summary
React components perform expensive computations on every render without memoization, causing performance issues and unnecessary re-renders.

### Impact
- Slow UI responsiveness
- Entire lists re-render when single item changes
- Expensive filter/map operations recalculated every render
- Poor user experience on slower devices

### Current State

#### Problem 1: Expensive Filtering Without Memoization
**File**: `app/projects/[projectId]/questions/components/questions-provider.tsx` (lines 563-593)

```typescript
const getFilteredQuestions = (filterType = "all") => {
  if (!rfpDocument) return [];

  // ❌ This runs on EVERY render, even if rfpDocument hasn't changed
  const allQuestions = rfpDocument.sections.flatMap(section => {
    return section.questions.map(question => ({
      ...question,
      sectionTitle: section.title,
      sectionId: section.id
    }));
  });

  // More filtering logic...
  return filtered;
};

// Called multiple times per render
const filteredQuestions = getFilteredQuestions(selectedTab);
```

#### Problem 2: Callbacks Not Memoized
**File**: `hooks/use-multi-step-response.ts` (lines 162-255)

```typescript
// ❌ These functions are recreated on every render
const getCurrentSteps = () => {
  // Complex logic parsing through messages
  // Returns array that could be memoized
};

const getFinalResponse = () => {
  // More complex parsing
  // Returns object that could be memoized
};
```

#### Problem 3: List Items Not Memoized
**File**: `components/organizations/TeamMembersTable.tsx` (lines 64-72)

```typescript
{members.map((member) => (
  <MemberTableRow
    key={member.id}
    member={member}
    orgId={orgId}
    onMemberUpdated={onMemberUpdated}  // ❌ New function reference each render
    onMemberRemoved={onMemberRemoved}  // ❌ New function reference each render
  />
))}
```

### Implementation Strategy

#### Step 1: Memoize Expensive Computations

```typescript
// questions-provider.tsx
import { useMemo } from 'react';

const allQuestions = useMemo(() => {
  if (!rfpDocument) return [];

  return rfpDocument.sections.flatMap(section => {
    return section.questions.map(question => ({
      ...question,
      sectionTitle: section.title,
      sectionId: section.id
    }));
  });
}, [rfpDocument]); // ✅ Only recalculates when rfpDocument changes

const filteredQuestions = useMemo(() => {
  return allQuestions.filter(question => {
    // Filter logic
  });
}, [allQuestions, selectedTab, searchTerm]); // ✅ Proper dependencies
```

#### Step 2: Memoize Callback Functions

```typescript
import { useCallback } from 'react';

const onMemberUpdated = useCallback((memberId: string, updates: any) => {
  // Handle update
  setMembers(prev => prev.map(m =>
    m.id === memberId ? { ...m, ...updates } : m
  ));
}, []); // ✅ Stable function reference

const onMemberRemoved = useCallback((memberId: string) => {
  setMembers(prev => prev.filter(m => m.id !== memberId));
}, []); // ✅ Stable function reference
```

#### Step 3: Memoize List Components

```typescript
// components/organizations/MemberTableRow.tsx
import { memo } from 'react';

interface MemberTableRowProps {
  member: Member;
  orgId: string;
  onMemberUpdated: (id: string, updates: any) => void;
  onMemberRemoved: (id: string) => void;
}

const MemberTableRow = memo(({ member, orgId, onMemberUpdated, onMemberRemoved }: MemberTableRowProps) => {
  return (
    <TableRow>
      {/* Row content */}
    </TableRow>
  );
});

MemberTableRow.displayName = 'MemberTableRow';

export default MemberTableRow;
```

#### Step 4: Memoize in Custom Hooks

```typescript
// hooks/use-multi-step-response.ts
import { useMemo } from 'react';

export function useMultiStepResponse() {
  // ... state declarations

  const currentSteps = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    // Complex parsing logic
    const latestAssistantMessage = messages
      .filter(m => m.role === 'assistant')
      .pop();

    if (!latestAssistantMessage?.toolInvocations) return [];

    return latestAssistantMessage.toolInvocations.map((invocation, index) => ({
      // Step mapping
    }));
  }, [messages]); // ✅ Only recalculates when messages change

  const finalResponse = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    // Complex response extraction
    return extractedResponse;
  }, [messages]); // ✅ Proper memoization

  return {
    currentSteps,
    finalResponse,
    // ...
  };
}
```

#### Step 5: Optimize Context Providers

```typescript
// context/organization-context.tsx
import { useMemo, useCallback } from 'react';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // ✅ Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentOrganization,
    organizations,
    setCurrentOrganization,
    setOrganizations,
  }), [currentOrganization, organizations]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
```

### Acceptance Criteria

#### Expensive Computations
- [ ] Wrap `getFilteredQuestions` in `useMemo`
- [ ] Wrap `getCurrentSteps` in `useMemo`
- [ ] Wrap `getFinalResponse` in `useMemo`
- [ ] Memoize all filter/map/reduce operations in providers

#### Callback Functions
- [ ] Wrap event handlers passed to lists in `useCallback`
- [ ] Wrap `onMemberUpdated` in `useCallback`
- [ ] Wrap `onMemberRemoved` in `useCallback`
- [ ] Wrap `handleAnswerChange` in `useCallback`
- [ ] Wrap `handleSave` callbacks in `useCallback`

#### Component Memoization
- [ ] Wrap `MemberTableRow` with `React.memo`
- [ ] Wrap `ProjectCard` with `React.memo`
- [ ] Wrap question list item components with `React.memo`
- [ ] Add proper `displayName` to memoized components

#### Context Optimization
- [ ] Memoize context values in all providers
- [ ] Split large contexts to reduce re-render scope
- [ ] Use separate contexts for state and actions

#### Testing
- [ ] Use React DevTools Profiler to measure improvements
- [ ] Verify list items don't re-render when siblings update
- [ ] Test that memoized callbacks maintain referential equality
- [ ] Measure render counts before/after optimization

### Performance Benchmarks

Target improvements:
- Reduce question list re-renders by 80%
- Reduce member table re-renders by 80%
- Improve filter operation from ~50ms to ~5ms on large datasets
- Reduce context provider re-renders by 60%

### Files to Update
- [ ] `app/projects/[projectId]/questions/components/questions-provider.tsx`
- [ ] `hooks/use-multi-step-response.ts`
- [ ] `components/organizations/TeamMembersTable.tsx`
- [ ] `components/organizations/MemberTableRow.tsx`
- [ ] `components/organizations/ProjectCard.tsx`
- [ ] `context/organization-context.tsx`
- [ ] All list-rendering components

### Estimated Effort
6-8 hours

### Related Issues
- HIGH-004 (Refactor large providers)
- HIGH-010 (Fix infinite loops)
- MED-020 (Optimize Framer Motion animations)

### References
- [React.memo documentation](https://react.dev/reference/react/memo)
- [useMemo documentation](https://react.dev/reference/react/useMemo)
- [useCallback documentation](https://react.dev/reference/react/useCallback)
