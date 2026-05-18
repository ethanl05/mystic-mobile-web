import { BaziResultView } from "@/features/bazi/components/bazi-result-view";

export default async function BaziResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BaziResultView profileId={id} />;
}
