import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";

const roboto = localFont({
  src: [
    { path: "../../node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/roboto/files/roboto-cyrillic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/roboto/files/roboto-cyrillic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/roboto/files/roboto-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/roboto/files/roboto-cyrillic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "W1 Router Dashboard",
  description: "W1 Router — LLM Gateway",
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
