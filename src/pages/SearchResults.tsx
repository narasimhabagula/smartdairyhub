import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, ArrowRight, SearchX } from "lucide-react";
import { searchAll, SEARCH_ENTRIES, SearchCategory, SearchEntry } from "@/lib/searchRegistry";

const CATEGORIES: SearchCategory[] = [
  "Milk Rates",
  "Veterinary Doctors",
  "Cattle Market",
  "Marketplace",
  "Government Schemes",
  "Customer Support",
  "Dashboard",
  "Profile",
  "Orders",
  "Settings",
];

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [activeCat, setActiveCat] = useState<SearchCategory | "All">("All");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const results = useMemo(() => searchAll(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchCategory, SearchEntry[]>();
    for (const r of results) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [results]);

  const visibleCats = CATEGORIES.filter((c) => activeCat === "All" || c === activeCat);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(query ? { q: query } : {});
  };

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Search results</h1>
      {query && (
        <p className="mt-1 text-sm text-muted-foreground">
          Showing matches for <span className="font-semibold text-foreground">"{query}"</span>
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-5 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-accent"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search milk rates, vets, cattle market, marketplace, schemes…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
          autoFocus
        />
      </form>

      {/* Category chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCat("All")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            activeCat === "All" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          All ({results.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = grouped.get(c)?.length ?? 0;
          if (!count && query) return null;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeCat === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {c} {count ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-8">
        {!query && (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Type something above to search across the entire Smart Dairy Hub.
          </div>
        )}

        {query && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">No results found</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              We couldn't find anything for "{query}". Try a different keyword like
              <span className="font-medium text-foreground"> milk rates</span>,
              <span className="font-medium text-foreground"> vet</span>, or
              <span className="font-medium text-foreground"> schemes</span>.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to Home
            </button>
          </div>
        )}

        {visibleCats.map((cat) => {
          const items = grouped.get(cat);
          if (!items?.length) return null;
          return (
            <section key={cat}>
              <h2 className="font-display text-lg font-bold">{cat}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {items.map((r) => (
                  <Link
                    key={`${cat}-${r.to}-${r.label}`}
                    to={r.to}
                    className="group flex items-start justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold">{r.label}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                      <span className="mt-2 inline-block text-xs text-muted-foreground">{r.to}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
