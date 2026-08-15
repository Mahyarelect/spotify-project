export const PWA_UPDATE_EVENT = "spotify:pwa-update";

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return null;

  const hadController = Boolean(navigator.serviceWorker.controller);
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

  const announceWaitingWorker = () => {
    if (registration.waiting) {
      window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: registration }));
    }
  };

  announceWaitingWorker();
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        announceWaitingWorker();
      }
    });
  });

  if (hadController) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  return registration;
}

export function activateServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}
