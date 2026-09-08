"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { campaigns, toCatalogItem, type CatalogItem } from "@/lib/campaigns";

const seedCatalog = campaigns.map(toCatalogItem);

export function useCatalog() {
  const pathname = usePathname();
  const [items, setItems] = useState<CatalogItem[]>(seedCatalog);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((response) => response.json())
      .then((json: { campaigns?: CatalogItem[] }) => {
        if (json.campaigns?.length) setItems(json.campaigns);
      })
      .catch(() => undefined);
  }, [pathname]);

  return items;
}
