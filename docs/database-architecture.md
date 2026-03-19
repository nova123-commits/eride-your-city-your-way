# eRide Platform — Database Architecture

> Production-ready database design document.
> Generated from codebase analysis on 2026-03-19.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Database Tables](#3-database-tables)
4. [Relationships](#4-relationships)
5. [Row Level Security (RLS)](#5-row-level-security)
6. [Realtime Design](#6-realtime-design)
7. [Critical Backend Logic](#7-critical-backend-logic)
8. [Payments](#8-payments)
9. [Indexing & Performance](#9-indexing--performance)
10. [Security Considerations](#10-security-considerations)
11. [Scalability](#11-scalability)

---

## 1. System Overview

eRide is a ride-hailing platform built on **React + Vite + TypeScript** with **Supabase** as the backend.

### Supabase Usage

| Capability | Usage |
|---|---|
| **PostgreSQL** | All persistent data — users, rides, payments, wallets, support, etc. |
| **Auth** | Email/password signup with role metadata. Trigger `handle_new_user()` auto-creates profile, wallet, and role row on registration. |
| **RLS** | Every table has Row Level Security enabled. Access is gated by `auth.uid()` ownership checks and `has_role()` / `is_super_admin()` security-definer functions. |
| **Realtime** | Planned for driver location updates, ride status changes, SOS alerts, and notifications. |
| **Edge Functions** | `calculate-fare`, `assign-driver`, `complete-ride`, `mpesa-stk-push`, `nearby-landmarks`, `predictive-eta`, `ride-match`, `support-chat`. |
| **Storage** | Planned for driver document uploads (license, insurance, vehicle photos). |

### Frontend ↔ Backend Interaction

- The frontend uses `@supabase/supabase-js` client initialized with the anon key.
- All data access flows through the Supabase PostgREST layer, gated by RLS.
- Edge Functions handle server-side logic (fare calculation, driver assignment, ride completion).
- Auth state is managed via `useAuth()` context with session health checks every 5 minutes and proactive token refresh.

---

## 2. Roles & Permissions

Roles are stored in a **separate `user_roles` table** (never on `profiles`). The `app_role` enum defines:

| Role | Description | Access |
|---|---|---|
| `rider` | End-user booking rides | `/rider`, `/wallet`, `/safety-center`, `/trips-history`, `/help`, `/settings` |
| `driver` | Partner accepting & completing rides | `/driver`, `/driver/dashboard`, `/driver/manual`, `/wallet` |
| `admin` | Platform administrator | `/admin/*`, command center, approvals, surge, broadcasts, finance |
| `manager` | Senior admin with elevated privileges | `/manager`, all admin routes, platform setup, user role management, audit trail |
| `super_admin` | Highest privilege, identical routing to manager | Same as manager, platform initialization |
| `operations_manager` | Ops staff | Routed to `/admin/overview` |
| `support_agent` | Customer support | Routed to `/admin/overview`, ticket management |
| `finance` | Financial operations | Routed to `/admin/overview`, revenue & payout views |

### Permission Enforcement

- **Frontend**: `<ProtectedRoute allowedRoles={[...]}>` component blocks unauthorized access and redirects to role-appropriate home.
- **Backend**: RLS policies use `has_role(auth.uid(), 'admin')` and `is_super_admin(auth.uid())` security-definer functions to prevent policy recursion.

---

## 3. Database Tables

### 3.1 Authentication & Identity

#### `profiles`

Linked 1:1 to `auth.users` via `id`. Created automatically by `handle_new_user()` trigger.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK | Matches `auth.users.id` |
| `full_name` | text | nullable | |
| `phone` | text | nullable | |
| `mpesa_phone` | text | nullable | M-Pesa withdrawal number |
| `avatar_url` | text | nullable | |
| `managed_by` | uuid | nullable | Manager who oversees this user |
| `safety_terms_accepted_at` | timestamptz | nullable | Driver safety onboarding completion |
| `subscription_plan` | text | NOT NULL, default `'basic'` | `basic` or `gold` |
| `created_at` | timestamptz | NOT NULL, default `now()` | |
| `updated_at` | timestamptz | NOT NULL, default `now()` | |

#### `user_roles`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, UNIQUE with `role` |
| `role` | `app_role` | NOT NULL, default `'rider'` |

### 3.2 Rides

#### `rides`

Core ride lifecycle table. Tracks the full state machine from request to completion/cancellation.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK | |
| `rider_id` | uuid | NOT NULL | |
| `driver_id` | uuid | nullable | Set when driver assigned |
| `status` | text | NOT NULL, default `'requested'` | `requested`, `driver_assigned`, `driver_arriving`, `ride_started`, `ride_completed`, `cancelled` |
| `category` | text | NOT NULL, default `'basic'` | `basic`, `xtra`, `boda` |
| `pickup_address` | text | NOT NULL | |
| `pickup_lat` | double precision | nullable | |
| `pickup_lng` | double precision | nullable | |
| `destination_address` | text | NOT NULL | |
| `destination_lat` | double precision | nullable | |
| `destination_lng` | double precision | nullable | |
| `estimated_fare` | numeric | NOT NULL, default `0` | |
| `final_fare` | numeric | nullable | Set on completion |
| `surge_multiplier` | numeric | NOT NULL, default `1.0` | |
| `distance_km` | numeric | nullable | |
| `duration_minutes` | numeric | nullable | |
| `payment_method` | text | NOT NULL, default `'cash'` | `cash`, `wallet`, `mpesa`, `card` |
| `otp_code` | text | nullable | Rider-to-driver verification |
| `cancel_reason` | text | nullable | |
| `cancelled_by` | text | nullable | `rider` or `driver` |
| `started_at` | timestamptz | nullable | |
| `completed_at` | timestamptz | nullable | |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### `ride_status_history`

Audit log of every ride state transition.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `ride_id` | uuid | NOT NULL, FK → `rides.id` |
| `from_status` | text | nullable |
| `to_status` | text | NOT NULL |
| `changed_by` | uuid | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.3 Drivers

#### `vehicles`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `make` | text | NOT NULL |
| `model` | text | NOT NULL |
| `year` | integer | NOT NULL |
| `color` | text | NOT NULL |
| `plate_number` | text | NOT NULL |
| `category` | text | NOT NULL, default `'basic'` |
| `is_approved` | boolean | NOT NULL, default `false` |
| `is_active` | boolean | NOT NULL, default `false` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

#### `driver_documents`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `document_type` | text | NOT NULL | `license`, `insurance`, `vehicle_inspection`, `id_card` |
| `file_url` | text | NOT NULL |
| `status` | text | NOT NULL, default `'pending'` | `pending`, `approved`, `rejected` |
| `rejection_reason` | text | nullable |
| `expiry_date` | date | nullable |
| `reviewed_by` | uuid | nullable |
| `reviewed_at` | timestamptz | nullable |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

#### `driver_locations`

Real-time driver position tracking.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `latitude` | double precision | NOT NULL |
| `longitude` | double precision | NOT NULL |
| `heading` | double precision | nullable |
| `speed` | double precision | nullable |
| `is_online` | boolean | NOT NULL, default `false` |
| `updated_at` | timestamptz | NOT NULL |

#### `driver_commitment_scores`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `score` | integer | NOT NULL, default `100` |
| `total_accepts` | integer | NOT NULL, default `0` |
| `total_cancels` | integer | NOT NULL, default `0` |
| `updated_at` | timestamptz | NOT NULL |

#### `driver_cancellations`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `trip_id` | text | nullable |
| `reason` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

#### `driver_payouts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `driver_id` | uuid | NOT NULL |
| `ride_id` | uuid | nullable, FK → `rides.id` |
| `amount` | numeric | NOT NULL |
| `commission` | numeric | NOT NULL, default `0` |
| `net_amount` | numeric | NOT NULL |
| `status` | text | NOT NULL, default `'pending'` |
| `created_at` | timestamptz | NOT NULL |

### 3.4 Payments & Wallets

#### `wallets`

One per user, created by `handle_new_user()` trigger.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `balance` | numeric | NOT NULL, default `0` |
| `currency` | text | NOT NULL, default `'KES'` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

#### `wallet_transactions`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `amount` | numeric | NOT NULL |
| `fee` | numeric | NOT NULL, default `0` |
| `type` | text | NOT NULL | `credit` or `debit` |
| `label` | text | NOT NULL |
| `phone` | text | nullable |
| `status` | text | NOT NULL, default `'completed'` |
| `created_at` | timestamptz | NOT NULL |

#### `payments`

Per-ride payment records.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `ride_id` | uuid | NOT NULL, FK → `rides.id` |
| `payer_id` | uuid | NOT NULL |
| `amount` | numeric | NOT NULL |
| `currency` | text | NOT NULL, default `'KES'` |
| `method` | text | NOT NULL, default `'cash'` |
| `status` | text | NOT NULL, default `'pending'` |
| `transaction_ref` | text | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.5 Safety

#### `sos_alerts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `status` | text | NOT NULL, default `'active'` | `active`, `resolved` |
| `location_text` | text | nullable |
| `resolved_at` | timestamptz | nullable |
| `resolved_by` | uuid | nullable |
| `created_at` | timestamptz | NOT NULL |

#### `trusted_contacts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `name` | text | NOT NULL |
| `phone` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

#### `shared_trips`

Live trip sharing via unique token.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `share_token` | text | NOT NULL |
| `pickup` | text | NOT NULL |
| `destination` | text | NOT NULL |
| `driver_name` | text | nullable |
| `vehicle` | text | nullable |
| `plate` | text | nullable |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` | timestamptz | NOT NULL |

### 3.6 Support

#### `support_tickets`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `subject` | text | NOT NULL |
| `description` | text | NOT NULL |
| `category` | text | NOT NULL, default `'general'` |
| `status` | text | NOT NULL, default `'open'` |
| `admin_response` | text | nullable |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

#### `support_messages`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `ticket_id` | uuid | nullable, FK → `support_tickets.id` |
| `content` | text | NOT NULL |
| `sender_role` | text | NOT NULL, default `'user'` |
| `created_at` | timestamptz | NOT NULL |

#### `lost_items`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `reporter_id` | uuid | NOT NULL |
| `description` | text | NOT NULL |
| `trip_date` | text | nullable |
| `status` | text | NOT NULL, default `'reported'` |
| `admin_notes` | text | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.7 Promotions & Referrals

#### `referrals`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `referrer_id` | uuid | NOT NULL |
| `referred_id` | uuid | nullable |
| `referral_code` | text | NOT NULL |
| `status` | text | NOT NULL, default `'pending'` |
| `trips_completed` | integer | NOT NULL, default `0` |
| `bonus_paid` | boolean | NOT NULL, default `false` |
| `created_at` | timestamptz | NOT NULL |

#### `promo_codes`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | NOT NULL |
| `created_by` | uuid | NOT NULL |
| `discount_percent` | integer | NOT NULL, default `0` |
| `discount_amount` | numeric | NOT NULL, default `0` |
| `max_uses` | integer | NOT NULL, default `500` |
| `current_uses` | integer | NOT NULL, default `0` |
| `is_active` | boolean | NOT NULL, default `true` |
| `expires_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.8 Notifications

#### `notifications`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `title` | text | NOT NULL |
| `body` | text | NOT NULL |
| `type` | text | NOT NULL, default `'general'` |
| `is_read` | boolean | NOT NULL, default `false` |
| `data` | jsonb | nullable |
| `created_at` | timestamptz | NOT NULL |

#### `broadcasts`

Admin-to-role mass messaging.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `sender_id` | uuid | NOT NULL |
| `title` | text | NOT NULL |
| `message` | text | NOT NULL |
| `target_role` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

### 3.9 Platform Configuration

#### `platform_settings`

Key-value store for global config.

| Column | Type | Constraints |
|---|---|---|
| `key` | text | PK |
| `value` | text | NOT NULL |
| `updated_by` | uuid | nullable |
| `updated_at` | timestamptz | NOT NULL |

**Known keys**: `platform_name`, `support_email`, `support_phone`, `country`, `base_fare`, `per_km_rate`, `per_minute_rate`, `minimum_fare`, `driver_commission_percent`, `referral_inviter_reward`, `referral_invitee_reward`, `platform_initialized`.

#### `feature_flags`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `flag_key` | text | NOT NULL |
| `flag_label` | text | NOT NULL |
| `enabled` | boolean | NOT NULL, default `false` |
| `description` | text | nullable |
| `updated_by` | uuid | nullable |
| `updated_at` | timestamptz | NOT NULL |

**Known flags**: `shared_rides`, `voice_booking`, `ride_scheduling`, `auto_driver_accept`, `gold_membership`, `sos_system`, `trusted_contacts`, `selfie_verification`, `mpesa_payments`, `card_payments`, `wallet_payments`, `driver_heatmap`, `surge_pricing`, `referral_program`.

#### `surge_rules`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `region_name` | text | NOT NULL |
| `start_hour` | integer | NOT NULL |
| `end_hour` | integer | NOT NULL |
| `multiplier` | numeric | NOT NULL, default `1.5` |
| `day_of_week` | integer[] | nullable |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` | timestamptz | NOT NULL |

#### `regional_fare_tiers`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `region_name` | text | NOT NULL |
| `region_type` | text | NOT NULL, default `'city'` |
| `base_fare_basic` | numeric | NOT NULL, default `100` |
| `base_fare_xtra` | numeric | NOT NULL, default `250` |
| `base_fare_boda` | numeric | NOT NULL, default `50` |
| `per_km_rate` | numeric | NOT NULL, default `20` |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

### 3.10 Admin & Audit

#### `admin_permissions`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `admin_user_id` | uuid | NOT NULL |
| `can_view_revenue` | boolean | default `true` |
| `can_approve_drivers` | boolean | default `true` |
| `can_issue_refunds` | boolean | default `false` |
| `can_delete_users` | boolean | default `false` |
| `updated_by` | uuid | nullable |
| `updated_at` | timestamptz | NOT NULL |

#### `audit_trail`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `actor_id` | uuid | NOT NULL |
| `actor_role` | text | NOT NULL |
| `action` | text | NOT NULL |
| `target_table` | text | nullable |
| `target_id` | text | nullable |
| `details` | jsonb | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.11 Ratings

#### `ratings`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `ride_id` | uuid | NOT NULL, FK → `rides.id` |
| `rater_id` | uuid | NOT NULL |
| `rated_id` | uuid | NOT NULL |
| `rater_role` | text | NOT NULL |
| `rating` | integer | NOT NULL | 1–5 |
| `comment` | text | nullable |
| `created_at` | timestamptz | NOT NULL |

### 3.12 Miscellaneous

#### `locked_fares`

Fare freeze for 30 minutes.

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `pickup` / `destination` | text | NOT NULL |
| `distance_km` / `fare_amount` | numeric | NOT NULL |
| `currency` | text | default `'KES'` |
| `category_id` | text | NOT NULL |
| `is_active` | boolean | default `true` |
| `locked_at` | timestamptz | default `now()` |
| `expires_at` | timestamptz | default `now() + 30 min` |

#### `saved_addresses`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `label` | text | NOT NULL, default `'Home'` |
| `address` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

#### `scheduled_trips`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `pickup` / `destination` | text | NOT NULL |
| `category_id` | text | NOT NULL |
| `scheduled_at` | timestamptz | NOT NULL |
| `status` | text | default `'scheduled'` |
| `stops` | jsonb | default `'[]'` |
| `created_at` | timestamptz | NOT NULL |

#### `waitlist`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `phone` | text | NOT NULL |
| `city` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL |

---

## 4. Relationships

```
auth.users (1) ──── (1) profiles
auth.users (1) ──── (N) user_roles
auth.users (1) ──── (1) wallets
auth.users (1) ──── (N) wallet_transactions

rides (N) ──── (1) rider_id → auth.users
rides (N) ──── (1) driver_id → auth.users (nullable)
rides (1) ──── (N) ride_status_history
rides (1) ──── (N) payments
rides (1) ──── (N) driver_payouts
rides (1) ──── (N) ratings

driver_id → auth.users:
  vehicles (N) ──── (1) driver_id
  driver_documents (N) ──── (1) driver_id
  driver_locations (1) ──── (1) driver_id
  driver_commitment_scores (1) ──── (1) driver_id
  driver_cancellations (N) ──── (1) driver_id

support_tickets (1) ──── (N) support_messages (via ticket_id FK)
```

**Data Flow — Ride Lifecycle:**

```
Rider creates ride (rides.status = 'requested')
  → assign-driver edge function finds nearest driver (driver_locations)
  → rides.status = 'driver_assigned', driver_id set
  → Driver navigates → 'driver_arriving'
  → OTP verified → 'ride_started'
  → complete-ride edge function:
      → rides.status = 'ride_completed'
      → payments row created
      → driver_payouts row created
      → wallet balances updated
      → ride_status_history entries for each transition
```

---

## 5. Row Level Security

RLS is **enabled on all 30+ tables**. Policies are enforced using two security-definer functions to avoid recursion:

```sql
has_role(_user_id uuid, _role app_role) → boolean
is_super_admin(_user_id uuid) → boolean
```

### Policy Summary by Table

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own row OR admin | Trigger only | Own row | — |
| `user_roles` | Own row OR admin | Trigger only | — | — |
| `wallets` | Own OR admin | Own (trigger) | Own | — |
| `wallet_transactions` | Own OR admin | Own | — | — |
| `rides` | Own (rider/driver) OR admin/manager | Rider (own) | Driver (assigned) | — |
| `ride_status_history` | Ride participant OR admin | — (edge fn) | — | — |
| `vehicles` | Own OR admin | Own | Own | Own |
| `driver_documents` | Own OR admin | Own | Own + admin | Own |
| `driver_locations` | Own OR online (public) OR admin | Own | Own | Own |
| `payments` | Own OR admin | — (edge fn) | — | — |
| `driver_payouts` | Own OR admin | — (edge fn) | — | — |
| `ratings` | Participant OR admin | Own (rater) | — | — |
| `sos_alerts` | Own OR admin/manager | Own | Admin/manager | — |
| `trusted_contacts` | Own | Own | Own | Own |
| `support_tickets` | Own OR admin | Own | Admin | — |
| `support_messages` | Own OR admin | Own OR admin | — | — |
| `lost_items` | Own OR admin | Own | Admin | — |
| `referrals` | Participant OR admin | Own (referrer) | Participant | — |
| `promo_codes` | Active (all) OR admin (all) | Admin | Admin | Admin |
| `broadcasts` | Admin | Admin | — | — |
| `notifications` | Own | — (system) | Own | — |
| `feature_flags` | All authenticated | Admin/super_admin | Admin/super_admin | Admin/super_admin |
| `platform_settings` | All authenticated | Admin | Admin | Admin |
| `surge_rules` | All authenticated | Admin | Admin | Admin |
| `regional_fare_tiers` | All authenticated | Manager | Manager | Manager |
| `admin_permissions` | Own OR manager | Manager | Manager | Manager |
| `audit_trail` | Manager | Own (actor) | — | — |
| `waitlist` | Admin | Anyone (anon) | — | — |
| `shared_trips` | Own OR active (anon) | Own | Own | — |

### Example: Ride Ownership Enforcement

```sql
-- Riders can only see their own rides
CREATE POLICY "Riders can view own rides" ON rides
  FOR SELECT USING (auth.uid() = rider_id);

-- Drivers can only update rides assigned to them
CREATE POLICY "Drivers can update assigned rides" ON rides
  FOR UPDATE USING (auth.uid() = driver_id);
```

### Example: Driver Data Protection

```sql
-- Drivers can only manage their own documents
CREATE POLICY "Drivers manage own documents" ON driver_documents
  FOR ALL USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Location is only readable by the driver themselves, or when online (for matching)
CREATE POLICY "Authenticated can read online drivers" ON driver_locations
  FOR SELECT USING (is_online = true);
```

---

## 6. Realtime Design

### Implemented via Supabase Realtime (postgres_changes)

| Feature | Table | Events | Channel Pattern |
|---|---|---|---|
| **Ride status updates** | `rides` | UPDATE (status changes) | `ride:{ride_id}` — rider and driver subscribe |
| **Driver location tracking** | `driver_locations` | UPDATE | `driver-location:{driver_id}` — rider subscribes during active ride |
| **SOS alerts** | `sos_alerts` | INSERT | `sos-alerts` — admin/manager dashboard subscribes |
| **Notifications** | `notifications` | INSERT | `notifications:{user_id}` — per-user channel |
| **Support messages** | `support_messages` | INSERT | `support:{ticket_id}` — real-time chat |

### Enabling Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
```

---

## 7. Critical Backend Logic

### 7.1 Ride Creation

```
1. Rider submits pickup + destination
2. Edge function `calculate-fare` computes estimated fare:
   - Looks up regional_fare_tiers for base fare
   - Applies per_km_rate × distance
   - Checks surge_rules for active multiplier
   - Returns { estimated_fare, surge_multiplier, breakdown }
3. Rider confirms → INSERT into rides (status = 'requested')
4. ride_status_history entry: null → 'requested'
```

### 7.2 Driver Assignment

```
1. Edge function `assign-driver`:
   - Query driver_locations WHERE is_online = true
   - Filter by Haversine distance (radius-based)
   - Sort by distance ASC
   - Check driver_commitment_scores (min threshold)
   - Check vehicles.is_approved = true
   - Return nearest eligible driver
2. UPDATE rides SET driver_id, status = 'driver_assigned'
3. ride_status_history entry logged
```

### 7.3 Race Condition Prevention

```sql
-- Use SELECT ... FOR UPDATE to lock the ride row
-- Prevents two drivers from accepting the same ride

BEGIN;
  SELECT id FROM rides
  WHERE id = $ride_id AND status = 'requested'
  FOR UPDATE SKIP LOCKED;

  -- If row returned, proceed with assignment
  UPDATE rides SET driver_id = $driver_id, status = 'driver_assigned'
  WHERE id = $ride_id AND status = 'requested';
COMMIT;
```

### 7.4 Ride Completion (Edge Function: `complete-ride`)

```
Atomic transaction:
1. UPDATE rides SET status = 'ride_completed', final_fare, completed_at
2. INSERT into payments (ride_id, payer_id, amount, method, status = 'completed')
3. Calculate commission (platform_settings.driver_commission_percent)
4. INSERT into driver_payouts (driver_id, ride_id, amount, commission, net_amount)
5. UPDATE wallets (driver balance += net_amount)
6. INSERT wallet_transactions for driver
7. INSERT ride_status_history
```

All steps execute within a single database transaction via the edge function using the service role key.

---

## 8. Payments

### Payment Flow (Implemented)

The codebase supports the following payment methods:

| Method | Status | Implementation |
|---|---|---|
| **Cash** | ✅ Implemented | Default. No digital processing needed. |
| **Wallet** | ✅ Implemented | `wallets` table with `wallet_transactions`. Deposits via M-Pesa STK Push. Withdrawals to M-Pesa. |
| **M-Pesa** | ✅ Partially | Edge function `mpesa-stk-push` exists. Simulated flow. |
| **Card** | 🔲 Not implemented | Feature flag `card_payments` exists but no Stripe integration. |

### Wallet Flow

```
Deposit:
  1. User enters amount + M-Pesa phone
  2. mpesa-stk-push edge function initiates STK push
  3. On success: UPDATE wallets.balance, INSERT wallet_transactions (type='credit')

Withdrawal:
  1. User enters amount + phone
  2. Validate balance >= amount + fee
  3. UPDATE wallets.balance, INSERT wallet_transactions (type='debit', fee=15)

Ride Payment (wallet):
  1. complete-ride checks rider wallet balance
  2. Deducts fare from rider wallet
  3. Credits net amount to driver wallet
  4. Records in payments + wallet_transactions
```

### Tables Involved

- `wallets` — balance per user
- `wallet_transactions` — full transaction ledger
- `payments` — per-ride payment records
- `driver_payouts` — driver earnings per ride

---

## 9. Indexing & Performance

### Recommended Indexes (based on query patterns)

```sql
-- High-frequency lookups
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at DESC);

-- Driver matching (geospatial approximation)
CREATE INDEX idx_driver_locations_online ON driver_locations(is_online) WHERE is_online = true;
CREATE INDEX idx_driver_locations_coords ON driver_locations(latitude, longitude) WHERE is_online = true;

-- Wallet lookups
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- Support
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Ride history audit
CREATE INDEX idx_ride_status_history_ride ON ride_status_history(ride_id);

-- Feature flags (frequent reads)
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- Referrals
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- Locked fares (active check)
CREATE INDEX idx_locked_fares_active ON locked_fares(user_id, is_active) WHERE is_active = true;

-- SOS (admin dashboard)
CREATE INDEX idx_sos_active ON sos_alerts(status) WHERE status = 'active';
```

### Why These Indexes

- **`rides` by rider/driver/status**: Every page load on rider/driver home queries active rides.
- **`driver_locations` filtered by online**: The `assign-driver` function scans online drivers — partial index avoids scanning offline rows.
- **`notifications` unread filter**: Badge count queries hit this constantly.
- **`sos_alerts` active**: Admin dashboard polls for active alerts.

---

## 10. Security Considerations

### Privilege Escalation Prevention

- Roles are **never stored on profiles**. The `user_roles` table has no INSERT/UPDATE/DELETE policies for regular users — only the `handle_new_user()` trigger (SECURITY DEFINER) can create role rows.
- Role checks use `has_role()` and `is_super_admin()` — both are SECURITY DEFINER functions that bypass RLS, preventing infinite recursion and ensuring consistent checks.

### Data Leak Prevention

- Every table has RLS enabled with explicit ownership checks (`auth.uid() = user_id`).
- Driver locations are only visible when `is_online = true` — offline drivers are invisible.
- Shared trips use token-based access for anonymous viewers but only expose active trips.
- Admin access requires verified role — no client-side role checks.

### Session Security

- Server-side session validation via `auth.getUser()` on app init (not just `getSession()`).
- Proactive token refresh 120 seconds before expiry.
- 5-minute health check interval clears stale sessions.
- `SIGNED_OUT` and `TOKEN_REFRESHED` events handled explicitly.

### Input Validation

- Wallet operations use Zod schemas (min/max amounts, phone format validation).
- Edge functions use service role key for atomic operations — client cannot directly modify payment/payout tables.

### Audit Trail

- `audit_trail` table logs admin actions with actor, target, and details.
- Only managers can read audit entries (preventing admins from covering tracks).

---

## 11. Scalability

### Schema Design for Growth

| Concern | Approach |
|---|---|
| **Growing users** | All user-scoped tables use `user_id` indexes. RLS ownership checks are O(1) via PK/index. |
| **Ride volume** | `rides` table partitioning by `created_at` (monthly) can be added when volume exceeds 10M rows. Status index allows efficient active-ride queries. |
| **Realtime updates** | Supabase Realtime scales per-table. Only 5 tables are published — minimizing broadcast overhead. |
| **Driver matching** | Current Haversine-based search works for < 10K concurrent drivers. For larger scale, PostGIS extension with `ST_DWithin` on a geography column would provide true spatial indexing. |
| **Wallet concurrency** | Balance updates use `SET balance = balance + amount` (atomic increment) rather than read-modify-write, preventing race conditions. |
| **Feature flags** | Cached client-side via `useFeatureFlags()` hook — single query on mount, no per-render overhead. |
| **Notifications** | Partial index on `(user_id, is_read) WHERE is_read = false` keeps unread badge counts fast regardless of history size. |

### Future Scaling Steps

1. **PostGIS**: Replace Haversine with native geography type + spatial index for driver matching.
2. **Connection pooling**: Supabase provides PgBouncer — ensure edge functions use pooled connections.
3. **Read replicas**: Route analytics/reporting queries to read replica when available.
4. **Table partitioning**: Partition `rides`, `wallet_transactions`, and `ride_status_history` by month for archival.
5. **Rate limiting**: Add rate limits on edge functions (ride creation, payment processing) to prevent abuse.

---

## Appendix: Database Functions

| Function | Type | Purpose |
|---|---|---|
| `has_role(uuid, app_role)` | SECURITY DEFINER | Check if user has a specific role (used in RLS) |
| `is_super_admin(uuid)` | SECURITY DEFINER | Check if user is manager or super_admin |
| `get_user_role(uuid)` | SECURITY DEFINER | Return user's primary role |
| `handle_new_user()` | TRIGGER (SECURITY DEFINER) | Auto-create profile + role + wallet on signup |
| `complete_referral_bonus(uuid, uuid, uuid)` | SECURITY DEFINER | Atomically credit referrer + invitee wallets |

## Appendix: Edge Functions

| Function | Purpose |
|---|---|
| `calculate-fare` | Server-side fare computation with surge, distance, category |
| `assign-driver` | Geospatial nearest-driver matching |
| `complete-ride` | Atomic ride completion + payment + payout |
| `mpesa-stk-push` | M-Pesa STK Push initiation |
| `ride-match` | Alternative ride matching logic |
| `nearby-landmarks` | Landmark-based pickup suggestions |
| `predictive-eta` | ETA estimation |
| `support-chat` | AI-powered support responses |
