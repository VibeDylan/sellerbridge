
WITH deduplicated_reviews AS (
  SELECT *
  FROM sellerbridge_analytics.kyb_reviews
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY kyb_case_id, reviewed_at
    ORDER BY ingested_at
  ) = 1
)
SELECT
  COUNTIF(verdict = 'approved') AS approved_count,
  COUNT(*) AS total_reviews,
  ROUND(COUNTIF(verdict = 'approved') / COUNT(*) * 100, 2) AS approval_rate_pct
FROM deduplicated_reviews;

-- 2. Average time between registration and review (deduplicated on both sides)
-- Swap MINUTE for SECOND/HOUR/DAY depending on the granularity you want.
WITH deduplicated_registrations AS (
  SELECT *
  FROM sellerbridge_analytics.seller_registrations
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY seller_id, registered_at
    ORDER BY ingested_at
  ) = 1
),
deduplicated_reviews AS (
  SELECT *
  FROM sellerbridge_analytics.kyb_reviews
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY kyb_case_id, reviewed_at
    ORDER BY ingested_at
  ) = 1
)
SELECT
  ROUND(AVG(TIMESTAMP_DIFF(r.reviewed_at, s.registered_at, MINUTE)), 2) AS avg_minutes_to_review
FROM deduplicated_reviews r
JOIN deduplicated_registrations s
  ON r.seller_id = s.seller_id;

-- 3. Registrations per day (deduplicated)
WITH deduplicated_registrations AS (
  SELECT *
  FROM sellerbridge_analytics.seller_registrations
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY seller_id, registered_at
    ORDER BY ingested_at
  ) = 1
)
SELECT
  DATE(registered_at) AS registration_date,
  COUNT(*) AS registrations
FROM deduplicated_registrations
GROUP BY registration_date
ORDER BY registration_date;
