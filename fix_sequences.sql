SELECT setval('carwash_services_id_seq', (SELECT MAX(id) FROM carwash_services));
SELECT setval('carwash_rates_id_seq', (SELECT MAX(id) FROM carwash_rates));
SELECT setval('carwash_service_centre_id_seq', (SELECT MAX(id) FROM carwash_service_centre));
SELECT setval('carwash_deal_prices_id_seq', (SELECT MAX(id) FROM carwash_deal_prices));
