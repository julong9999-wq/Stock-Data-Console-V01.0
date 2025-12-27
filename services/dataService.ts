import { LogEntry, SyncJob } from '../types';

// Declare PapaParse as it is loaded from CDN
declare const Papa: any;

/**
 * Fetches and parses a CSV from a public Google Sheet URL.
 */
export const fetchAndParseCSV = async (url: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
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
      throw new Error("Source data is empty");
    }
    
    // Get the latest date from Source
    // Assuming the last row is the latest, or we find the distinct dates in the source
    const lastSourceRow = sourceData[sourceData.length - 1];
    const sourceDate = lastSourceRow[job.targetDateColumn];
    
    log(`[${job.name}] 來源資料日期: ${sourceDate || '未知'} (共 ${sourceData.length} 筆)`, 'info');

    if (!sourceDate) {
       throw new Error(`Cannot find date column: ${job.targetDateColumn}`);
    }

    log(`[${job.name}] 正在比對存檔資料...`, 'info');
    const destData = await fetchAndParseCSV(job.destinationUrl);
    
    // Check if the sourceDate already exists in destData
    const alreadyExists = destData.some((row: any) => row[job.targetDateColumn] === sourceDate);

    if (alreadyExists) {
      log(`[${job.name}] 資料已存在 (${sourceDate})，無須更新。`, 'warning');
      return null; 
    } else {
      log(`[${job.name}] 發現新資料 (${sourceDate})，準備寫入...`, 'success');
      // In a real scenario, we might want to filter *only* the new rows
      // For this specific requirement, we take the source and append it.
      return sourceData; 
    }

  } catch (err: any) {
    log(`[${job.name}] 錯誤: ${err.message || 'Network Error'}`, 'error');
    throw err;
  }
};