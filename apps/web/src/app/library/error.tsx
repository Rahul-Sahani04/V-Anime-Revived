"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown } from "lucide-react";

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("Library Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center max-w-lg">
      <div className="rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-xl p-8 shadow-2xl w-full">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Library Unavailable</h1>
        <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
          We encountered an issue syncing your library and watch progress. Please retry or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Library</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-surface px-6 py-2.5 text-xs font-semibold text-white border border-surface-border hover:bg-surface-hover transition-all"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home Page</span>
          </Link>
        </div>

        {/* Technical Details */}
        <div className="border-t border-surface-border pt-4 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] font-mono text-muted hover:text-white transition-colors"
          >
            <span>Technical Details</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </button>

          {showDetails && (
            <div className="mt-2.5 rounded-lg bg-background p-3 font-mono text-[11px] text-rose-400 border border-surface-border overflow-x-auto whitespace-pre-wrap">
              {error.message || "Failed to load user library"}
              {error.digest && <div className="text-muted mt-1">Digest: {error.digest}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
