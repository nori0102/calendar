import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-screen-xl w-full mx-auto grid lg:grid-cols-2 gap-12 px-6 py-12">
        <div>
          <h1 className="mt-6 max-w-[17ch] text-4xl md:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold !leading-[1.2]">
            Customized Shadcn UI Blocks & Components
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg">
            Explore a collection of Shadcn UI blocks and components, ready to
            preview and copy. Streamline your development workflow with
            easy-to-implement examples.
          </p>
          <div className="mt-12 flex items-center justify-center gap-12">
            <Link href="/calendar">
              <Button size="lg" className="rounded-full text-base">
                今すぐつかってみる <ArrowUpRight className="!h-5 !w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-base shadow-none"
            >
              <CirclePlus className="!h-5 !w-5" /> アカウント作成
            </Button>
          </div>
        </div>
        <div className="relative w-full h-[320px] sm:h-[420px] md:h-[520px]">
          <Image
            src="/hero1.svg"
            alt="Hero Image"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
