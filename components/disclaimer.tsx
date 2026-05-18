import { STANDARD_DISCLAIMER } from "@/lib/safety/disclaimers";

export function Disclaimer() {
  return <p className="rounded-lg border border-[#ddd2c0] bg-white/70 p-3 text-xs leading-5 text-[#756a5d]">{STANDARD_DISCLAIMER}</p>;
}
