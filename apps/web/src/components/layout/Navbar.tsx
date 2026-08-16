import { UserButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MobileMenu } from "./MobileMenu";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const { userId } = await auth();

  const authSlot = userId ? (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8 rounded-md border border-surface-border shadow-sm",
        },
      }}
    />
  ) : (
    <SignInButton mode="modal">
      <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]">
        Sign In
      </button>
    </SignInButton>
  );

  return (
    <NavbarClient
      authSlot={authSlot}
      mobileMenuSlot={<MobileMenu />}
    />
  );
}

