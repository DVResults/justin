import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leadfinder – Automotive Lead-Recherche",
  description:
    "Legale Lead-Recherche für die Automotive-Branche: Handelsregister (OpenCorporates) + Impressum (§ 5 DDG). Geschäftsführer, Telefon, E-Mail, Website & CSV-Export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
