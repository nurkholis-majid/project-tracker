import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Tracker",
  description: "Epic, story, release, dan dokumennya — dalam satu tempat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
