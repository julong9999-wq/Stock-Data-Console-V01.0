import React from 'react';
import { SyncJob, JobStatus } from '../types';
import { Play, CheckCircle2, AlertCircle, Loader2, Clock, Database, ArrowRight } from 'lucide-react';

interface Props {
  job: SyncJob;
  status: JobStatus;
  onRun: (job: SyncJob) => void;
  lastRun?: Date;
}

const JobCard: React.FC<Props> = ({ job, status, onRun, lastRun }) => {
  const isRunning = status === JobStatus.CHECKING || status === JobStatus.SYNCING || status === JobStatus.LOADING;

  const getStatusIcon = () => {
    switch (status) {
      case JobStatus.SUCCESS: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case JobStatus.SKIPPED: return <CheckCircle2 className="w-5 h-5 text-blue-500" />; // Existing data is also good
      case JobStatus.ERROR: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case JobStatus.IDLE: return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
      default: return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case JobStatus.IDLE: return '等待操作';
      case JobStatus.CHECKING: return '檢查資料中...';
      case JobStatus.SYNCING: return '寫入中...';
      case JobStatus.SUCCESS: return '同步完成';
      case JobStatus.SKIPPED: return '資料已存在 (無需更新)';
      case JobStatus.ERROR: return '發生錯誤';
      default: return '處理中...';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{job.name}</h3>
          <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" /> 排程: {job.scheduleTime}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
          ${status === JobStatus.ERROR ? 'bg-red-50 text-red-600' : 
            status === JobStatus.SUCCESS ? 'bg-green-50 text-green-600' :
            status === JobStatus.SKIPPED ? 'bg-blue-50 text-blue-600' :
            'bg-slate-100 text-slate-600'}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 bg-slate-50 p-2 rounded-lg">
        <Database className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{job.description}</span>
        <ArrowRight className="w-3 h-3" />
        <span>目標: {job.targetDateColumn}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">
          {lastRun ? `上次執行: ${lastRun.toLocaleTimeString()}` : '尚未執行'}
        </span>
        <button
          onClick={() => onRun(job)}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${isRunning 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200'}`}
        >
          {isRunning ? (
            <>處理中</>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> 立即同步
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JobCard;