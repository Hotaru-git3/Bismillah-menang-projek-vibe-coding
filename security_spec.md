# Firestore Security Spec

## Data Invariants
1. Users can only access their own data.
2. An expense must belong to the user's `expenses` subcollection.
3. Split bills and constraints must belong to the user's subcollections.
4. Timestamps (`createdAt`, `updatedAt`) must originate from the server.
5. All references (`userId`) must strictly equal `request.auth.uid`.

## Dirty Dozen Payloads
1. Create user with role: admin
2. Create user with another uid
3. Update user modifying createdAt
4. Create expense without userId
5. Create expense for another user
6. Update expense modifying userId
7. Create expense with invalid amount (string instead of int)
8. Create split bill missing friends array
9. Set arrays with > 50 elements
10. Spoofing document ID
11. Update challenge modifying dateAssigned
12. Blanket list queries bypassing resource.data.userId == request.auth.uid

## Test Runner
(Deferred to implementation if needed)
