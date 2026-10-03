import React, { useState, useRef } from 'react';
import { CheckCircle, Circle, Edit, Trash, AlertCircle, Clock } from 'lucide-react';

export const SwipeableBillItem = ({ bill, onTogglePaid, onEdit, onDelete, viewMonthName, isCurrentMonth }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const isMoved = useRef(false);

  const maxSwipe = 140; 

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

  const handleClick = (e) => {
    if (isMoved.current) return;
    if (dragOffset !== 0) {
      setDragOffset(0); 
      return;
    }
    onTogglePaid(bill.id); 
  };

  const today = new Date().getDate();
  let statusColor = "text-stone-400 dark:text-stone-500";
  let dueText = "Due";
  let alertIcon = null;

  if (isCurrentMonth && !bill.isPaid) {
    if (bill.dueDate < today) {
      statusColor = "text-rose-500 font-bold";
      dueText = "Overdue";
      alertIcon = <AlertCircle size={12} className="inline mr-1" />;
    } else if (bill.dueDate - today <= 3 && bill.dueDate >= today) {
      statusColor = "text-orange-500 font-bold";
      dueText = "Due Soon";
      alertIcon = <Clock size={12} className="inline mr-1" />;
    }
  }

  return (
    <div className="relative mb-2 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 touch-pan-y" style={{ WebkitTapHighlightColor: 'transparent' }}>
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end w-[140px]">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(bill); setDragOffset(0); }}
          className="w-[70px] h-full flex flex-col items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Edit size={18} />
          <span className="text-[10px] font-bold mt-1">Edit</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(bill.id); }}
          className="w-[70px] h-full flex flex-col items-center justify-center bg-rose-500 text-white hover:bg-rose-600 transition-colors"
        >
          <Trash size={18} />
          <span className="text-[10px] font-bold mt-1">Delete</span>
        </button>
      </div>

      {/* Foreground Content */}
      <div 
        className={`relative z-10 flex items-center justify-between p-3 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.05)] border select-none
          ${!isDragging ? 'transition-transform duration-200 ease-out' : ''}
          ${bill.isPaid ? 'bg-stone-100 dark:bg-stone-800 border-transparent' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}
        `}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer', transform: `translateX(${dragOffset}px)` }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => { if(isDragging) onEnd(); }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
          {bill.isPaid ? (
            <CheckCircle className="text-emerald-500 shrink-0" size={24} />
          ) : (
            <Circle className="text-stone-300 dark:text-stone-600 shrink-0" size={24} />
          )}
          
          <div className={`font-mono text-lg ${bill.isPaid ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-200 font-semibold'}`}>
            {bill.amount}
          </div>
          
          <div>
            <div className={`text-sm font-medium ${bill.isPaid ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-700 dark:text-stone-300'}`}>
              {bill.name}
            </div>
            <div className="text-xs text-stone-400 dark:text-stone-500 font-mono">
              {bill.totalInstallments === 999 
                ? 'Recurring' 
                : `${bill.monthsRemaining} month${bill.monthsRemaining > 1 ? 's' : ''} left`}
            </div>
          </div>
        </div>
        
        <div className="text-xs font-mono flex flex-col items-end shrink-0">
          <span className={`flex items-center ${statusColor}`}>{alertIcon}{dueText}</span>
          <span className={`font-bold ${statusColor !== 'text-stone-400 dark:text-stone-500' ? statusColor : 'text-stone-600 dark:text-stone-400'}`}>
            {viewMonthName} {String(bill.dueDate).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

