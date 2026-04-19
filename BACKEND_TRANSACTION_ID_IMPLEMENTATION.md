# Backend Transaction ID Implementation (Spring Gateway + Spring Boot Services)

This guide makes frontend `X-Transaction-Id` fully traceable across gateway and all backend microservices.

## Goal
- Keep a single transaction id for one user journey.
- Accept incoming `X-Transaction-Id` from frontend.
- Generate one if missing.
- Add it to logs using MDC.
- Propagate it to downstream service-to-service calls.

---

## 1) Standard

- Header name: `X-Transaction-Id`
- MDC key: `transactionId`
- Response header: echo back `X-Transaction-Id`

---

## 2) API Gateway (Spring Cloud Gateway)

Add a global filter in gateway app (for example `UiGatewayApplication`).

```java
package com.aspcare.gateway.filter;

import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class TransactionIdGatewayFilter implements GlobalFilter, Ordered {
    public static final String TX_HEADER = "X-Transaction-Id";
    public static final String TX_MDC_KEY = "transactionId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String incoming = exchange.getRequest().getHeaders().getFirst(TX_HEADER);
        String txId = (incoming == null || incoming.isBlank()) ? UUID.randomUUID().toString() : incoming.trim();

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(TX_HEADER, txId)
                .build();

        exchange.getResponse().getHeaders().set(TX_HEADER, txId);

        return chain.filter(exchange.mutate().request(mutatedRequest).build())
                .doFirst(() -> MDC.put(TX_MDC_KEY, txId))
                .doFinally(signalType -> MDC.remove(TX_MDC_KEY));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
```

---

## 3) Every Spring Boot Microservice (Servlet stack)

Add one shared request filter in `carwashcommon` and auto-configure it.

```java
package com.aspcare.common.tracing;

import java.io.IOException;
import java.util.UUID;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

public class TransactionIdFilter extends OncePerRequestFilter {
    public static final String TX_HEADER = "X-Transaction-Id";
    public static final String TX_MDC_KEY = "transactionId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String incoming = request.getHeader(TX_HEADER);
        String txId = (incoming == null || incoming.isBlank()) ? UUID.randomUUID().toString() : incoming.trim();

        MDC.put(TX_MDC_KEY, txId);
        response.setHeader(TX_HEADER, txId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TX_MDC_KEY);
        }
    }
}
```

Register filter bean (can be in common auto-config):

```java
@Bean
public FilterRegistrationBean<TransactionIdFilter> transactionIdFilterRegistration() {
    FilterRegistrationBean<TransactionIdFilter> bean = new FilterRegistrationBean<>();
    bean.setFilter(new TransactionIdFilter());
    bean.addUrlPatterns("/*");
    bean.setOrder(1);
    return bean;
}
```

---

## 4) Propagate header for outbound calls

### RestTemplate

```java
@Bean
public RestTemplate restTemplate() {
    RestTemplate rt = new RestTemplate();
    rt.getInterceptors().add((request, body, execution) -> {
        String txId = MDC.get("transactionId");
        if (txId != null && !txId.isBlank()) {
            request.getHeaders().set("X-Transaction-Id", txId);
        }
        return execution.execute(request, body);
    });
    return rt;
}
```

### WebClient

```java
@Bean
public WebClient webClient(WebClient.Builder builder) {
    return builder.filter((request, next) -> {
        String txId = MDC.get("transactionId");
        ClientRequest newReq = ClientRequest.from(request)
                .headers(headers -> {
                    if (txId != null && !txId.isBlank()) {
                        headers.set("X-Transaction-Id", txId);
                    }
                })
                .build();
        return next.exchange(newReq);
    }).build();
}
```

### OpenFeign (if used)

```java
@Bean
public RequestInterceptor transactionIdFeignInterceptor() {
    return template -> {
        String txId = MDC.get("transactionId");
        if (txId != null && !txId.isBlank()) {
            template.header("X-Transaction-Id", txId);
        }
    };
}
```

---

## 5) Logging pattern (Logback)

In each service `logback-spring.xml` pattern, include MDC key:

```xml
<pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%thread] [tx:%X{transactionId}] %logger{36} - %msg%n</pattern>
```

With this, all logs for one flow can be searched by the same tx id.

---

## 6) Suggested log points

At controller/service boundaries, add structured logs:

```java
log.info("booking.create.request user={} carType={} washType={}", phone, carType, washType);
log.info("booking.create.response bookingId={} status={}", bookingId, status);
```

Do not log secrets/PII beyond required operational fields.

---

## 7) Rollout order

1. API Gateway global filter.
2. `carwashcommon` request filter + auto-config.
3. Outbound interceptors (RestTemplate/WebClient/Feign).
4. Logback MDC pattern.
5. Verify through one flow: login -> booking -> membership/orders.

---

## 8) Validation checklist

- Gateway receives frontend `X-Transaction-Id` and forwards same value.
- Service A logs include `[tx:<id>]`.
- Service A calling Service B forwards same header.
- Service B logs show same tx id.
- Response includes `X-Transaction-Id`.

---

## Notes for your current frontend integration

- Frontend is already attaching `X-Transaction-Id` globally via fetch interceptor.
- Backend changes above complete end-to-end correlation.
