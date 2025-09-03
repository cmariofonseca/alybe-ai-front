import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alybe AI",
  description: "Asistente de voz impulsado por IA",
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
