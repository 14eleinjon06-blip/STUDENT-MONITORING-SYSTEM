
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Monitoring System",
  description: "Student attendance and monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

