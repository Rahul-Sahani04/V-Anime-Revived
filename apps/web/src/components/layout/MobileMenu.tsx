"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Search, Sparkles, Compass, Library, User } from "lucide-react";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Sparkles },
    { href: "/search", label: "Browse", icon: Compass },
    { href: "/library", label: "My Library", icon: Library },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-muted hover:text-foreground transition-colors rounded-lg bg-surface/60 border border-surface-border"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-16 bg-background/95 backdrop-blur-2xl border-b border-surface-border p-5 flex flex-col gap-6 shadow-2xl z-50"
          >
            <form onSubmit={handleSearch} className="relative w-full">
              <input 
                id="mobile-search-input"
                name="mobile-search"
                aria-label="Search anime"
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            </form>

            <nav className="flex flex-col gap-2">
              {navItems.map((item, idx) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

