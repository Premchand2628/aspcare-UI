# ASP Care Architecture Diagram

```mermaid
flowchart TB
  %% Clients
  U[Customer Mobile/Web App\nReact + Vite SPA]
  A[Admin / Ops UI]
  W[Washer App / Panel]

  %% Edge/API
  G[UI Gateway Service\nSpring Cloud Gateway]

  %% Shared module
  C[(carwashcommon\nSecurity + JWT + Logging\nShared AutoConfig)]

  %% Core services
  S1[otploginauth\nAuth / OTP / JWT]
  S2[bookingservice\nBooking Lifecycle\nSchedule / Reschedule / Cancel]
  S3[membership\nPlans / Active Membership\nDeal-Price Bookings]
  S4[carwashrates\nRate & Pricing Rules]
  S5[paymentservice\nPayment & Status]
  S6[invitation\nReferral / Coupons]
  S7[supportchatservice\nSupport & Tickets / Chat]
  S8[carwasherservice\nWasher Assignment / Ops]
  S9[mailnotification\nEmail Notifications]

  %% Data stores (logical)
  D1[(Auth DB)]
  D2[(Booking DB)]
  D3[(Membership DB)]
  D4[(Rates DB)]
  D5[(Payment DB)]
  D6[(Referral DB)]
  D7[(Support DB)]
  D8[(Washer DB)]

  %% External dependencies
  X1[[SMS / OTP Provider]]
  X2[[Payment Gateway]]
  X3[[Email Provider]]
  X4[[Maps/Geocoding API]]
  X5[[Google OAuth]]

  %% Client routing
  U -->|HTTPS / REST| G
  A -->|HTTPS / REST| G
  W -->|HTTPS / REST| G

  %% Gateway -> services
  G --> S1
  G --> S2
  G --> S3
  G --> S4
  G --> S5
  G --> S6
  G --> S7
  G --> S8

  %% Main service interactions
  S2 -->|get rates| S4
  S2 -->|validate membership / redeem| S3
  S2 -->|payment status| S5
  S2 -->|assign washer| S8
  S2 -->|send confirmation| S9

  S3 -->|payment for plan/deal| S5
  S3 -->|deal/referral checks| S6

  S6 -->|notify user| S9
  S7 -->|notify user/support| S9

  %% Databases
  S1 --> D1
  S2 --> D2
  S3 --> D3
  S4 --> D4
  S5 --> D5
  S6 --> D6
  S7 --> D7
  S8 --> D8

  %% External systems
  S1 --> X1
  S1 --> X5
  S5 --> X2
  S9 --> X3
  U -. address lookup .-> X4

  %% Shared module relationship
  C -. shared lib .-> S1
  C -. shared lib .-> S2
  C -. shared lib .-> S3
  C -. shared lib .-> S4
  C -. shared lib .-> S5
  C -. shared lib .-> S6
  C -. shared lib .-> S7
  C -. shared lib .-> S8
  C -. shared lib .-> S9
```

## How to view
- Open this file in VS Code
- Press `Ctrl+Shift+V` to open Markdown preview

## How to Read
- **Clients**: Customer, admin, and washer interfaces call backend APIs through the gateway.
- **Gateway**: `UI Gateway Service` is the single backend entry point and routes requests to microservices.
- **Core services**: Each service owns one domain area (auth, booking, membership, rates, payment, referrals, support, washer ops, notifications).
- **Service flow**: `bookingservice` orchestrates most runtime calls to rates, membership, payment, washer assignment, and notifications.
- **Data ownership**: Each service maps to its own logical database for better separation of concerns.
- **Shared module**: `carwashcommon` provides cross-cutting capabilities (JWT/security/logging) reused by multiple services.
- **External systems**: OTP/SMS, payment gateway, email, maps, and Google OAuth are outside your platform boundary.
