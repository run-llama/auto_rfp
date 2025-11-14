# Extract Duplicate LlamaCloud Integration Logic

## 🟠 High Priority - Code Maintainability

### Summary
~40 lines of LlamaCloud fetching/mapping logic duplicated in two files.

### Files Affected
- `app/api/llamacloud/projects/route.ts` (lines 17-59)
- `app/api/organizations/route.ts` (lines 85-122)

### Implementation
Create shared service method:
```typescript
// lib/services/llamacloud-client.ts
async fetchProjectsWithOrganizations(): Promise<ProjectWithOrg[]> {
  const projects = await this.getProjects();
  const organizations = await this.getOrganizations();
  const orgMap = new Map(organizations.map(o => [o.id, o.name]));
  
  return projects.map(p => ({
    ...p,
    organizationName: orgMap.get(p.organization_id) || 'Unknown'
  }));
}
```

### Acceptance Criteria
- [ ] Extract logic to llamacloud-client service
- [ ] Replace duplicate code with service call
- [ ] Add unit tests
- [ ] Ensure error handling is consistent

### Estimated Effort
2-3 hours
