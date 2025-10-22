import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "สิทธิของเรา ผลประโยชน์ของเรา | เดอะโกลบ",
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
    <html lang="th">
      <body
        className={`${inter.variable} ${notoSansThai.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-noto-sans-thai), var(--font-inter), sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
