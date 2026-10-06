import React, { useRef, useState } from 'react';
import { Edit, Trash, ArrowLeftRight } from 'lucide-react';

const formatPrice = (value) => `₱${Number(value || 0).toLocaleString()}`;

const parseLegacyLine = (line) => {
  const clean = String(line || '').trim();
  const match = clean.match(/^(.*?)(?:\s+[-₱]?\s*([\d,]+(?:\.\d+)?))\s*$/);
  if (!match) return { name: clean, price: null, quantity: null };

  const label = match[1].trim();
  const price = Number(match[2].replace(/,/g, ''));
  const qtyMatch = label.match(/^(\d+)\s*[×xX]?\s+(.+)$/);
  return {
    name: qtyMatch ? qtyMatch[2].trim() : label,
    quantity: qtyMatch ? Number(qtyMatch[1]) : null,
    price,
  };
};

const getItems = (log) => {
  if (log.type === 'income') {
    return [{ quantity: null, name: log.name || log.text || 'Income', price: Number(log.cost || 0) }];
  }

  if (log.name) {
    return [{ quantity: log.quantity == null ? null : Number(log.quantity), name: log.name, price: Number(log.cost || 0) }];
  }

  const rawLines = String(log.text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  if (!rawLines.length) {
    return [{ quantity: null, name: 'Transaction', price: Number(log.cost || 0) }];
  }

  const parsed = rawLines.map(parseLegacyLine);
  const hasLinePrices = parsed.some((item) => item.price != null);
  if (!hasLinePrices && parsed.length === 1) parsed[0].price = Number(log.cost || 0);
  return parsed;
};

export const SwipeableLogItem = ({ log, onEdit, onDelete }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const isMoved = useRef(false);

  const maxSwipe = 140;
  const groupedLogs = Array.isArray(log.groupedLogs) ? log.groupedLogs : [log];
  const items = groupedLogs.flatMap((item) => getItems(item));
  const total = groupedLogs.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const isIncome = groupedLogs.every((item) => item.type === 'income');
  const isTransfer = groupedLogs.every((item) => item.type === 'transfer');

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
    let next = startOffset.current + diff;
    if (next > 0) next = 0;
    if (next < -maxSwipe) next = -maxSwipe - (Math.abs(next) - maxSwipe) * 0.1;
    setDragOffset(next);
  };

  const onEnd = () => {
    setIsDragging(false);
    setDragOffset(dragOffset < -(maxSwipe / 2) ? -maxSwipe : 0);
  };

  return (
    <div className="relative mb-2 w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800 touch-pan-y" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="absolute inset-y-0 right-0 flex w-[140px] items-center justify-end">
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(log); setDragOffset(0); }} className="flex h-full w-[70px] flex-col items-center justify-center bg-blue-500 text-white hover:bg-blue-600">
          <Edit size={18} /><span className="mt-1 text-[10px] font-bold">Edit</span>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(groupedLogs.map((item) => item.id)); setDragOffset(0); }} className="flex h-full w-[70px] flex-col items-center justify-center bg-rose-500 text-white hover:bg-rose-600">
          <Trash size={18} /><span className="mt-1 text-[10px] font-bold">Delete</span>
        </button>
      </div>

      <div
        className={`relative z-10 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_0_10px_rgba(0,0,0,0.05)] dark:border-stone-800 dark:bg-stone-900 ${!isDragging ? 'transition-transform duration-200 ease-out' : ''}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', transform: `translateX(${dragOffset}px)` }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => { if (isDragging) onEnd(); }}
      >
        {/* Header: Date + Total */}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-100 pb-2 dark:border-stone-800">
          <span className="min-w-0 truncate font-mono text-xs font-bold text-stone-400 dark:text-stone-500">{log.date}</span>
          <span className={`shrink-0 text-sm font-black ${isTransfer ? 'text-blue-600 dark:text-blue-400' : isIncome ? 'text-emerald-500' : 'text-amber-600 dark:text-amber-400'}`}>
            {isTransfer ? '' : isIncome ? '+' : ''}{formatPrice(total)}
          </span>
        </div>

        {/* Item rows */}
        <div className="mt-2 min-w-0 space-y-1.5">
          {isTransfer ? groupedLogs.map((item, index) => (
            <div key={`${log.id}-transfer-${index}`} className="flex items-center gap-2 text-[13px] sm:text-sm">
              <ArrowLeftRight size={15} className="shrink-0 text-blue-500" />
              <span className="min-w-0 break-words font-semibold text-stone-700 dark:text-stone-300">{item.text}</span>
            </div>
          )) : null}
          {!isTransfer && items.map((item, index) => (
            <div key={`${log.id}-${index}`} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 text-[13px] sm:text-sm">
              <span className="shrink-0 font-mono font-black text-stone-500 dark:text-stone-400">{item.quantity != null ? item.quantity : ''}</span>
              <span className="min-w-0 break-words text-stone-700 dark:text-stone-300">{item.name || 'Unnamed item'}</span>
              <span className={`shrink-0 font-mono font-bold ${item.price != null ? 'text-stone-500 dark:text-stone-400' : 'text-stone-300 dark:text-stone-600'}`}>
                {item.price != null ? formatPrice(item.price) : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${isIncome ? 'text-emerald-500' : 'text-stone-400 dark:text-stone-500'}`}>
          {log.category || (isIncome ? 'Income' : 'Expense')}{groupedLogs.length > 1 ? ` • ${groupedLogs.length} items` : ''}
        </div>
      </div>
    </div>
  );
};

export default SwipeableLogItem;
