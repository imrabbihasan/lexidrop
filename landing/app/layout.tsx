import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexiDrop | Master Chinese and English Context Instantly",
  description: "The AI side-panel dictionary built for Bengali students. Get translations, grammar guides, and quizzes without leaving your tab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
