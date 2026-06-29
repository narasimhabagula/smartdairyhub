
create extension if not exists vector;

create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  title text,
  category text not null default 'website',
  content text not null,
  content_hash text not null,
  embedding vector(1536),
  token_count int,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kb_documents_hash_idx on public.kb_documents(content_hash);
create index if not exists kb_documents_embedding_idx on public.kb_documents using hnsw (embedding vector_cosine_ops);

grant select on public.kb_documents to authenticated;
grant select on public.kb_documents to anon;
grant all on public.kb_documents to service_role;

alter table public.kb_documents enable row level security;

create policy "Admins manage kb_documents" on public.kb_documents
  for all using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Active kb_documents are readable" on public.kb_documents
  for select using (active = true);

create trigger trg_kb_documents_updated before update on public.kb_documents
  for each row execute function public.update_updated_at_column();

create or replace function public.match_kb_documents(
  query_embedding vector(1536),
  match_count int default 6
)
returns table (
  id uuid,
  source_url text,
  title text,
  category text,
  content text,
  similarity float
)
language sql stable security definer set search_path = public as $$
  select d.id, d.source_url, d.title, d.category, d.content,
         1 - (d.embedding <=> query_embedding) as similarity
  from public.kb_documents d
  where d.active = true and d.embedding is not null
  order by d.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke all on function public.match_kb_documents(vector, int) from public, anon;
grant execute on function public.match_kb_documents(vector, int) to authenticated, service_role;
