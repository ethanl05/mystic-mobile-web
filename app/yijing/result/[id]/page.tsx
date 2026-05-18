import { YijingResultView } from "@/features/yijing/components/yijing-result-view";

export default async function YijingResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <YijingResultView castId={id} />;
}
