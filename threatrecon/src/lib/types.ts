export type InputType = "name" | "email" | "phone" | "address" | "username";

export interface ScanInput {
  type: InputType;
  fullName?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  username?: string;
}

export interface CandidateRecord {
  site: string;
  url?: string;
  matchedAttribute: InputType;
  confidence: number; // 0-1
  reason: string;
  cacheHit?: boolean;
  soft?: boolean; // true when blocked/opt-out stub
  optOutUrl?: string;
}

export interface SiteAdapter {
  id: string; // domain or canonical id
  supportsInputTypes: InputType[];
  metadata: {
    robotsStatus: "allowed" | "disallowed" | "unknown";
    optOutUrl?: string;
    lastChecked: string; // ISO date
    mirrorOf?: string; // canonical if mirror
  };
  buildQueries: (
    input: ScanInput
  ) => Promise<Array<{ url: string; method?: "GET" | "POST"; body?: Record<string, string> }>>;
  parse: (
    html: string,
    url: string
  ) => Promise<
    Array<
      Omit<CandidateRecord, "site" | "matchedAttribute" | "confidence" | "reason"> & {
        title?: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        username?: string;
        url?: string;
      }
    >
  >;
  match: (
    candidate: any,
    input: ScanInput
  ) => { matched: boolean; matchedFields: InputType[]; reason: string; confidence: number };
}

export interface ScanResult {
  input: ScanInput;
  results: CandidateRecord[];
}
