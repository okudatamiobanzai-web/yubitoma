"use client";

import liff from "@line/liff";

let initialized = false;

export async function initLiff(): Promise<void> {
  if (initialized) return;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    console.warn("LIFF ID not set");
    return;
  }
  await liff.init({ liffId });
  initialized = true;
}

export function isLoggedIn(): boolean {
  try {
    return liff.isLoggedIn();
  } catch {
    return false;
  }
}

export function login(): void {
  liff.login();
}

export function logout(): void {
  liff.logout();
  window.location.reload();
}

export async function getProfile() {
  if (!isLoggedIn()) return null;
  return liff.getProfile();
}

export async function getFriendship() {
  if (!isLoggedIn()) return null;
  return liff.getFriendship();
}

export function isInClient(): boolean {
  try {
    return liff.isInClient();
  } catch {
    return false;
  }
}
