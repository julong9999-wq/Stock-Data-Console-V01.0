import { LogEntry, SyncJob } from '../types';

// Declare PapaParse as it is loaded from CDN
declare const Papa: any;

/**
 * Helper: Parse CSV String using PapaParse
 */
const parseCSVString = (csvString: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!csvString) {
      resolve([]);
      return;
    }

    // Advanced Validation: Check for HTML tags which indicate a login wall or error page
    const trimmed = csvString.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.indexOf('<body') !== -1) {
      reject(new Error("讀取到的是 HTML 網頁而非 CSV。原因可能是：1. 試算表未「發布到網路」 2. Google 暫時封鎖了此代理路徑 3. 需要登入權限"));
      return;
    }

    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data) {
          resolve(results.data);
        } else {
          resolve([]);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

/**
 * Helper: Attempt to fetch from a URL with a timeout
 */
const fetchWithTimeout = async (url: string, timeout = 25000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Fetches and parses a CSV from a public Google Sheet URL.
 * Implements a 4-Layer "Aggressive" Fallback Strategy.
 */
export const fetchAndParseCSV = async (url: string): Promise<any[]> => {
  const timestamp = new Date().getTime();
  // Simply append timestamp. Do not use src param which caused 404s.
  const char = url.includes('?') ? '&' : '?';
  const urlWithTime = `${url}${char}_t=${timestamp}`;
  
  const errors: string[] = [];

  // --- STRATEGY 1: CodeTabs Proxy (Often most reliable for raw text) ---
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlWithTime)}`;
    const response = await fetchWithTimeout(proxyUrl, 25000);
    if (response.ok) {
      const text = await response.text();
      return await parseCSVString(text);
    }
    errors.push(`CodeTabs: ${response.status}`);
  } catch (e: any) {
    console.warn("Strategy 1 (CodeTabs) failed", e);
    errors.push(`CodeTabs: ${e.message}`);
  }

  // --- STRATEGY 2: AllOrigins (JSON Mode) ---
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlWithTime)}`;
    const response = await fetchWithTimeout(proxyUrl, 25000);
    if (response.ok) {
      const json = await response.json();
      if (json.contents) {
        return await parseCSVString(json.contents);
      }
    }
    errors.push(`AllOrigins: ${response.status}`);
  } catch (e: any) {
    console.warn("Strategy 2 (AllOrigins) failed", e);
    errors.push(`AllOrigins: ${e.message}`);
  }

  // --- STRATEGY 3: CorsProxy.io ---
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlWithTime)}`;
    const response = await fetchWithTimeout(proxyUrl, 15000);
    if (response.ok) {
      const text = await response.text();
      return await parseCSVString(text);
    }
    errors.push(`CorsProxy: ${response.status}`);
  } catch (e: any) {
    console.warn("Strategy 3 (CorsProxy) failed", e);
    errors.push(`CorsProxy: ${e.message}`);
  }

  // --- STRATEGY 4: Direct Fetch ---
  try {
    const response = await fetchWithTimeout(urlWithTime, 5000);
    if (response.ok) {
      const text = await response.text();
      return await parseCSVString(text);
    }
  } catch (e: any) {
    errors.push(`Direct: ${e.message}`);
  }

  // If all failed, throw a comprehensive error
  throw new Error(`無法讀取資料。已嘗試 4 種連線路徑皆失敗。\n最後錯誤: ${errors[errors.length - 1]}`);
};

/**
 * Simulate the "Write" operation.
 */
export const simulateWriteToSheet = async (data: any[], job: SyncJob): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Success: Appended ${data.length} new rows to ${job.name}`);
    }, 1500);
  });
};

/**
 * Main Logic: Compares source data with destination data.
 */
export const analyzeDataSync = async (
  job: SyncJob,
  log: (msg: string, type: LogEntry['type']) => void
): Promise<any[] | null> => {
  
  try {
    log(`[${job.name}] 正在讀取來源資料...`, 'info');
    const sourceData = await fetchAndParseCSV(job.sourceUrl);
    
    if (!sourceData || sourceData.length === 0) {
      throw new Error("來源資料為空 (0筆)");
    }
    
    // Get the latest date from Source
    const lastSourceRow = sourceData[sourceData.length - 1];
    const sourceDate = lastSourceRow[job.targetDateColumn];
    
    if (!sourceDate) {
       const keys = Object.keys(lastSourceRow).join(', ');
       throw new Error(`找不到日期欄位: '${job.targetDateColumn}'。可用欄位: ${keys}`);
    }

    log(`[${job.name}] 來源日期: ${sourceDate} (共 ${sourceData.length} 筆)`, 'info');

    log(`[${job.name}] 正在比對存檔資料...`, 'info');
    const destData = await fetchAndParseCSV(job.destinationUrl);
    
    const alreadyExists = destData.some((row: any) => row[job.targetDateColumn] === sourceDate);

    if (alreadyExists) {
      log(`[${job.name}] 資料已存在 (${sourceDate})，無須更新。`, 'warning');
      return null; 
    } else {
      log(`[${job.name}] 發現新資料 (${sourceDate})，準備寫入...`, 'success');
      return sourceData; 
    }

  } catch (err: any) {
    const errorMsg = err.message || '未知連線錯誤';
    log(`[${job.name}] 錯誤: ${errorMsg}`, 'error');
    throw err;
  }
};