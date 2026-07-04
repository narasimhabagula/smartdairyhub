# Demo Data

All files in `src/data/demo/` contain **temporary sample data** shown during development.

## How it works

Every page reads demo data through a single flag:

```ts
import { USE_DEMO_DATA } from "@/data/demo";
```

When `USE_DEMO_DATA` is `false`, pages should fall back to live Supabase queries.

## Removing demo data

1. Set `USE_DEMO_DATA = false` in `src/data/demo/index.ts`.
2. Delete the `src/data/demo/` folder.
3. Remove any `USE_DEMO_DATA` imports (TypeScript will surface them).

No UI code needs to change — the shape of demo objects mirrors the DB tables.
