import type { Metadata } from "next";

export const metadata: Metadata = { title: "GameVerse Developers", description: "بوابة مطوري الألعاب في GameVerse" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
