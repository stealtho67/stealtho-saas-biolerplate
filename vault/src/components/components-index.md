---
created: 2026-06-02
status: active
tags: [src, components, ui]
---

# Components Directory — `src/components/`

## Layout Components

| Component | Purpose |
|-----------|---------|
| `Layout.jsx` | Main app layout shell (header, footer, content area) |
| `AdminLayout.jsx` | Admin panel layout (sidebar nav, header, content) |
| `MobileHeader.jsx` | Mobile responsive header with hamburger menu |

## Auth Components

| Component | Purpose |
|-----------|---------|
| `AuthGate.jsx` | Wraps content requiring auth — shows login if not authed |
| `ProtectedRoute.jsx` | Route guard — redirects to login if not authenticated |
| `UserNotRegisteredError.jsx` | Error state for unregistered user access |

## Barber-Facing Components

| Component | Purpose |
|-----------|---------|
| `StatusHeader.jsx` | Barber's online/offline/away status toggle |
| `OnboardingChecklist.jsx` | Step-by-step onboarding for new barbers |
| `ServicesEditor.jsx` | CRUD for barber's service offerings |
| `ProfileEditor.jsx` | Edit barber profile (bio, photo, specialties) |
| `PortfolioEditor.jsx` | Manage portfolio photos |
| `BarberInfoTab.jsx` | Info tab in barber dashboard |
| `BarberProfileTab.jsx` | Profile tab in barber dashboard |
| `BarbershopTab.jsx` | Barbershop association tab |
| `CollectPaymentModal.jsx` | Modal to collect payment from customer |
| `CreateInvoiceModal.jsx` | Create invoice for a booking |
| `InvoicesList.jsx` | List of invoices for a barber |
| `PayoutHistory.jsx` | History of payouts received |
| `StripePayoutsSection.jsx` | Stripe Connect payout management |
| `BookingDeliveryEditor.jsx` | Edit booking delivery details |

## Customer-Facing Components

| Component | Purpose |
|-----------|---------|
| `BarberCard.jsx` | Card display for barber search results |
| `ShopCard.jsx` | Card display for barbershop search results |
| `BookingModal.jsx` | Booking creation/management modal |
| `ReviewCard.jsx` | Display a single review |
| `StarRating.jsx` | Interactive star rating component |

## Admin Components

| Component | Purpose |
|-----------|---------|
| `admin/SendBackModal.jsx` | Send barber application back for revisions |
| `admin/StripeReadiness.jsx` | Stripe integration status dashboard |
| `admin/WebhookSetupPanel.jsx` | Webhook configuration panel |

## Utility Components

| Component | Purpose |
|-----------|---------|
| `EmptyState.jsx` | Empty state display with icon + message + action |
| `PullToRefreshIndicator.jsx` | Mobile pull-to-refresh animation |
