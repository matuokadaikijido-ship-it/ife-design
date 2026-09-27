"use client";

import { createContext, useContext, useEffect, useState } from "react";

const RegionContext = createContext({ region: "saudi", setRegion: () => {} });

export function RegionProvider({ children }) {
  const [region, setRegionState] = useState("saudi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("life-design-region");
      if (saved === "saudi" || saved === "japan") setRegionState(saved);
    } catch (e) {
      /* 無視 */
    }
  }, []);

  function setRegion(next) {
    setRegionState(next);
    try {
      localStorage.setItem("life-design-region", next);
    } catch (e) {
      /* 無視 */
    }
  }

  return <RegionContext.Provider value={{ region, setRegion }}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  return useContext(RegionContext);
}
