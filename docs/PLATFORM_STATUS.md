# eRide Platform — Technical Status Report

**Generated**: 2026-03-13  
**Version**: 2.0 — Platform Setup Wizard  
**Stack**: React + Vite + TypeScript + Tailwind + Supabase (Lovable Cloud)

---

## 1. Project Architecture Overview

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 18 + Vite + TypeScript | ✅ Fully implemented |
| Styling | Tailwind CSS + shadcn/ui | ✅ Fully implemented |
| Auth | Supabase Auth (email/password) | ✅ Fully implemented |
| Database | PostgreSQL via Supabase | ✅ Fully implemented |
| Realtime | Supabase Realtime (wallet updates) | ⚠️ Partially implemented |
| Edge Functions | Deno (4 functions deployed) | ✅ Implemented |
| Hosting | Lovable Cloud | ✅ Active |

---

## 2. Role-Based Access Control (RBAC)

### Current Roles (app_role enum)

| Role | Description | Status |
|------|------------|--------|
| `rider` | Passenger accounts | ✅ Fully implemented |
| `driver` | Driver/boda partner | ✅ Fully implemented |
| `admin` | Platform administrator | ✅ Fully implemented |
| `manager` | Senior ops / super admin | ✅ Fully implemented |
| `super_admin` | Alias for manager (new) | ✅ Enum added, code pending |
| `operations_manager` | Ride ops & dispatch | ✅ Enum added, code pending |
| `support_agent` | Support tickets & disputes | ✅ Enum added, code pending |
| `finance` | Payments & driver payouts | ✅ Enum added, code pending |

### Security Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `has_role(uuid, app_role)` | Check if user has specific role | ✅ |
| `get_user_role(uuid)` | Get user's primary role | ✅ |
| `is_super_admin(uuid)` | Check manager or super_admin | ✅ |
| `handle_new_user()` | Auto-create profile + wallet + role on signup | ✅ |
| `complete_referral_bonus()` | Atomic referral reward distribution | ✅ |

### Weaknesses Identified

- ❌ New roles (operations_manager, support_agent, finance) have no RLS policies yet
- ❌ No granular permission matrix beyond role-based checks
- ⚠️ Admin permissions table exists but is not used by most components

---

## 3. Database Schema Overview

### Core Tables (21 total)

| Table | RLS | FK | Status |
|-------|-----|-----|--------|
| profiles | ✅ | auth.users (implicit) | ✅ |
| user_roles | ✅ | auth.users (implicit) | ✅ |
| wallets | ✅ | - | ✅ |
| wallet_transactions | ✅ | - | ✅ |
| trusted_contacts | ✅ | - | ✅ |
| saved_addresses | ✅ | - | ✅ |
| locked_fares | ✅ | - | ✅ |
| scheduled_trips | ✅ | - | ✅ |
| shared_trips | ✅ | - | ✅ |
| sos_alerts | ✅ | - | ✅ |
| support_tickets | ✅ | - | ✅ |
| support_messages | ✅ | support_tickets | ✅ |
| lost_items | ✅ | - | ✅ |
| referrals | ✅ | - | ✅ |
| driver_commitment_scores | ✅ | - | ✅ |
| driver_cancellations | ✅ | - | ✅ |
| broadcasts | ✅ | - | ✅ |
| promo_codes | ✅ | - | ✅ |
| admin_permissions | ✅ | - | ✅ |
| platform_settings | ✅ | - | ✅ |
| regional_fare_tiers | ✅ | - | ✅ |
| waitlist | ✅ | - | ✅ |
| audit_trail | ✅ | - | ✅ |
| feature_flags | ✅ | - | ✅ NEW |

### Missing Tables (Needed for Production)

| Table | Purpose | Priority |
|-------|---------|----------|
| `rides` | Core ride records with status lifecycle | 🔴 Critical |
| `ride_status_history` | Audit trail for ride state transitions | 🔴 Critical |
| `vehicles` | Driver vehicle registration | 🔴 Critical |
| `vehicle_types` | Economy, Executive, Boda definitions | 🟡 High |
| `driver_documents` | License, insurance, inspection uploads | 🟡 High |
| `driver_locations` | Real-time GPS tracking (PostGIS) | 🔴 Critical |
| `fare_breakdowns` | Itemized fare for each ride | 🟡 High |
| `payments` | Payment records per ride | 🔴 Critical |
| `refunds` | Refund tracking | 🟡 High |
| `driver_payouts` | Payout batching and tracking | 🟡 High |
| `ratings` | Rider ↔ Driver ratings | 🟡 High |
| `notifications` | In-app notification queue | 🟢 Medium |
| `push_tokens` | FCM/APNs device tokens | 🟢 Medium |
| `promotion_redemptions` | Track promo code usage per user | 🟢 Medium |
| `zones` | GeoJSON service area boundaries | 🟡 High |
| `surge_rules` | Dynamic pricing rules | 🟡 High |

---

## 4. Edge Functions

| Function | Purpose | Secrets | Status |
|----------|---------|---------|--------|
| `nearby-landmarks` | Google Places → safe pickup points | GOOGLE_MAPS_API_KEY | ✅ |
| `predictive-eta` | Google Distance Matrix → traffic ETA | GOOGLE_MAPS_API_KEY | ✅ |
| `ride-match` | AI driver matching via Lovable Gateway | LOVABLE_API_KEY | ✅ |
| `support-chat` | AI support chatbot (streaming) | LOVABLE_API_KEY | ✅ |
| `mpesa-stk-push` | M-Pesa STK Push simulation | Service role key | ✅ |

### Missing Edge Functions (Needed)

