import { isWanxiang } from "./wallpaper";

type HostMode = "startup";
type OpeningEvent = "ready" | "complete" | "error";

const requestedMode = new URLSearchParams(location.search).get("wanxiangHost");
const mode: HostMode | null = isWanxiang && window.parent !== window &&
  requestedMode === "startup" ? requestedMode : null;
let announced = false;
let completed = false;
let failed = false;
let disposed = false;

function send(event: OpeningEvent, message?: string) {
  if (!mode || disposed) return;
  window.parent.postMessage({ type: "wanxiang-opening", event, ...(message ? { message } : {}) }, location.origin);
}

/** The game owns Home readiness, overlay removal and the iframe lifetime. */
export const wanxiangHost = {
  mode,
  get waitingForHome() { return mode === "startup" && completed; },
  ready() {
    if (!mode || announced || failed || disposed) return;
    announced = true;
    send("ready");
  },
  complete() {
    if (!mode || !announced || failed || disposed || completed) return;
    completed = true;
    send("complete");
  },
  error(error: unknown) {
    if (!mode || failed || disposed) return;
    failed = true;
    send("error", error instanceof Error ? error.message : String(error));
  },
  dispose() { disposed = true; },
};
