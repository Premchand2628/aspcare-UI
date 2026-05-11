-- Reference DDL for the columns/tables the new backend code expects.
-- Apply only the parts that are missing — your team confirmed columns were
-- already added in the live DB, but this file is the source of truth for
-- naming so the JPA entities map correctly.

-- =====================================================================
-- carwash_service_centre  (bookingservice)
-- =====================================================================
ALTER TABLE carwash_service_centre
    ADD COLUMN IF NOT EXISTS centre_code   VARCHAR(64),
    ADD COLUMN IF NOT EXISTS center_home   BOOLEAN,
    ADD COLUMN IF NOT EXISTS center_service BOOLEAN,
    ADD COLUMN IF NOT EXISTS center_both   BOOLEAN,
    ADD COLUMN IF NOT EXISTS center_teflon BOOLEAN,
    ADD COLUMN IF NOT EXISTS center_asp    BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_csc_centre_code
    ON carwash_service_centre (centre_code);

-- =====================================================================
-- carwash_centre_rate  (carwashrates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS carwash_centre_rate (
    id                BIGSERIAL PRIMARY KEY,
    rate_center_code  VARCHAR(64)   NOT NULL,
    service_mode      VARCHAR(32)   NOT NULL,    -- HOME | SERVICE_CENTRE
    vehicle_type      VARCHAR(20)   NOT NULL,    -- HATCHBACK | SEDAN | SUV | ...
    wash_level        VARCHAR(20)   NOT NULL,    -- BASIC | PREMIUM | ...
    amount            NUMERIC(10,2) NOT NULL,
    currency          VARCHAR(10)   NOT NULL DEFAULT 'INR',
    active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP     NOT NULL,
    updated_at        TIMESTAMP     NOT NULL,
    CONSTRAINT uk_centre_rate UNIQUE (rate_center_code, service_mode, vehicle_type, wash_level)
);

CREATE INDEX IF NOT EXISTS idx_centre_rate_lookup
    ON carwash_centre_rate (rate_center_code, service_mode, active);
