import Papa from 'papaparse';
export const parseCsv = (text: string) =>
  Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;

