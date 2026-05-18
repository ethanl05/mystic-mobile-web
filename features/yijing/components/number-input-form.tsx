"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NumberInputForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setError("");
    setLoading(true);
    const numbers = [Number(formData.get("n1")), Number(formData.get("n2")), Number(formData.get("n3"))] as [number, number, number];
    const response = await fetch("/api/yijing/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numbers })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "起卦失败");
      return;
    }
    sessionStorage.setItem(`yijing:${data.castId}`, JSON.stringify({ numbers, result: data.result }));
    router.push(`/yijing/result/${data.castId}`);
  }

  return (
    <form action={submit} className="panel space-y-4 p-4">
      <p className="text-sm leading-6 text-[#756a5d]">请先静心片刻，认真想好你要问的问题，再输入三个自然浮现的数字。</p>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#756a5d]">第一个三位数</span>
          <input className="field text-center text-xl font-black" name="n1" type="number" inputMode="numeric" min={100} max={999} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#756a5d]">第二个三位数</span>
          <input className="field text-center text-xl font-black" name="n2" type="number" inputMode="numeric" min={100} max={999} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-[#756a5d]">第三个三位数</span>
          <input className="field text-center text-xl font-black" name="n3" type="number" inputMode="numeric" min={100} max={999} required />
        </label>
      </div>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button className="button-primary w-full" disabled={loading}>{loading ? "起卦中..." : "生成卦象"}</button>
    </form>
  );
}
