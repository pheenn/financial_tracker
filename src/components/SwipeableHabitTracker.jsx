import React, { useState, useRef } from 'react';
import { Trophy, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import { getLocalTodayStr } from '../utils/date';

export const SwipeableHabitTracker = ({ habit, onIncrement, onReset }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const isMoved = useRef(false);

  const maxSwipe = 100;
  const todayStr = getLocalTodayStr();
  
  // Can click if they haven't incremented yet today
  const canIncrement = habit.lastIncrementDate !== todayStr;

  const onStart = (clientX) => {
    startX.current = clientX;
    startOffset.current = dragOffset;
    setIsDragging(true);
    isMoved.current = false;
  };

  const onMove = (clientX) => {
    if (!isDragging) return;
    const diff = clientX - startX.current;
    if (Math.abs(diff) > 5) isMoved.current = true;
    
    let newOffset = startOffset.current + diff;
    if (newOffset > 0) newOffset = 0; 
    if (newOffset < -maxSwipe) {
      newOffset = -maxSwipe - (Math.abs(newOffset) - maxSwipe) * 0.1; 
    }
    setDragOffset(newOffset);
  };

  const onEnd = () => {
    setIsDragging(false);
    if (dragOffset < -(maxSwipe / 2)) {
      setDragOffset(-maxSwipe); 
    } else {
      setDragOffset(0); 
    }
  };

  const handleResetClick = (e) => {
    e.stopPropagation();
    setDragOffset(0);
    onReset();
  };

  return (
    <div className="relative mt-4 sm:mt-0 rounded-2xl overflow-hidden touch-pan-y shadow-lg transform rotate-1 hover:rotate-0 transition-transform" style={{ WebkitTapHighlightColor: 'transparent' }}>
      {/* Background Actions (Fail / Relapse) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end w-[100px]">
        <button 
          onClick={handleResetClick}
          className="w-full h-full flex flex-col items-center justify-center bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          <RefreshCw size={20} className="mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Relapse</span>
        </button>
      </div>

      {/* Foreground Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center bg-stone-900 dark:bg-black text-white px-6 py-4 rounded-2xl w-full h-full select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'pointer', transform: `translateX(${dragOffset}px)`, transition: !isDragging ? 'transform 0.2s ease-out' : 'none' }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => { if(isDragging) onEnd(); }}
      >
        <div className="text-xs uppercase tracking-wider text-stone-300 mb-2 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          {habit.name} Days Free
        </div>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-black text-yellow-400">{habit.daysFree}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (canIncrement && !isMoved.current) onIncrement();
            }}
            disabled={!canIncrement}
            className={`text-xl font-bold p-3 rounded-full transition-colors flex items-center justify-center shadow-inner
              ${canIncrement ? 'text-stone-900 bg-yellow-400 hover:bg-yellow-300' : 'text-stone-500 bg-stone-800 opacity-80 cursor-not-allowed'}`}
          >
            {canIncrement ? <Plus size={20}/> : <CheckCircle size={20}/>}
          </button>
        </div>
        {!canIncrement && (
           <div className="text-[9px] text-stone-500 mt-2 uppercase tracking-widest">Come back tomorrow</div>
        )}
      </div>
    </div>
  );
};

