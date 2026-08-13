-- 1. Email queue helpers: lock down + pin search_path
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 2. Split public-read policies so anon paths never evaluate has_role()
DROP POLICY "Anyone can view approved products" ON public.products;
CREATE POLICY "Guests can view approved products" ON public.products FOR SELECT TO anon USING (approved = true);
CREATE POLICY "Users can view approved products" ON public.products FOR SELECT TO authenticated
  USING (approved = true OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Sellers can delete own products" ON public.products;
CREATE POLICY "Sellers can delete own products" ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
    AND (o.buyer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))));

DROP POLICY "Users can update own cattle" ON public.cattle_listings;
CREATE POLICY "Users can update own cattle" ON public.cattle_listings FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users can delete own cattle" ON public.cattle_listings;
CREATE POLICY "Users can delete own cattle" ON public.cattle_listings FOR DELETE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can view active schemes" ON public.schemes;
CREATE POLICY "Guests can view active schemes" ON public.schemes FOR SELECT TO anon USING (active = true);
CREATE POLICY "Users can view active schemes" ON public.schemes FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins can manage schemes" ON public.schemes;
CREATE POLICY "Admins can manage schemes" ON public.schemes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins manage FAQs" ON public.faqs;
CREATE POLICY "Admins manage FAQs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Active FAQs are public" ON public.faqs;
CREATE POLICY "Active FAQs are visible to guests" ON public.faqs FOR SELECT TO anon USING (active = true);
CREATE POLICY "Active FAQs are visible to users" ON public.faqs FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Active banners are public" ON public.notification_banners;
CREATE POLICY "Active banners visible to guests" ON public.notification_banners FOR SELECT TO anon
  USING (active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Active banners visible to users" ON public.notification_banners FOR SELECT TO authenticated
  USING ((active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()))
    OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins manage banners" ON public.notification_banners;
CREATE POLICY "Admins manage banners" ON public.notification_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins manage kb_documents" ON public.kb_documents;
CREATE POLICY "Admins manage kb_documents" ON public.kb_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Active knowledge is readable by everyone" ON public.chatbot_knowledge;
CREATE POLICY "Active knowledge readable by guests" ON public.chatbot_knowledge FOR SELECT TO anon USING (active = true);
CREATE POLICY "Active knowledge readable by users" ON public.chatbot_knowledge FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Admins manage chatbot knowledge" ON public.chatbot_knowledge;
CREATE POLICY "Admins manage chatbot knowledge" ON public.chatbot_knowledge FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- 3. Help Center aggregates via public views instead of definer RPCs
CREATE OR REPLACE VIEW public.help_top_searches AS
  SELECT lower(btrim(term)) AS term, count(*) AS hits
  FROM public.help_search_events
  WHERE event_type = 'search' AND term IS NOT NULL
    AND length(btrim(term)) >= 2
    AND created_at > now() - interval '30 days'
  GROUP BY lower(btrim(term))
  ORDER BY count(*) DESC, lower(btrim(term)) ASC
  LIMIT 25;

CREATE OR REPLACE VIEW public.help_top_faqs AS
  SELECT faq_index, count(*) AS hits
  FROM public.help_search_events
  WHERE event_type = 'faq_open' AND faq_index IS NOT NULL
    AND created_at > now() - interval '30 days'
  GROUP BY faq_index
  ORDER BY count(*) DESC, faq_index ASC
  LIMIT 25;

GRANT SELECT ON public.help_top_searches TO anon, authenticated;
GRANT SELECT ON public.help_top_faqs TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_top_help_searches(integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_top_help_faqs(integer) FROM anon;