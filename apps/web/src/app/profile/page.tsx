import { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile & Preferences | V-Anime Revived",
  description: "Manage your streaming preferences, default servers, audio settings, and view your anime stats.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
