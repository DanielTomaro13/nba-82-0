"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "nba82.marketmover.promoUntil";
const HIDE_MS = 14 * 24 * 60 * 60 * 1000;
const DELAY_MS = 1500;
const HREF =
  "https://www.marketmover.net?utm_source=nba82-0&utm_medium=popup&utm_campaign=crosspromo";
const MARK = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/marketmover-mark.png`;

function pathOf(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

/** Home and the main perfect-season page only. */
function showOn(pathname: string) {
  const path = pathOf(pathname);
  return path === "/" || path === "/play";
}

function hiddenUntil() {
  try {
    const until = Number(localStorage.getItem(KEY) || "0");
    return Number.isFinite(until) ? until : 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export default function MarketMoverPromo() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!showOn(pathname) || hiddenUntil() > Date.now()) {
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    try {
      localStorage.setItem(KEY, String(Date.now() + HIDE_MS));
    } catch {
      /* storage blocked — still close for this view */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <aside
      className="pop"
      role="dialog"
      aria-label="MarketMover"
      style={{
        position: "fixed",
        zIndex: 70,
        right: "max(12px, env(safe-area-inset-right))",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        width: "min(380px, calc(100vw - 24px - env(safe-area-inset-left) - env(safe-area-inset-right)))",
        display: "grid",
        gap: 12,
        padding: "0.9rem 0.95rem",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "0 18px 50px rgba(0,0,0,.45)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <img
          src={MARK}
          alt=""
          width={40}
          height={40}
          style={{ width: 40, height: 40, borderRadius: 10, display: "block", flexShrink: 0 }}
        />
        <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.45 }}>
          MarketMover — live prices and model markets in one place. More markets coming.
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={dismiss} style={{ minHeight: 40, padding: "0.4rem 0.8rem" }}>
          Dismiss
        </button>
        <a className="btn btn-primary" href={HREF} onClick={dismiss} style={{ minHeight: 40, padding: "0.4rem 0.85rem" }}>
          Visit MarketMover
        </a>
      </div>
    </aside>
  );
}
