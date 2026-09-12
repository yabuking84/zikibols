"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { CatalogItem } from "@/lib/campaigns";

export function useCatalog() {
  const pathname = usePathname();
  const [items, setItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((response) => response.json())
      .then((json: { campaigns?: CatalogItem[] }) => {
        if (Array.isArray(json.campaigns)) setItems(json.campaigns);
      })
      .catch(() => undefined);
  }, [pathname]);

  return items;
}
