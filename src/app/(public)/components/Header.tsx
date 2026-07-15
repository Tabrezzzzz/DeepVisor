import Link from "next/link";
import type { FC } from "react";
import { Container } from "@/components/marketing";

const navItems = [
  { label: "Overview", href: "/#top" },
  { label: "Features", href: "/features" },
  { label: "Dashboard", href: "/dashboard" },
];

const Header: FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f4f4f1]/95 backdrop-blur-xl">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 text-black">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fd4b23] text-sm font-black text-white">
            D
          </span>
          <span className="text-sm font-black tracking-[-0.02em]">DeepVisor</span>
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.18em] text-black/55 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[#fd4b23]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden min-h-11 items-center rounded-lg px-3 text-xs font-black uppercase tracking-[0.16em] text-black/60 transition hover:text-[#fd4b23] sm:inline-flex">
            Log in
          </Link>
          <Link href="/sign-up" className="inline-flex min-h-11 items-center rounded-lg bg-[#fd4b23] px-5 text-sm font-black text-white">
            Start free test
          </Link>
        </div>
      </Container>
    </header>
  );
};

export default Header;
