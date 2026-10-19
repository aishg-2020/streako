import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "@/components/providers/AntdProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creator OS",
  description: "Your AI-powered creator operating system",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isMock = process.env.MOCK_AUTH === 'true';

  const body = (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* The style registry seeds its cache with a random id, which Next's prerender treats as
            request-time work; the Suspense boundary lets it stream instead of blocking. */}
        <Suspense fallback={null}>
          <AntdRegistry>
            <AntdProvider>{children}</AntdProvider>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );

  if (isMock) return body;

  const { ClerkProvider } = await import('@clerk/nextjs');
  return <ClerkProvider>{body}</ClerkProvider>;
}
