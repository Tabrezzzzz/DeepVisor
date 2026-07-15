import Link from "next/link";
import type { FC } from "react";
import { Container } from "@/components/marketing";

const Footer: FC = () => {
  return (
    <footer className="border-t border-black/10 bg-[#f4f4f1] text-black/58">
      <Container className="flex flex-col gap-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-xs font-black text-white">
            D
          </span>
          <div>
            <p className="font-black tracking-[0.16em] text-black">DeepVisor</p>
            <p className="mt-1 text-[11px]">© {new Date().getFullYear()} DeepVisor. All rights reserved.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 text-[11px] font-black uppercase tracking-[0.18em]">
          <Link href="/features" className="transition hover:text-[#fd4b23]">Features</Link>
          <Link href="/login" className="transition hover:text-[#fd4b23]">Login</Link>
          <Link href="/sign-up" className="transition hover:text-[#fd4b23]">Sign up</Link>
          <Link href="/privacy" className="transition hover:text-[#fd4b23]">Privacy</Link>
          <Link href="/terms-of-service" className="transition hover:text-[#fd4b23]">Terms</Link>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
