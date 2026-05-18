import { BirthInfoForm } from "@/features/bazi/components/birth-info-form";

export default function BaziPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-black">八字排盘</h1>
      </header>
      <BirthInfoForm />
    </div>
  );
}
