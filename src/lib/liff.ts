"use client";

let liffModule: typeof import("@line/liff").default | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

async function getLiff() {
  if (!liffModule) {
    const mod = await import("@line/liff");
    liffModule = mod.default;
  }
  return liffModule;
}

export async function initLiff(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    console.warn("LIFF ID not set");
    return;
  }

  initPromise = (async () => {
    try {
      const liff = await getLiff();
      await liff.init({ liffId });
      initialized = true;
    } catch (e) {
      console.error("LIFF init failed:", e);
      initPromise = null;
    }
  })();

  return initPromise;
}

export function isLoggedIn(): boolean {
  try {
    return liffModule?.isLoggedIn() ?? false;
  } catch {
    return false;
  }
}

export async function login(): Promise<void> {
  const liff = await getLiff();
  liff.login();
}

export async function logout(): Promise<void> {
  const liff = await getLiff();
  liff.logout();
  window.location.reload();
}

export async function getProfile() {
  if (!isLoggedIn()) return null;
  const liff = await getLiff();
  return liff.getProfile();
}

export async function getFriendship() {
  if (!isLoggedIn()) return null;
  const liff = await getLiff();
  return liff.getFriendship();
}

export function isInClient(): boolean {
  try {
    return liffModule?.isInClient() ?? false;
  } catch {
    return false;
  }
}
