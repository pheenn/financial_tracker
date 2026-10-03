export const DEFAULT_DATA = {
	habit: { name: 'Gambling', daysFree: 3, lastIncrementDate: null },
	baseAllowance: 5000,
	wallets: { cash: 0, gcash: 0 },
	theme: 'light',
	strategyNote:
		'2000 - will loan to Atome in order to survive October and will pay full in November so that no interest and will borrow again and pay full until march and slowly pay it 500 per month.',
	bills: [
		{
			id: 1,
			name: 'bill ease',
			amount: 451,
			totalInstallments: 6,
			startMonth: '2026-10',
			dueDate: 7
		},
		{
			id: 2,
			name: 'megapeso',
			amount: 950,
			totalInstallments: 1,
			startMonth: '2026-10',
			dueDate: 9
		},
		{
			id: 3,
			name: 'mobilis cash',
			amount: 272,
			totalInstallments: 1,
			startMonth: '2026-10',
			dueDate: 25
		},
		{
			id: 4,
			name: 'maya credit',
			amount: 560,
			totalInstallments: 1,
			startMonth: '2026-10',
			dueDate: 2
		},
		{
			id: 5,
			name: 'G cash loan',
			amount: 355,
			totalInstallments: 5,
			startMonth: '2026-11',
			dueDate: 2
		},
		{
			id: 6,
			name: 'rent sa bh',
			amount: 1700,
			totalInstallments: 999,
			startMonth: '2026-10',
			dueDate: 1
		},
		{
			id: 7,
			name: 'megapeso (new)',
			amount: 236,
			totalInstallments: 2,
			startMonth: '2026-11',
			dueDate: 9
		}
	],
	paidRecords: [],
	dailyLogs: [
		{
			id: 1,
			date: 'Sep 28',
			text: 'Saba Red Sardines',
			cost: 0,
			monthStr: '2026-10',
			type: 'expense',
			category: 'Food'
		},
		{
			id: 2,
			date: 'Sep 29',
			text: 'Lucky me with 1 egg at 5 tuyo\n5 bread',
			cost: 0,
			monthStr: '2026-10',
			type: 'expense',
			category: 'Food'
		},
		{
			id: 3,
			date: 'Sep 30',
			text: '2 eggs, lucky me with 2 eggs\n3 Skyflakes',
			cost: 0,
			monthStr: '2026-10',
			type: 'expense',
			category: 'Food'
		},
		{
			id: 4,
			date: 'Oct 01',
			text: '2 eggs 20\nLucky me 10',
			cost: 30,
			monthStr: '2026-10',
			type: 'expense',
			category: 'Food'
		}
	]
};
