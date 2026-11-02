/**
 * Fire-and-forget trigger that asks the Python visual-search server to rebuild
 * its embedding index after a product is created, edited, or deleted.
 *
 * This is intentionally non-blocking and never throws into the request path:
 * if the Python server is down, the product mutation still succeeds and we just
 * log a warning. The index will catch up on the next reindex (or a manual
 * `python generate_embeddings.py`).
 */
const VISUAL_SEARCH_URL =
  process.env.VISUAL_SEARCH_URL || "http://127.0.0.1:8000";

export function triggerVisualSearchReindex(reason?: string): void {
  // Don't await — let it run in the background so product saves stay fast.
  fetch(`${VISUAL_SEARCH_URL}/reindex`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.VISUAL_SEARCH_REINDEX_TOKEN ? { "X-Reindex-Token": process.env.VISUAL_SEARCH_REINDEX_TOKEN } : {}) },
  })
    .then((res) => {
      if (!res.ok) {
        console.warn(
          `[reindex] Visual search server returned ${res.status}` +
            (reason ? ` (after ${reason})` : ""),
        );
      }
    })
    .catch((err) => {
      console.warn(
        `[reindex] Could not reach visual search server at ${VISUAL_SEARCH_URL}` +
          (reason ? ` (after ${reason})` : "") +
          `: ${err?.message || err}`,
      );
    });
}
