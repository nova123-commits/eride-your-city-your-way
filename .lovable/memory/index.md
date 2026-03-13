# eRide Project Memory

## Design System
- **Theme**: Dark-first, blue brand (HSL 210 100% 55% primary)
- **Font**: Inter (all weights)
- **Brand**: lowercase 'e' + uppercase 'Ride' in logo
- **Primary color**: HSL 210 100% 55% (light) / 210 100% 60% (dark)
- **Gradient**: blue to teal (135deg)
- **Border radius**: 0.75rem default, 2xl for cards/buttons

## Architecture
- Role selection on `/`, Rider on `/rider`, Driver on `/driver`
- 3 ride categories: Basic (100 KES), Xtra (250 KES), Boda (50 KES)
- Surge: 1.5x during 7-9 AM and 5-7 PM
- Commission: 15% per trip (configurable via platform_settings)
- Supabase backend via Lovable Cloud

## Roles (app_role enum)
- rider, driver, admin, manager (active)
- super_admin, operations_manager, support_agent, finance (enum added, code pending)

## Platform Setup
- First-time setup wizard at /admin/platform-setup
- platform_initialized flag in platform_settings controls gate
- feature_flags table for toggling platform features
- PlatformInitGate in App.tsx redirects managers/admins to setup if not initialized

## Key Tables
- profiles, user_roles, wallets, wallet_transactions
- platform_settings, regional_fare_tiers, feature_flags
- audit_trail, referrals, promo_codes
- Missing: rides, driver_locations, vehicles, payments
