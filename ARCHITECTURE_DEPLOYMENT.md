# ASP Care Deployment View

```mermaid
flowchart TB
  subgraph ClientLayer[Client Layer]
    C1[Customer Browser / Mobile Web]
    C2[Admin UI]
    C3[Washer Panel]
  end

  subgraph Edge[Edge / Entry]
    CDN[Static Hosting / CDN\nReact + Vite Build]
    G[API Gateway\nSpring Cloud Gateway]
  end

  subgraph ServiceCluster[Backend Microservices Cluster]
    S1[otploginauth]
    S2[bookingservice]
    S3[membership]
    S4[carwashrates]
    S5[paymentservice]
    S6[invitation]
    S7[supportchatservice]
    S8[carwasherservice]
    S9[mailnotification]
    SH[(carwashcommon shared lib)]
  end

  subgraph DataLayer[Data Layer]
    D1[(Auth DB)]
    D2[(Booking DB)]
    D3[(Membership DB)]
    D4[(Rates DB)]
    D5[(Payment DB)]
    D6[(Referral DB)]
    D7[(Support DB)]
    D8[(Washer DB)]
  end

  subgraph External[External Providers]
    X1[[SMS/OTP Provider]]
    X2[[Payment Gateway]]
    X3[[Email Service Provider]]
    X4[[Google OAuth]]
    X5[[Maps / Geocoding API]]
  end

  C1 --> CDN
  C2 --> CDN
  C3 --> CDN
  CDN --> G

  G --> S1
  G --> S2
  G --> S3
  G --> S4
  G --> S5
  G --> S6
  G --> S7
  G --> S8

  S1 --> D1
  S2 --> D2
  S3 --> D3
  S4 --> D4
  S5 --> D5
  S6 --> D6
  S7 --> D7
  S8 --> D8

  S1 --> X1
  S1 --> X4
  S5 --> X2
  S9 --> X3
  C1 -. location lookup .-> X5

  SH -. shared security/logging .-> S1
  SH -. shared security/logging .-> S2
  SH -. shared security/logging .-> S3
  SH -. shared security/logging .-> S4
  SH -. shared security/logging .-> S5
  SH -. shared security/logging .-> S6
  SH -. shared security/logging .-> S7
  SH -. shared security/logging .-> S8
  SH -. shared security/logging .-> S9

  S2 --> S4
  S2 --> S3
  S2 --> S5
  S2 --> S8
  S2 --> S9
  S3 --> S5
  S3 --> S6
```

## How to Read
- **Client layer**: Browsers/panels access the app UI build, then API requests go to gateway.
- **Edge layer**: CDN/static hosting serves frontend assets; API Gateway handles backend entry and service routing.
- **Service cluster**: Backend microservices are independently deployable units with clear domain boundaries.
- **Data layer**: Each service has a dedicated logical datastore, reducing cross-service coupling.
- **External providers**: OTP, payment, email, OAuth, and maps are third-party integrations.
- **Shared library**: `carwashcommon` is not a standalone runtime service; it is a shared dependency used by services.
- **Critical path**: Booking and membership flows depend on rates/payment and trigger mail notifications.

## Transaction Correlation Standard
- Use request header `X-Transaction-Id` end-to-end across gateway and all microservices.
- Frontend already sends this header globally for every API call.
- Backend implementation details are documented in [BACKEND_TRANSACTION_ID_IMPLEMENTATION.md](BACKEND_TRANSACTION_ID_IMPLEMENTATION.md).
