export enum JobStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  CHECKING = 'CHECKING',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED' // Data already exists
}

export interface StockRow {
  '商品分類'?: string;
  '日期'?: string;
  [key: string]: any;
}

export interface GlobalMarketRow {
  '指數名稱'?: string;
  '日期 tradetime'?: string;
  [key: string]: any;
}

export interface SyncJob {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  destinationUrl: string; // In a real app, this would be a Sheet ID
  targetDateColumn: string; // The column name to check for duplicates (e.g., '日期')
  type: 'STOCK' | 'GLOBAL';
  scheduleTime?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  jobId?: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}