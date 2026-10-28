"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLElement>(null);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, String(Date.now() + HIDE_MS));
    } catch {
      /* storage blocked — still close for this view */
    }
    setOpen(false);
  }, []);

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
    dialogRef.current?.focus();
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div className="mm-promo-root">
      <button type="button" className="mm-promo-backdrop" aria-label="Dismiss" onClick={dismiss} />
      <aside
        ref={dialogRef}
        className="mm-promo pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-promo-title"
        aria-describedby="mm-promo-body"
        tabIndex={-1}
      >
        <div className="mm-promo-copy">
          <img src={MARK} alt="" width={92} height={92} className="mm-promo-mark" />
          <div>
            <h2 id="mm-promo-title">MarketMover</h2>
            <p id="mm-promo-body">Live prices and model markets in one place. More markets coming.</p>
          </div>
        </div>
        <div className="mm-promo-actions">
          <button type="button" className="btn" onClick={dismiss}>
            Dismiss
          </button>
          <a className="btn btn-primary" href={HREF} onClick={dismiss}>
            Visit MarketMover
          </a>
        </div>
      </aside>
    </div>
  );
}
