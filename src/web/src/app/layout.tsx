import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SearchProvider } from "./contexts/SearchContext";
import { PostsProvider } from "./contexts/PostsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIChat from "./components/AIChat";

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'block', // Changed from 'swap' to 'block' for better font loading
  preload: true,
});

const notoSansThai = Noto_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: 'block', // Changed from 'swap' to 'block' for better font loading
  preload: true,
});

export const metadata: Metadata = {
  title: "สิทธิของเรา ผลประโยชน์ของเรา | The GLOBE",
  description: "ค้นพบสิทธิประโยชน์ สวัสดิการ และบริการภาครัฐที่จำเป็นซึ่งออกแบบมาเพื่อสนับสนุนคุณ",
  icons: {
    icon: '/theglobe-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body
        className={`${inter.variable} ${notoSansThai.variable} font-sans antialiased min-h-full flex flex-col`}
        style={{ fontFamily: 'var(--font-noto-sans-thai), var(--font-inter), sans-serif' }}
      >
        <LanguageProvider>
          <SearchProvider>
            <PostsProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <AIChat />
            </PostsProvider>
          </SearchProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
