# Highland Sanctuary Firestore Security Specification

## 1. Data Invariants
1. **User Ownership**: A `/users/{userId}` document may only be read or written by the authenticated, email-verified user whose `request.auth.uid == userId`. User collection listing is denied.
2. **Booking Ownership & Immutability**: A `/bookings/{bookingId}` document belongs strictly to `userId == request.auth.uid`. Once created as `Confirmed`, the only allowed state transition is `Confirmed -> Cancelled`, updating only `status` and `updatedAt`. `createdAt` and `userId` are immutable.
3. **Saved Bookmark Ownership**: A `/saved/{savedId}` document belongs strictly to `userId == request.auth.uid` and cannot be modified in place (create or delete only).
4. **Server Temporal Integrity**: All `createdAt`, `updatedAt`, and `savedAt` timestamps must match `request.time`.

## 2. Adversarial Payloads ("Dirty Dozen")
1. **Cross-User Profile Read**: User B attempts `get(/users/userA)` -> `PERMISSION_DENIED`.
2. **User Collection Scraping**: User A attempts `list(/users)` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Profile**: User A creates `/users/userA` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED`.
4. **UID Spoofing on Profile**: User A creates `/users/userA` with `{ uid: 'userB', ... }` -> `PERMISSION_DENIED`.
5. **Client Timestamp Forgery**: User A creates `/bookings/b1` with `createdAt` in the past -> `PERMISSION_DENIED`.
6. **Booking Ownership Hijack**: User A creates `/bookings/b2` with `userId: 'userB'` -> `PERMISSION_DENIED`.
7. **Unverified Email Write**: Unverified auth token attempts to create `/bookings/b3` -> `PERMISSION_DENIED`.
8. **Terminal State Reversal**: User A updates a `Cancelled` booking back to `Confirmed` -> `PERMISSION_DENIED`.
9. **Price Tampering on Update**: User A updates a booking's `totalInr` to `1` -> `PERMISSION_DENIED`.
10. **Unfiltered Bookings List**: User A lists `/bookings` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
11. **Oversized Addon Array**: User A submits `selectedAddonIds` with 50 entries -> `PERMISSION_DENIED`.
12. **ID Poisoning**: User A writes `/saved/bad id with spaces!` -> `PERMISSION_DENIED`.
