
-- Update existing schemes with official apply URLs
UPDATE public.schemes SET apply_url = 'https://dahd.gov.in/schemes-programmes/animal-husbandry-infrastructure-development-fund-ahidf' WHERE title = 'Animal Husbandry Infrastructure Development Fund';
UPDATE public.schemes SET apply_url = 'https://dahd.gov.in/schemes/programmes/dairy-entrepreneurship-development-scheme' WHERE title = 'Dairy Entrepreneurship Development Scheme';
UPDATE public.schemes SET apply_url = 'https://www.nabard.org/auth/writereaddata/tender/1806174505KCC%20for%20AHD%20and%20Fishery.pdf' WHERE title = 'Kisan Credit Card for Animal Husbandry';
UPDATE public.schemes SET apply_url = 'https://nlm.udyamimitra.in/' WHERE title = 'National Livestock Mission';
UPDATE public.schemes SET apply_url = 'https://dahd.gov.in/schemes/programmes/rashtriya-gokul-mission' WHERE title = 'Rashtriya Gokul Mission';

-- Insert missing core schemes (avoid duplicates by title)
INSERT INTO public.schemes (title, category, description, eligibility, benefits, apply_url, active)
SELECT * FROM (VALUES
  ('PM Kisan Samman Nidhi', 'subsidy',
   'Income support of ₹6,000 per year paid in three equal installments of ₹2,000 directly to small and marginal farmer families.',
   'All landholding farmer families with cultivable land, subject to exclusion criteria.',
   '₹6,000 / year credited directly to the bank account (DBT).',
   'https://pmkisan.gov.in/', true),
  ('e-Gopala App', 'other',
   'Government of India mobile app for direct farmer access to disease-free germplasm, animal nutrition, veterinary services and AI booking.',
   'Open to all livestock farmers across India.',
   'AI booking, vet help, nutrition advice, animal market and disease alerts on one app.',
   'https://egopala.dahd.gov.in/', true),
  ('NABARD Dairy Schemes', 'loan',
   'NABARD-refinanced loans for dairy units, milking parlours, chilling plants and processing units with capital subsidy.',
   'Individual farmers, SHGs, FPOs, cooperatives and dairy entrepreneurs eligible under NABARD norms.',
   'Capital subsidy up to 25% (33.33% for SC/ST), back-ended subsidy on loan.',
   'https://www.nabard.org/content.aspx?id=591', true),
  ('AP State Dairy Subsidy (YSR Cheyutha & APDDCF)', 'subsidy',
   'Andhra Pradesh state subsidy and support for dairy farmers including milch animal purchase support and bonus on milk procurement through APDDCF.',
   'Resident dairy farmers of Andhra Pradesh supplying milk to recognized societies/APDDCF.',
   'Per-litre incentive on milk procurement and subsidy on milch animals/equipment.',
   'https://apddcf.ap.gov.in/', true)
) AS v(title, category, description, eligibility, benefits, apply_url, active)
WHERE NOT EXISTS (SELECT 1 FROM public.schemes s WHERE s.title = v.title);
