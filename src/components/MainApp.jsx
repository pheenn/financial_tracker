import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Home,
  ReceiptText,
  CreditCard,
  BarChart3,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  PieChart,
  Trophy,
  Plus,
  ArrowDown,
  ArrowUp,
  Edit,
  Trash,
  Download,
  Upload,
  Bell,
  Palette,
  Database,
  ShieldAlert,
  Moon,
  Sun,
  X,
  Heart,
  PartyPopper,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { SwipeableLogItem } from './SwipeableLogItem';
import { SwipeableBillItem } from './SwipeableBillItem';
import { SwipeableHabitTracker } from './SwipeableHabitTracker';
import { setupDailyReminder } from '../utils/dailyReminder';

const getCurrentMonthStr = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getLocalTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getMotivation = (days) => {
  if (days === 1) return 'Every journey begins with a single step. Great start!';
  if (days === 2) return 'Two days down! Your willpower is growing stronger.';
  if (days === 3) return 'Three days! The urges might be there, but so is your strength.';
  if (days === 7) return 'One whole week! Be proud of this massive milestone.';
  if (days === 10) return 'Double digits! You are literally rewiring your brain.';
  if (days === 14) return "Two weeks! Look how much money and peace you've saved.";
  if (days === 30) return 'A whole month! You are an inspiration. Keep going.';
  if (days % 10 === 0) return `${days} days clean! You are a master of your own mind now.`;
  return `Day ${days} clean. You are investing in your future peace! Keep it up.`;
};

const DEFAULT_DATA = {
  habit: { name: 'Gambling', daysFree: 3, lastIncrementDate: null },
  baseAllowance: 5000,
  wallets: { cash: 0, gcash: 0 },
  theme: 'light',
  autoBillTransactions: true,
  strategyNote: '',
  bills: [
    { id: 1, name: 'bill ease', amount: 451, totalInstallments: 6, startMonth: '2026-10', dueDate: 7 },
    { id: 2, name: 'megapeso', amount: 950, totalInstallments: 1, startMonth: '2026-10', dueDate: 9 },
    { id: 3, name: 'mobilis cash', amount: 272, totalInstallments: 1, startMonth: '2026-10', dueDate: 25 },
    { id: 4, name: 'maya credit', amount: 560, totalInstallments: 1, startMonth: '2026-10', dueDate: 2 },
    { id: 5, name: 'G cash loan', amount: 355, totalInstallments: 5, startMonth: '2026-11', dueDate: 2 },
    { id: 6, name: 'rent sa bh', amount: 1700, totalInstallments: 999, startMonth: '2026-10', dueDate: 1 },
    { id: 7, name: 'megapeso (new)', amount: 236, totalInstallments: 2, startMonth: '2026-11', dueDate: 9 },
  ],
  paidRecords: [],
  dailyLogs: [],
};

const QUANTITY_CATEGORIES = new Set(['Food', 'Wants', 'Other']);

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'bills', label: 'Bills', icon: CreditCard },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Card = ({ children, className = '', ...props }) => (
  <section {...props} className={`rounded-3xl border border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90 ${className}`}>
    {children}
  </section>
);

