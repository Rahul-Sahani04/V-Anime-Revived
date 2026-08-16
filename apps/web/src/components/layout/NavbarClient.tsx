"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Search, Sparkles, Library, Compass } from "lucide-react";
import { CommandSearch } from "../search/CommandSearch";

interface NavbarClientProps {
  authSlot: React.ReactNode;
  mobileMenuSlot: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/search", label: "Browse", icon: Compass },
  { href: "/library", label: "My Library", icon: Library },
];

export function NavbarClient({ authSlot, mobileMenuSlot }: NavbarClientProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global ⌘K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-surface-border bg-background/85 backdrop-blur-xl shadow-lg shadow-black/40 py-2.5"
            : "border-b border-transparent bg-gradient-to-b from-background/90 via-background/40 to-transparent py-4"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 lg:px-8">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_25px_rgba(225,29,72,0.8)]"
              >
                V
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight hidden sm:inline-block bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  V-Anime Revived
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Animated Pill */}
            <nav className="hidden md:flex items-center gap-1 bg-surface/50 p-1 rounded-full border border-surface-border/60 backdrop-blur-md">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      isActive ? "text-white" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-full bg-primary/20 border border-primary/40 shadow-[0_0_12px_rgba(225,29,72,0.25)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-3.5 w-3.5 relative z-10 ${isActive ? "text-primary" : ""}`} />
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Quick Search, Auth & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Animated Search Pill Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 rounded-full border border-surface-border bg-surface/70 px-3.5 py-1.5 text-xs text-muted hover:border-primary/50 hover:bg-surface-hover transition-colors shadow-inner"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Search anime...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted border border-surface-border">
                <span>⌘</span>K
              </kbd>
            </motion.button>

            {/* Auth Slot */}
            <div className="flex items-center">{authSlot}</div>

            {/* Mobile Menu Slot */}
            <div className="md:hidden">{mobileMenuSlot}</div>
          </div>
        </div>
      </header>

      {/* Command Search Palette */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
