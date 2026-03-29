"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("yubito-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("yubito-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("yubito-theme", "light");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-full bg-[var(--color-soft)] flex items-center justify-center text-sm hover:bg-[var(--color-border)] transition-colors"
      title={isDark ? "ライトモードに切替" : "ダークモードに切替"}
    >
      {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
    </button>
  );
}