const SectionTitle = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div>
      <div className="flex items-center gap-2 text-base font-black text-stone-900 dark:text-white">
        {Icon && <Icon size={18} className="text-yellow-500" />}
        {title}
      </div>
      {subtitle && <p className="mt-1 text-xs font-medium text-stone-400 dark:text-stone-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

function MainApp() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('financeTrackerData');
      if (!saved) return DEFAULT_DATA;
      const parsed = JSON.parse(saved);
      if (parsed.baseAllowance === undefined) parsed.baseAllowance = parsed.allowance || 5000;
      if (!parsed.wallets) parsed.wallets = { cash: 0, gcash: 0 };
      if (!parsed.theme) parsed.theme = 'light';
      if (parsed.autoBillTransactions === undefined) parsed.autoBillTransactions = true;
      if (!Array.isArray(parsed.bills)) parsed.bills = [];
      if (!Array.isArray(parsed.paidRecords)) parsed.paidRecords = [];
      if (!Array.isArray(parsed.dailyLogs)) parsed.dailyLogs = [];
      if (!parsed.habit) parsed.habit = { ...DEFAULT_DATA.habit };
      if (parsed.dailyLogs) {
        parsed.dailyLogs = parsed.dailyLogs.map((log) => ({
          ...log,
          type: log.type || 'expense',
          category: log.category || 'Food',
        }));
      }
      return parsed;
    } catch {
      return DEFAULT_DATA;
    }
  });

  const [activeScreen, setActiveScreen] = useState('home');
  const [currentViewMonth, setCurrentViewMonth] = useState(getCurrentMonthStr());
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isAddingLogForm, setIsAddingLogForm] = useState(false);
  const [newLogType, setNewLogType] = useState('expense');
  const [newLogCategory, setNewLogCategory] = useState('Food');
  const [newLogText, setNewLogText] = useState('');
  const [newLogName, setNewLogName] = useState('');
  const [newLogQuantity, setNewLogQuantity] = useState('1');
  const [newLogDate, setNewLogDate] = useState(getLocalTodayStr());
  const [newLogCost, setNewLogCost] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [pendingDeleteTransactionIds, setPendingDeleteTransactionIds] = useState([]);
  const [pendingDeleteBillId, setPendingDeleteBillId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('financeTrackerData', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    setupDailyReminder();
  }, []);

  useEffect(() => {
    const isDark = data.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = '';
    };
  }, [data.theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeScreen]);

  const parseYearMonth = (ymStr) => {
    const [year, month] = ymStr.split('-').map(Number);
    return { year, month };
  };

  const getMonthName = (ymStr) => {
    const { year, month } = parseYearMonth(ymStr);
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (offset) => {
    setSelectedCategoryFilter(null);
    const { year, month } = parseYearMonth(currentViewMonth);
    const next = new Date(year, month - 1 + offset, 1);
    setCurrentViewMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const activeBills = useMemo(() => {
    const { year: vYear, month: vMonth } = parseYearMonth(currentViewMonth);
    return data.bills
      .filter((bill) => {
        const { year: sYear, month: sMonth } = parseYearMonth(bill.startMonth);
        const monthsDiff = (vYear - sYear) * 12 + (vMonth - sMonth);
        return monthsDiff >= 0 && monthsDiff < bill.totalInstallments;
      })
      .map((bill) => {
        const { year: sYear, month: sMonth } = parseYearMonth(bill.startMonth);
        const monthsDiff = (vYear - sYear) * 12 + (vMonth - sMonth);
        return {
          ...bill,
          monthsRemaining: bill.totalInstallments - monthsDiff,
          isPaid: data.paidRecords.includes(`${bill.id}-${currentViewMonth}`),
        };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [data.bills, data.paidRecords, currentViewMonth]);

  const totalBillsAmount = activeBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const paidBills = activeBills.filter((b) => b.isPaid);
  const totalPaidAmount = paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const currentMonthLogs = data.dailyLogs.filter(
    (log) => log.monthStr === currentViewMonth || (!log.monthStr && currentViewMonth === getCurrentMonthStr()),
  );
  const totalExtraIncome = currentMonthLogs.filter((l) => l.type === 'income').reduce((sum, log) => sum + Number(log.cost || 0), 0);
  const totalDailyExpenses = currentMonthLogs.filter((l) => l.type === 'expense' && !l.isBillAutoTransaction).reduce((sum, log) => sum + Number(log.cost || 0), 0);
  const baseAllowanceAmount = Number(data.baseAllowance || 0);
  const currentMonthAllowance = baseAllowanceAmount + totalExtraIncome;
  const extraAllowancePercent = baseAllowanceAmount > 0 ? (totalExtraIncome / baseAllowanceAmount) * 100 : 0;
  const quantityApplies = newLogType === 'expense' && QUANTITY_CATEGORIES.has(newLogCategory);
  const remainingAllowance = currentMonthAllowance - totalPaidAmount;
  const actualLeftover = remainingAllowance - totalDailyExpenses;
  const chartRentAmount = activeBills.filter((b) => b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const chartDebtAmount = activeBills.filter((b) => !b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const paidRentAmount = paidBills.filter((b) => b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const paidDebtAmount = paidBills.filter((b) => !b.name.toLowerCase().includes('rent')).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const paidBillsSpending = paidRentAmount + paidDebtAmount;
  const trueTotalSpent = paidBillsSpending + totalDailyExpenses;
  const chartDenominator = Math.max(currentMonthAllowance, trueTotalSpent) || 1;
  const isOverbudget = trueTotalSpent > currentMonthAllowance;
  const pRent = (chartRentAmount / chartDenominator) * 100;
  const pDebt = (chartDebtAmount / chartDenominator) * 100;
  const pExp = (totalDailyExpenses / chartDenominator) * 100;
  const pRem = isOverbudget ? 0 : ((currentMonthAllowance - trueTotalSpent) / chartDenominator) * 100;

  const allTermDebts = data.bills.filter((b) => b.totalInstallments !== 999 && !b.name.toLowerCase().includes('rent'));
  const totalHistoricalDebtAmount = allTermDebts.reduce((sum, b) => sum + Number(b.amount || 0) * Number(b.totalInstallments || 0), 0);
  const totalPaidDebtAmount = allTermDebts.reduce((sum, bill) => {
    const paidCount = data.paidRecords.filter((pr) => pr.startsWith(`${bill.id}-`)).length;
    return sum + paidCount * Number(bill.amount || 0);
  }, 0);
  const debtProgressPercent = totalHistoricalDebtAmount === 0
    ? 100
    : Math.min(100, Math.round((totalPaidDebtAmount / totalHistoricalDebtAmount) * 100));

  const debtBreakdown = useMemo(() => allTermDebts.map((bill) => {
    const paidCount = data.paidRecords.filter((pr) => pr.startsWith(`${bill.id}-`)).length;
    const remainingCount = Math.max(0, Number(bill.totalInstallments) - paidCount);
    return { ...bill, remainingCount, totalRemainingAmount: remainingCount * Number(bill.amount || 0) };
  }).filter((b) => b.totalRemainingAmount > 0), [allTermDebts, data.paidRecords]);

  const grandTotalDebt = debtBreakdown.reduce((sum, item) => sum + item.totalRemainingAmount, 0);
  const expenseLogs = currentMonthLogs.filter((l) => l.type === 'expense');
  const categoryTotals = expenseLogs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + Number(l.cost || 0);
    return acc;
  }, {});
  const categoriesList = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const getLogDateValue = (log) => {
    const month = log.monthStr || currentViewMonth;
    const [year, monthNumber] = String(month).split('-').map(Number);
    const match = String(log.date || '').match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/);
    const day = match ? Number(match[1]) : 1;
    return new Date(year || 1970, (monthNumber || 1) - 1, day).getTime();
  };

  const sortedCurrentMonthLogs = useMemo(() => [...currentMonthLogs].sort((a, b) => {
    const dateDiff = getLogDateValue(b) - getLogDateValue(a);
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id || 0) - Number(a.id || 0);
  }), [currentMonthLogs, currentViewMonth]);

  const groupTransactions = (logs) => {
    const groups = new Map();
    logs.forEach((log) => {
      const key = `${log.monthStr || currentViewMonth}|${log.date || ''}|${log.category || (log.type === 'income' ? 'Income' : 'Other')}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(log);
    });
    return [...groups.values()].map((group) => {
      const first = group[0];
      return { ...first, id: `group-${group.map((item) => item.id).join('-')}`, cost: group.reduce((sum, item) => sum + Number(item.cost || 0), 0), groupedLogs: group, isGroupedTransaction: group.length > 1 };
    }).sort((a, b) => getLogDateValue(b) - getLogDateValue(a) || Number(b.groupedLogs?.[0]?.id || 0) - Number(a.groupedLogs?.[0]?.id || 0));
  };

  const filteredLogs = selectedCategoryFilter ? sortedCurrentMonthLogs.filter((log) => log.category === selectedCategoryFilter) : sortedCurrentMonthLogs;
  const displayLogs = groupTransactions(filteredLogs);

  const recentLogs = sortedCurrentMonthLogs.slice(0, 5);

  const upcomingBills = activeBills.filter((bill) => !bill.isPaid).slice(0, 4);

  const showNotification = (msg, type = 'success') => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => setNotification(''), 3200);
  };

  const getBillTransactionDate = (monthStr, dueDate) => {
    const { year, month } = parseYearMonth(monthStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysInMonth = new Date(year, month, 0).getDate();
    const safeDay = Math.min(Math.max(Number(dueDate) || 1, 1), daysInMonth);
    return `${monthNames[month - 1]} ${safeDay}`;
  };

  const buildBillTransaction = (bill, monthStr) => {
    const amount = Number(bill.amount || 0);
    const recordKey = `${bill.id}-${monthStr}`;
    return {
      id: Date.now(),
      date: getBillTransactionDate(monthStr, bill.dueDate),
      text: `${bill.name} ${amount.toLocaleString()}`,
      cost: amount,
      monthStr,
      type: 'expense',
      category: 'Bill',
      isBillAutoTransaction: true,
      billId: bill.id,
      billRecordKey: recordKey,
    };
  };

  const toggleBillPaid = (billId) => {
    const recordKey = `${billId}-${currentViewMonth}`;
    setData((prev) => {
      const isCurrentlyPaid = prev.paidRecords.includes(recordKey);
      const bill = prev.bills.find((item) => item.id === billId);
      if (!bill) return prev;

      if (isCurrentlyPaid) {
        return {
          ...prev,
          paidRecords: prev.paidRecords.filter((key) => key !== recordKey),
          // Always remove the linked auto transaction when a paid bill is unmarked.
          dailyLogs: prev.dailyLogs.filter((log) => log.billRecordKey !== recordKey),
        };
      }

      const shouldAutoAdd = prev.autoBillTransactions !== false;
      const alreadyHasAutoTransaction = prev.dailyLogs.some((log) => log.billRecordKey === recordKey);

      return {
        ...prev,
        paidRecords: [...prev.paidRecords, recordKey],
        dailyLogs: shouldAutoAdd && !alreadyHasAutoTransaction
          ? [...prev.dailyLogs, buildBillTransaction(bill, currentViewMonth)]
          : prev.dailyLogs,
      };
    });

    const willBePaid = !data.paidRecords.includes(recordKey);
    showNotification(
      willBePaid
        ? (data.autoBillTransactions !== false ? 'Bill marked paid and transaction added.' : 'Bill successfully marked paid.')
        : 'Bill marked unpaid and linked transaction removed.'
    );
  };


  const handleEditBillClick = (bill) => {
    setEditingBill(bill);
    setIsAddingBill(true);
    setActiveScreen('bills');
  };

  const handleIncrementHabit = () => {
    const todayStr = getLocalTodayStr();
    setData((prev) => ({
      ...prev,
      habit: { ...prev.habit, daysFree: prev.habit.daysFree + 1, lastIncrementDate: todayStr },
    }));
    setActiveModal('congrats');
  };

  const handleResetHabit = () => {
    setData((prev) => ({
      ...prev,
      habit: { ...prev.habit, daysFree: 0, lastIncrementDate: null },
    }));
    setActiveModal('fail');
  };

  const resetLogForm = () => {
    setEditingLogId(null);
    setNewLogType('expense');
    setNewLogCategory('Food');
    setNewLogText('');
    setNewLogName('');
    setNewLogQuantity('1');
    setNewLogDate(getLocalTodayStr());
    setNewLogCost('');
    setEditItems([]);
  };

  const handleEditLogClick = (log) => {
    const logs = Array.isArray(log.groupedLogs) ? log.groupedLogs : [log];
    setEditingLogId(logs.map((item) => item.id));
    setEditItems(logs.map((item) => ({ id: item.id, name: item.name || String(item.text || '').split('\n')[0].trim(), text: item.text || '', quantity: item.quantity == null ? '1' : String(item.quantity), cost: item.cost == null ? '' : String(item.cost) })));
    setNewLogType(log.type || 'expense');
    setNewLogCategory(log.category || 'Food');
    setNewLogText(log.text || '');
    setNewLogName(log.name || '');
    setNewLogQuantity(log.quantity == null ? '1' : String(log.quantity));
    setNewLogCost(log.cost === 0 ? '' : String(log.cost || ''));
    const month = log.monthStr || currentViewMonth;
    const [, dayRaw] = String(log.date || '').match(/^(?:[A-Za-z]{3})\s+(\d{1,2})$/) || [];
    const [year, monthNumber] = month.split('-');
    const day = dayRaw || String(new Date().getDate()).padStart(2, '0');
    setNewLogDate(`${year}-${monthNumber}-${String(day).padStart(2, '0')}`);
    setIsAddingLogForm(true);
    setActiveScreen('transactions');
    window.setTimeout(() => document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const addDailyLog = () => {
    const expenseName = newLogName.trim();
    const incomeDescription = newLogText.trim();

    if (!editingLogId && newLogType === 'expense' && !expenseName) {
      showNotification('Failed: enter a transaction name.', 'error');
      return;
    }
    if (!editingLogId && newLogType === 'income' && !incomeDescription) {
      showNotification('Failed: enter an income description.', 'error');
      return;
    }
    if (!editingLogId && quantityApplies && (!newLogQuantity || Number(newLogQuantity) < 1)) {
      showNotification('Failed: enter a valid quantity.', 'error');
      return;
    }
    if (!editingLogId && (!newLogCost || Number(newLogCost) < 0)) {
      showNotification('Failed: enter a valid total price.', 'error');
      return;
    }

    let dateToUse = '';
    let logMonthStr = currentViewMonth;
    if (newLogDate) {
      const [y, m, dNum] = newLogDate.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateToUse = `${monthNames[Number(m) - 1]} ${dNum}`;
      logMonthStr = `${y}-${m}`;
    } else {
      dateToUse = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const calculatedCost = Number(newLogCost) || 0;
    const quantity = quantityApplies ? Math.max(1, Number(newLogQuantity) || 1) : null;
    const targetCategory = newLogType === 'income' ? 'Income' : newLogCategory;
    const displayText = newLogType === 'expense'
      ? `${quantityApplies ? `${quantity} ` : ''}${expenseName}`
      : incomeDescription;

    setData((prev) => {
      if (editingLogId) {
        const ids = Array.isArray(editingLogId) ? editingLogId : [editingLogId];
        const items = editItems.length ? editItems : [{ id: ids[0], name: expenseName, text: incomeDescription, quantity, cost: calculatedCost }];
        const updatedLogs = prev.dailyLogs.filter((log) => !ids.includes(log.id));
        const replacementLogs = items.filter((item) => String(item.name || item.text || '').trim()).map((item, index) => {
          const existing = prev.dailyLogs.find((log) => log.id === item.id);
          const itemName = newLogType === 'expense' ? String(item.name || '').trim() : String(item.text || '').trim();
          const itemQuantity = newLogType === 'expense' && quantityApplies ? Math.max(1, Number(item.quantity) || 1) : null;
          return { ...(existing || {}), id: existing?.id ?? Date.now() + index, date: dateToUse, text: newLogType === 'expense' ? `${quantityApplies ? `${itemQuantity} ` : ''}${itemName}` : itemName, ...(newLogType === 'expense' ? { name: itemName, ...(quantityApplies ? { quantity: itemQuantity } : {}) } : {}), cost: Number(item.cost) || 0, monthStr: logMonthStr, type: newLogType, category: targetCategory };
        });
        return { ...prev, dailyLogs: [...updatedLogs, ...replacementLogs] };
      }

      return {
        ...prev,
        dailyLogs: [
          ...prev.dailyLogs,
          {
            id: Date.now(),
            date: dateToUse,
            text: displayText,
            ...(newLogType === 'expense' ? { name: expenseName, ...(quantityApplies ? { quantity } : {}) } : {}),
            cost: calculatedCost,
            monthStr: logMonthStr,
            type: newLogType,
            category: targetCategory,
          },
        ],
      };
    });

    const wasEditing = Boolean(editingLogId);
    resetLogForm();
    setIsAddingLogForm(false);
    showNotification(wasEditing ? 'Transaction successfully edited.' : 'Transaction successfully added.');
  };

  const requestDeleteTransaction = (id) => {
    const ids = Array.isArray(id) ? id : [id];
    if (!ids.length) return;
    setPendingDeleteTransactionIds(ids);
    setActiveModal('delete-transaction');
  };

  const confirmDeleteTransaction = () => {
    const ids = pendingDeleteTransactionIds;
    if (!ids.length) {
      setActiveModal(null);
      return;
    }
    setData((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter((log) => !ids.includes(log.id)),
    }));
    setPendingDeleteTransactionIds([]);
    setActiveModal(null);
    showNotification(ids.length > 1 ? `${ids.length} transactions successfully deleted.` : 'Transaction successfully deleted.');
  };

  const handleDeleteBill = (billId) => {
    const bill = data.bills.find((item) => item.id === billId);
    if (!bill) return;
    setPendingDeleteBillId(billId);
    setActiveModal('delete-bill');
  };

  const confirmDeleteBill = () => {
    const billId = pendingDeleteBillId;
    if (billId == null) {
      setActiveModal(null);
      return;
    }
    setData((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== billId),
      paidRecords: prev.paidRecords.filter((record) => !record.startsWith(`${billId}-`)),
      dailyLogs: prev.dailyLogs.filter((log) => log.billId !== billId),
    }));
    setPendingDeleteBillId(null);
    setActiveModal(null);
    showNotification('Bill successfully deleted.');
  };

  const confirmResetData = () => {
    const freshData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    setData(freshData);
    setCurrentViewMonth(getCurrentMonthStr());
    setSelectedCategoryFilter(null);
    setEditingLogId(null);
    setEditItems([]);
    setIsAddingLogForm(false);
    setEditingBill(null);
    setIsAddingBill(false);
    setPendingDeleteTransactionIds([]);
    setPendingDeleteBillId(null);
    setActiveModal(null);
    setActiveScreen('home');
    showNotification('All data successfully reset.');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Financial-Tracker-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup exported.');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData || !Array.isArray(importedData.bills) || !Array.isArray(importedData.dailyLogs)) {
          showNotification('Invalid backup file.');
          return;
        }
        setData((prev) => ({
          ...prev,
          ...importedData,
          theme: importedData.theme || prev.theme || 'light',
        }));
        showNotification('Backup restored successfully.');
      } catch {
        showNotification('Could not read backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const screenMeta = {
    home: { title: 'Home', subtitle: 'Your money at a glance' },
    transactions: { title: 'Transactions', subtitle: `${getMonthName(currentViewMonth)} activity` },
    bills: { title: 'Bills', subtitle: `${getMonthName(currentViewMonth)} obligations` },
    progress: { title: 'Progress', subtitle: 'Debt and personal progress' },
    settings: { title: 'Settings', subtitle: 'Customize and manage your data' },
  };

  const navTo = (screen) => {
    setSelectedCategoryFilter(null);
    setActiveScreen(screen);
  };

  const renderMonthSwitcher = (suffix = '') => (
    <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-950">
      <button onClick={() => changeMonth(-1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200 dark:hover:bg-stone-800" aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <div className="text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Viewing</div>
        <div className="text-sm font-black text-stone-800 dark:text-white">{getMonthName(currentViewMonth)}{suffix}</div>
      </div>
      <button onClick={() => changeMonth(1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200 dark:hover:bg-stone-800" aria-label="Next month">
        <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderDebtProgress = (compact = false) => (
    <Card className={compact ? 'p-5' : 'p-6'}>
      <SectionTitle icon={Trophy} title="Debt Freedom Journey" subtitle="Track your progress toward clearing installment debt." />
      <div className="relative h-5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-950">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${debtProgressPercent}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-stone-800 dark:text-white">{debtProgressPercent}% PAID</span>
      </div>
      <div className="mt-3 flex justify-between gap-4 text-xs font-bold text-stone-500 dark:text-stone-400">
        <span>Paid ₱{totalPaidDebtAmount.toLocaleString()}</span>
        <span>Total ₱{totalHistoricalDebtAmount.toLocaleString()}</span>
      </div>
    </Card>
  );

  const renderHome = () => (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-stone-900 p-6 text-white dark:bg-black sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Available balance</div>
            <div className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">₱{actualLeftover.toLocaleString()}</div>
            <div className="mt-2 text-sm font-medium text-stone-400">After bills and daily expenses for {getMonthName(currentViewMonth)}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <Wallet size={22} className="text-yellow-400" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-stone-500">Allowance</div><div className="mt-1 font-black">₱{currentMonthAllowance.toLocaleString()}</div></div>
          <div className="rounded-2xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-stone-500">Bills</div><div className="mt-1 font-black">₱{totalBillsAmount.toLocaleString()}</div></div>
          <div className="rounded-2xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-stone-500">Expenses</div><div className="mt-1 font-black">₱{totalDailyExpenses.toLocaleString()}</div></div>
          <div className="rounded-2xl bg-white/5 p-3"><div className="text-[10px] uppercase tracking-wider text-stone-500">Debt left</div><div className="mt-1 font-black">₱{grandTotalDebt.toLocaleString()}</div></div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={TrendingDown} title="Spending" subtitle="Bills marked paid + daily expenses" />
        <div className={`text-3xl font-black ${isOverbudget ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>₱{trueTotalSpent.toLocaleString()}</div>
        <div className="mt-2 text-xs font-semibold text-stone-400">Paid bills: ₱{paidBillsSpending.toLocaleString()} • Daily: ₱{totalDailyExpenses.toLocaleString()}</div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle icon={PieChart} title="Budget mix" subtitle="Where this month's planned funds are going" />
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: `conic-gradient(var(--ft-chart-rent) 0% ${pRent}%, var(--ft-chart-debt) ${pRent}% ${pRent + pDebt}%, var(--ft-chart-expense) ${pRent + pDebt}% ${pRent + pDebt + pExp}%, var(--ft-chart-remaining) ${pRent + pDebt + pExp}% 100%)` }}>
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white shadow-inner dark:bg-stone-900">
                <div className="text-xl font-black">{isOverbudget ? '!' : 'OK'}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">Budget</div>
              </div>
            </div>
            <div className="w-full space-y-3 text-sm">
              {[
                ['Rent', chartRentAmount, 'bg-blue-500'],
                ['Debt & Bills', chartDebtAmount, 'bg-rose-500'],
                ['Daily Expenses', totalDailyExpenses, 'bg-amber-500'],
                [isOverbudget ? 'Overbudget By' : 'Remaining Funds', isOverbudget ? trueTotalSpent - currentMonthAllowance : currentMonthAllowance - trueTotalSpent, isOverbudget ? 'bg-rose-500' : 'bg-emerald-500'],
              ].map(([label, amount, dot]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${dot}`} /><span className="font-bold text-stone-600 dark:text-stone-400">{label}</span></div>
                  <span className="font-black">₱{Number(amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Calendar} title="Upcoming bills" subtitle={`${upcomingBills.length} unpaid bill${upcomingBills.length === 1 ? '' : 's'} in the current month`} action={<button onClick={() => navTo('bills')} className="text-xs font-black text-stone-500 hover:text-stone-900 dark:hover:text-white">View all</button>} />
          <div className="space-y-2">
            {upcomingBills.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-stone-200 py-8 text-center text-sm font-semibold text-stone-400 dark:border-stone-800">No unpaid bills here.</div>
            ) : upcomingBills.map((bill) => (
              <button key={bill.id} onClick={() => navTo('bills')} className="flex w-full items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 p-3 text-left transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700">
                <div className="min-w-0"><div className="truncate text-sm font-bold text-stone-800 dark:text-stone-200">{bill.name}</div><div className="text-xs text-stone-400">Due {getMonthName(currentViewMonth).split(' ')[0]} {String(bill.dueDate).padStart(2, '0')}</div></div>
                <div className="shrink-0 font-black text-rose-500">₱{Number(bill.amount).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>


      <Card className="p-5">
        <SectionTitle icon={ReceiptText} title="Recent transactions" action={<button onClick={() => navTo('transactions')} className="text-xs font-black text-stone-500 hover:text-stone-900 dark:hover:text-white">See all</button>} />
        <div className="space-y-2">
          {recentLogs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 py-8 text-center text-sm font-semibold text-stone-400 dark:border-stone-800">No transactions this month.</div>
          ) : recentLogs.map((log) => (
            <button key={log.id} onClick={() => navTo('transactions')} className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-100 p-3 text-left dark:border-stone-800">
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-stone-800 dark:text-stone-200">{log.text.split('\n')[0]}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-stone-400">{log.date} • {log.category}</div></div>
              <div className={`shrink-0 font-black ${log.type === 'income' ? 'text-emerald-500' : 'text-amber-600 dark:text-amber-400'}`}>{log.type === 'income' ? '+' : '-'}₱{Number(log.cost || 0).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </Card>

      {data.strategyNote?.trim() && (
        <Card className="p-5">
          <SectionTitle icon={Info} title="Strategy note" subtitle="Your current financial plan" />
          <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-stone-600 dark:text-stone-300">{data.strategyNote}</p>
        </Card>
      )}
    </div>
  );

  const closeTransactionForm = () => {
    resetLogForm();
    setIsAddingLogForm(false);
  };

  const renderTransactionForm = () => (
    <Card id="transaction-form" className="w-full min-w-0 max-w-full overflow-hidden p-5 box-border">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle icon={editingLogId ? Edit : Plus} title={editingLogId ? 'Edit transaction' : 'Add transaction'} subtitle="Enter the details without leaving this screen." />
        <button
          type="button"
          onClick={closeTransactionForm}
          className="shrink-0 rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-white"
          aria-label="Close transaction form"
        >
          <X size={19} />
        </button>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5 dark:bg-stone-950">
          <button type="button" onClick={() => setNewLogType('expense')} className={`min-h-11 rounded-xl text-sm font-black ${newLogType === 'expense' ? 'bg-white text-amber-700 shadow-sm dark:bg-stone-800 dark:text-amber-400' : 'text-stone-500'}`}><ArrowDown size={15} className="mr-1 inline" />Expense</button>
          <button type="button" onClick={() => setNewLogType('income')} className={`min-h-11 rounded-xl text-sm font-black ${newLogType === 'income' ? 'bg-white text-emerald-700 shadow-sm dark:bg-stone-800 dark:text-emerald-400' : 'text-stone-500'}`}><ArrowUp size={15} className="mr-1 inline" />Extra income</button>
        </div>

        {newLogType === 'expense' ? (
          <>
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Category</div>
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                {['Food', 'Transpo', 'Wants', 'Bills', 'Other'].map((cat) => (
                  <button key={cat} type="button" onClick={() => setNewLogCategory(cat)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${newLogCategory === cat ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className={`grid min-w-0 gap-4 ${quantityApplies ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
              <label className="min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Date<input type="date" value={newLogDate} onChange={(e) => setNewLogDate(e.target.value)} className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
              {quantityApplies && (
                <label className="min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Quantity<input type="number" min="1" step="1" inputMode="numeric" value={newLogQuantity} onChange={(e) => setNewLogQuantity(e.target.value)} className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
              )}
            </div>

            {editingLogId ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Transactions on this date</div><button type="button" onClick={() => setEditItems((items) => [...items, { id: null, name: '', quantity: '1', cost: '' }])} className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Plus size={13} className="mr-1 inline" />Add item</button></div>
                {editItems.map((item, index) => (
                  <div key={item.id ?? `new-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                    <div className={`grid gap-3 ${quantityApplies ? 'sm:grid-cols-[90px_minmax(0,1fr)_130px_auto]' : 'sm:grid-cols-[minmax(0,1fr)_130px_auto]'}`}>
                      {quantityApplies && <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Qty<input type="number" min="1" value={item.quantity} onChange={(e) => setEditItems((items) => items.map((x, i) => i === index ? { ...x, quantity: e.target.value } : x))} className="mt-1 block w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900 dark:text-white" /></label>}
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Name<input type="text" value={item.name} onChange={(e) => setEditItems((items) => items.map((x, i) => i === index ? { ...x, name: e.target.value } : x))} className="mt-1 block w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900 dark:text-white" /></label>
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Price<input type="number" min="0" step="0.01" value={item.cost} onChange={(e) => setEditItems((items) => items.map((x, i) => i === index ? { ...x, cost: e.target.value } : x))} className="mt-1 block w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900 dark:text-white" /></label>
                      <button type="button" disabled={editItems.length === 1} onClick={() => setEditItems((items) => items.filter((_, i) => i !== index))} className="self-end rounded-xl p-2.5 text-rose-500 disabled:opacity-30" aria-label="Remove transaction"><X size={16} /></button>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl bg-stone-100 p-3 text-right text-xs font-black dark:bg-stone-950">Group total: ₱{editItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0).toLocaleString()}</div>
              </div>
            ) : (
              <>
                <label className="block min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Name<input type="text" value={newLogName} onChange={(e) => setNewLogName(e.target.value)} placeholder={quantityApplies ? 'e.g. Rice' : 'e.g. Jeepney fare'} className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
                <label className="block min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Total Price<input type="number" min="0" step="0.01" inputMode="decimal" value={newLogCost} onChange={(e) => setNewLogCost(e.target.value)} placeholder="0.00" className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /><span className="mt-1 block normal-case tracking-normal text-[10px] font-medium text-stone-400">Enter the total price for the whole transaction.</span></label>
              </>
            )}
          </>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Date<input type="date" value={newLogDate} onChange={(e) => setNewLogDate(e.target.value)} className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
            <label className="min-w-0 text-xs font-black uppercase tracking-wider text-stone-400">Amount<input type="number" min="0" step="0.01" inputMode="decimal" value={newLogCost} onChange={(e) => setNewLogCost(e.target.value)} placeholder="0.00" className="mt-2 block w-full min-w-0 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
            <label className="block min-w-0 text-xs font-black uppercase tracking-wider text-stone-400 sm:col-span-2">Name / Description<textarea value={newLogText} onChange={(e) => setNewLogText(e.target.value)} placeholder="e.g. Freelance payment" rows={3} className="mt-2 block w-full min-w-0 resize-none rounded-2xl border border-stone-200 bg-white p-3 text-sm font-medium outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
          </div>
        )}

        <div className="flex min-w-0 gap-2">
          <button type="button" onClick={addDailyLog} className="min-h-12 min-w-0 flex-1 rounded-2xl bg-stone-900 px-4 text-sm font-black text-white shadow-md transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900">{editingLogId ? 'Save changes' : 'Add transaction'}</button>
          {editingLogId && <button type="button" onClick={closeTransactionForm} className="min-h-12 shrink-0 rounded-2xl bg-stone-100 px-4 text-sm font-black text-stone-600 dark:bg-stone-800 dark:text-stone-300">Cancel</button>}
        </div>
      </div>
    </Card>
  );

  const renderCategoryBreakdown = () => (
    <Card className="w-full min-w-0 max-w-full overflow-hidden p-5 box-border">
      <SectionTitle icon={PieChart} title="Category breakdown" subtitle="Expense distribution for the selected month." />
      {categoriesList.length === 0 ? (
        <div className="text-sm font-semibold text-stone-400">No expense categories yet.</div>
      ) : (
        <div className="min-w-0 space-y-3">
          {categoriesList.map(([category, amount]) => (
            <div key={category} className="min-w-0">
              <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-sm font-bold">
                <span className="min-w-0 break-words">{category}</span>
                <span className="shrink-0">₱{amount.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div className="h-2 max-w-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (amount / Math.max(totalDailyExpenses, 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const renderTransactions = () => (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        <Card className="min-w-0 max-w-full overflow-hidden p-5 box-border">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total allowance</div>
          <div className="mt-2 break-words text-2xl font-black text-emerald-600 dark:text-emerald-400">₱{currentMonthAllowance.toLocaleString()}</div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-stone-400">Base ₱{baseAllowanceAmount.toLocaleString()}</span>
            {totalExtraIncome > 0 ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <TrendingUp size={12} /> +₱{totalExtraIncome.toLocaleString()} extra ({extraAllowancePercent.toFixed(0)}%)
              </span>
            ) : (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                No extra allowance yet
              </span>
            )}
          </div>
        </Card>
        <Card className="min-w-0 max-w-full overflow-hidden p-5 box-border">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Expenses</div>
          <div className="mt-2 break-words text-2xl font-black text-amber-600 dark:text-amber-400">₱{totalDailyExpenses.toLocaleString()}</div>
          <div className="mt-2 text-xs font-semibold text-stone-400">Daily expenses recorded this month</div>
        </Card>
      </div>

      {renderCategoryBreakdown()}

      {!isAddingLogForm && !editingLogId ? (
        <Card className="w-full min-w-0 max-w-full overflow-hidden p-5 box-border">
          <button
            type="button"
            onClick={() => setIsAddingLogForm(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-black text-white shadow-md transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900"
          >
            <Plus size={18} /> Add transaction
          </button>
        </Card>
      ) : (
        renderTransactionForm()
      )}

      {renderMonthSwitcher()}

      <Card className="w-full min-w-0 max-w-full overflow-hidden p-5 box-border">
        <SectionTitle icon={ReceiptText} title="Activity" subtitle="Swipe a transaction to edit or delete it." action={<div className="text-xs font-bold text-stone-400">{displayLogs.length} shown</div>} />
        <div className="mb-4 flex min-w-0 gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategoryFilter(null)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${!selectedCategoryFilter ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300'}`}>All</button>
          {['Food', 'Transpo', 'Wants', 'Bill', 'Bills', 'Other', 'Income'].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-black ${selectedCategoryFilter === cat ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300'}`}>{cat}</button>
          ))}
        </div>
        {displayLogs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center text-sm font-semibold text-stone-400 dark:border-stone-800">No transactions found for this view.</div>
        ) : (
          <div className="min-w-0 max-w-full space-y-2 overflow-hidden">
            {displayLogs.map((log) => <SwipeableLogItem key={log.id} log={log} onEdit={handleEditLogClick} onDelete={requestDeleteTransaction} />)}
          </div>
        )}
      </Card>
    </div>
  );

  const renderBillForm = () => (
    <Card className="p-5">
      <SectionTitle icon={editingBill ? Edit : Plus} title={editingBill ? 'Edit bill' : 'Add bill'} subtitle="Recurring or installment obligations." />
      <form onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const billData = {
          name: String(fd.get('name') || '').trim(),
          amount: Number(fd.get('amount') || 0),
          totalInstallments: Number(fd.get('months') || 0),
          dueDate: Number(fd.get('due') || 1),
        };
        if (!billData.name || billData.amount <= 0 || billData.totalInstallments <= 0) {
          showNotification('Failed: complete the bill details with valid values.', 'error');
          return;
        }
        setData((prev) => {
          if (editingBill) {
            const updatedBills = prev.bills.map((b) => b.id === editingBill.id ? { ...b, ...billData } : b);
            const updatedLogs = prev.dailyLogs.map((log) => {
              if (!log.isBillAutoTransaction || log.billId !== editingBill.id) return log;
              const billRecordMonth = log.billRecordKey?.split('-').slice(1).join('-') || currentViewMonth;
              return {
                ...log,
                text: `${billData.name} ${Number(billData.amount || 0).toLocaleString()}`,
                cost: Number(billData.amount || 0),
                date: getBillTransactionDate(billRecordMonth, billData.dueDate),
                category: 'Bill',
              };
            });
            return { ...prev, bills: updatedBills, dailyLogs: updatedLogs };
          }
          return { ...prev, bills: [...prev.bills, { id: Date.now(), startMonth: currentViewMonth, ...billData }] };
        });
        setEditingBill(null);
        setIsAddingBill(false);
        showNotification(editingBill ? 'Bill successfully edited.' : 'Bill successfully added.');
      }} className="space-y-4">
        <label className="block text-xs font-black uppercase tracking-wider text-stone-400">Bill name<input name="name" required defaultValue={editingBill?.name || ''} placeholder="e.g. Rent" className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-black uppercase tracking-wider text-stone-400">Monthly amount<input name="amount" required type="number" defaultValue={editingBill?.amount || ''} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
          <label className="text-xs font-black uppercase tracking-wider text-stone-400">Due day<input name="due" required type="number" min="1" max="31" defaultValue={editingBill?.dueDate || ''} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
          <label className="text-xs font-black uppercase tracking-wider text-stone-400">Duration<input name="months" required type="number" min="1" defaultValue={editingBill?.totalInstallments || ''} placeholder="999 = recurring" className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
        </div>
        <div className="flex gap-2"><button type="submit" className="min-h-12 flex-1 rounded-2xl bg-stone-900 text-sm font-black text-white dark:bg-stone-100 dark:text-stone-900">{editingBill ? 'Save changes' : 'Add bill'}</button><button type="button" onClick={() => { setIsAddingBill(false); setEditingBill(null); }} className="min-h-12 rounded-2xl bg-stone-100 px-5 text-sm font-black text-stone-600 dark:bg-stone-800 dark:text-stone-300">Cancel</button></div>
      </form>
    </Card>
  );

  const renderBills = () => (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-5"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total bills</div><div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">₱{totalBillsAmount.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Paid</div><div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">₱{totalPaidAmount.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Unpaid</div><div className="mt-2 text-2xl font-black">₱{(totalBillsAmount - totalPaidAmount).toLocaleString()}</div></Card>
      </div>
      {renderMonthSwitcher(' Bills')}
      <Card className="p-5">
        <SectionTitle icon={CreditCard} title="Monthly bill tracker" subtitle="Tap a bill to mark it paid. Swipe left for edit/delete." action={<button onClick={() => setIsAddingBill((v) => !v)} className="flex min-h-11 items-center gap-2 rounded-2xl bg-stone-900 px-4 text-xs font-black text-white dark:bg-stone-100 dark:text-stone-900"><Plus size={15} /> Add bill</button>} />
        {activeBills.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center text-sm font-semibold text-stone-400 dark:border-stone-800">No bills scheduled for this month.</div> : <div className="space-y-2">{activeBills.map((bill) => <SwipeableBillItem key={bill.id} bill={bill} onTogglePaid={toggleBillPaid} onEdit={handleEditBillClick} onDelete={handleDeleteBill} viewMonthName={new Date(parseYearMonth(currentViewMonth).year, parseYearMonth(currentViewMonth).month - 1).toLocaleString('default', { month: 'short' })} isCurrentMonth={currentViewMonth === getCurrentMonthStr()} />)}</div>}
        <div className="mt-5 flex justify-between border-t border-stone-100 pt-4 text-sm font-black dark:border-stone-800"><span className="text-stone-400">TOTAL</span><span>₱{totalBillsAmount.toLocaleString()}</span></div>
      </Card>
      {isAddingBill && renderBillForm()}
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-5">
      {renderDebtProgress(false)}
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Trophy} title="Daily progress" subtitle="Keep your streak action in one dedicated place." />
        <SwipeableHabitTracker habit={data.habit} onIncrement={handleIncrementHabit} onReset={handleResetHabit} />
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Wallet} title="Financial progress" subtitle="A simple snapshot of where the month stands." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20"><div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Remaining funds</div><div className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">₱{Math.max(0, actualLeftover).toLocaleString()}</div></div>
          <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20"><div className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">Debt remaining</div><div className="mt-2 text-3xl font-black text-rose-700 dark:text-rose-400">₱{grandTotalDebt.toLocaleString()}</div></div>
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Info} title="Debt breakdown" />
        <button onClick={() => setShowDebtBreakdown((v) => !v)} className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-stone-50 px-4 text-left dark:bg-stone-950"><span className="text-sm font-black">{showDebtBreakdown ? 'Hide details' : 'Show details'}</span><span className="text-stone-400">{showDebtBreakdown ? '−' : '+'}</span></button>
        {showDebtBreakdown && <div className="mt-3 space-y-2">{debtBreakdown.length === 0 ? <div className="text-sm font-semibold text-emerald-500">No remaining term debt.</div> : debtBreakdown.map((item) => <div key={item.id} className="flex justify-between rounded-2xl border border-stone-100 p-3 text-sm dark:border-stone-800"><span className="font-bold">{item.name}<span className="ml-2 text-xs font-medium text-stone-400">{item.remainingCount} left × ₱{item.amount}</span></span><span className="font-black text-rose-500">₱{item.totalRemainingAmount.toLocaleString()}</span></div>)}</div>}
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-5">
      <Card className="p-5">
        <SectionTitle icon={Palette} title="Appearance" subtitle="A more intentional light and dark experience." />
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setData((prev) => ({ ...prev, theme: 'light' }))} className={`min-h-14 rounded-2xl border p-3 text-sm font-black ${data.theme === 'light' ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100' : 'border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300'}`}><Sun size={17} className="mr-2 inline" />Light</button>
          <button onClick={() => setData((prev) => ({ ...prev, theme: 'dark' }))} className={`min-h-14 rounded-2xl border p-3 text-sm font-black ${data.theme === 'dark' ? 'border-stone-100 bg-stone-100 text-stone-900' : 'border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300'}`}><Moon size={17} className="mr-2 inline" />Dark</button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Wallet} title="Monthly budget" subtitle="Adjust the base allowance without leaving Settings." />
        <label className="block text-xs font-black uppercase tracking-wider text-stone-400">Base allowance<input type="number" value={data.baseAllowance} onChange={(e) => setData((prev) => ({ ...prev, baseAllowance: Number(e.target.value) || 0 }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-base font-black dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Info} title="Strategy / notes" subtitle="Your planning notes are still saved with the same data key." />
        <textarea value={data.strategyNote || ''} onChange={(e) => setData((prev) => ({ ...prev, strategyNote: e.target.value }))} rows={6} placeholder="Write your financial strategy here..." className="w-full resize-none rounded-2xl border border-stone-200 bg-amber-50/80 p-4 text-sm font-medium leading-6 outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200" />
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Bell} title="Notifications" subtitle="Your daily 8:00 AM reminder is configured by the local notification utility." />
        <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 dark:bg-stone-950"><div><div className="text-sm font-black">Daily reminder</div><div className="text-xs font-semibold text-stone-400">Open Financial Tracker at 8:00 AM</div></div><div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Enabled</div></div>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={ReceiptText} title="Bill transactions" subtitle="Automatically create a Bill expense when you mark a bill paid." />
        <button
          type="button"
          role="switch"
          aria-checked={data.autoBillTransactions !== false}
          onClick={() => {
            const nextValue = data.autoBillTransactions === false;
            setData((prev) => ({ ...prev, autoBillTransactions: nextValue }));
            showNotification(nextValue ? 'Automatic bill transactions enabled.' : 'Automatic bill transactions disabled.');
          }}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-stone-50 px-4 text-left transition dark:bg-stone-950"
        >
          <div>
            <div className="text-sm font-black">Auto-add paid bills to Transactions</div>
            <div className="mt-1 text-xs font-semibold text-stone-400">Unmarking the bill removes its linked automatic transaction.</div>
          </div>
          <div className={`flex h-7 w-12 items-center rounded-full p-1 transition ${data.autoBillTransactions !== false ? 'bg-emerald-500 justify-end' : 'bg-stone-300 justify-start dark:bg-stone-700'}`}>
            <div className="h-5 w-5 rounded-full bg-white shadow" />
          </div>
        </button>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Database} title="Data" subtitle="Backups and maintenance." />
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={handleExport} className="min-h-12 rounded-2xl bg-stone-100 text-sm font-black text-stone-700 dark:bg-stone-800 dark:text-stone-200"><Download size={16} className="mr-2 inline" />Export backup</button>
          <button onClick={() => fileInputRef.current?.click()} className="min-h-12 rounded-2xl bg-stone-100 text-sm font-black text-stone-700 dark:bg-stone-800 dark:text-stone-200"><Upload size={16} className="mr-2 inline" />Import backup</button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
      </Card>

      <Card className="border-rose-200 p-5 dark:border-rose-900/50">
        <SectionTitle icon={ShieldAlert} title="Danger zone" subtitle="Destructive actions are intentionally kept away from the main dashboard." />
        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20"><div className="text-sm font-black text-rose-700 dark:text-rose-400">Reset all data</div><div className="mt-1 text-xs font-medium leading-5 text-rose-600/80 dark:text-rose-300/70">This permanently removes your local transactions, bills, habit progress, and saved settings.</div><button onClick={() => setActiveModal('reset')} className="mt-4 min-h-12 w-full rounded-2xl bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700">Reset All Data</button></div>
      </Card>
    </div>
  );

  const themeClass = data.theme === 'dark' ? 'dark' : '';
  const background = 'var(--ft-page-bg)';
  const grid = 'var(--ft-grid)';

  return (
    <div className={themeClass} data-theme={data.theme}>
      <div
        className="min-h-screen overflow-x-hidden font-sans text-stone-800 transition-colors duration-300 dark:text-stone-100"
        style={{
          backgroundColor: background,
          backgroundImage: `linear-gradient(to right, ${grid} 1px, transparent 1px), linear-gradient(to bottom, ${grid} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      >
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-white/90 p-5 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90 lg:flex">
          <div className="mb-8 px-2">
            <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">Financial Tracker</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Financial Planner</div>
          </div>
          <nav className="space-y-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => navTo(id)} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-black transition ${activeScreen === id ? 'bg-stone-900 text-white shadow-md dark:bg-stone-100 dark:text-stone-900' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white'}`}>
                <Icon size={19} />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-3xl bg-stone-900 p-4 text-white dark:bg-black"><div className="text-[10px] font-black uppercase tracking-widest text-stone-500">This month</div><div className="mt-2 text-2xl font-black">₱{Math.max(0, actualLeftover).toLocaleString()}</div><div className="mt-1 text-xs font-medium text-stone-400">available after planned spending</div></div>
        </aside>

        <main className="min-h-screen lg:pl-64">
          <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
            <header className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Financial Tracker • Financial Planner</div>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-900 dark:text-white sm:text-4xl">{screenMeta[activeScreen].title}</h1>
                <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">{screenMeta[activeScreen].subtitle}</p>
              </div>
              <button onClick={() => navTo('settings')} className="hidden min-h-11 min-w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 sm:flex lg:hidden" aria-label="Open settings"><Settings size={18} /></button>
            </header>

            {notification && (
              <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4" role="status" aria-live="polite">
                <div className={`flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur-xl ${
                  notificationType === 'error'
                    ? 'border-rose-200 bg-rose-50/95 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/95 dark:text-rose-200'
                    : 'border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/95 dark:text-emerald-200'
                }`}>
                  {notificationType === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle size={18} className="shrink-0" />}
                  <span className="min-w-0 flex-1">{notification}</span>
                </div>
              </div>
            )}

            {activeScreen === 'home' && renderHome()}
            {activeScreen === 'transactions' && renderTransactions()}
            {activeScreen === 'bills' && renderBills()}
            {activeScreen === 'progress' && renderProgress()}
            {activeScreen === 'settings' && renderSettings()}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95 lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => navTo(id)} className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-2xl text-[10px] font-black ${activeScreen === id ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-400'}`}>
                <Icon size={18} /><span className="mt-1">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm" onClick={() => { setActiveModal(null); setPendingDeleteTransactionIds([]); setPendingDeleteBillId(null); }}>
            <div className="relative w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-2xl dark:border-stone-800 dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setActiveModal(null); setPendingDeleteTransactionIds([]); setPendingDeleteBillId(null); }} className="absolute right-5 top-5 rounded-xl p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Close confirmation">
                <X size={20} />
              </button>

              {activeModal === 'reset' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30"><ShieldAlert size={30} className="text-rose-600" /></div>
                  <h3 className="text-2xl font-black">Reset all data?</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-stone-500 dark:text-stone-400">This cannot be undone. Your locally saved financial tracker data will be deleted.</p>
                  <div className="mt-6 flex gap-2">
                    <button onClick={confirmResetData} className="min-h-12 flex-1 rounded-2xl bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700">Yes, reset everything</button>
                    <button onClick={() => setActiveModal(null)} className="min-h-12 flex-1 rounded-2xl bg-stone-100 text-sm font-black text-stone-700 dark:bg-stone-800 dark:text-stone-200">Cancel</button>
                  </div>
                </>
              ) : activeModal === 'delete-transaction' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30"><Trash size={28} className="text-rose-600" /></div>
                  <h3 className="text-2xl font-black">Delete transaction?</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-stone-500 dark:text-stone-400">{pendingDeleteTransactionIds.length > 1 ? `This will permanently delete ${pendingDeleteTransactionIds.length} transactions from this group.` : 'This transaction will be permanently removed.'}</p>
                  <div className="mt-6 flex gap-2">
                    <button onClick={confirmDeleteTransaction} className="min-h-12 flex-1 rounded-2xl bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700">Delete</button>
                    <button onClick={() => { setActiveModal(null); setPendingDeleteTransactionIds([]); }} className="min-h-12 flex-1 rounded-2xl bg-stone-100 text-sm font-black text-stone-700 dark:bg-stone-800 dark:text-stone-200">Cancel</button>
                  </div>
                </>
              ) : activeModal === 'delete-bill' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30"><Trash size={28} className="text-rose-600" /></div>
                  <h3 className="text-2xl font-black">Delete this bill?</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-stone-500 dark:text-stone-400">Deleting it also removes its paid records and linked automatic Bill transactions.</p>
                  <div className="mt-6 flex gap-2">
                    <button onClick={confirmDeleteBill} className="min-h-12 flex-1 rounded-2xl bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700">Delete bill</button>
                    <button onClick={() => { setActiveModal(null); setPendingDeleteBillId(null); }} className="min-h-12 flex-1 rounded-2xl bg-stone-100 text-sm font-black text-stone-700 dark:bg-stone-800 dark:text-stone-200">Cancel</button>
                  </div>
                </>
              ) : activeModal === 'congrats' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/30"><PartyPopper size={30} className="text-yellow-600" /></div>
                  <h3 className="text-2xl font-black">Awesome job!</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-stone-500 dark:text-stone-400">{getMotivation(data.habit.daysFree)}</p>
                  <button onClick={() => setActiveModal(null)} className="mt-6 min-h-12 w-full rounded-2xl bg-stone-900 text-sm font-black text-white dark:bg-stone-100 dark:text-stone-900">Continue</button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30"><Heart size={30} className="text-rose-600" /></div>
                  <h3 className="text-2xl font-black">Start again.</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-stone-500 dark:text-stone-400">You can reset the counter and continue from here.</p>
                  <button onClick={() => setActiveModal(null)} className="mt-6 min-h-12 w-full rounded-2xl bg-stone-900 text-sm font-black text-white dark:bg-stone-100 dark:text-stone-900">Continue</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { MainApp };
export default MainApp;
