import type { Metadata } from "next";
import Script from "next/script";
import "@mantine/core/styles.css";
import { MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import { Manrope, Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import PendingAuthToast from "@/components/ui/toasts/PendingAuthToast";
import FirstSyncTracker from "@/components/integrations/FirstSyncTracker";
import "../globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "DeepVisor - AI Performance Marketing Command Center",
  description: "Monitor paid ad performance, detect wasted spend, track ROAS, CPL, CAC, lead quality, reports, and approval-ready next actions.",
};

const theme = createTheme({
  primaryColor: "deepOrange",
  colors: {
    deepOrange: [
      "#fff0ec",
      "#ffded6",
      "#ffbaa8",
      "#ff9477",
      "#ff724f",
      "#fd4b23",
      "#e63d19",
      "#c53012",
      "#a3270f",
      "#7f1f0e",
    ],
  },
  fontFamily: "var(--font-body)",
  headings: {
    fontFamily: "var(--font-display)",
    fontWeight: "800",
  },
  defaultRadius: "md",
});

const themeBootstrap = `
try {
  var stored = localStorage.getItem('deepvisor-theme');
  var theme = stored === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.mantineColorScheme = theme;
} catch (_) {
  document.documentElement.classList.remove('dark');
  document.documentElement.dataset.mantineColorScheme = 'light';
}
`;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <Script
          id="deepvisor-theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Toaster />
          <PendingAuthToast />
          <FirstSyncTracker />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
};
