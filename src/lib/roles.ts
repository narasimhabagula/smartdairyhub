import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const VALID = new Set<AppRole>(["farmer", "mediator", "industry"]);

/**
 * After a successful login/signup, ensure the role chosen on the role-selection
 * screen is attached to the user. The trigger inserts 'farmer' by default; this
 * adds the chosen role (additive) if it differs and is one we allow from the UI.
 */
export async function applyChosenRole(userId: string) {
  const chosen = localStorage.getItem("sdh_chosen_role") as AppRole | null;
  if (!chosen || !VALID.has(chosen)) return;
  try {
    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const have = new Set((existing ?? []).map((r) => r.role));
    if (!have.has(chosen)) {
      await supabase.from("user_roles").insert({ user_id: userId, role: chosen });
    }
  } catch (e) {
    console.error("[applyChosenRole]", e);
  } finally {
    localStorage.removeItem("sdh_chosen_role");
  }
}

export function readChosenRole(): AppRole | null {
  const v = localStorage.getItem("sdh_chosen_role") as AppRole | null;
  return v && VALID.has(v) ? v : null;
}
