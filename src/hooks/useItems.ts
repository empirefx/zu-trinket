import { useEffect, useState } from "react";
import { loadItems, loadStar, loadSets, loadStones, type Item, type GearSet, type StarCurves, type Stone } from "../lib/items";

export function useItems() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadItems().then((d) => alive && setItems(d));
    return () => {
      alive = false;
    };
  }, []);

  return items;
}

export function useStar() {
  const [star, setStar] = useState<StarCurves | null>(null);

  useEffect(() => {
    let alive = true;
    loadStar().then((d) => alive && setStar(d));
    return () => {
      alive = false;
    };
  }, []);

  return star;
}

export function useSets() {
  const [sets, setSets] = useState<Record<string, GearSet> | null>(null);

  useEffect(() => {
    let alive = true;
    loadSets().then((d) => alive && setSets(d));
    return () => {
      alive = false;
    };
  }, []);

  return sets;
}
