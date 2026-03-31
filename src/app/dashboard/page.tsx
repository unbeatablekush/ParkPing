import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-3xl" />}>
        <DashboardContent tab={searchParams.tab || "overview"} />
      </Suspense>
    </div>
  );
}
