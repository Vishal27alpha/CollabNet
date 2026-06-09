import { Brand } from "@/lib/types";
import { demoBrands } from "@/lib/demo-data";

export const mergeBrands = (brands: Brand[]) => {
  const sanitizedBrands = brands.filter((brand) => brand.name?.trim());
  const merged = [...sanitizedBrands];
  const existingNames = new Set(
    sanitizedBrands.map((brand) => brand.name?.trim().toLowerCase()).filter(Boolean)
  );

  demoBrands.forEach((brand) => {
    const normalizedName = brand.name?.trim().toLowerCase();
    if (!normalizedName || existingNames.has(normalizedName)) {
      return;
    }

    merged.push(brand);
  });

  return merged;
};

export const getRemainingDaysText = (brand: Brand, now: number) => {
  const explicitDays = Number(brand.campaignCloseInDays);
  if (Number.isFinite(explicitDays) && explicitDays > 0) {
    return `Campaign closes in: ${explicitDays} days`;
  }

  const rawDate = brand.campaignCloseDate;
  const closeDate =
    rawDate && typeof rawDate === "object" && "seconds" in rawDate
      ? new Date(rawDate.seconds * 1000)
      : rawDate
        ? new Date(rawDate)
        : null;

  if (!closeDate || Number.isNaN(closeDate.getTime())) {
    return "Campaign closes in: 25 days";
  }

  const daysLeft = Math.max(
    20,
    Math.ceil((closeDate.getTime() - now) / (1000 * 60 * 60 * 24))
  );
  return `Campaign closes in: ${daysLeft} days`;
};

export const getRemainingDaysBadge = (brand: Brand, now: number) => {
  const text = getRemainingDaysText(brand, now);
  const match = text.match(/(\d+)/);
  return match ? `${match[1]} days left` : "25 days left";
};

export const getCollaborationTags = (value?: string) =>
  (value || "paid, barter, affiliate, ambassador")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getLookingForTags = (value?: string) =>
  (value || "fitness creators, lifestyle creators")
    .split(/[,+]/)
    .map((item) => item.trim())
    .filter(Boolean);
