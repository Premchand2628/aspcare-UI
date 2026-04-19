# ASP Care Request Flow (Sequence)

```mermaid
sequenceDiagram
  autonumber
  participant User as Customer App (React)
  participant GW as UI Gateway
  participant Auth as OTP/Auth Service
  participant Booking as Booking Service
  participant Rates as Rates Service
  participant Membership as Membership Service
  participant Payment as Payment Service
  participant Washer as Car Washer Service
  participant Mail as Mail Notification Service

  User->>GW: Send OTP / Login
  GW->>Auth: Validate OTP and issue JWT
  Auth-->>GW: JWT token
  GW-->>User: Auth success

  User->>GW: Create booking request + JWT
  GW->>Booking: Forward booking request

  Booking->>Rates: Get wash rate (carType, washType, serviceType)
  Rates-->>Booking: Rate details

  alt Membership flow enabled
    Booking->>Membership: Validate active plan / deal booking
    Membership-->>Booking: Redemption eligibility
  end

  Booking->>Payment: Create/confirm payment intent
  Payment-->>Booking: Payment success/failure

  alt Payment success
    Booking->>Washer: Assign washer / update schedule
    Washer-->>Booking: Assignment result
    Booking->>Mail: Send confirmation notification
    Mail-->>Booking: Delivered
    Booking-->>GW: Booking confirmed
    GW-->>User: Booking success + order details
  else Payment failed
    Booking-->>GW: Booking failed
    GW-->>User: Payment failed message
  end

  User->>GW: Reschedule / Cancel booking
  GW->>Booking: Update booking status
  Booking->>Mail: Send update notification
  Booking-->>GW: Updated booking
  GW-->>User: Updated status
```

## How to Read
- **Actors**: The customer app talks only to gateway; gateway forwards to backend services.
- **Auth stage**: Login/OTP returns JWT used for subsequent booking operations.
- **Booking orchestration**: Booking service coordinates rates, membership validation, payment, washer assignment, and notifications.
- **Conditional branches**: `alt` blocks show success/failure behavior paths.
- **Lifecycle updates**: Reschedule/cancel flows still pass through booking service and notify users.
