import { comboKey } from "./normalize";

/**
 * Static device-type map.
 *
 * The 800 rows reduce to 53 canonical manufacturer|model combinations, so we
 * classify each combination exactly once (curated, deterministic, auditable)
 * rather than guessing per row. Keys are produced by comboKey() = canonical
 * manufacturer + "|" + uppercased model.
 */
export const DEVICE_TYPE_MAP: Record<string, string> = {
  // Infusion pumps
  "Hospira|PLUMA+": "Infusion Pump",
  "Baxter Healthcare Corp.|SPECTRUM IQ": "Infusion Pump",

  // ZOLL resuscitation
  "ZOLL Medical|R SERIES ALS": "Defibrillator/Monitor",
  "ZOLL Medical|RSERIES": "Defibrillator/Monitor",
  "ZOLL Medical|R SERIES": "Defibrillator/Monitor",
  "ZOLL Medical|R SERIES PLUS": "Defibrillator/Monitor",
  "ZOLL Medical|M SERIES": "Defibrillator/Monitor",
  "ZOLL Medical|X SERIES": "Defibrillator/Monitor",
  "ZOLL Medical|PROPAQ MD": "Defibrillator/Monitor",
  "ZOLL Medical|AEDPLUS": "AED (Defibrillator)",

  // Patient monitors / modules
  "GE Healthcare|PATIENT DATA MODULE (PDM)": "Patient Monitor",
  "GE Healthcare|APEX PRO CH": "Telemetry Transmitter",
  "Philips|INTELLIVUE MP50": "Patient Monitor",
  "Philips|INTELLIVUE MP30": "Patient Monitor",
  "Philips|INTELLIVUE MP20": "Patient Monitor",
  "Philips|INTELLIVUE MX40": "Patient Monitor",
  "Philips|MX500": "Patient Monitor",
  "Philips|M3002A": "Patient Monitor",
  "Edan Instruments|IT20": "Patient Monitor",
  "Edan Instruments|IM70": "Patient Monitor",
  "Edan Instruments|IM50": "Patient Monitor",
  "Edan Instruments|IM3": "Patient Monitor",
  "Edan Instruments|ELITEV5": "Patient Monitor",
  "Mindray|EPM12MA": "Patient Monitor",
  "Mindray|BENEVISION N15": "Patient Monitor",

  // Edan specialty
  "Edan Instruments|F9EXPRESS": "Fetal Monitor",
  "Edan Instruments|SE1200EXPRESS": "Electrocardiograph (ECG)",

  // Hospital beds / stretchers
  "Hillrom|P1440": "Hospital Bed",
  "Hillrom|P3200": "Hospital Bed",
  "Hillrom|CENTURY": "Hospital Bed",
  "Hillrom|CENTURYP1400": "Hospital Bed",
  "Hillrom|PCENTURYK3256": "Hospital Bed",
  "LINET|ELEGANZA 3": "Hospital Bed",
  "LINET|ELEGANZA 4": "Hospital Bed",
  "Stryker|1115": "Stretcher",
  "Stryker|1061": "Stretcher",

  // Thermometry / vitals
  "Welch Allyn|FILAC3000": "Thermometer",
  "Welch Allyn|SURETEMPPLUS": "Thermometer",
  "Exergen|TAT5000": "Thermometer",
  "Welch Allyn|SPOT VITAL SIGNS": "Vital Signs Monitor",
  "Masimo|RAD8": "Pulse Oximeter",
  "American Diagnostic|CE 1434": "Blood Pressure Monitor",

  // Surgical / endoscopy
  "Olympus|CV190": "Endoscopy",
  "Cogentix Medical|CST-4000": "Endoscopy",
  "Cogentix Medical|CST-5000": "Endoscopy",
  "Covidien|RAPIDVAC": "Surgical Smoke Evacuator",
  "Jiangmen Dacheng Medical Equipment Co.|IOB-507": "Surgical Table",
  "Arjo Inc.|FLOWTRON": "Compression Therapy",

  // Lab / sterilization
  "BIOSONIC|UC95": "Ultrasonic Cleaner",
  "BIOSONIC|UC95D15": "Ultrasonic Cleaner",
  "Thermo Scientific|SMARTVUE915": "Environmental Monitor",
  "Unico|G380PL LED": "Microscope",
  "Lab Corp.|642E": "Laboratory Equipment",
};

export const UNKNOWN_DEVICE_TYPE = "Unknown";

export function lookupDeviceType(manufacturer: string, model: string): string {
  return DEVICE_TYPE_MAP[comboKey(manufacturer, model)] ?? UNKNOWN_DEVICE_TYPE;
}
