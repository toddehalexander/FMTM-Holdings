import { Holding } from '../types';

export const parseHoldingsCSV = (csvText: string): Holding[] => {
  // CRITICAL: Strip Byte Order Mark (BOM) if present (common in Excel exports)
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/);
  const holdings: Holding[] = [];
  
  // Find header line
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].toLowerCase();
    // The user's file has "Ticker" and "Portfolio Weight"
    if (line.includes('ticker') && (line.includes('weight') || line.includes('portfolio weight'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.warn("Could not find standard header. Attempting default parse.");
    headerIndex = 0;
  }

  // Identify column indices from header
  const headerLine = lines[headerIndex].toLowerCase();
  // Split header using regex for CSV to be safe, though headers usually simple
  const headers = headerLine.split(',').map(h => h.trim().replace(/['"]+/g, ''));
  
  const tickerIdx = headers.findIndex(h => h === 'ticker');
  const weightIdx = headers.findIndex(h => h.includes('weight'));
  const nameIdx = headers.findIndex(h => h === 'description' || h === 'name' || h === 'security name');

  // Helper to split CSV line respecting quotes
  const clean = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : '';

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Use regex to split by comma ONLY if not inside quotes
    // This handles "179,412" in Quantity column correctly
    const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(clean);

    // If we found headers, use indices, else guess
    let ticker = '';
    let name = 'Unknown';
    let weightStr = '';

    if (tickerIdx !== -1 && weightIdx !== -1) {
      ticker = row[tickerIdx];
      name = nameIdx !== -1 ? row[nameIdx] : name;
      weightStr = row[weightIdx];
    } else {
      // Fallback Logic
      ticker = row[0];
      name = row[1] || row[2]; // Description often 2nd or 3rd
      // Look for percent
      weightStr = row.find(c => c.includes('%') || c.match(/^-?\d+(\.\d+)?$/)) || '';
    }

    if (!ticker || !weightStr) continue;

    const weightVal = parseFloat(weightStr.replace('%', ''));
    
    // Normalize weight. If strict 'Portfolio Weight' is 4.07%, value is 4.07.
    holdings.push({
      ticker: ticker.toUpperCase(),
      name: name,
      weight: isNaN(weightVal) ? 0 : weightVal
    });
  }
  
  return holdings;
};