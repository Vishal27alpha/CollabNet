import { Brand } from "@/lib/types";

const SAVED_BRANDS_KEY = "collabnet:saved-brands";
export const SAVED_BRANDS_EVENT = "collabnet:saved-brands-updated";

const isBrowser = () => typeof window !== "undefined";

export const getSavedBrands = (): Brand[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(SAVED_BRANDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load saved brands:", error);
    return [];
  }
};

const setSavedBrands = (brands: Brand[]) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(SAVED_BRANDS_KEY, JSON.stringify(brands));
  window.dispatchEvent(new CustomEvent(SAVED_BRANDS_EVENT));
};

export const isBrandSaved = (brandId: string) =>
  getSavedBrands().some((brand) => brand.id === brandId);

export const toggleSavedBrand = (brand: Brand) => {
  const savedBrands = getSavedBrands();
  const exists = savedBrands.some((item) => item.id === brand.id);

  if (exists) {
    const updatedBrands = savedBrands.filter((item) => item.id !== brand.id);
    setSavedBrands(updatedBrands);
    return false;
  }

  const updatedBrands = [brand, ...savedBrands.filter((item) => item.id !== brand.id)];
  setSavedBrands(updatedBrands);
  return true;
};
