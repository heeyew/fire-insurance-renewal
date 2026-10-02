import type { Metadata } from "next";
import "./globals.css";
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: "Fire Insurance Renewal Tracker",
  description: "Property values, renewal reminders and annual renewal history in one workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
