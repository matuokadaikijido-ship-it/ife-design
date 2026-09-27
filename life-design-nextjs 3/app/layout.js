import "./globals.css";
import Header from "@/components/Header";
import SpriteIcons from "@/components/SpriteIcons";
import { RegionProvider } from "@/components/RegionProvider";

export const metadata = {
  title: "Life Design",
  description: "サウジアラビアと日本、そして本日のアクションを一画面にまとめたパーソナル・ポータル。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F3" },
    { media: "(prefers-color-scheme: dark)", color: "#15171B" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <RegionProvider>
          <SpriteIcons />
          <div className="grain" aria-hidden="true" />
          <div className="shell">
            <Header />
            {children}
          </div>
        </RegionProvider>
      </body>
    </html>
  );
}
