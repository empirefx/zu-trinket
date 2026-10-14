import { useEffect, useState } from "react";
import { loadData, type Data } from "../lib/data";

export function useData() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadData()
      .then((d) => setData(d))
      .catch((e) => setErr(String(e)));
  }, []);

  return { data, err };
}