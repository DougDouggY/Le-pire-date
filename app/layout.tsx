import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Pire Date — Foxy",
  description: "Des rendez-vous à reconnaître, comprendre et parfois rattraper.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
