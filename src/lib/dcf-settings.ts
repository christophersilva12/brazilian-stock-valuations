export type DcfPerpetuityMethod = "buffett" | "classic";

export interface DcfSettings {
  perpetuityMethod: DcfPerpetuityMethod;
}

export const DEFAULT_DCF_SETTINGS: DcfSettings = {
  perpetuityMethod: "buffett",
};

const STORAGE_KEY = "dcf-settings";

function isPerpetuityMethod(value: unknown): value is DcfPerpetuityMethod {
  return value === "buffett" || value === "classic";
}

export function loadDcfSettings(): DcfSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DCF_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<DcfSettings>;
    return {
      perpetuityMethod: isPerpetuityMethod(parsed.perpetuityMethod)
        ? parsed.perpetuityMethod
        : DEFAULT_DCF_SETTINGS.perpetuityMethod,
    };
  } catch {
    return { ...DEFAULT_DCF_SETTINGS };
  }
}

export function saveDcfSettings(settings: DcfSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
