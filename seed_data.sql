--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: carwash_deal_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (1, 'Home', 'Foam', 'N', 1200.00, 25.08, 899.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (2, 'Home', 'Basic', 'N', 750.00, 20.13, 599.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (3, 'Home', 'Premium', 'N', 4500.00, 28.91, 3199.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (5, 'Home', 'Basic', 'Y', 750.00, 53.47, 349.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (6, 'Home', 'Premium', 'Y', 4500.00, 38.91, 2749.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (7, 'Self Drive', 'Foam', 'N', 1200.00, 25.08, 899.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (8, 'Self Drive', 'Basic', 'N', 750.00, 29.47, 529.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (9, 'Self Drive', 'Premium', 'N', 4500.00, 28.91, 3199.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (10, 'Home', 'Basic+Foam+Premium', 'N', 2150.00, 25.63, 1599.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (11, 'Home', 'Basic+Foam+Premium', 'Y', 2150.00, 39.58, 1299.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (12, 'Self Drive', 'Basic+Foam+Premium', 'N', 2150.00, 25.63, 1599.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (4, 'Home', 'Foam', 'Y', 1200.00, 44.25, 669.00, '2026-02-08 09:18:10.812284', '2026-02-08 09:18:10.812284', 'Hatchback', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (13, 'Self Drive', 'Foam', 'N', 1200.00, 25.08, 899.04, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (14, 'Home', 'Foam', 'Y', 1200.00, 44.25, 669.00, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (15, 'Home', 'Foam', 'N', 1200.00, 25.08, 899.04, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (16, 'Self Drive', 'Basic', 'N', 750.00, 29.47, 528.98, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (17, 'Home', 'Basic', 'Y', 750.00, 53.47, 348.98, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (18, 'Home', 'Basic', 'N', 750.00, 20.13, 599.03, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (19, 'Self Drive', 'Premium', 'N', 4500.00, 28.91, 3199.05, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (20, 'Home', 'Premium', 'Y', 4500.00, 38.91, 2749.05, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (21, 'Home', 'Premium', 'N', 4500.00, 28.91, 3199.05, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (22, 'Self Drive', 'Basic+Foam+Premium', 'N', 2150.00, 25.63, 1598.96, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (23, 'Home', 'Basic+Foam+Premium', 'Y', 2150.00, 39.58, 1299.03, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (24, 'Home', 'Basic+Foam+Premium', 'N', 2150.00, 25.63, 1598.96, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Sedan', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (25, 'Self Drive', 'Foam', 'N', 1500.00, 25.08, 1123.80, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (26, 'Home', 'Foam', 'Y', 1500.00, 44.25, 836.25, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (27, 'Home', 'Foam', 'N', 1500.00, 25.08, 1123.80, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (28, 'Self Drive', 'Basic', 'N', 900.00, 29.47, 634.77, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (29, 'Home', 'Basic', 'Y', 900.00, 53.47, 418.77, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (30, 'Home', 'Basic', 'N', 900.00, 20.13, 718.83, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (31, 'Self Drive', 'Premium', 'N', 5400.00, 28.91, 3838.86, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (32, 'Home', 'Premium', 'Y', 5400.00, 38.91, 3298.86, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (33, 'Home', 'Premium', 'N', 5400.00, 28.91, 3838.86, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (34, 'Self Drive', 'Basic+Foam+Premium', 'N', 2600.00, 25.63, 1933.62, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (35, 'Home', 'Basic+Foam+Premium', 'Y', 2600.00, 39.58, 1570.92, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (36, 'Home', 'Basic+Foam+Premium', 'N', 2600.00, 25.63, 1933.62, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'SUV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (37, 'Self Drive', 'Foam', 'N', 1500.00, 25.08, 1123.80, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (38, 'Home', 'Foam', 'Y', 1500.00, 44.25, 836.25, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (39, 'Home', 'Foam', 'N', 1500.00, 25.08, 1123.80, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (40, 'Self Drive', 'Basic', 'N', 900.00, 29.47, 634.77, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (41, 'Home', 'Basic', 'Y', 900.00, 53.47, 418.77, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (42, 'Home', 'Basic', 'N', 900.00, 20.13, 718.83, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (43, 'Self Drive', 'Premium', 'N', 6400.00, 28.91, 4549.76, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (44, 'Home', 'Premium', 'Y', 6400.00, 38.91, 3909.76, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (45, 'Home', 'Premium', 'N', 6400.00, 28.91, 4549.76, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (46, 'Self Drive', 'Basic+Foam+Premium', 'N', 2600.00, 25.63, 1933.62, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (47, 'Home', 'Basic+Foam+Premium', 'Y', 2600.00, 39.58, 1570.92, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (48, 'Home', 'Basic+Foam+Premium', 'N', 2600.00, 25.63, 1933.62, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'MPV', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (49, 'Self Drive', 'Foam', 'N', 2100.00, 25.08, 1573.32, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (50, 'Home', 'Foam', 'Y', 2100.00, 44.25, 1170.75, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (51, 'Home', 'Foam', 'N', 2100.00, 25.08, 1573.32, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (52, 'Self Drive', 'Basic', 'N', 1500.00, 29.47, 1057.95, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (53, 'Home', 'Basic', 'Y', 1500.00, 53.47, 697.95, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (54, 'Home', 'Basic', 'N', 1500.00, 20.13, 1198.05, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (55, 'Self Drive', 'Premium', 'N', 6000.00, 28.91, 4265.40, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (56, 'Home', 'Premium', 'Y', 6000.00, 38.91, 3665.40, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (57, 'Home', 'Premium', 'N', 6000.00, 28.91, 4265.40, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (58, 'Self Drive', 'Basic+Foam+Premium', 'N', 3200.00, 25.63, 2379.84, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (59, 'Home', 'Basic+Foam+Premium', 'Y', 3200.00, 39.58, 1933.44, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);
INSERT INTO public.carwash_deal_prices (id, deal_service_type, deal_wash_type, deal_water_providing, deal_actual_price, deal_discount, deal_final_price, created_at, updated_at, deal_car_type, total_months) VALUES (60, 'Home', 'Basic+Foam+Premium', 'N', 3200.00, 25.63, 2379.84, '2026-02-17 02:42:48.888351', '2026-02-17 02:42:48.888351', 'Pickup', 3);


--
-- Data for Name: carwash_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (1, 'HATCHBACK', 'BASIC', 250.00, '2025-12-23 02:00:44.392503', true, 250.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (2, 'HATCHBACK', 'FOAM', 400.00, '2025-12-23 02:00:44.392503', true, 400.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (3, 'HATCHBACK', 'PREMIUM', 1500.00, '2025-12-23 02:00:44.392503', true, 1500.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (4, 'SEDAN', 'BASIC', 250.00, '2025-12-23 02:00:44.392503', true, 250.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (5, 'SEDAN', 'FOAM', 400.00, '2025-12-23 02:00:44.392503', true, 400.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (6, 'SEDAN', 'PREMIUM', 1500.00, '2025-12-23 02:00:44.392503', true, 1500.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (7, 'SUV', 'BASIC', 260.00, '2025-12-23 02:00:44.392503', true, 260.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (8, 'SUV', 'FOAM', 500.00, '2025-12-23 02:00:44.392503', true, 500.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (9, 'SUV', 'PREMIUM', 1699.00, '2025-12-23 02:00:44.392503', true, 1699.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (10, 'MPV', 'BASIC', 260.00, '2025-12-23 02:00:44.392503', true, 260.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (11, 'MPV', 'FOAM', 500.00, '2025-12-23 02:00:44.392503', true, 500.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (12, 'MPV', 'PREMIUM', 1699.00, '2025-12-23 02:00:44.392503', true, 1699.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (13, 'PICKUP', 'BASIC', 270.00, '2025-12-23 02:00:44.392503', true, 270.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (14, 'PICKUP', 'FOAM', 600.00, '2025-12-23 02:00:44.392503', true, 600.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (15, 'PICKUP', 'PREMIUM', 1799.00, '2025-12-23 02:00:44.392503', true, 1799.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (16, 'BIKE', 'BASIC', 100.00, '2025-12-23 02:00:44.392503', true, 100.00, '2025-12-23 02:00:44.392503', 'INR');
INSERT INTO public.carwash_rates (id, vehicle_type, wash_level, rate, updated_at, active, amount, created_at, currency) VALUES (17, 'BIKE', 'FOAM', 250.00, '2025-12-23 02:00:44.392503', true, 250.00, '2025-12-23 02:00:44.392503', 'INR');


--
-- Data for Name: carwash_service_centre; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carwash_service_centre (id, name, area, address, rating, maps_url, latitude, longitude, active, created_at, updated_at) VALUES (3, 'ASP care', 'Kondapur', 'Kondapur Junction, Widia Colony , Mumbai Highway Rd, opposite Hanuman Temple Road, Multiplex, Hyderabad, Telangana 500049, India', 4.9, 'https://maps.app.goo.gl/Hocxzr923bAj8iez6', 17.4510650, 78.3632720, true, '2025-11-26 02:00:26.295433', '2025-11-26 02:00:26.295433');
INSERT INTO public.carwash_service_centre (id, name, area, address, rating, maps_url, latitude, longitude, active, created_at, updated_at) VALUES (2, 'Anvi', 'Kokapet', 'KokapetJunction, finance Colony , Mumbai Highway Rd,  Hyderabad, Telangana 500051, India', 4.9, 'https://maps.app.goo.gl/Hocxzr923bAj8iez6', 17.4510650, 78.3632720, true, '2025-11-25 09:17:55.577476', '2025-11-25 09:17:55.577476');
INSERT INTO public.carwash_service_centre (id, name, area, address, rating, maps_url, latitude, longitude, active, created_at, updated_at) VALUES (1, 'Supriya', 'Gachibowli', 'Gachibowli Junction, AIG Colony , Beside Atrium mall, Multiplex, Hyderabad, Telangana 500064, India', 4.9, 'https://maps.app.goo.gl/Hocxzr923bAj8iez6', 17.4510710, 78.3632730, true, '2025-11-25 09:08:38.0374', '2025-11-25 09:08:38.0374');
INSERT INTO public.carwash_service_centre (id, name, area, address, rating, maps_url, latitude, longitude, active, created_at, updated_at) VALUES (4, 'GSA care', 'Uppal', 'Uppal Junction, mallikarjun Colony , opposite Hanuman Temple Road, Multiplex, Hyderabad, Telangana 500032', 4.2, 'https://maps.app.goo.gl/Hocxzr923bAj8iez6', 17.4510650, 78.3632720, true, '2026-02-03 09:14:46.212262', '2026-02-03 09:14:46.212262');
INSERT INTO public.carwash_service_centre (id, name, area, address, rating, maps_url, latitude, longitude, active, created_at, updated_at) VALUES (5, 'Prem', 'Gachibowli', 'Gachibowli , AIG Colony , Beside Atrium mall, Multiplex, Hyderabad, Telangana 500064, India', 4, 'https://maps.app.goo.gl/Hocxzr923bAj8iez6', 17.4510710, 78.3632730, true, '2025-11-25 09:08:38.0374', '2026-03-16 07:37:46.913752');


--
-- Data for Name: carwash_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.carwash_services (id, service_type, display_name, discount_percentage, icon, active, sort_order, created_at, updated_at) VALUES (1, 'centre', '@Centre', 20.00, '📍', true, 1, '2026-03-29 03:11:35.195255', '2026-03-29 03:11:35.195255');
INSERT INTO public.carwash_services (id, service_type, display_name, discount_percentage, icon, active, sort_order, created_at, updated_at) VALUES (2, 'home', '@Home', 40.00, '🏠', true, 2, '2026-03-29 03:11:35.195255', '2026-03-29 03:11:35.195255');
INSERT INTO public.carwash_services (id, service_type, display_name, discount_percentage, icon, active, sort_order, created_at, updated_at) VALUES (3, 'teflon', 'Teflon', 15.00, '✨', true, 3, '2026-03-29 03:11:35.195255', '2026-03-29 03:11:35.195255');
INSERT INTO public.carwash_services (id, service_type, display_name, discount_percentage, icon, active, sort_order, created_at, updated_at) VALUES (4, 'aspcare', 'ASP Care', 25.00, '🛡️', true, 4, '2026-03-29 03:11:35.195255', '2026-03-29 03:11:35.195255');


--
-- Name: carwash_deal_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carwash_deal_prices_id_seq', 60, true);


--
-- Name: carwash_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carwash_rates_id_seq', 17, true);


--
-- Name: carwash_service_centre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carwash_service_centre_id_seq', 3, true);


--
-- Name: carwash_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carwash_services_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

