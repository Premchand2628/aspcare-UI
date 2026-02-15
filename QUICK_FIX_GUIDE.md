# Quick Fix Guide for STS Errors

## Errors Fixed

### 1. Line 86 Error: `upper()` method 
**Problem:** `upper(b.getStatus())` is not a valid Java method  
**Solution:** Changed to `b.getStatus().toUpperCase()`

### 2. Missing Method Implementations
The following methods were missing from BookingServiceImpl:

- ✅ `createBooking(BookingRequest)`
- ✅ `confirmOrder(List<BookingRequest>)`
- ✅ `cancelConfirm(Long)`
- ✅ `upgradeBooking(Long, UpgradeBookingRequest)`
- ✅ `updateBookingStatus(Long, StatusUpdateRequest)`
- ✅ `markPaymentSuccess(Long)`
- ✅ `getCancelQuote(Long)`

## How to Apply the Fix in STS

### Option 1: Replace Entire File
1. Open `BookingServiceImpl.java` in STS
2. Select all content (Ctrl+A)
3. Delete selected content
4. Copy all content from `BookingServiceImpl_CORRECTED.java`
5. Paste into your STS file
6. Save (Ctrl+S)

### Option 2: Fix Line 86 Only
**Find this (around line 86):**
```java
String status = upper(b.getStatus());
```

**Replace with:**
```java
String status = b.getStatus().toUpperCase();
```

**Then apply same fix to all occurrences** (there are multiple places with this issue)

### All Locations to Fix `upper()` → `toUpperCase()`:

1. **In `isSlotAvailable()` method:**
```java
// BEFORE
String status = upper(b.getStatus());

// AFTER
String status = b.getStatus().toUpperCase();
```

2. **In `handleRescheduleBooking()` method:**
```java
// BEFORE  
String currentStatus = booking.getStatus().toUpperCase();

// ALREADY CORRECT - no change needed
```

3. **In `getAvailability()` method:**
```java
// BEFORE
String status = upper(b.getStatus());

// AFTER
String status = b.getStatus().toUpperCase();
```

## Missing Methods - Add These to Your BookingServiceImpl

Copy these method implementations into your `BookingServiceImpl` class:

```java
@Override
@Transactional
public ApiResponse createBooking(BookingRequest request) {
    if (request.getPhone() == null || request.getBookingDate() == null) {
        return ApiResponse.builder()
                .statusCode(400)
                .message("Phone number and booking date are required")
                .build();
    }

    Booking booking = Booking.builder()
            .phone(request.getPhone())
            .carType(request.getCarType())
            .serviceType(request.getServiceType())
            .washType(request.getWashType())
            .bookingDate(LocalDate.parse(request.getBookingDate()))
            .timeSlot(request.getTimeSlot())
            .center(request.getCenter())
            .paymentStatus("PENDING")
            .status("PENDING")
            .planName(request.getPlanName())
            .planAmount(request.getPlanAmount())
            .paymentMode(request.getPaymentMode())
            .build();

    Booking savedBooking = bookingRepository.save(booking);

    return ApiResponse.builder()
            .statusCode(200)
            .message("Booking created successfully")
            .data(savedBooking)
            .build();
}

@Override
@Transactional
public ApiResponse confirmOrder(List<BookingRequest> requests) {
    try {
        for (BookingRequest request : requests) {
            createBooking(request);
        }
        return ApiResponse.builder()
                .statusCode(200)
                .message("Orders confirmed successfully")
                .build();
    } catch (Exception e) {
        return ApiResponse.builder()
                .statusCode(500)
                .message("Error confirming orders: " + e.getMessage())
                .build();
    }
}

@Override
@Transactional
public ApiResponse cancelConfirm(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    booking = booking.toBuilder()
            .status("CANCELLED")
            .build();

    bookingRepository.save(booking);

    return ApiResponse.builder()
            .statusCode(200)
            .message("Booking cancelled successfully")
            .data(booking)
            .build();
}

@Override
@Transactional
public ApiResponse upgradeBooking(Long bookingId, UpgradeBookingRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    booking = booking.toBuilder()
            .planName(request.getNewPlanName())
            .planAmount(request.getNewPlanAmount())
            .washType(request.getNewWashType())
            .build();

    Booking savedBooking = bookingRepository.save(booking);

    return ApiResponse.builder()
            .statusCode(200)
            .message("Booking upgraded successfully")
            .data(savedBooking)
            .build();
}

@Override
@Transactional
public ApiResponse updateBookingStatus(Long bookingId, StatusUpdateRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    booking = booking.toBuilder()
            .status(request.getNewStatus())
            .build();

    Booking savedBooking = bookingRepository.save(booking);

    return ApiResponse.builder()
            .statusCode(200)
            .message("Booking status updated successfully")
            .data(savedBooking)
            .build();
}

@Override
@Transactional
public ApiResponse markPaymentSuccess(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    booking = booking.toBuilder()
            .paymentStatus("SUCCESS")
            .status("CONFIRMED")
            .build();

    Booking savedBooking = bookingRepository.save(booking);

    return ApiResponse.builder()
            .statusCode(200)
            .message("Payment marked as successful")
            .data(savedBooking)
            .build();
}

@Override
public ApiResponse getCancelQuote(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    double refundAmount = calculateRefundAmount(booking);

    Map<String, Object> quote = Map.of(
            "bookingId", bookingId,
            "originalAmount", booking.getPlanAmount() != null ? booking.getPlanAmount() : 0.0,
            "refundAmount", refundAmount,
            "cancellationFee", booking.getPlanAmount() != null ? booking.getPlanAmount() - refundAmount : 0.0
    );

    return ApiResponse.builder()
            .statusCode(200)
            .message("Cancel quote retrieved successfully")
            .data(quote)
            .build();
}

// Helper method for refund calculation
private double calculateRefundAmount(Booking booking) {
    if (booking.getPlanAmount() == null) return 0.0;
    
    LocalDate bookingDate = booking.getBookingDate();
    LocalDate today = LocalDate.now();
    long daysUntilBooking = java.time.temporal.ChronoUnit.DAYS.between(today, bookingDate);

    if (daysUntilBooking >= 2) {
        return booking.getPlanAmount(); // 100% refund
    } else if (daysUntilBooking >= 1) {
        return booking.getPlanAmount() * 0.5; // 50% refund
    } else {
        return 0.0; // No refund
    }
}
```

## After Applying Fixes

1. **Save the file** (Ctrl+S)
2. **Clean the project** in STS: Project → Clean
3. **Refresh the project** (F5)
4. All errors should be resolved ✅

## Verification Checklist

- [ ] No more `upper()` method errors
- [ ] All 7 abstract methods implemented
- [ ] No compilation errors in STS
- [ ] Project builds successfully
- [ ] Rescheduling functionality works with limit of 2

## Need More Help?

If you still see errors after applying these fixes, please check:
1. All required imports are present
2. BookingService interface matches the method signatures
3. All DTO classes exist (BookingRequest, UpdateBookingRequest, UpgradeBookingRequest, StatusUpdateRequest)
