import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";

const roboto = Roboto({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "W1 Router Dashboard",
  description: "W1 Router — Единый шлюз для LLM",
  icons: { icon: "./favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={roboto.className}>
        <ReactQueryProvider>
          <AntdGlobalProvider>{children}</AntdGlobalProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
