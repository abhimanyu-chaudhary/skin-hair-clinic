import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "src/lib/global-settings.json");

export interface GlobalSettings {
  businessName: string;
  taxType: "VAT" | "GST" | "NONE";
  taxRate: number;
  currency: string;
  smsGateway: string;
  smsApiKey: string;
  smsSenderId: string;
  whatsappEnabled: boolean;
  telemedicineEnabled: boolean;
  abhaEnabled: boolean;
  citizenshipIdRequired: boolean;
  irdApprovedBilling: boolean;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  businessName: "Nepal Skin & Hair Clinic",
  taxType: "VAT",
  taxRate: 13,
  currency: "NPR",
  smsGateway: "Sparrow SMS",
  smsApiKey: "sparrow-sms-demo-key",
  smsSenderId: "SkinClinic",
  whatsappEnabled: true,
  telemedicineEnabled: true,
  abhaEnabled: false,
  citizenshipIdRequired: true,
  irdApprovedBilling: true,
};

export function getGlobalSettings(): GlobalSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Failed to read global settings:", err);
  }
  return DEFAULT_SETTINGS;
}

export function saveGlobalSettings(settings: Partial<GlobalSettings>): GlobalSettings {
  try {
    const current = getGlobalSettings();
    const updated = { ...current, ...settings };
    
    // Ensure parent directory exists
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Failed to save global settings:", err);
    throw new Error("Failed to write settings to storage");
  }
}
