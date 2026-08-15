import { activateServiceWorkerUpdate, PWA_UPDATE_EVENT } from "@/lib/pwa/registerServiceWorker";

it("uses a namespaced update event", () => {
  expect(PWA_UPDATE_EVENT).toBe("spotify:pwa-update");
});

it("asks a waiting worker to activate", () => {
  const postMessage = vi.fn();
  const registration = { waiting: { postMessage } } as unknown as ServiceWorkerRegistration;

  activateServiceWorkerUpdate(registration);

  expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
});
