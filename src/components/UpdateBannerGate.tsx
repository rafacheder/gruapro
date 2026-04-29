import { lazy, Suspense } from "react";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

const enabled = !isInIframe && !isPreviewHost;

const UpdateBanner = lazy(() =>
  import("./UpdateBanner").then((m) => ({ default: m.UpdateBanner })),
);

export function UpdateBannerGate() {
  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <UpdateBanner />
    </Suspense>
  );
}