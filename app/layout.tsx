import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SESÉ Recebimentos",
  description: "Gestão operacional de recebimentos, filas, divergências e desempenho.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
