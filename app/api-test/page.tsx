// TEMPORARY test page. Delete the whole app/api-test folder after it works.
import { Suspense } from "react";
import { apiGet } from "@/lib/api";
import type { CpuListItem, Paginated } from "@/lib/types";

async function CpuNames() {
  const cpus = await apiGet<Paginated<CpuListItem>>("/cpus", { per_page: 3 });

  return (
    <pre className="rounded bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
      {JSON.stringify(
        { total: cpus.meta.total, names: cpus.data.map((cpu) => cpu.name) },
        null,
        2,
      )}
    </pre>
  );
}

export default function ApiTestPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">API test</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <CpuNames />
      </Suspense>
    </main>
  );
}
