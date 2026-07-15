import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";


export const metadata: Metadata = {
  title: "DeepVisor - AI Performance Marketing Command Center",
  description:
    "DeepVisor helps marketing teams monitor paid ad performance, detect wasted spend, track ROAS, CPL, CAC, lead quality, reports, and approval-ready next actions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
