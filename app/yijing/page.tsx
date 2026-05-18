import { NumberInputForm } from "@/features/yijing/components/number-input-form";

export default function YijingPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">易经数字卦</h1>
        <p className="mt-2 text-sm leading-6 text-[#756a5d]">采用“第一个数为上卦、第二个数为下卦、第三个数为动爻”的固定规则。</p>
      </header>
      <NumberInputForm />
      <section className="panel p-4 text-sm leading-6 text-[#756a5d]">
        三不占：不诚不占、不义不占、不疑不占。涉及伤害、违法和医疗诊断的问题会被安全拦截。
      </section>
    </div>
  );
}
