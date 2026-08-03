-- Analytics queries for the sellerbridge_analytics dataset.
-- Run directly in the BigQuery query editor — not part of application code.

-- 1. KYB approval rate
SELECT
  COUNTIF(verdict = 'approved') AS approved_count,
  COUNT(*) AS total_reviews,
  ROUND(COUNTIF(verdict = 'approved') / COUNT(*) * 100, 2) AS approval_rate_pct
FROM sellerbridge_analytics.kyb_reviews;

-- 2. Average time between registration and review
-- Swap MINUTE for SECOND/HOUR/DAY depending on the granularity you want.
SELECT
  ROUND(AVG(TIMESTAMP_DIFF(r.reviewed_at, s.registered_at, MINUTE)), 2) AS avg_minutes_to_review
FROM sellerbridge_analytics.kyb_reviews r
JOIN sellerbridge_analytics.seller_registrations s
  ON r.seller_id = s.seller_id;

-- 3. Registrations per day
SELECT
  DATE(registered_at) AS registration_date,
  COUNT(*) AS registrations
FROM sellerbridge_analytics.seller_registrations
GROUP BY registration_date
ORDER BY registration_date;
