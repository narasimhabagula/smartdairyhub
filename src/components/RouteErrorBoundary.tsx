import { Component, createRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CHUNK_RELOAD_KEY = "sdh_chunk_reload";
const reloadPage = () => window.location.reload();

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed|Failed to load module script/i.test(message);
}

/** Persist before reloading; unavailable storage must never cause a reload loop. */
export function reloadChunkOnce(error: unknown, reload = reloadPage): boolean {
  if (!isChunkLoadError(error)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    return false;
  }
  reload();
  return true;
}

export class PageErrorBoundary extends Component<
  { children: ReactNode; reload?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  private heading = createRef<HTMLHeadingElement>();

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    reloadChunkOnce(error, this.props.reload ?? reloadPage);
    this.heading.current?.focus();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section role="alert" className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center gap-4 px-6 py-12 text-center text-foreground">
        <h1 ref={this.heading} tabIndex={-1} className="text-2xl font-semibold">This page couldn’t load</h1>
        <p className="text-muted-foreground">Please check your connection and reload the page. Your account is safe.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={this.props.reload ?? reloadPage}><RefreshCw aria-hidden="true" />Reload page</Button>
          <Button variant="outline" asChild><a href="/"><Home aria-hidden="true" />Go to home</a></Button>
        </div>
      </section>
    );
  }
}

export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <PageErrorBoundary key={location.pathname}>{children}</PageErrorBoundary>;
}