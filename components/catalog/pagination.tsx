import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listHref, type ListParams } from "@/lib/list-params";

type Props = {
  segment: string;
  params: ListParams;
  currentPage: number;
  lastPage: number;
};

export function Pagination({ segment, params, currentPage, lastPage }: Props) {
  // One page (or none): no buttons needed.
  if (lastPage <= 1) return null;

  const prevHref =
    currentPage > 1 ? listHref(segment, params, currentPage - 1) : null;
  const nextHref =
    currentPage < lastPage ? listHref(segment, params, currentPage + 1) : null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between gap-4"
    >
      {prevHref ? (
        <Button asChild variant="outline">
          <Link href={prevHref} rel="prev">
            <ChevronLeft />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          <ChevronLeft />
          Previous
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {lastPage}
      </p>

      {nextHref ? (
        <Button asChild variant="outline">
          <Link href={nextHref} rel="next">
            Next
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Next
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
