import React from 'react';
import { SimulationState } from '../../types/simulation';
import { Play, Pause, RotateCcw, AlertTriangle, CloudRain, ShieldCheck, Route, Bell } from 'lucide-react';

interface SimulationControllerProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onJumpToStep: (step: 1 | 2 | 3 | 4 | 5) => void;
}

export const SimulationController: React.FC<SimulationControllerProps> = ({
  state,
  onStart,
  onPause,
  onReset,
  onJumpToStep,
}) => {
  const steps = [
    { num: 1, title: 'Normal Tracking', icon: ShieldCheck, desc: 'NER-07 Guwahati → Silchar' },
    { num: 2, title: 'Weather Warning', icon: CloudRain, desc: 'Heavy Rainfall in Dima Hasao' },
    { num: 3, title: 'Landslide Event', icon: AlertTriangle, desc: 'Primary Corridor Blocked' },
    { num: 4, title: 'AI Rerouting', icon: Route, desc: '132km Low-Risk Pass Generated' },
    { num: 5, title: 'Alert Dispatch', icon: Bell, desc: 'Broadcasting to Authorities' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold tracking-wider uppercase">
            OPERATOR TRAINING SIMULATOR
          </div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            ▶ Emergency Disruption & AI Advisory Training Module
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {state.isRunning && !state.isPaused ? (
            <button
              onClick={onPause}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Simulation</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition shadow shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{state.step > 1 && state.isPaused ? 'Resume Simulation' : '▶ START SIMULATION'}</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            title="Reset Simulation to Initial State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = state.step === s.num;
          const isCompleted = state.step > s.num;

          let badgeStyle = 'bg-slate-50 text-slate-500 border-slate-200';
          if (isActive) {
            badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm ring-1 ring-emerald-500';
          } else if (isCompleted) {
            badgeStyle = 'bg-slate-100 text-emerald-700 border-slate-300';
          }

          return (
            <button
              key={s.num}
              onClick={() => onJumpToStep(s.num as 1 | 2 | 3 | 4 | 5)}
              className={`p-2.5 rounded-lg border text-left transition relative overflow-hidden ${badgeStyle}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  STEP 0{s.num}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">{s.title}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Active Step Description Bar */}
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-emerald-700 uppercase">STATUS:</span>
          <span className="text-slate-800 font-medium">{state.stepDescription}</span>
        </div>

        <span className="text-[11px] text-slate-500 hidden md:inline">
          Vehicle: <strong className="text-slate-900">NER-07</strong> (Essential Medicines)
        </span>
      </div>
    </div>
  );
};
