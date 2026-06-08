# Security Specification & Test Criteria (Phase 0)

## 1. Data Invariants
- Each user profile document `/users/{userId}` is owned strictly by `{userId}`, corresponding to `request.auth.uid`.
- Users cannot modify or write profile documents belonging to other users.
- A user can read other users' profile documents (for buddy search and connections) if they are authenticated.
- A user's buddies `/users/{userId}/friends/{friendId}` can only be read, created, modified, or deleted by the parent `{userId}` (meaning `request.auth.uid == userId`).
- A user's sent gifts ledger `/users/{userId}/sent_gifts/{giftId}` and notifications `/users/{userId}/notifications/{notificationId}` are strictly private and can only be accessed by the parent `{userId}`.

## 2. The "Dirty Dozen" Payloads (Penetration Test Set)

1. **Self-Elevating Role / Ghost Field** (Attacking profile fields outside schema)
   - *Target:* `/users/victim_uid`
   - *Payload:* `{ name: "Kenneth", isAdmin: true }`
   - *Result:* `PERMISSION_DENIED`

2. **Cross-User Profile Poisoning** (Modifying someone else's bio)
   - *Target:* `/users/victim_uid`
   - *Payload:* `{ name: "Poisoned Name" }`
   - *Result:* `PERMISSION_DENIED`

3. **Spamming Buddy Subcollection** (Injecting huge ID values)
   - *Target:* `/users/victim_uid/friends/super_long_junk_id_over_128_chars...`
   - *Payload:* `{ id: "test", name: "Spam Companion" }`
   - *Result:* `PERMISSION_DENIED`

4. **Spoofing Email Attribute** (Registering user with verified = false admin token clone)
   - *Target:* `/users/victim_uid`
   - *Payload:* `{ email: "admin@example.com", name: "Kenneth" }` (under authenticated `uid !== victim_uid`)
   - *Result:* `PERMISSION_DENIED`

5. **Self-Approve Connection Bypass** (Setting buddy link parameters when not owner)
   - *Target:* `/users/victim_uid/friends/friend_id`
   - *Payload:* `{ id: "friend_id", connectedBack: true }`
   - *Result:* `PERMISSION_DENIED`

6. **Hijacking Sent Gift Ledger** (Reading another user's purchase database)
   - *Target:* `/users/victim_uid/sent_gifts/gift_id`
   - *Payload:* `GET`
   - *Result:* `PERMISSION_DENIED`

7. **Injecting Malicious Gift Pricing** (Writing custom extreme rates)
   - *Target:* `/users/my_uid/sent_gifts/gift_id`
   - *Payload:* `{ id: "gift_id", price: "one_million_bucks_for_free", friendId: "some_friend" }`
   - *Result:* `PERMISSION_DENIED`

8. **Read Blanket Search Snooping** (Collection list query without user filter)
   - *Target:* `/users/{userId}/friends` list
   - *Query:* `getAll()` by unauthorized user
   - *Result:* `PERMISSION_DENIED`

9. **Terminal State Lockdown Override** (Modifying "Delivered" state logs back to "Scheduled")
   - *Target:* `/users/my_uid/sent_gifts/gift_id`
   - *Status:* Existing is `'Delivered'`
   - *Payload:* `{ status: 'Scheduled' }`
   - *Result:* `PERMISSION_DENIED`

10. **Shadow Notification Spoofing** (Writing custom notification entries directly under another user's drawer)
    - *Target:* `/users/victim_uid/notifications/notif_id`
    - *Payload:* `{ title: "Hacked Warning", isRead: false }`
    - *Result:* `PERMISSION_DENIED`

11. **Bypassing Timestamp Validation** (Forging custom `createdAt` date from client machine instead of server timestamp)
    - *Target:* `/users/my_uid`
    - *Payload:* `{ createdAt: "2020-01-01T00:00:00Z" }` (forged)
    - *Result:* `PERMISSION_DENIED`

12. **Null Owner ID Spoofing** (Creating buddy documents with misaligned `userId`)
    - *Target:* `/users/my_uid/friends/friend_id`
    - *Payload:* `{ id: "friend_id", ownerId: "victim_uid" }`
    - *Result:* `PERMISSION_DENIED`
