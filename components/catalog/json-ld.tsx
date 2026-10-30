type Props = {
  /** One JSON-LD object, for example one item of seo.structured_data. */
  data: Record<string, unknown>;
};

// Prints <script type="application/ld+json">. Search engines read it to show
// price and breadcrumbs in the results.
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // "<" is replaced so text that comes from the database can never close
      // the script tag early (this is the standard way to do it in Next.js).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
