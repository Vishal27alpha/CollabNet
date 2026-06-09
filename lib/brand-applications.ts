import { BrandApplication } from "@/lib/types";

const BRAND_APPLICATIONS_KEY = "collabnet:brand-applications";
export const BRAND_APPLICATIONS_EVENT = "collabnet:brand-applications-updated";

const isBrowser = () => typeof window !== "undefined";

type BrandApplicationsMap = Record<string, BrandApplication[]>;

const readStore = (): BrandApplicationsMap => {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(BRAND_APPLICATIONS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Failed to load brand applications:", error);
    return {};
  }
};

const writeStore = (store: BrandApplicationsMap) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(BRAND_APPLICATIONS_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(BRAND_APPLICATIONS_EVENT));
};

const toMillis = (value: BrandApplication["createdAt"]) => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return value.seconds * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getBrandApplications = (brandId: string): BrandApplication[] => {
  const store = readStore();
  const applications = store[brandId] || [];

  return [...applications].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
};

export const hasCreatorAppliedToBrand = (brandId: string, creatorId: string) =>
  getBrandApplications(brandId).some((application) => application.creatorId === creatorId);

export const saveBrandApplication = (brandId: string, application: BrandApplication) => {
  const store = readStore();
  const existing = store[brandId] || [];
  const filtered = existing.filter((item) => item.creatorId !== application.creatorId);
  store[brandId] = [application, ...filtered].sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );
  writeStore(store);
};
