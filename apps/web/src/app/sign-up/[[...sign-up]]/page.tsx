import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background py-12">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
