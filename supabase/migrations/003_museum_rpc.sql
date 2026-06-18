-- 博物馆点赞：原子递增 likes 计数
CREATE OR REPLACE FUNCTION increment_museum_like(item_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE museum_items SET likes = likes + 1 WHERE id = item_id;
END;
$$;
