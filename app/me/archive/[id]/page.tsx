import { ArchiveDetailPage } from "@/features/archive/archive-detail-page";

export default async function MeArchiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArchiveDetailPage archiveId={id} />;
}
