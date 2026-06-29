
-- Chatbot knowledge sources
CREATE TABLE public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chatbot_knowledge TO anon, authenticated;
GRANT ALL ON public.chatbot_knowledge TO service_role;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active knowledge is readable by everyone"
  ON public.chatbot_knowledge FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage chatbot knowledge"
  ON public.chatbot_knowledge FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER trg_chatbot_knowledge_updated
  BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Managed FAQs (shown in Help Center)
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active FAQs are public"
  ON public.faqs FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage FAQs"
  ON public.faqs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER trg_faqs_updated
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification banner messages (shown to all users)
CREATE TABLE public.notification_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  variant text NOT NULL DEFAULT 'info', -- info | success | warning | promo
  link text,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_banners TO anon, authenticated;
GRANT ALL ON public.notification_banners TO service_role;
ALTER TABLE public.notification_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active banners are public"
  ON public.notification_banners FOR SELECT
  USING (
    (active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );
CREATE POLICY "Admins manage banners"
  ON public.notification_banners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER trg_notification_banners_updated
  BEFORE UPDATE ON public.notification_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
