import { SyncJob } from './types';

// The URLs provided by the user
const SOURCE_STOCK_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDMI5dE6tEegjsrdP-JTu0lOB43WW-Q9T0-OcASMGmLldv_VYh_O4AGY3vCOfGgxNsWqTfly205M_q/pub?output=csv';
const SOURCE_GLOBAL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNI4hC9iSm84tiDe17UHLA026pZZTt1mD--w7tLs42mRm1AlqVlitIbnVK8AvVxa7jBKqOgECebUrs/pub?output=csv';

// Destination Read-Only URLs (Used for checking if data exists)
const DEST_STOCK_202512 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vReBSP-zpv7b3EfuvB6gLBWzunvRDOdPq8dF3-IzyRbf-PfFFVT2FmmU-61Ir2FnbZ333YEIANEgaEj/pub?output=csv';
const DEST_STOCK_202601 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiZUayIYr401ZFL11PtZvgUzGTOq0YZiqsVK6QfaK987QEuFvT5H0_KlqeypnXLsTMid6VMKYvtGj9/pub?output=csv';
const DEST_STOCK_202602 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpBvDog35afkhsWzvFuyqGnG9pWub-zjb_y_DLp-G9QmdEzbJrvsmHOC4u3DnP7oW57jOvk-UWGAew/pub?output=csv';
const DEST_GLOBAL_202601 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0G86lVQoTnBoav9QQ7nAxJBrI4hsWbxtaXUIhTb9R7QeegeuvlMCrM6akCBOgdHmUYI2m4EtoCSB9/pub?output=csv';

export const JOBS: SyncJob[] = [
  {
    id: 'job-stock-202512',
    name: '每日股價 (2025/12)',
    description: 'B002_202512 當月收集',
    sourceUrl: SOURCE_STOCK_URL,
    destinationUrl: DEST_STOCK_202512,
    targetDateColumn: '日期',
    type: 'STOCK',
    scheduleTime: '14:00'
  },
  {
    id: 'job-global-202601',
    name: '國際大盤 (Global)',
    description: 'B002_202601 台股/美股',
    sourceUrl: SOURCE_GLOBAL_URL,
    destinationUrl: DEST_GLOBAL_202601,
    targetDateColumn: '日期 tradetime',
    type: 'GLOBAL',
    scheduleTime: '14:00 & 06:00'
  }
  // 2026 每日股價尚未到來，暫時隱藏
  /*
  {
    id: 'job-stock-202601',
    name: '每日股價 (2026/01)',
    description: 'B002_202601 長期收集',
    sourceUrl: SOURCE_STOCK_URL,
    destinationUrl: DEST_STOCK_202601,
    targetDateColumn: '日期',
    type: 'STOCK',
    scheduleTime: '14:00'
  },
  {
    id: 'job-stock-202602',
    name: '每日股價 (2026/02)',
    description: 'B002_202602 長期收集',
    sourceUrl: SOURCE_STOCK_URL,
    destinationUrl: DEST_STOCK_202602,
    targetDateColumn: '日期',
    type: 'STOCK',
    scheduleTime: '14:00'
  },
  */
];