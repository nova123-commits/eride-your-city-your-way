# eRide — Database Architecture & ERD

## Entity Relationship Diagram (Text)

```
auth.users (Supabase managed)
  │
  ├──1:1──► profiles (id = auth.users.id)
  │           • full_name, phone, mpesa_phone, avatar_url
  │           • safety_terms_accepted_at (driver compliance)
  │           • managed_by (manager oversight)
  │
  ├──1:N──► user_roles
  │           • role: rider | driver | admin | manager
  │
  ├──1:1──► wallets
  │           • balance, currency (KES)
  │           │
  │           └──1:N──► wallet_transactions
  │                       • amount, fee, type, label, status
  │
  ├──1:N──► trusted_contacts
  │           • name, phone (max 3 enforced in app)
  │
  ├──1:N──► saved_addresses
  │           • label (Home/Work/etc), address
  │
  ├──1:N──► locked_fares
  │           • pickup, destination, fare_amount
  │           • expires_at (30 min window)
  │
  ├──1:N──► scheduled_trips
  │           • pickup, destination, scheduled_at, stops (jsonb)
  │
  ├──1:N──► shared_trips
  │           • share_token (unique URL), driver_name, plate
  │
  ├──1:N──► sos_alerts
  │           • status, location_text, resolved_at/by
  │
  ├──1:N──► support_tickets
  │           │  • subject, description, category, status
  │           └──1:N──► support_messages
  │                       • content, sender_role
  │
  ├──1:N──► lost_items
  │           • description, trip_date, status, admin_notes
  │
  ├──1:N──► referrals
  │           • referral_code, referred_id, trips_completed, bonus_paid
  │
  ├──1:N──► driver_commitment_scores (driver only)
  │           • score, total_accepts, total_cancels
  │
  ├──1:N──► driver_cancellations (driver only)
  │           • trip_id, reason
  │
  └──1:N──► audit_trail
              • action, actor_role, target_table, details (jsonb)

Standalone tables:
  • platform_settings (key/value config)
  • promo_codes (discount management)
  • broadcasts (admin → role announcements)
  • admin_permissions (granular admin access)
  • waitlist (pre-launch signups)
```

## Enum: `app_role`

| Value | Description |
|-------|-------------|
| `rider` | Passenger account (default) |
| `driver` | Driver/boda partner |
| `admin` | Platform administrator |
| `manager` | Senior ops / legal compliance |

## Key Security Patterns

1. **Roles in separate table** — `user_roles` is isolated from `profiles` to prevent privilege escalation.
2. **Security definer functions** — `has_role()` and `get_user_role()` bypass RLS recursion.
3. **All tables have RLS enabled** — No table is publicly writable without policy checks.
4. **Audit trail** — All sensitive actions are logged with actor, role, and timestamp.

## Edge Functions

| Function | Purpose | Secrets Required |
|----------|---------|-----------------|
| `nearby-landmarks` | Google Places API — safe pickup points | `GOOGLE_MAPS_API_KEY` |
| `predictive-eta` | Google Distance Matrix — traffic-aware ETA | `GOOGLE_MAPS_API_KEY` |
| `ride-match` | AI driver matching via Lovable Gateway | `LOVABLE_API_KEY` |
| `support-chat` | AI support chatbot (streaming) | `LOVABLE_API_KEY` |

## Secrets Summary

| Secret | Source | Used By |
|--------|--------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console | nearby-landmarks, predictive-eta |
| `LOVABLE_API_KEY` | Auto-provisioned by Lovable Cloud | ride-match, support-chat |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provisioned | Internal admin operations |
| `SUPABASE_ANON_KEY` | Auto-provisioned | Client SDK |