| Function | Purpose | Priority |
|----------|---------|----------|
| `calculate-fare` | Server-side fare calculation | 🔴 Critical |
| `assign-driver` | Server-side driver matching + assignment | 🔴 Critical |
| `process-payment` | Payment verification + wallet update | 🔴 Critical |
| `complete-ride` | Atomic ride completion + payout | 🔴 Critical |

---

## 5. Platform Setup System

| Feature | Status |
|---------|--------|
| First-time setup wizard (/admin/platform-setup) | ✅ NEW |
| Platform identity config (name, email, phone, country) | ✅ NEW |
| Service type configuration | ✅ NEW |
| Pricing rules (base fare, per km, per min, commission) | ✅ NEW |
| Operating zones display | ✅ NEW |
| Payment method toggles | ✅ NEW |
| Driver policy configuration | ✅ NEW |
| Safety feature toggles | ✅ NEW |
| Feature flags management | ✅ NEW |
| Initialization gate (blocks app until setup complete) | ✅ NEW |
| platform_initialized flag in platform_settings | ✅ NEW |

---

## 6. Feature Flags System

| Flag | Default | Description |
|------|---------|-------------|
| shared_rides | ❌ | Shared ride matching |
| voice_booking | ❌ | Voice-based ride booking |
| ride_scheduling | ✅ | Schedule rides in advance |
| auto_driver_accept | ❌ | Auto-accept for drivers |
| gold_membership | ✅ | Gold subscription tier |
| sos_system | ✅ | Emergency SOS alerts |
| trusted_contacts | ✅ | Contact sharing |
| selfie_verification | ❌ | Photo verification |
| mpesa_payments | ✅ | M-Pesa payments |
| card_payments | ❌ | Card processing |
| wallet_payments | ✅ | Wallet balance |
| driver_heatmap | ✅ | Demand heatmap |
| surge_pricing | ✅ | Dynamic pricing |
| referral_program | ✅ | Referral rewards |

⚠️ **Note**: Feature flags are stored in DB but NOT yet enforced in all frontend/backend code paths.

---

## 7. Ride Lifecycle

| State | Implemented | Server-validated |
|-------|------------|-----------------|
| requested | ❌ Missing | ❌ |
| driver_assigned | ❌ Missing | ❌ |
| driver_arriving | ❌ Missing | ❌ |
| ride_started | ❌ Missing | ❌ |
| ride_completed | ❌ Missing | ❌ |
| cancelled | ❌ Missing | ❌ |

**Status**: 🔴 **Not implemented**. The ride lifecycle is simulated in frontend only. No `rides` table exists.

---

## 8. Payment & Wallet System

| Feature | Status |
|---------|--------|
| Wallet table + transactions | ✅ |
| Wallet UI (deposit/withdraw) | ✅ |
| M-Pesa STK Push simulation | ✅ |
| Atomic balance updates | ⚠️ Edge function only |
| Payment per ride | ❌ Missing |
| Refund system | ❌ Missing |
| Driver payout batching | ❌ Missing |
| Race condition prevention | ⚠️ Partial (no DB-level locks) |

---

## 9. Driver Tracking

| Feature | Status |
|---------|--------|
| driver_locations table | ❌ Missing |
| PostGIS/geospatial indexing | ❌ Missing |
| Real-time location updates | ❌ Missing |
| Radius-based driver search | ❌ Missing |
| Live map tracking | ⚠️ UI mock only |

---

## 10. Admin Configuration

| Feature | Status |
|---------|--------|
| Admin overview dashboard | ✅ |
| Admin command center | ✅ |
| Admin approvals | ✅ |
| Manager vault | ✅ |
| Manager setup (subscriptions, rewards, roles, fares) | ✅ |
| Platform setup wizard | ✅ NEW |
| Audit trail logging | ✅ |

---

## 11. Safety Systems

| Feature | Status |
|---------|--------|
| SOS button + alerts | ✅ |
| Trusted contacts | ✅ |
| Live trip sharing | ✅ |
| Driver safety onboarding | ✅ |
| Safety terms acceptance tracking | ✅ |
| Pink mode toggle | ✅ |
| Privacy call masking | ✅ UI only |
| Selfie verification | ✅ UI only |

---

## 12. Support Systems

| Feature | Status |
|---------|--------|
| Support tickets | ✅ |
| Support chat (AI) | ✅ |
| Lost item reports | ✅ |
| Admin ticket management | ✅ |

---

## 13. Scalability Considerations

| Concern | Current State | Recommendation |
|---------|--------------|----------------|
| Driver location updates | Not implemented | Use PostGIS + partitioned tables |
| Realtime subscriptions | Wallet only | Add ride status + driver location channels |
| Ride matching | AI edge function | Add geospatial driver index |
| Wallet transactions | No DB-level locks | Add SELECT FOR UPDATE or advisory locks |
| Admin dashboards | Client-side queries | Add server-side aggregation views |
| Large datasets | No pagination limits | Enforce cursor-based pagination |

---

## 14. Recommended Next Steps (Priority Order)

1. 🔴 **Create `rides` table** with full lifecycle and server-side state machine
2. 🔴 **Create `driver_locations` table** with PostGIS for real-time tracking
3. 🔴 **Build `calculate-fare` edge function** with server-side pricing logic
4. 🔴 **Build `assign-driver` edge function** for server-side matching
5. 🟡 **Create `vehicles` + `driver_documents` tables** for driver verification
6. 🟡 **Create `payments` + `refunds` tables** for ride payment tracking
7. 🟡 **Enforce feature flags** across all frontend components
8. 🟡 **Build permission matrix** for new roles (ops_manager, support_agent, finance)
9. 🟢 **Add `ratings` table** and post-ride rating flow
10. 🟢 **Add `notifications` + `push_tokens`** for push notification support
