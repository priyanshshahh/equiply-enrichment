export type RawRow = {
  manufacturer: string;
  model: string;
  serial_number: string;
};

export type DateConfidence = "High" | "Medium" | "Low" | "None";

export type DateSource =
  | "serial_rule"
  | "not_encoded"
  | "unrecognized"
  | "openai";

export type DeviceTypeSource = "static_map" | "openai";

export type CapitalStatus =
  | "End of Life (Replace)"
  | "Review"
  | "Active"
  | "Unknown";

export type DecodedDate = {
  /** ISO date string (YYYY-MM-DD) or null when no date could be derived */
  date: string | null;
  /** Calendar year, if known */
  year: number | null;
  /** 1-12 month, if known */
  month: number | null;
  confidence: DateConfidence;
  source: DateSource;
  /** Human-readable note describing how the value was derived (auditability) */
  method: string;
};

export type EnrichedRow = {
  manufacturer: string;
  model: string;
  serial_number: string;
  manufactured_date: string | null;
  /** Human-friendly date honoring known precision ("May 2018", "2018", "—") */
  manufactured_display: string;
  device_type: string;
  device_type_source: DeviceTypeSource;
  equipment_age_years: number | null;
  capital_status: CapitalStatus;
  date_confidence: DateConfidence;
  date_source: DateSource;
  date_method: string;
};
