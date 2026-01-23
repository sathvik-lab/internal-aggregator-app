# Firestore Indexes Guide

## Overview
Firestore requires composite indexes for queries that filter on multiple fields or combine filters with ordering. This guide explains which indexes are needed and how to create them.

## Automatic Index Creation
When you run a query that requires an index, Firestore will:
1. Return an error with a link to create the index
2. The error message includes a direct link to Firebase Console
3. Click the link to create the index automatically

## Required Indexes

### Documents Collection

#### Index 1: User Documents by Upload Date
**Query**: Get user's documents sorted by upload date (descending)
```javascript
queryDocuments('documents', 
  [{ field: 'userId', operator: '==', value: userId }],
  { orderBy: { field: 'uploadDate', direction: 'desc' } }
)
```

**Index Configuration**:
- Collection: `documents`
- Fields:
  1. `userId` (Ascending)
  2. `uploadDate` (Descending)

**Create in Console**:
1. Go to Firestore > Indexes
2. Click "Create Index"
3. Collection ID: `documents`
4. Add fields:
   - `userId` (Ascending)
   - `uploadDate` (Descending)
5. Click "Create"

#### Index 2: User Documents by Category
**Query**: Get user's documents filtered by category
```javascript
queryDocuments('documents', 
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'category', operator: '==', value: category }
  ]
)
```

**Index Configuration**:
- Collection: `documents`
- Fields:
  1. `userId` (Ascending)
  2. `category` (Ascending)

#### Index 3: User Documents by Category and Date
**Query**: Get user's documents filtered by category, sorted by date
```javascript
queryDocuments('documents', 
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'category', operator: '==', value: category }
  ],
  { orderBy: { field: 'uploadDate', direction: 'desc' } }
)
```

**Index Configuration**:
- Collection: `documents`
- Fields:
  1. `userId` (Ascending)
  2. `category` (Ascending)
  3. `uploadDate` (Descending)

### Checklist Items Collection

#### Index 1: User Checklist Items by Status
**Query**: Get user's checklist items filtered by status
```javascript
queryDocuments('checklistItems', 
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'status', operator: '==', value: 'pending' }
  ]
)
```

**Index Configuration**:
- Collection: `checklistItems`
- Fields:
  1. `userId` (Ascending)
  2. `status` (Ascending)

#### Index 2: User Checklist Items by Due Date
**Query**: Get user's checklist items sorted by due date
```javascript
queryDocuments('checklistItems', 
  [{ field: 'userId', operator: '==', value: userId }],
  { orderBy: { field: 'dueDate', direction: 'asc' } }
)
```

**Index Configuration**:
- Collection: `checklistItems`
- Fields:
  1. `userId` (Ascending)
  2. `dueDate` (Ascending)

#### Index 3: User Checklist Items by Status and Due Date
**Query**: Get user's pending items sorted by due date
```javascript
queryDocuments('checklistItems', 
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'status', operator: '==', value: 'pending' }
  ],
  { orderBy: { field: 'dueDate', direction: 'asc' } }
)
```

**Index Configuration**:
- Collection: `checklistItems`
- Fields:
  1. `userId` (Ascending)
  2. `status` (Ascending)
  3. `dueDate` (Ascending)

#### Index 4: User Checklist Items by Completed Status
**Query**: Get user's completed items
```javascript
queryDocuments('checklistItems', 
  [
    { field: 'userId', operator: '==', value: userId },
    { field: 'completed', operator: '==', value: false }
  ]
)
```

**Index Configuration**:
- Collection: `checklistItems`
- Fields:
  1. `userId` (Ascending)
  2. `completed` (Ascending)

## Creating Indexes

### Method 1: Automatic (Recommended)
1. Run the query in your app
2. Firestore returns error with link
3. Click the link in error message
4. Firebase Console opens with index pre-configured
5. Click "Create Index"
6. Wait for index to build (usually 1-5 minutes)

### Method 2: Manual in Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** > **Indexes**
4. Click **Create Index**
5. Fill in:
   - Collection ID
   - Fields (add each field with sort order)
6. Click **Create**
7. Wait for index to build

### Method 3: Firebase CLI
Create `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "uploadDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "uploadDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "checklistItems",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

## Index Status
- **Building**: Index is being created (wait 1-5 minutes)
- **Enabled**: Index is ready to use
- **Error**: Index creation failed (check configuration)

## Best Practices
1. **Create indexes proactively** - Don't wait for errors
2. **Test queries** - Run queries to trigger automatic index creation
3. **Monitor index usage** - Check which indexes are used most
4. **Remove unused indexes** - Clean up indexes that are no longer needed

## Troubleshooting

### "The query requires an index"
**Solution**: Click the link in the error message to create the index automatically.

### Index taking too long to build
**Solution**: 
- Large collections take longer (5-10 minutes)
- Check index status in Console
- Verify field paths are correct

### Index already exists but query fails
**Solution**:
- Verify field order matches query
- Check sort direction (ascending vs descending)
- Ensure collection name matches exactly

## Notes
- Single-field queries don't need indexes
- Queries with only `userId` filter don't need indexes (if `userId` is the only filter)
- Composite queries (multiple filters + ordering) require indexes
- Indexes are free but count toward project quotas
