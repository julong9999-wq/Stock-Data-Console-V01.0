import React, { useState, useCallback, useEffect, useRef } from 'react';
import { JOBS } from './constants';
import { SyncJob, JobStatus, LogEntry } from './types';
import JobCard from './components/JobCard';
import FeasibilityModal from './components/FeasibilityModal';
import { analyzeDataSync, simulateWriteToSheet } from './services/dataService';
import { Activity, PlayCircle, Terminal, Info, CheckCheck, Power, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, Date>>({});
  
  // Auto-Run State
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [nextCheckTime, setNextCheckTime] = useState<string>('');
  
  // Ref to track if a job has already run for a specific time slot to avoid duplicate runs
  const executedSlotsRef = useRef<Record<string, string[]>>({}); // { jobId: ['14:00', '06:00'] }

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', jobId?: string) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      jobId
    }, ...prev]);
  }, []);

  const handleRunJob = async (job: SyncJob, isAuto: boolean = false) => {
    setJobStatuses(prev => ({ ...prev, [job.id]: JobStatus.CHECKING }));
    const triggerType = isAuto ? '[自動排程]' : '[手動觸發]';
    addLog(`${triggerType} 開始任務: ${job.name}`, 'info', job.id);

    try {
      // 1. Analyze (Read & Compare)
      const newData = await analyzeDataSync(job, (msg, type) => addLog(msg, type, job.id));

      if (newData) {
        // 2. Sync (Write - Simulated)
        setJobStatuses(prev => ({ ...prev, [job.id]: JobStatus.SYNCING }));
        const resultMsg = await simulateWriteToSheet(newData, job);
        addLog(resultMsg, 'success', job.id);
        setJobStatuses(prev => ({ ...prev, [job.id]: JobStatus.SUCCESS }));
      } else {
        // Skipped
        setJobStatuses(prev => ({ ...prev, [job.id]: JobStatus.SKIPPED }));
      }
    } catch (error) {
      setJobStatuses(prev => ({ ...prev, [job.id]: JobStatus.ERROR }));
      addLog(`任務失敗: ${job.name}`, 'error', job.id);
    } finally {
      setLastRunTimes(prev => ({ ...prev, [job.id]: new Date() }));
    }
  };

  const handleRunAll = async () => {
    addLog("--- 開始批次執行所有任務 ---", 'info');
    for (const job of JOBS) {
      await handleRunJob(job);
    }
    addLog("--- 批次執行結束 ---", 'info');
  };

  // --- Auto Run Logic ---
  useEffect(() => {
    if (!isAutoMode) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // "14:00"
      
      setNextCheckTime(currentTimeStr);

      JOBS.forEach(job => {
        if (!job.scheduleTime) return;

        // Handle complex schedules like "14:00 & 06:00"
        const schedules = job.scheduleTime.split('&').map(s => s.trim());
        
        schedules.forEach(schedule => {
          // Check if current time matches schedule AND we haven't run this slot yet today
          if (currentTimeStr === schedule) {
            const today = now.toLocaleDateString();
            const runKey = `${today}-${schedule}`; // e.g., "2023-10-27-14:00"
            
            // Initialize array if needed
            if (!executedSlotsRef.current[job.id]) {
              executedSlotsRef.current[job.id] = [];
            }

            if (!executedSlotsRef.current[job.id].includes(runKey)) {
              // EXECUTE
              handleRunJob(job, true);
              
              // Mark as executed
              executedSlotsRef.current[job.id].push(runKey);
              
              // Keep array small
              if (executedSlotsRef.current[job.id].length > 10) {
                 executedSlotsRef.current[job.id].shift();
              }
            }
          }
        });
      });
    };

    // Check every 10 seconds to ensure we hit the minute
    const intervalId = setInterval(checkSchedule, 10000);
    checkSchedule(); // Run immediately on toggle

    return () => clearInterval(intervalId);
  }, [isAutoMode]);

  return (
    <div className="min-h-screen pb-20 md:pb-0 transition-colors duration-500">
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors duration-300
        ${isAutoMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white transition-colors duration-300 ${isAutoMode ? 'bg-green-500' : 'bg-indigo-600'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold leading-tight transition-colors ${isAutoMode ? 'text-white' : 'text-slate-800'}`}>
                {isAutoMode ? '自動託管模式中' : '股票資料控制台'}
              </h1>
              <p className={`text-xs font-medium transition-colors ${isAutoMode ? 'text-green-400' : 'text-slate-500'}`}>
                {isAutoMode ? '● 系統監控中' : 'AutoStock Sync v2.0'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Auto Mode Toggle */}
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                ${isAutoMode 
                  ? 'bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500/20' 
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
            >
              <Power className="w-3 h-3" />
              {isAutoMode ? '自動模式 ON' : '手動模式'}
            </button>

            <button 
              onClick={() => setIsModalOpen(true)}
              className={`p-2 rounded-full transition-colors ${isAutoMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
        
        {/* Job List Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              排程任務列表
              {isAutoMode && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded animate-pulse">監聽時間中...</span>}
            </h2>
            
            <button 
              onClick={handleRunAll}
              disabled={isAutoMode} // Disable manual run all in auto mode to prevent conflicts
              className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full transition-colors
                ${isAutoMode 
                  ? 'text-slate-400 cursor-not-allowed opacity-50' 
                  : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50'}`}
            >
              <PlayCircle className="w-3 h-3" /> 全部執行
            </button>
          </div>
          
          {JOBS.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              status={jobStatuses[job.id] || JobStatus.IDLE}
              onRun={handleRunJob}
              lastRun={lastRunTimes[job.id]}
            />
          ))}
        </div>

        {/* Log Console Column */}
        <div className="md:h-[calc(100vh-120px)] md:sticky md:top-24 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Terminal className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">系統日誌</h2>
            {isAutoMode && <span className="ml-auto text-xs font-mono text-slate-400">Time: {nextCheckTime}</span>}
          </div>
          
          <div className={`rounded-xl p-4 flex-1 overflow-hidden flex flex-col shadow-xl border transition-colors duration-300
             ${isAutoMode ? 'bg-black border-green-900/30 shadow-green-900/20' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide font-mono text-sm">
              {logs.length === 0 && (
                <div className="text-slate-600 text-center mt-10 italic">
                  {isAutoMode ? '系統監控中...等待時間觸發' : '等待執行指令...'}
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-slate-500 text-xs whitespace-nowrap pt-1">
                    {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                  <div className={`flex-1 break-words leading-relaxed
                    ${log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-green-400' : 
                      log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">
               <span className="flex items-center gap-2">
                 {isAutoMode ? <Zap className="w-3 h-3 text-green-500 fill-current" /> : <span className="w-2 h-2 rounded-full bg-slate-500" />}
                 {isAutoMode ? 'AUTO-PILOT ACTIVE' : 'MANUAL MODE'}
               </span>
               <span>Connect: Secure</span>
            </div>
          </div>
        </div>

      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center z-20 shadow-lg">
        <div className="text-xs text-slate-500">
          <div>模式: {isAutoMode ? '自動' : '手動'}</div>
          <div className="font-mono text-[10px]">{logs.length > 0 ? logs[0].message.substring(0, 20) + '...' : '等待中'}</div>
        </div>
        <button 
          onClick={handleRunAll}
          disabled={isAutoMode}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform
            ${isAutoMode 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white'}`}
        >
          <CheckCheck className="w-4 h-4" /> 全部同步
        </button>
      </div>

      <FeasibilityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default App;