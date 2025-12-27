import { LogEntry, SyncJob } from '../types';

// Declare PapaParse as it is loaded from CDN
declare const Papa: any;

/**
 * Helper: Parse CSV String using PapaParse
 */
const parseCSVString = (csvString: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length > 0) {
          resolve(results.data);
        } else {
          resolve([]); // Return empty array instead of failing hard, logic will handle empty later
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

/**
 * Fetches and parses a CSV from a public Google Sheet URL.
 * Includes CORS handling and Cache-Busting.
 */
export const fetchAndParseCSV = async (url: string): Promise<any[]> => {
  // 1. Add timestamp to prevent mobile browser caching
  const timestamp = new Date().getTime();
  const urlWithCacheBuster = url.includes('?') 
    ? `${url}&_t=${timestamp}` 
    : `${url}?_t=${timestamp}`;

  try {
    // Attempt 1: Direct Fetch
    // Note: This often fails on mobile due to CORS if the sheet isn't perfectly public
    const response = await fetch(urlWithCacheBuster, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' }
    });
    
    if (!response.ok) {
      throw new Error(`Direct Access Error (${response.status})`);
    }
    
    const csvText = await response.text();
    return await parseCSVString(csvText);

  } catch (directError) {
    console.warn("Direct fetch failed (likely CORS), switching to Proxy...", directError);

    try {
      // Attempt 2: Use a Public CORS Proxy (api.allorigins.win)
      // This routes the request through a server that adds the correct headers
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlWithCacheBuster)}`;
      
      const proxyResponse = await fetch(proxyUrl);
      if (!proxyResponse.ok) {
        throw new Error(`Proxy Error (${proxyResponse.status})`);
      }

      const proxyCsvText = await proxyResponse.text();
      return await parseCSVString(proxyCsvText);

    } catch (proxyError: any) {
      console.error("All fetch attempts failed", proxyError);
      throw new Error(`連線失敗 (CORS/Network): 請檢查網路或連結權限`);
    }
  }
};

/**
 * Simulate the "Write" operation.
 * NOTE: In a real environment, this would call a Google Apps Script Web App
 * or use the Google Sheets API with OAuth.
 */
export const simulateWriteToSheet = async (data: any[], job: SyncJob): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Success: Appended ${data.length} new rows to ${job.name}`);
    }, 1500); // Simulate network delay
  });
};

/**
 * Main Logic: Compares source data with destination data.
 * Returns null if up to date, or the data that needs to be appended.
 */
export const analyzeDataSync = async (
  job: SyncJob,
  log: (msg: string, type: LogEntry['type']) => void
): Promise<any[] | null> => {
  
  try {
    log(`[${job.name}] 正在讀取來源資料...`, 'info');
    const sourceData = await fetchAndParseCSV(job.sourceUrl);
    
    if (!sourceData || sourceData.length === 0) {
      throw new Error("來源資料為空或無法讀取");
    }
    
    // Get the latest date from Source
    const lastSourceRow = sourceData[sourceData.length - 1];
    const sourceDate = lastSourceRow[job.targetDateColumn];
    
    if (!sourceDate) {
       // Log available keys to help debugging
       const keys = Object.keys(lastSourceRow).join(', ');
       throw new Error(`找不到日期欄位: '${job.targetDateColumn}'。可用欄位: ${keys}`);
    }

    log(`[${job.name}] 來源日期: ${sourceDate} (共 ${sourceData.length} 筆)`, 'info');

    log(`[${job.name}] 正在比對存檔資料...`, 'info');
    const destData = await fetchAndParseCSV(job.destinationUrl);
    
    // Check if the sourceDate already exists in destData
    const alreadyExists = destData.some((row: any) => row[job.targetDateColumn] === sourceDate);

    if (alreadyExists) {
      log(`[${job.name}] 資料已存在 (${sourceDate})，無須更新。`, 'warning');
      return null; 
    } else {
      log(`[${job.name}] 發現新資料 (${sourceDate})，準備寫入...`, 'success');
      return sourceData; 
    }

  } catch (err: any) {
    // Clean up the error message for the UI
    const errorMsg = err.message || '未知連線錯誤';
    log(`[${job.name}] 錯誤: ${errorMsg}`, 'error');
    throw err;
  }
};