import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Repeat2,
  CalendarDays,
  Target,
  Landmark,
  BarChart3,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = ['Food', 'Transpo', 'Wants', 'Bills', 'Other', 'Debt'];
const ACCOUNT_TYPES = ['Cash', 'E-wallet', 'Bank', 'Savings', 'Credit Card', 'Other'];
const id = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const money = (v) => `₱${Number(v || 0).toLocaleString()}`;
const pad = (n) => String(n).padStart(2, '0');
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const labelDate = (s) => {
  const [y, m, d] = String(s || '').split('-').map(Number);
  if (!y || !m || !d) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function FinanceHub({ data, setData, currentViewMonth, changeMonth, getMonthName, currentMonthLogs, showNotification }) {
  const [tab, setTab] = useState('accounts');
  const accounts = useMemo(() => (Array.isArray(data.accounts) ? data.accounts : []), [data.accounts]);
  const budgets = Array.isArray(data.budgets) ? data.budgets : [];
  const recurring = Array.isArray(data.recurringTransactions) ? data.recurringTransactions : [];
  const goals = Array.isArray(data.savingsGoals) ? data.savingsGoals : [];
  const loans = Array.isArray(data.loans) ? data.loans : [];

  const [accountForm, setAccountForm] = useState({ name: '', type: 'Cash', openingBalance: '0' });
  const [editingAccount, setEditingAccount] = useState(null);
  const [transfer, setTransfer] = useState({ from: '', to: '', amount: '' });
  const [budget, setBudget] = useState({ category: 'Food', amount: '' });
  const [repeat, setRepeat] = useState({ name: '', amount: '', type: 'expense', category: 'Food', accountId: '', frequency: 'monthly', day: '1', startDate: new Date().toISOString().slice(0, 10) });
  const [goal, setGoal] = useState({ name: '', target: '', current: '0', targetDate: '', accountId: '' });
  const [loan, setLoan] = useState({ name: '', principal: '', interestRate: '0', monthlyPayment: '', nextPaymentDate: new Date().toISOString().slice(0, 10), accountId: '' });

  useEffect(() => {
    if (!accounts.length) return;
    const first = accounts[0]?.id || '';
    const second = accounts[1]?.id || first;
    setTransfer((v) => ({ ...v, from: v.from || first, to: v.to || second }));
    setRepeat((v) => ({ ...v, accountId: v.accountId || first }));
    setGoal((v) => ({ ...v, accountId: v.accountId || first }));
    setLoan((v) => ({ ...v, accountId: v.accountId || first }));
  }, [accounts]);

  const input = 'mt-2 w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-semibold outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-stone-950 dark:text-white';
  const button = 'min-h-11 rounded-2xl bg-stone-900 px-4 text-sm font-black text-white dark:bg-stone-100 dark:text-stone-900';
  const disabledButton = !accounts.length ? ' opacity-50 cursor-not-allowed' : '';

  const accountBalance = (accountId) => (data.dailyLogs || []).reduce((sum, l) => {
    const amount = Number(l.cost || 0);
    const owner = l.accountId || accounts[0]?.id;
    if (l.type === 'income' && owner === accountId) return sum + amount;
    if (l.type === 'expense' && owner === accountId) return sum - amount;
    if (l.type === 'transfer') return l.fromAccountId === accountId ? sum - amount : l.toAccountId === accountId ? sum + amount : sum;
    return sum;
  }, Number(accounts.find((a) => a.id === accountId)?.openingBalance || 0));

  const saveAccount = (e) => {
    e.preventDefault();
    const name = accountForm.name.trim();
    if (!name) return showNotification('Failed: enter an account name.', 'error');
    const next = editingAccount
      ? accounts.map((a) => a.id === editingAccount.id ? { ...a, ...accountForm, openingBalance: Number(accountForm.openingBalance) || 0 } : a)
      : [...accounts, { id: id('account'), ...accountForm, openingBalance: Number(accountForm.openingBalance) || 0 }];
    setData((p) => ({ ...p, accounts: next }));
    setEditingAccount(null);
    setAccountForm({ name: '', type: 'Cash', openingBalance: '0' });
    showNotification(editingAccount ? 'Account successfully updated.' : 'Account successfully added.');
  };

  const deleteAccount = (accountId) => {
    const used = (data.dailyLogs || []).some((l) => (l.accountId || accounts[0]?.id) === accountId || l.fromAccountId === accountId || l.toAccountId === accountId);
    if (used) return showNotification('Cannot delete an account that has transaction history.', 'error');
    if (accounts.length < 2) return showNotification('Keep at least one account.', 'error');
    if (!window.confirm('Delete this empty account?')) return;
    setData((p) => ({ ...p, accounts: accounts.filter((a) => a.id !== accountId) }));
    showNotification('Account deleted.');
  };

  const doTransfer = (e) => {
    e.preventDefault();
    const amount = Number(transfer.amount);
    if (!accounts.length) return showNotification('Failed: add an account first.', 'error');
    if (!amount || amount <= 0 || transfer.from === transfer.to) return showNotification('Failed: choose two different accounts and a valid amount.', 'error');
    const from = accounts.find((a) => a.id === transfer.from)?.name || 'Account';
    const to = accounts.find((a) => a.id === transfer.to)?.name || 'Account';
    const d = new Date();
    setData((p) => ({ ...p, dailyLogs: [...p.dailyLogs, { id: Date.now(), date: labelDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`), monthStr: ym(d), text: `Transfer: ${from} → ${to}`, cost: amount, type: 'transfer', category: 'Transfer', fromAccountId: transfer.from, toAccountId: transfer.to }] }));
    setTransfer((v) => ({ ...v, amount: '' }));
    showNotification('Transfer recorded.');
  };

  const upsertBudget = (e) => {
    e.preventDefault();
    const amount = Number(budget.amount);
    if (amount <= 0) return showNotification('Failed: enter a valid budget.', 'error');
    setData((p) => {
      const list = p.budgets || [];
      const found = list.find((b) => b.monthStr === currentViewMonth && b.category === budget.category);
      return { ...p, budgets: found ? list.map((b) => b.id === found.id ? { ...b, amount } : b) : [...list, { id: id('budget'), monthStr: currentViewMonth, category: budget.category, amount }] };
    });
    setBudget((v) => ({ ...v, amount: '' }));
    showNotification('Budget saved.');
  };

  const monthBudgets = budgets.filter((b) => b.monthStr === currentViewMonth);
  const categorySpent = useMemo(() => currentMonthLogs.filter((l) => l.type === 'expense').reduce((a, l) => { a[l.category] = (a[l.category] || 0) + Number(l.cost || 0); return a; }, {}), [currentMonthLogs]);

  const recurringDates = (r, monthStr) => {
    const [y, m] = monthStr.split('-').map(Number);
    const start = String(r.startDate || '').slice(0, 10);
    if (!start || start.slice(0, 7) > monthStr) return [];
    if (r.frequency === 'monthly') return [iso(y, m, Math.min(Math.max(Number(r.day) || 1, 1), new Date(y, m, 0).getDate()))];
    if (r.frequency === 'yearly') {
      const d = new Date(`${start}T12:00:00`);
      return d.getMonth() === m - 1 ? [iso(y, m, Math.min(d.getDate(), new Date(y, m, 0).getDate()))] : [];
    }
    const weekday = new Date(`${start}T12:00:00`).getDay();
    const days = [];
    for (let day = 1; day <= new Date(y, m, 0).getDate(); day++) {
      if (new Date(y, m - 1, day).getDay() === weekday && iso(y, m, day) >= start) days.push(iso(y, m, day));
    }
    return days;
  };

  useEffect(() => {
    if (!accounts.length || !recurring.length) return;
    const additions = [];
    const seen = new Set((data.dailyLogs || []).map((l) => l.recurringOccurrenceKey).filter(Boolean));
    recurring.filter((r) => r.active !== false).forEach((r) => recurringDates(r, currentViewMonth).forEach((d) => {
      const key = `${r.id}-${d}`;
      if (seen.has(key)) return;
      additions.push({ id: Date.now() + additions.length, date: labelDate(d), monthStr: currentViewMonth, text: r.name, name: r.name, cost: Number(r.amount || 0), type: r.type, category: r.type === 'income' ? 'Income' : r.category, accountId: r.accountId, recurringId: r.id, recurringOccurrenceKey: key });
    }));
    if (additions.length) setData((p) => ({ ...p, dailyLogs: [...p.dailyLogs, ...additions] }));
  }, [currentViewMonth, recurring, accounts.length]);

  const saveRecurring = (e) => {
    e.preventDefault();
    if (!accounts.length) return showNotification('Failed: add an account first.', 'error');
    if (!repeat.name.trim() || Number(repeat.amount) <= 0 || !repeat.accountId) return showNotification('Failed: complete the recurring transaction.', 'error');
    setData((p) => ({ ...p, recurringTransactions: [...(p.recurringTransactions || []), { ...repeat, id: id('recurring'), name: repeat.name.trim(), amount: Number(repeat.amount), day: Number(repeat.day) || 1, active: true }] }));
    setRepeat({ name: '', amount: '', type: 'expense', category: 'Food', accountId: accounts[0]?.id || '', frequency: 'monthly', day: '1', startDate: new Date().toISOString().slice(0, 10) });
    showNotification('Recurring transaction created.');
  };

  const removeRecurring = (rid) => {
    if (!window.confirm('Delete this recurring rule and its generated transactions?')) return;
    setData((p) => ({ ...p, recurringTransactions: (p.recurringTransactions || []).filter((r) => r.id !== rid), dailyLogs: (p.dailyLogs || []).filter((l) => l.recurringId !== rid) }));
    showNotification('Recurring transaction deleted.');
  };

  const saveGoal = (e) => {
    e.preventDefault();
    if (!accounts.length) return showNotification('Failed: add an account first.', 'error');
    if (!goal.name.trim() || Number(goal.target) <= 0) return showNotification('Failed: complete the goal.', 'error');
    setData((p) => ({ ...p, savingsGoals: [...(p.savingsGoals || []), { id: id('goal'), name: goal.name.trim(), target: Number(goal.target), current: Number(goal.current) || 0, targetDate: goal.targetDate, accountId: goal.accountId }] }));
    setGoal({ name: '', target: '', current: '0', targetDate: '', accountId: accounts[0]?.id || '' });
    showNotification('Savings goal created.');
  };

  const contribute = (g) => {
    const amount = Number(window.prompt(`Add to ${g.name}`, '0'));
    if (!amount || amount <= 0) return;
    setData((p) => ({ ...p, savingsGoals: (p.savingsGoals || []).map((x) => x.id === g.id ? { ...x, current: Math.min(Number(x.target), Number(x.current || 0) + amount) } : x) }));
    showNotification(`${money(amount)} added to ${g.name}.`);
  };

  const removeGoal = (gid) => {
    if (!window.confirm('Delete this savings goal?')) return;
    setData((p) => ({ ...p, savingsGoals: (p.savingsGoals || []).filter((g) => g.id !== gid) }));
    showNotification('Savings goal deleted.');
  };

  const saveLoan = (e) => {
    e.preventDefault();
    if (!accounts.length) return showNotification('Failed: add an account first.', 'error');
    if (!loan.name.trim() || Number(loan.principal) <= 0 || Number(loan.monthlyPayment) <= 0) return showNotification('Failed: complete the loan details.', 'error');
    setData((p) => ({ ...p, loans: [...(p.loans || []), { id: id('loan'), ...loan, principal: Number(loan.principal), interestRate: Number(loan.interestRate) || 0, monthlyPayment: Number(loan.monthlyPayment), remainingBalance: Number(loan.principal), accountId: loan.accountId }] }));
    setLoan({ name: '', principal: '', interestRate: '0', monthlyPayment: '', nextPaymentDate: new Date().toISOString().slice(0, 10), accountId: accounts[0]?.id || '' });
    showNotification('Loan added.');
  };

  const payLoan = (l) => {
    const amount = Math.min(Number(l.monthlyPayment), Number(l.remainingBalance));
    if (!amount) return;
    const d = new Date();
    const dateIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setData((p) => ({
      ...p,
      loans: (p.loans || []).map((x) => x.id === l.id ? { ...x, remainingBalance: Math.max(0, Number(x.remainingBalance) - amount) } : x),
      dailyLogs: [...p.dailyLogs, { id: Date.now(), date: labelDate(dateIso), monthStr: ym(d), text: `${l.name} loan payment`, name: `${l.name} loan payment`, cost: amount, type: 'expense', category: 'Debt', accountId: l.accountId || accounts[0]?.id, loanId: l.id }],
    }));
    showNotification(`${money(amount)} loan payment recorded.`);
  };

  const removeLoan = (lid) => {
    if (!window.confirm('Delete this loan? Existing payment logs will remain.')) return;
    setData((p) => ({ ...p, loans: (p.loans || []).filter((l) => l.id !== lid) }));
    showNotification('Loan deleted.');
  };

  const calendar = useMemo(() => {
    const [y, m] = currentViewMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const count = new Date(y, m, 0).getDate();
    const days = Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const dateStr = iso(y, m, day);
      const events = [];
      (data.dailyLogs || []).filter((l) => l.monthStr === currentViewMonth).forEach((l) => {
        const dateLabel = labelDate(dateStr);
        if (l.date === dateLabel) events.push({ kind: l.type, label: `${l.type === 'income' ? '+' : l.type === 'transfer' ? '↔' : '-'} ${l.text}`, amount: l.cost });
      });
      (data.bills || []).forEach((bill) => {
        const [sy, sm] = String(bill.startMonth || '').split('-').map(Number);
        const diff = (y - sy) * 12 + (m - sm);
        if (diff >= 0 && diff < Number(bill.totalInstallments || 0) && Number(bill.dueDate) === day) events.push({ kind: 'bill', label: `Due ${bill.name}` });
      });
      return { day, iso: dateStr, events: events.slice(0, 4) };
    });
    return { first, days };
  }, [data.dailyLogs, data.bills, currentViewMonth]);

  const report = useMemo(() => {
    const income = currentMonthLogs.filter((l) => l.type === 'income').reduce((s, l) => s + Number(l.cost || 0), 0);
    const expenses = currentMonthLogs.filter((l) => l.type === 'expense').reduce((s, l) => s + Number(l.cost || 0), 0);
    const savings = income - expenses;
    const categories = currentMonthLogs.filter((l) => l.type === 'expense').reduce((a, l) => { a[l.category] = (a[l.category] || 0) + Number(l.cost || 0); return a; }, {});
    return { income, expenses, savings, rate: income ? (savings / income) * 100 : 0, categories };
  }, [currentMonthLogs]);

  const renderAccounts = () => (
    <div className="space-y-5">
      {!accounts.length && <div className="rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/20 dark:text-yellow-200">Add your first account before recording transactions, budgets, recurring items, goals, or debt payments.</div>}
      <div className="grid gap-4 sm:grid-cols-2">{accounts.map((a) => <div key={a.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="flex justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{a.type}</div><div className="mt-1 font-black">{a.name}</div></div><div className="flex gap-1"><button type="button" onClick={() => { setEditingAccount(a); setAccountForm({ name: a.name, type: a.type, openingBalance: String(a.openingBalance || 0) }); }} className="rounded-xl p-2 text-stone-400"><Pencil size={15} /></button><button type="button" onClick={() => deleteAccount(a.id)} className="rounded-xl p-2 text-rose-500"><Trash2 size={15} /></button></div></div><div className="mt-4 text-3xl font-black text-emerald-600 dark:text-emerald-400">{money(accountBalance(a.id))}</div><div className="mt-1 text-xs font-semibold text-stone-400">Opening {money(a.openingBalance)}</div></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={saveAccount} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">{editingAccount ? 'Edit account' : 'Add account'}</h3><input placeholder="Account name" value={accountForm.name} onChange={(e) => setAccountForm((v) => ({ ...v, name: e.target.value }))} className={input} /><select value={accountForm.type} onChange={(e) => setAccountForm((v) => ({ ...v, type: e.target.value }))} className={input}>{ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}</select><input type="number" inputMode="decimal" step="0.01" placeholder="Opening balance" value={accountForm.openingBalance} onChange={(e) => setAccountForm((v) => ({ ...v, openingBalance: e.target.value }))} className={input} /><button className={`mt-3 ${button}`}>{editingAccount ? 'Save account' : 'Add account'}</button></form>
        <form onSubmit={doTransfer} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">Transfer money</h3><select value={transfer.from} onChange={(e) => setTransfer((v) => ({ ...v, from: e.target.value }))} className={input} disabled={!accounts.length}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><select value={transfer.to} onChange={(e) => setTransfer((v) => ({ ...v, to: e.target.value }))} className={input} disabled={!accounts.length}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Amount" value={transfer.amount} onChange={(e) => setTransfer((v) => ({ ...v, amount: e.target.value }))} className={input} disabled={!accounts.length} /><button disabled={!accounts.length} className={`mt-3 ${button}${disabledButton}`}><ArrowLeftRight size={15} className="mr-1 inline" />Transfer</button></form>
      </div>
    </div>
  );

  const renderBudgets = () => <div className="space-y-5"><div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"><div className="text-sm font-black">{getMonthName(currentViewMonth)}</div><div className="flex gap-1"><button type="button" onClick={() => changeMonth(-1)} className="rounded-xl p-2 text-stone-500">‹</button><button type="button" onClick={() => changeMonth(1)} className="rounded-xl p-2 text-stone-500">›</button></div></div><form onSubmit={upsertBudget} className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-3"><select value={budget.category} onChange={(e) => setBudget((v) => ({ ...v, category: e.target.value }))} className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Monthly budget" value={budget.amount} onChange={(e) => setBudget((v) => ({ ...v, amount: e.target.value }))} className={input} /><button className={`mt-2 ${button}`}>Save budget</button></form><div className="grid gap-4 md:grid-cols-2">{monthBudgets.map((b) => { const spent = Number(categorySpent[b.category] || 0); const left = Number(b.amount) - spent; const pct = Math.min(100, spent / Math.max(1, Number(b.amount)) * 100); return <div key={b.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="flex justify-between"><span className="font-black">{b.category}</span><span className="text-xs font-bold text-stone-400">{pct.toFixed(0)}%</span></div><div className="mt-3 text-2xl font-black">{money(spent)} <span className="text-sm font-bold text-stone-400">/ {money(b.amount)}</span></div><div className="mt-3 h-2 rounded-full bg-stone-100 dark:bg-stone-800"><div className={`h-full rounded-full ${left < 0 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} /></div><div className={`mt-2 text-xs font-bold ${left < 0 ? 'text-rose-500' : 'text-stone-400'}`}>{left < 0 ? `${money(Math.abs(left))} over budget` : `${money(left)} remaining`}</div></div>; })}</div>{!monthBudgets.length && <div className="text-sm font-semibold text-stone-400">No budgets for this month yet.</div>}</div>;

  const renderRecurring = () => <div className="space-y-5"><form onSubmit={saveRecurring} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">Create recurring transaction</h3><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Name" value={repeat.name} onChange={(e) => setRepeat((v) => ({ ...v, name: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Amount" value={repeat.amount} onChange={(e) => setRepeat((v) => ({ ...v, amount: e.target.value }))} className={input} /><select value={repeat.type} onChange={(e) => setRepeat((v) => ({ ...v, type: e.target.value }))} className={input}><option value="expense">Expense</option><option value="income">Income</option></select>{repeat.type === 'expense' && <select value={repeat.category} onChange={(e) => setRepeat((v) => ({ ...v, category: e.target.value }))} className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}<select value={repeat.accountId} onChange={(e) => setRepeat((v) => ({ ...v, accountId: e.target.value }))} className={input} disabled={!accounts.length}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><select value={repeat.frequency} onChange={(e) => setRepeat((v) => ({ ...v, frequency: e.target.value }))} className={input}><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></select><input type="date" value={repeat.startDate} onChange={(e) => setRepeat((v) => ({ ...v, startDate: e.target.value }))} className={input} />{repeat.frequency === 'monthly' && <input type="number" inputMode="numeric" min="1" max="31" placeholder="Day" value={repeat.day} onChange={(e) => setRepeat((v) => ({ ...v, day: e.target.value }))} className={input} />}</div><button disabled={!accounts.length} className={`mt-3 ${button}${disabledButton}`}><Repeat2 size={15} className="mr-1 inline" />Create</button></form><div className="space-y-3">{recurring.map((r) => <div key={r.id} className="flex items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div><div className="font-black">{r.name}</div><div className="text-xs text-stone-400">{r.frequency} • {r.type} • {accounts.find((a) => a.id === r.accountId)?.name || 'Account'}</div></div><div className="flex items-center gap-3"><span className="font-black">{money(r.amount)}</span><button type="button" onClick={() => removeRecurring(r.id)} className="rounded-xl p-2 text-rose-500"><Trash2 size={16} /></button></div></div>)}</div></div>;

  const renderCalendar = () => <div className="space-y-4"><div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"><button type="button" onClick={() => changeMonth(-1)} className="p-2">‹</button><span className="font-black">{getMonthName(currentViewMonth)}</span><button type="button" onClick={() => changeMonth(1)} className="p-2">›</button></div><div className="grid grid-cols-7 gap-1 sm:gap-2">{['S','M','T','W','T','F','S'].map((x, i) => <div key={`${x}-${i}`} className="py-2 text-center text-[10px] font-black text-stone-400">{x}</div>)}{Array.from({ length: calendar.first }).map((_, i) => <div key={`blank-${i}`} className="min-h-24 rounded-xl bg-stone-50 dark:bg-stone-950/50" />)}{calendar.days.map((d) => <div key={d.iso} className="min-h-24 rounded-xl border border-stone-200 bg-white p-1.5 dark:border-stone-800 dark:bg-stone-900"><div className="text-xs font-black">{d.day}</div>{d.events.map((e, i) => <div key={`${d.iso}-${i}`} className={`mt-1 truncate rounded px-1 py-1 text-[8px] font-bold ${e.kind === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : e.kind === 'bill' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : e.kind === 'transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{e.label}</div>)}</div>)}</div></div>;

  const renderGoals = () => <div className="space-y-5"><form onSubmit={saveGoal} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">Create savings goal</h3><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Goal name" value={goal.name} onChange={(e) => setGoal((v) => ({ ...v, name: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Target amount" value={goal.target} onChange={(e) => setGoal((v) => ({ ...v, target: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0" placeholder="Already saved" value={goal.current} onChange={(e) => setGoal((v) => ({ ...v, current: e.target.value }))} className={input} /><input type="date" value={goal.targetDate} onChange={(e) => setGoal((v) => ({ ...v, targetDate: e.target.value }))} className={input} /><select value={goal.accountId} onChange={(e) => setGoal((v) => ({ ...v, accountId: e.target.value }))} className={`${input} sm:col-span-2`} disabled={!accounts.length}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><button disabled={!accounts.length} className={`mt-3 ${button}${disabledButton}`}><Target size={15} className="mr-1 inline" />Create goal</button></form><div className="grid gap-4 md:grid-cols-2">{goals.map((g) => { const pct = Math.min(100, Number(g.current || 0) / Math.max(1, Number(g.target)) * 100); return <div key={g.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="flex justify-between"><div><div className="font-black">{g.name}</div><div className="text-xs text-stone-400">{g.targetDate || 'No target date'}</div></div><button type="button" onClick={() => removeGoal(g.id)} className="text-rose-500"><Trash2 size={15} /></button></div><div className="mt-4 text-3xl font-black text-emerald-600 dark:text-emerald-400">{money(g.current)}</div><div className="text-xs text-stone-400">of {money(g.target)} • {pct.toFixed(0)}%</div><div className="mt-3 h-3 rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div><button type="button" onClick={() => contribute(g)} className="mt-3 w-full rounded-2xl bg-emerald-100 py-3 text-xs font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Add contribution</button></div>; })}</div></div>;

  const renderDebt = () => <div className="space-y-5"><form onSubmit={saveLoan} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">Add loan</h3><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Loan name" value={loan.name} onChange={(e) => setLoan((v) => ({ ...v, name: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Principal" value={loan.principal} onChange={(e) => setLoan((v) => ({ ...v, principal: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0" placeholder="Interest % / year" value={loan.interestRate} onChange={(e) => setLoan((v) => ({ ...v, interestRate: e.target.value }))} className={input} /><input type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="Monthly payment" value={loan.monthlyPayment} onChange={(e) => setLoan((v) => ({ ...v, monthlyPayment: e.target.value }))} className={input} /><input type="date" value={loan.nextPaymentDate} onChange={(e) => setLoan((v) => ({ ...v, nextPaymentDate: e.target.value }))} className={input} /><select value={loan.accountId} onChange={(e) => setLoan((v) => ({ ...v, accountId: e.target.value }))} className={input} disabled={!accounts.length}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><button disabled={!accounts.length} className={`mt-3 ${button}${disabledButton}`}><Plus size={15} className="mr-1 inline" />Add loan</button></form><div className="grid gap-4 md:grid-cols-2">{loans.map((l) => { const remain = Number(l.remainingBalance || 0); const pct = Math.min(100, (Number(l.principal) - remain) / Math.max(1, Number(l.principal)) * 100); const monthlyInterest = remain * (Number(l.interestRate || 0) / 100) / 12; const payments = Number(l.monthlyPayment) > monthlyInterest ? Math.ceil(remain / (Number(l.monthlyPayment) - monthlyInterest)) : null; return <div key={l.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="flex justify-between"><div><div className="font-black">{l.name}</div><div className="text-xs text-stone-400">{l.interestRate}% • Next {l.nextPaymentDate}</div></div><button type="button" onClick={() => removeLoan(l.id)} className="text-rose-500"><Trash2 size={15} /></button></div><div className="mt-4 text-3xl font-black text-rose-600 dark:text-rose-400">{money(remain)}</div><div className="mt-1 text-xs text-stone-400">remaining • {money(l.monthlyPayment)}/month • {payments ? `~${payments} payments` : 'payment below interest'}</div><div className="mt-3 h-3 rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div><button type="button" disabled={!remain} onClick={() => payLoan(l)} className="mt-3 w-full rounded-2xl bg-rose-100 py-3 text-xs font-black text-rose-700 disabled:opacity-50 dark:bg-rose-950/30 dark:text-rose-300">Record payment</button></div>; })}</div></div>;

  const renderReports = () => { const entries = Object.entries(report.categories).sort((a, b) => b[1] - a[1]); return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Income', money(report.income), 'text-emerald-600 dark:text-emerald-400'], ['Expenses', money(report.expenses), 'text-amber-600 dark:text-amber-400'], ['Savings', money(report.savings), report.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'], ['Savings rate', `${report.rate.toFixed(1)}%`, 'text-blue-600 dark:text-blue-400']].map(([a, b, c]) => <div key={a} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="text-[10px] font-black uppercase tracking-widest text-stone-400">{a}</div><div className={`mt-2 text-2xl font-black ${c}`}>{b}</div></div>)}</div><div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h3 className="font-black">Spending by category</h3><div className="mt-4 space-y-4">{entries.length ? entries.map(([c, v]) => <div key={c}><div className="flex justify-between text-sm font-bold"><span>{c}</span><span>{money(v)}</span></div><div className="mt-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, v / Math.max(1, report.expenses) * 100)}%` }} /></div></div>) : <div className="text-sm text-stone-400">No expense data yet.</div>}</div></div><div className="grid gap-4 md:grid-cols-2">{accounts.map((a) => <div key={a.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><div className="text-xs font-black text-stone-400">{a.name}</div><div className="mt-1 text-2xl font-black">{money(accountBalance(a.id))}</div></div>)}</div></div>; };

  const tabs = [['accounts', Wallet, 'Accounts'], ['budget', PiggyBank, 'Budgets'], ['recurring', Repeat2, 'Recurring'], ['calendar', CalendarDays, 'Calendar'], ['goals', Target, 'Goals'], ['debt', Landmark, 'Debt'], ['reports', BarChart3, 'Reports']];
  const content = tab === 'accounts' ? renderAccounts() : tab === 'budget' ? renderBudgets() : tab === 'recurring' ? renderRecurring() : tab === 'calendar' ? renderCalendar() : tab === 'goals' ? renderGoals() : tab === 'debt' ? renderDebt() : renderReports();

  return <div className="space-y-5"><div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900"><div className="flex min-w-max gap-2">{tabs.map(([key, Icon, name]) => <button key={key} type="button" onClick={() => setTab(key)} className={`flex min-h-11 items-center gap-2 rounded-2xl px-3.5 text-xs font-black ${tab === key ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-500 dark:text-stone-400'}`}><Icon size={15} />{name}</button>)}</div></div>{content}<div className="flex gap-3 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200"><CheckCircle2 size={18} className="shrink-0" /><div className="text-xs font-semibold">Planning is now data-driven: all number inputs stay focused while typing, and every feature uses your account and transaction data.</div></div></div>;
}

export { FinanceHub };
export default FinanceHub;
