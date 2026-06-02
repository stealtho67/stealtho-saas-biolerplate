---
created: 2026-06-02
status: active
tags: [src, pages, routes]
---

# Pages Directory — `src/pages/`

## Public Pages

### Home (`Home.jsx`)
- Landing page for NextCut
- Hero section, featured barbers, CTA

### Explore (`Explore.jsx`)
- Browse/search barbers and barbershops
- Filter by location, service, availability

### Barbershops (`Barbershops.jsx`)
- List view of all registered barbershops
- Search + filter functionality

### BarberProfile (`BarberProfile.jsx`)
- Individual barber detail page
- Shows: bio, services, availability, reviews, portfolio
- Book now CTA

### BarbershopProfile (`BarbershopProfile.jsx`)
- Barbershop detail page with all barbers listed

### Pricing (`Pricing.jsx`)
- Subscription tiers for barbers
- Free vs Pro vs Growth vs Spotlight

### HowItWorks (`HowItWorks.jsx`)
- Explains the platform to new users
- Step-by-step guide

### About (`About.jsx`)
- Company/about page

### FAQ (`FAQ.jsx`)
- Frequently asked questions

### Privacy (`Privacy.jsx`)
- Privacy policy

### Terms (`Terms.jsx`)
- Terms of service

### BarberApplication (`BarberApplication.jsx`)
- Application form for barbers to join the platform

## Authenticated Pages

### MyBookings (`MyBookings.jsx`)
- User's upcoming and past bookings
- Cancel/reschedule functionality

### Profile (`Profile.jsx`)
- User profile settings
- Manage account details

### BarberDashboard (`BarberDashboard.jsx`)
- Main dashboard for barbers
- Calendar, booking management, earnings overview
- Links to: services, portfolio, payouts, settings

## Admin Pages (`admin/`)

### Overview (`admin/Overview.jsx`)
- Admin dashboard home
- System-wide metrics (users, bookings, revenue)

### UserManagement (`admin/UserManagement.jsx`)
- Manage all users
- Roles, status, bans

### BarberManagement (`admin/BarberManagement.jsx`)
- Review barber applications
- Approve/reject/suspend

### BarbershopManagement (`admin/BarbershopManagement.jsx`)
- Manage barbershops
- Verification status

### BookingManagement (`admin/BookingManagement.jsx`)
- View/manage all bookings
- Cancel, refund, reschedule

### RevenueTracking (`admin/RevenueTracking.jsx`)
- Platform revenue dashboard
- Commission tracking, payout oversight

### ReviewsModeration (`admin/ReviewsModeration.jsx`)
- Moderate reviews and ratings
- Approve/reject reported reviews

### Settings (`admin/Settings.jsx`)
- Platform-wide settings
- Commission rates, feature flags

### BarberDashboardPreview (`admin/BarberDashboardPreview.jsx`)
- Admin can view any barber's dashboard
- Support/debugging tool
