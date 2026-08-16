import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
