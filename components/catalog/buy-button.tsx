// components/catalog/buy-button.tsx
// The Buy button. The rule lives here, in ONE place:
// - an affiliate link is "sponsored", a normal shop link is "nofollow",
// - both open in a new tab, and "noopener" protects our page,
// - a link that is not http(s) never becomes clickable (safeHttpUrl).
// A Server Component, so it can be used on any page.

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeHttpUrl } from "@/lib/format";

type Props = {
  /** offer.buy_url from the API. */
  url: string | null;
  /** offer.is_affiliate from the API. */
  isAffiliate: boolean;
  /** For example "Buy at Test Shop". */
  label: string;
  variant?: "default" | "outline";
  /**
   * The name of the part. Only screen readers read it. A guide has many Buy
   * buttons, and this makes every link name different:
   * "Buy at Test Shop for Ryzen 7 (opens in a new tab)".
   */
  partName?: string;
};

export function BuyButton({
  url,
  isAffiliate,
  label,
  variant = "default",
  partName,
}: Props) {
  const href = safeHttpUrl(url);

  if (href === null) {
    return <span className="text-sm text-muted-foreground">No link yet</span>;
  }

  return (
    <Button asChild variant={variant}>
      <a
        href={href}
        target="_blank"
        rel={isAffiliate ? "sponsored noopener" : "nofollow noopener"}
      >
        {label}
        {partName && <span className="sr-only"> for {partName}</span>}
        <ExternalLink aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  );
}
