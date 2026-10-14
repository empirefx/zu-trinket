import { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import { useData } from "./hooks/useData";
import { MapPage } from "./pages/MapPage";
import { GearPage } from "./pages/GearPage";
import { TopTabs } from "./components/ui/TopTabs";

type TabKey = "map" | "gear";

export default function App() {
  const { data, err } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [slug, setSlug] = useState<string>("");

  // Initialize slug to Holy City once
  useEffect(() => {
    if (data && !slug) {
      const holyCity = data.maps.find((m) => m.slug === "level01_00_wyc");
      setSlug(holyCity?.slug ?? data.maps[0]?.slug ?? "");
    }
  }, [data, slug]);

  const handleTabChange = (key: TabKey) => setActiveTab(key);

  if (err)
    return (
      <div className="flex h-screen w-screen items-center justify-center text-danger">
        Failed to load data: {err}
      </div>
    );
  if (!data)
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div id="app" className="flex h-screen w-screen overflow-hidden" data-testid="app">
      <TopTabs activeKey={activeTab} onChange={handleTabChange} />
      {activeTab === "map" && <MapPage data={data} slug={slug} setSlug={setSlug} isActive={true} />}
      {activeTab === "gear" && <GearPage />}
    </div>
  );
}