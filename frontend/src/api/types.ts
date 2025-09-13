export interface ScanResult {
  message: string;
  scan_id: string;
  risk_score: number;
  categories: { [key: string]: number };
  critical_items: string[];
  permissions: string[];
} 