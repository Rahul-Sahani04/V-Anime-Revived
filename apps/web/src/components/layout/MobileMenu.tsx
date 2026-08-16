"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-muted hover:text-foreground transition-colors"
        aria-label="Toggle Menu"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-16 w-full bg-background/95 backdrop-blur-xl border-b border-surface-border p-4 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-2 duration-200 z-50">
          
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              type="text" 
              placeholder="Search anime..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <nav className="flex flex-col gap-4">
            <Link href="/" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${pathname === '/' ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
              Home
            </Link>
            <Link href="/search" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${pathname === '/search' ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
              Browse
            </Link>
            <Link href="/library" onClick={() => setIsOpen(false)} className={`text-lg font-medium transition-colors ${pathname === '/library' ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
              My Library
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
