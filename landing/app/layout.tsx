import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexiDrop | Understand Foreign Text Instantly",
  description:
    "LexiDrop is a browser extension for Bengali speakers that translates, explains, and helps you retain Chinese and English content without leaving the page.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
