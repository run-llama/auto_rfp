# Optimize Database Query Performance

## 🟠 High Priority - Performance

### Summary
Database queries use inefficient patterns like N+1 queries and complex single transactions.

### Issues Found

**N+1 Pattern:**
```typescript
// lib/project-service.ts (lines 345-357)
await Promise.all(sources.map(source =>
  tx.source.create({ data: source })
)); // ❌ Creates N queries instead of 1
```

**Should use:**
```typescript
await tx.source.createMany({
  data: sources // ✅ Single query
});
```

**Complex Transaction:**
```typescript
// lib/project-service.ts (lines 113-171)
// 58 lines in single transaction - should be broken down
```

### Acceptance Criteria
- [ ] Replace Promise.all(map(create)) with createMany
- [ ] Add database indexes for common queries
- [ ] Break down complex transactions
- [ ] Add query performance monitoring
- [ ] Use select to limit returned fields
- [ ] Add connection pooling configuration

### Estimated Effort
4-6 hours
