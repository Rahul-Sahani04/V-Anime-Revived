import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MobileMenu } from "./MobileMenu";

export async function Navbar() {
  const { userId } = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        
        {/* Left Side: Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-[0_0_15px_rgba(225,29,72,0.4)]">
              V
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden sm:block">V-Anime Revived</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-semibold text-muted hover:text-white transition-colors">Home</Link>
            <Link href="/search" className="text-sm font-semibold text-muted hover:text-white transition-colors">Browse</Link>
            <Link href="/library" className="text-sm font-semibold text-muted hover:text-white transition-colors">My Library</Link>
          </nav>
        </div>
        
        {/* Right Side: Search, Auth & Mobile Menu */}
        <div className="flex items-center gap-4">
          <div className="relative h-9 w-full max-w-[240px] hidden md:block">
            <input 
              type="text" 
              placeholder="Search anime..." 
              className="h-full w-full rounded-md border border-surface-border bg-surface pl-4 pr-10 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          {userId ? (
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9 rounded-md border border-surface-border shadow-sm" } }} />
          ) : (
            <SignInButton mode="modal">
              <button className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]">
                Sign In
              </button>
            </SignInButton>
          )}

          {/* Mobile Hamburger Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
