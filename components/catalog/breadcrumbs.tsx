import Link from "next/link";
import type { Seo } from "@/lib/types";

type Props = {
  /** Use seo.breadcrumbs from the API. The last item is the current page. */
  items: Seo["breadcrumbs"];
};

export function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}

              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-foreground">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
