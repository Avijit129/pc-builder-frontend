import { buildSpecSections } from "@/lib/detail-specs";
import { cn } from "@/lib/utils";
import type { Specs } from "@/lib/types";

type Props = {
  /** component.specs from the API. */
  specs: Specs;
};

// The "Specifications" part of a component page: one small table per group
// (Clock speeds, Memory, ...). It is a Server Component, so the specs are in
// the HTML that search engines read. The labels and units come from
// lib/detail-specs.ts.
export function SpecTables({ specs }: Props) {
  const sections = buildSpecSections(specs);

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="text-2xl font-semibold tracking-tight">
        Specifications
      </h2>

      {sections.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No specifications have been added for this part yet.
        </p>
      ) : (
        // items-start: a short table does not stretch to the height of its neighbor.
        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.key} className="rounded-xl border bg-card">
              <h3
                id={`specs-${section.key}`}
                className="border-b px-4 py-3 font-medium"
              >
                {section.title}
              </h3>

              <table
                aria-labelledby={`specs-${section.key}`}
                className="w-full text-sm"
              >
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.key} className="border-b last:border-b-0">
                      <th
                        scope="row"
                        className="w-1/2 px-4 py-2 text-left align-top font-normal text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      <td
                        className={cn(
                          "px-4 py-2 text-right align-top break-words",
                          !row.known && "text-muted-foreground",
                        )}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
