import { useEffect, useState } from "react";
import { loadPets, type PetData } from "../lib/pets";

export function usePets() {
  const [pets, setPets] = useState<PetData | null>(null);

  useEffect(() => {
    let alive = true;
    loadPets().then((d) => alive && setPets(d));
    return () => {
      alive = false;
    };
  }, []);

  return pets;
}
