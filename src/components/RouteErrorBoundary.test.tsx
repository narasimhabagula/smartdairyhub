import { lazy, Suspense } from "react";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHUNK_RELOAD_KEY, PageErrorBoundary, reloadChunkOnce } from "./RouteErrorBoundary";

const chunkError = new TypeError("Failed to fetch dynamically imported module: /assets/page-old.js");

describe("route loading recovery", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("reloads a rejected lazy page only once across remounts", async () => {
    const reload = vi.fn(() => expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe("1"));
    const Broken = lazy(() => Promise.reject(chunkError));
    const view = () => <PageErrorBoundary reload={reload}><Suspense fallback={<p>Loading</p>}><Broken /></Suspense></PageErrorBoundary>;
    const first = render(view());
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    first.unmount();
    render(view());
    await screen.findByRole("alert");
    expect(reload).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reload page" }));
    expect(reload).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/");
  });

  it("does not automatically reload ordinary render failures", () => {
    const reload = vi.fn();
    const Broken = (): JSX.Element => { throw new Error("ordinary render error"); };
    render(<PageErrorBoundary reload={reload}><Broken /></PageErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not reload when the guard cannot be persisted", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    const reload = vi.fn();
    expect(reloadChunkOnce(chunkError, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([
    "Importing a module script failed.",
    "error loading dynamically imported module",
    "Loading chunk 123 failed.",
  ])("recovers browser module error: %s", message => {
    const reload = vi.fn();
    expect(reloadChunkOnce(new Error(message), reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});