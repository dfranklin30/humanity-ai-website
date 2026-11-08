/**
 * Guardrail doors (roadmap 6.1): a satisfying "no".
 *
 * When an order ends held or blocked, the child is not left at a wall. The
 * status card offers three doors:
 *
 *   Try it a different way   a kid-safe rewording of their order, written by the
 *                            text model and screened like any other text; it
 *                            only fills the form, the child still presses Make
 *   Lounge                   something good to watch, always available
 *   Advanced Special Training  only when the facilitator has switched it on
 *
 * Every door a child takes is written to the audit log by the server, so the
 * facilitator can see which doors the class takes and tune the themes.
 */
import { useState } from "react";
import { ApiError, childDoor, type Door, type StudioRequest } from "./api";
import { BigButton } from "./components";

export function GuardrailDoors({
  request,
  advancedEnabled,
  onReword,
  onLounge,
  onAdvanced,
}: {
  request: StudioRequest;
  advancedEnabled: boolean;
  /** The screened rewording, as form values to start from, plus what changed in the child's words. */
  onReword: (values: Record<string, string>, changes: string[]) => void;
  onLounge: () => void;
  onAdvanced: () => void;
}) {
  const [busy, setBusy] = useState<Door | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function take(door: Door) {
    setBusy(door);
    setNote(null);
    try {
      const r = await childDoor(request.id, door);
      if (door === "lounge") onLounge();
      else if (door === "advanced") onAdvanced();
      else if (r.suggestion && Object.keys(r.suggestion.values).length) onReword(r.suggestion.values, r.suggestion.changes);
      else setNote("I couldn't think of a new way to say that one. Try your own words, or ask your facilitator for an idea!");
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : "That door is stuck. Try again in a moment!");
    } finally {
      setBusy(null);
    }
  }

  const held = request.status === "held";
  return (
    <div className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-200" data-testid="guardrail-doors">
      <p className="text-sm font-semibold text-violet-900">{held ? "While you wait, pick a door:" : "No worries. Pick a door:"}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {request.kind !== "chat" && (
          <BigButton variant="secondary" className="!px-4 !py-2 !text-base" disabled={busy !== null} onClick={() => take("reword")}>
            {busy === "reword" ? "Thinking…" : "💡 Try it a different way"}
          </BigButton>
        )}
        <BigButton variant="secondary" className="!px-4 !py-2 !text-base" disabled={busy !== null} onClick={() => take("lounge")}>
          📺 Lounge
        </BigButton>
        {advancedEnabled && (
          <BigButton variant="secondary" className="!px-4 !py-2 !text-base" disabled={busy !== null} onClick={() => take("advanced")}>
            🧪 Advanced Special Training
          </BigButton>
        )}
      </div>
      {note && <p className="mt-2 text-sm font-semibold text-violet-900">{note}</p>}
    </div>
  );
}
