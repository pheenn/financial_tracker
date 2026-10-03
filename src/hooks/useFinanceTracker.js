import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DATA } from '../data/defaultData';
import { getCurrentMonthStr, getLocalTodayStr } from '../utils/date';

export function useFinanceTracker() {

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('financeTrackerData');
      if (saved) {
         const parsed = JSON.parse(saved);
         // Migration logic for old saves to new format
         if (parsed.baseAllowance === undefined) parsed.baseAllowance = parsed.allowance || 5000;
         if (!parsed.wallets) parsed.wallets = { cash: 0, gcash: 0 };
         if (!parsed.theme) parsed.theme = 'light';
         if (parsed.dailyLogs) {
            parsed.dailyLogs = parsed.dailyLogs.map(log => ({
               ...log,
               type: log.type || 'expense',
               category: log.category || 'Food'
            }));
         }
         return parsed;
      }
      return DEFAULT_DATA;
    } catch (e) {
      return DEFAULT_DATA;
    }
  });

  const [currentViewMonth, setCurrentViewMonth] = useState("2026-10"); 
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  
  // New Log State
  const [editingLogId, setEditingLogId] = useState(null);
  const [newLogType, setNewLogType] = useState('expense'); // 'expense' or 'income'
  const [newLogCategory, setNewLogCategory] = useState('Food');
  const [newLogText, setNewLogText] = useState("");
  const [newLogDate, setNewLogDate] = useState(getLocalTodayStr());
  const [newLogCost, setNewLogCost] = useState("");
  
  const [notification, setNotification] = useState("");
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('financeTrackerData', JSON.stringify(data));
  }, [data]);

  const toggleTheme = () => {
    setData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const parseYearMonth = (ymStr) => {
    const [year, month] = ymStr.split('-').map(Number);
    return { year, month };
  };

  const getMonthName = (ymStr) => {
    const { year, month } = parseYearMonth(ymStr);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (offset) => {
    setSelectedCategoryFilter(null);
    const { year, month } = parseYearMonth(currentViewMonth);
    let newMonth = month + offset;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    setCurrentViewMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const activeBills = useMemo(() => {
    const { year: vYear, month: vMonth } = parseYearMonth(currentViewMonth);
    
    return data.bills.filter(bill => {
      const { year: sYear, month: sMonth } = parseYearMonth(bill.startMonth);
      const monthsDiff = (vYear - sYear) * 12 + (vMonth - sMonth);
      return monthsDiff >= 0 && monthsDiff < bill.totalInstallments;
    }).map(bill => {
      const { year: sYear, month: sMonth } = parseYearMonth(bill.startMonth);
      const monthsDiff = (vYear - sYear) * 12 + (vMonth - sMonth);
      const isPaid = data.paidRecords.includes(`${bill.id}-${currentViewMonth}`);
      
      return {
        ...bill,
        monthsRemaining: bill.totalInstallments - monthsDiff,
        isPaid
      };
    }).sort((a, b) => a.dueDate - b.dueDate);
  }, [data.bills, data.paidRecords, currentViewMonth]);

  const totalBillsAmount = activeBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaidAmount = activeBills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  
  const currentMonthLogs = data.dailyLogs.filter(log => 
    log.monthStr === currentViewMonth || (!log.monthStr && currentViewMonth === "2023-10")
  );
  
  // Math logic separating income and expenses
  const totalExtraIncome = currentMonthLogs.filter(l => l.type === 'income').reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalDailyExpenses = currentMonthLogs.filter(l => l.type === 'expense').reduce((sum, log) => sum + (log.cost || 0), 0);
  
  const currentMonthAllowance = data.baseAllowance + totalExtraIncome;
  const remainingAllowance = currentMonthAllowance - totalPaidAmount;
  const actualLeftover = remainingAllowance - totalDailyExpenses;
  
  const unallocatedCash = actualLeftover - ((data.wallets?.cash || 0) + (data.wallets?.gcash || 0));

  // --- Chart Math ---
  const chartRentAmount = activeBills.filter(b => b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + b.amount, 0);
  const chartDebtAmount = activeBills.filter(b => !b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + b.amount, 0);
  const chartExpensesAmount = totalDailyExpenses;
  
  // Total denominator is either your funds, or the total spent if you go over budget
  const trueTotalSpent = chartRentAmount + chartDebtAmount + chartExpensesAmount;
  const chartDenominator = Math.max(currentMonthAllowance, trueTotalSpent) || 1; 
  const isOverbudget = trueTotalSpent > currentMonthAllowance;
  
  const pRent = (chartRentAmount / chartDenominator) * 100;
  const pDebt = (chartDebtAmount / chartDenominator) * 100;
  const pExp = (chartExpensesAmount / chartDenominator) * 100;
  const pRem = isOverbudget ? 0 : ((currentMonthAllowance - trueTotalSpent) / chartDenominator) * 100;

  // Debt Progress Logic
  const allTermDebts = data.bills.filter(b => b.totalInstallments !== 999 && !b.name.toLowerCase().includes('rent'));
  const totalHistoricalDebtAmount = allTermDebts.reduce((sum, b) => sum + (Number(b.amount) * Number(b.totalInstallments)), 0);
  const totalPaidDebtAmount = allTermDebts.reduce((sum, b) => {
    const paidCount = data.paidRecords.filter(pr => pr.startsWith(`${b.id}-`)).length;
    return sum + (paidCount * Number(b.amount));
  }, 0);
  const debtProgressPercent = totalHistoricalDebtAmount === 0 ? 100 : Math.round((totalPaidDebtAmount / totalHistoricalDebtAmount) * 100);

  const debtBreakdown = useMemo(() => {
    return allTermDebts.map(bill => {
      const paidCount = data.paidRecords.filter(pr => pr.startsWith(`${bill.id}-`)).length;
      const remainingCount = Math.max(0, bill.totalInstallments - paidCount);
      return {
        ...bill,
        remainingCount,
        totalRemainingAmount: remainingCount * Number(bill.amount)
      };
    }).filter(b => b.totalRemainingAmount > 0);
  }, [allTermDebts, data.paidRecords]);

  const grandTotalDebt = debtBreakdown.reduce((sum, item) => sum + item.totalRemainingAmount, 0);

  // Categories Breakdown
  const expenseLogs = currentMonthLogs.filter(l => l.type === 'expense');
  const categoryTotals = expenseLogs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + l.cost;
    return acc;
  }, {});
  const categoriesList = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const toggleBillPaid = (billId) => {
    const recordKey = `${billId}-${currentViewMonth}`;
    setData(prev => {
      const isCurrentlyPaid = prev.paidRecords.includes(recordKey);
      return {
        ...prev,
        paidRecords: isCurrentlyPaid 
          ? prev.paidRecords.filter(key => key !== recordKey)
          : [...prev.paidRecords, recordKey]
      };
    });
  };

  const handleDeleteBill = (billId) => {
    setData(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== billId),
      paidRecords: prev.paidRecords.filter(record => !record.startsWith(`${billId}-`))
    }));
  };

  const handleEditBillClick = (bill) => {
    setEditingBill(bill);
    setIsAddingBill(true);
  };

  const handleIncrementHabit = () => {
    const todayStr = getLocalTodayStr();
    setData(prev => {
      const newDays = prev.habit.daysFree + 1;
      return {
        ...prev,
        habit: { ...prev.habit, daysFree: newDays, lastIncrementDate: todayStr }
      };
    });
    setActiveModal('congrats');
  };

  const handleResetHabit = () => {
    setData(prev => ({
      ...prev,
      habit: { ...prev.habit, daysFree: 0, lastIncrementDate: null }
    }));
    setActiveModal('fail');
  };

  const handleEditLogClick = (log) => {
    setEditingLogId(log.id);
    setNewLogType(log.type);
    setNewLogCategory(log.category);
    setNewLogText(log.text);
    setNewLogCost(log.cost === 0 ? "" : log.cost.toString());
  };

  const addDailyLog = () => {
    if (!newLogText.trim()) return;
    
    let dateToUse = "";
    let logMonthStr = currentViewMonth;

    if (newLogDate) {
      const [y, m, dNum] = newLogDate.split('-');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      dateToUse = `${monthNames[parseInt(m, 10) - 1]} ${dNum}`;
      logMonthStr = `${y}-${m}`;
    } else {
      dateToUse = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Auto-calculate cost from text if the amount input is empty!
    let calculatedCost = Number(newLogCost);
    if (!newLogCost) {
      let autoSum = 0;
      newLogText.split('\n').forEach(line => {
        const match = line.match(/^(.*?)\s+[-₱]?\s*([\d,]+(?:\.\d+)?)\s*$/);
        if (match) {
          autoSum += parseFloat(match[2].replace(/,/g, ''));
        }
      });
      if (autoSum > 0) {
         calculatedCost = autoSum;
      } else {
         calculatedCost = 0;
      }
    } else {
      calculatedCost = calculatedCost || 0;
    }

    setData(prev => {
      const targetCategory = newLogType === 'income' ? 'Income' : newLogCategory;

      if (editingLogId) {
        const updatedLogs = prev.dailyLogs.map(l => 
          l.id === editingLogId 
            ? { ...l, text: newLogText, cost: calculatedCost, date: dateToUse, monthStr: logMonthStr, type: newLogType, category: targetCategory }
            : l
        );
        return { ...prev, dailyLogs: updatedLogs };
      }

      // Check if a log already exists for this exact date, type, AND category
      const existingLogIndex = prev.dailyLogs.findIndex(
        log => log.date === dateToUse && log.type === newLogType && log.category === targetCategory && log.monthStr === logMonthStr
      );

      if (existingLogIndex >= 0) {
        // Update the existing log by combining text and summing up the cost
        const updatedLogs = [...prev.dailyLogs];
        const existing = updatedLogs[existingLogIndex];
        updatedLogs[existingLogIndex] = {
          ...existing,
          text: existing.text + "\n" + newLogText,
          cost: existing.cost + calculatedCost
        };
        return { ...prev, dailyLogs: updatedLogs };
      }
      
      // Create a brand new log if none exists for this day/type/category combo
      return {
        ...prev,
        dailyLogs: [
          ...prev.dailyLogs, 
          { 
            id: Date.now(), 
            date: dateToUse, 
            text: newLogText,
            cost: calculatedCost,
            monthStr: logMonthStr,
            type: newLogType,
            category: targetCategory
          }
        ]
      };
    });
    
    setNewLogText("");
    setNewLogCost("");
    setEditingLogId(null);
  };

  const deleteDailyLog = (id) => {
    setData(prev => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter(log => log.id !== id)
    }));
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const confirmResetData = () => {
    localStorage.removeItem('financeTrackerData');
    window.location.reload();
  };

  const gridColor = data.theme === 'dark' ? '#292524' : '#e5e7eb';
  const bgColor = data.theme === 'dark' ? '#0c0a09' : '#fdfbf7';

  const displayLogs = selectedCategoryFilter 
    ? currentMonthLogs.filter(log => log.category === selectedCategoryFilter)
    : currentMonthLogs;


  return {
    data,
    setData,
    currentViewMonth,
    setCurrentViewMonth,
    isAddingBill,
    setIsAddingBill,
    editingBill,
    setEditingBill,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    editingLogId,
    setEditingLogId,
    newLogType,
    setNewLogType,
    newLogCategory,
    setNewLogCategory,
    newLogText,
    setNewLogText,
    newLogDate,
    setNewLogDate,
    newLogCost,
    setNewLogCost,
    notification,
    setNotification,
    showDebtBreakdown,
    setShowDebtBreakdown,
    activeModal,
    setActiveModal,
    toggleTheme,
    parseYearMonth,
    getMonthName,
    changeMonth,
    activeBills,
    totalBillsAmount,
    totalPaidAmount,
    currentMonthLogs,
    totalExtraIncome,
    totalDailyExpenses,
    currentMonthAllowance,
    remainingAllowance,
    actualLeftover,
    unallocatedCash,
    chartRentAmount,
    chartDebtAmount,
    chartExpensesAmount,
    trueTotalSpent,
    chartDenominator,
    isOverbudget,
    pRent,
    pDebt,
    pExp,
    pRem,
    allTermDebts,
    totalHistoricalDebtAmount,
    totalPaidDebtAmount,
    debtProgressPercent,
    debtBreakdown,
    grandTotalDebt,
    expenseLogs,
    categoryTotals,
    categoriesList,
    toggleBillPaid,
    handleDeleteBill,
    handleEditBillClick,
    handleIncrementHabit,
    handleResetHabit,
    handleEditLogClick,
    addDailyLog,
    deleteDailyLog,
    showNotification,
    confirmResetData,
    gridColor,
    bgColor,
    displayLogs,
  };
}
