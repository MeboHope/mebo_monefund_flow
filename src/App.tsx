import { useMemo, useState, type FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  Bell,
  Brain,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  CreditCard,
  Database,
  Download,
  FileText,
  Gauge,
  Globe2,
  HandCoins,
  Home,
  KeyRound,
  Landmark,
  Layers3,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Menu,
  PackageCheck,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  ServerCog,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Target,
  Upload,
  UserCheck,
  Users,
  WalletCards,
  X
} from 'lucide-react';
import { DistributionChart, MiniBars, ProgressRing, TrendChart } from './components/Charts';
import { useWorkspace } from './state/workspaceStore';
import type { Bill, Budget, Goal, Invoice, MoneySpace, PaymentMethod, Transaction } from './types';
import { WorkspaceProvider } from './state/workspaceStore';
import { AuthGate, AuthProvider, useAuth } from './auth/AuthProvider';
import {
  accountBalance,
  budgetStatus,
  budgetUtilization,
  daysUntil,
  formatKES,
  getMonthlyContribution,
  getSpacePerformance,
  getSpaceTransactions,
  suggestCategorization,
  totalsForTransactions
} from './utils/financial';

type ViewKey =
  | 'dashboard'
  | 'spaces'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'invoices'
  | 'chama'
  | 'reports'
  | 'team'
  | 'settings';

const navItems: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'spaces', label: 'Money Spaces', icon: Layers3 },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'accounts', label: 'Accounts', icon: WalletCards },
  { key: 'budgets', label: 'Budgets & Bills', icon: PiggyBank },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'chama', label: 'Chama & Debts', icon: HandCoins },
  { key: 'reports', label: 'Reports', icon: LineChart },
  { key: 'team', label: 'Team & Admin', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings }
];

const quickActions = ['+ Income', '+ Expense', 'Transfer', 'Request Payment', 'Scan Receipt'];

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [experience, setExperience] = useState<'landing' | 'platform'>('landing');
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [activeSpace, setActiveSpace] = useState('all');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (experience === 'landing') {
    return <LandingPage onOpenApp={() => setExperience('platform')} />;
  }

  return (
    <AuthGate>
      <AppShell
        activeView={activeView}
        setActiveView={setActiveView}
        activeSpace={activeSpace}
        setActiveSpace={setActiveSpace}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onOpenLanding={() => setExperience('landing')}
      />
    </AuthGate>
  );
}

function LandingPage({ onOpenApp }: { onOpenApp: () => void }) {
  const { subscriptionPlans } = useWorkspace();
  return (
    <main className="marketing-page">
      <section className="hero-section">
        <nav className="marketing-nav">
          <div className="brand brand--light">
            <img className="brand-logo-icon" src="/brand/pesaweave-icon.svg" alt="PesaWeave" />
            <div>
              <strong>PesaWeave</strong>
              <small>Separate your money. Connect your flows.</small>
            </div>
          </div>
          <div className="marketing-links">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <button className="btn btn--ghost-light" onClick={onOpenApp}>Open Platform</button>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="pill pill--glass"><Sparkles size={16} /> Premium Kenya-focused fintech SaaS</span>
            <h1>One place for every money flow in your life.</h1>
            <p>
              Separate your personal, business, family, project and group finances — while seeing the bigger picture from one secure executive dashboard.
            </p>
            <div className="hero-actions">
              <button className="btn btn--primary btn--large" onClick={onOpenApp}>Start Free</button>
              <button className="btn btn--secondary btn--large" onClick={onOpenApp}>See How It Works</button>
            </div>
            <div className="trust-row">
              <span><Shield size={16} /> Tenant isolation</span>
              <span><Smartphone size={16} /> M-Pesa ready</span>
              <span><BadgeCheck size={16} /> Audit trails</span>
            </div>
          </div>

          <div className="hero-product-card" aria-label="Product dashboard preview">
            <div className="floating-card floating-card--top">
              <span>Available cash</span>
              <strong>{formatKES(0)}</strong>
              <small>Your workspace starts private and empty</small>
            </div>
            <div className="product-window">
              <div className="window-head">
                <span /> <span /> <span />
              </div>
              <div className="window-body">
                <div className="window-sidebar">
                  {['Personal', 'Business', 'Farm', 'Chama'].map((item) => <b key={item}>{item}</b>)}
                </div>
                <div className="window-main">
                  <div className="window-kpis">
                    <div><small>Income</small><strong>{formatKES(0)}</strong></div>
                    <div><small>Expenses</small><strong>{formatKES(0)}</strong></div>
                  </div>
                  <MiniBars values={[18, 18, 18, 18, 18, 18, 18, 18]} color="#22c55e" />
                  <div className="mini-table">
                    <span><i />No records yet<b>Create your first transaction</b></span>
                    <span><i />Money Spaces<b>Personal, business or chama</b></span>
                    <span><i />Accounts<b>M-Pesa, bank or cash</b></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-card floating-card--bottom">
              <span>PesaWeave AI</span>
              <strong>Ask questions after your data is connected.</strong>
              <small>Only authorized tenant data is used</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell" id="features">
        <div className="section-heading">
          <span className="eyebrow">Problem → Solution</span>
          <h2>Every activity gets its own financial space.</h2>
          <p>Stop mixing personal, business, family, chama, rental, farm and project money. PesaWeave keeps each flow separate without forcing users into multiple accounts.</p>
        </div>
        <div className="feature-grid">
          <FeatureCard icon={Layers3} title="Money Spaces" description="Independent accounts, budgets, members, permissions, reports, categories and rules per space." />
          <FeatureCard icon={Smartphone} title="Kenya-first payments" description="M-Pesa, bank, cash, cheque, card and configurable payment-provider architecture." />
          <FeatureCard icon={ReceiptText} title="Smart transactions" description="Income, expenses, transfers, refunds, adjustments, approvals, reconciliation and attachments." />
          <FeatureCard icon={HandCoins} title="Chama mode" description="Members, contributions, welfare, fines, loans, attendance, minutes and statements." />
          <FeatureCard icon={BriefcaseBusiness} title="Business mode" description="Customers, suppliers, invoices, receipts, P&L, branches, departments and approvals." />
          <FeatureCard icon={Brain} title="PesaWeave AI" description="Ask questions about spending, bills, M-Pesa receipts, profitability and cash flow with tenant-safe data access." />
        </div>
      </section>

      <section className="section-shell section-shell--split">
        <div>
          <span className="eyebrow">Onboarding</span>
          <h2>Mobile-first setup for Kenyan users.</h2>
          <p>From “What do you want to manage?” to first M-Pesa, bank and cash accounts in minutes.</p>
          <OnboardingFlow compact />
        </div>
        <div className="mobile-preview">
          <div className="phone-frame">
            <span className="phone-notch" />
            <div className="phone-screen">
              <p className="eyebrow">Mobile Dashboard</p>
              <h3>{formatKES(0)}</h3>
              <small>Your M-Pesa • New Money Space</small>
              <div className="mobile-action-grid">
                {quickActions.map((action) => <button type="button" key={action} onClick={onOpenApp}>{action}</button>)}
              </div>
              <div className="phone-list">
                <span>No records yet<b>Create your first Money Space</b></span>
                <span>Then add M-Pesa, bank or cash<b>Opening balances stay auditable</b></span>
                <span>Start tracking income and expenses<b>Private by default</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell" id="security">
        <div className="section-heading">
          <span className="eyebrow">Security & scale</span>
          <h2>Built as a SaaS financial operating system, not a CRUD tracker.</h2>
        </div>
        <div className="security-grid">
          {[
            ['Tenant isolation', 'Row-level security, memberships and server-side authorization stop ID manipulation leaks.'],
            ['Auditability', 'Financial records are voided, reversed or archived instead of silently overwritten.'],
            ['Payment secrecy', 'M-Pesa/Daraja and bank credentials stay server-side in encrypted environment configuration.'],
            ['Accounting consistency', 'Opening Balance + Credits − Debits = Closing Balance, with transfers excluded from income/expense.']
          ].map(([title, text]) => <div className="security-card" key={title}><CheckCircle2 /> <strong>{title}</strong><p>{text}</p></div>)}
        </div>
      </section>

      <section className="section-shell" id="pricing">
        <div className="section-heading">
          <span className="eyebrow">Configurable plans</span>
          <h2>From one person to SMEs, chamas and enterprises.</h2>
        </div>
        <div className="pricing-grid">
          {subscriptionPlans.map((plan) => (
            <div className={`pricing-card ${plan.id === 'business' ? 'pricing-card--featured' : ''}`} key={plan.id}>
              <span>{plan.audience}</span>
              <h3>{plan.name}</h3>
              <strong>{typeof plan.priceMonthly === 'number' ? `${formatKES(plan.priceMonthly)}/mo` : 'Custom'}</strong>
              <ul>{plan.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <button className="btn btn--secondary" onClick={onOpenApp}>Explore</button>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>A financial control center where every part of your money has its own space.</h2>
        <p>Explore a configured Kenyan workspace and start managing real money flows.</p>
        <button className="btn btn--primary btn--large" onClick={onOpenApp}>Open the SaaS dashboard</button>
      </section>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <article className="feature-card">
      <div className="icon-tile"><Icon size={20} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function AppShell({
  activeView,
  setActiveView,
  activeSpace,
  setActiveSpace,
  mobileNavOpen,
  setMobileNavOpen,
  onOpenLanding
}: {
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  activeSpace: string;
  setActiveSpace: (space: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onOpenLanding: () => void;
}) {
  const { tenant, moneySpaces, transactions, accounts, invoices, notifications } = useWorkspace();
  const { user, localMode, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ title: string; message?: string; tone?: 'success' | 'info' | 'warning' } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [actionMode, setActionMode] = useState<'income' | 'expense' | 'transfer' | 'space' | 'account' | null>(null);
  const selectedSpace = moneySpaces.find((space) => space.id === activeSpace);
  const scopedTransactions = useMemo(() => getSpaceTransactions(transactions, activeSpace), [transactions, activeSpace]);
  const scopedTotals = useMemo(() => totalsForTransactions(scopedTransactions), [scopedTransactions]);
  const balance = useMemo(() => accountBalance(accounts, activeSpace), [accounts, activeSpace]);
  const currentView = navItems.find((item) => item.key === activeView);
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return [
      ...transactions.filter((item) => `${item.description} ${item.reference} ${item.party}`.toLowerCase().includes(query)).map((item) => ({ type: 'Transaction', title: item.description, meta: formatKES(item.amount), view: 'transactions' as ViewKey })),
      ...moneySpaces.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query)).map((item) => ({ type: 'Money Space', title: item.name, meta: item.kind, view: 'spaces' as ViewKey })),
      ...invoices.filter((item) => `${item.number} ${item.customer}`.toLowerCase().includes(query)).map((item) => ({ type: 'Invoice', title: item.number, meta: item.customer, view: 'invoices' as ViewKey }))
    ].slice(0, 6);
  }, [search, transactions, moneySpaces, invoices]);

  const notify = (title: string, message?: string, tone: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ title, message, tone });
    window.setTimeout(() => setToast(null), 3600);
  };

  const openSpaceCreator = () => {
    setActiveView('spaces');
    setActionMode('space');
  };

  const openAccountCreator = () => {
    if (!moneySpaces.length) {
      openSpaceCreator();
      return;
    }
    setActiveView('accounts');
    setActionMode('account');
  };

  const handleQuickAction = (action: string) => {
    if (!moneySpaces.length) {
      openSpaceCreator();
      return;
    }
    if (!accounts.length) {
      openAccountCreator();
      return;
    }
    if (action.includes('Income') || action.includes('Request')) setActionMode('income');
    else if (action.includes('Expense') || action.includes('Scan')) setActionMode('expense');
    else if (action.includes('Transfer')) setActionMode('transfer');
  };

  const userLabel = String(user?.user_metadata?.full_name || user?.email || (localMode ? 'Local setup user' : 'Account Owner'));
  const userInitials = userLabel.split(/\s|@/).filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') || 'AO';

  const sidebar = (
    <aside className="sidebar">
      <button className="brand brand-button" onClick={onOpenLanding} aria-label="Open marketing site">
        <img className="brand-logo-icon" src="/brand/pesaweave-icon.svg" alt="PesaWeave" />
        <div>
          <strong>PesaWeave</strong>
          <small>{tenant.plan.replace('_', ' ')} plan</small>
        </div>
      </button>
      <div className="tenant-card">
        <div>
          <span className="eyebrow">Tenant</span>
          <strong>{tenant.name}</strong>
          <small>Isolated tenant workspace</small>
        </div>
        <Shield size={18} />
      </div>
      <nav className="main-nav" aria-label="Primary navigation">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={activeView === key ? 'active' : ''}
            onClick={() => {
              setActiveView(key);
              setMobileNavOpen(false);
            }}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-session-card">
          <i>{userInitials}</i>
          <div>
            <strong>{userLabel}</strong>
            <small>{localMode ? 'Local setup mode' : 'Authenticated session'}</small>
          </div>
        </div>
        <div className="privacy-lock"><LockKeyhole size={16} /> Financial privacy enabled</div>
        <small>All sensitive operations require tenant, membership and role checks.</small>
        <button type="button" className="sidebar-action" onClick={() => signOut()}>Sign out</button>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      {sidebar}
      {mobileNavOpen && <div className="mobile-drawer"><button className="drawer-close" onClick={() => setMobileNavOpen(false)}><X /></button>{sidebar}</div>}
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="topbar-title">
            <span className="eyebrow">{currentView?.label}</span>
            <h1>{selectedSpace ? selectedSpace.name : 'Consolidated Financial View'}</h1>
          </div>
          <div className="global-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search M-Pesa transactions above 10,000…" />
            {searchResults.length > 0 && (
              <div className="search-popover">
                {searchResults.map((result) => <button key={`${result.type}-${result.title}`} onClick={() => { setActiveView(result.view); setSearch(''); notify(`Opened ${result.type}`, result.title, 'success'); }}><span>{result.type}</span><strong>{result.title}</strong><small>{result.meta}</small></button>)}
              </div>
            )}
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setShowNotifications((open) => !open)} aria-label="Open notifications"><Bell size={18} />{notifications.length > 0 && <i className="notification-dot" />}</button>
            <div className="avatar">{userInitials}</div>
          </div>
          {showNotifications && (
            <div className="notification-popover">
              <strong>Notifications</strong>
              {notifications.length ? notifications.slice(0, 5).map((item) => <span key={item.id}>{item.title}<small>{item.message}</small></span>) : <span>No notifications yet<small>Important workspace alerts will appear here.</small></span>}
            </div>
          )}
        </header>

        <section className="control-strip">
          <div className="space-switcher">
            <span><ChevronsUpDown size={16} /> Money Space</span>
            <select value={activeSpace} onChange={(event) => setActiveSpace(event.target.value)}>
              <option value="all">All Spaces</option>
              {moneySpaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}
            </select>
          </div>
          <div className="quick-actions">
            {quickActions.map((action) => <button key={action} onClick={() => handleQuickAction(action)}>{action}</button>)}
          </div>
        </section>

        <section className="mobile-summary mobile-only">
          <strong>{formatKES(balance)}</strong>
          <span>Available cash</span>
          <div>{quickActions.slice(0, 3).map((action) => <button key={action} onClick={() => handleQuickAction(action)}>{action}</button>)}</div>
        </section>

        <div className="content-area">
          {activeView === 'dashboard' && moneySpaces.length === 0 && <FirstRunOnboarding onCreateSpace={openSpaceCreator} />}
          {activeView === 'dashboard' && moneySpaces.length > 0 && accounts.length === 0 && <FirstAccountOnboarding onCreateAccount={openAccountCreator} />}
          {activeView === 'dashboard' && moneySpaces.length > 0 && accounts.length > 0 && <DashboardView activeSpace={activeSpace} balance={balance} totals={scopedTotals} transactions={scopedTransactions} />}
          {activeView === 'spaces' && <MoneySpacesView onCreateSpace={openSpaceCreator} />}
          {activeView === 'transactions' && <TransactionsView activeSpace={activeSpace} transactions={scopedTransactions} onAddTransaction={() => { if (!moneySpaces.length) openSpaceCreator(); else if (!accounts.length) openAccountCreator(); else setActionMode('expense'); }} onNotify={notify} />}
          {activeView === 'accounts' && <AccountsPaymentsView activeSpace={activeSpace} onCreateAccount={openAccountCreator} onCreateTransfer={() => { if (accounts.length < 2) openAccountCreator(); else setActionMode('transfer'); }} />}
          {activeView === 'budgets' && <BudgetsBillsGoalsView activeSpace={activeSpace} />}
          {activeView === 'invoices' && <InvoicesBusinessView activeSpace={activeSpace} onNotify={notify} />}
          {activeView === 'chama' && <ChamaDebtsView activeSpace={activeSpace} />}
          {activeView === 'reports' && <ReportsAnalyticsView activeSpace={activeSpace} onNotify={notify} />}
          {activeView === 'team' && <TeamAdminSecurityView />}
          {activeView === 'settings' && <SettingsArchitectureView onNotify={notify} />}
        </div>
      </main>
      {toast && <div className={`toast toast--${toast.tone ?? 'info'}`}><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>}
      {actionMode && (
        <ActionDrawer
          mode={actionMode}
          activeSpace={activeSpace}
          onClose={() => setActionMode(null)}
          onSpaceCreated={(spaceId) => setActiveSpace(spaceId)}
        />
      )}
    </div>
  );
}

function ActionDrawer({
  mode,
  activeSpace,
  onClose,
  onSpaceCreated
}: {
  mode: 'income' | 'expense' | 'transfer' | 'space' | 'account';
  activeSpace: string;
  onClose: () => void;
  onSpaceCreated: (spaceId: string) => void;
}) {
  const { moneySpaces, accounts, addTransaction, createTransfer, addMoneySpace, addAccount } = useWorkspace();
  const firstSpaceId = activeSpace !== 'all' ? activeSpace : moneySpaces[0]?.id ?? '';
  const [spaceId, setSpaceId] = useState(firstSpaceId);
  const scopedAccounts = accounts.filter((account) => account.spaceId === spaceId);
  const [accountId, setAccountId] = useState(scopedAccounts[0]?.id ?? accounts[0]?.id ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts.find((account) => account.id !== accountId)?.id ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(mode === 'income' ? 'Income' : 'Expenses');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [party, setParty] = useState('');
  const [reference, setReference] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [spaceKind, setSpaceKind] = useState('business');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('bank');
  const [institution, setInstitution] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const title = mode === 'income' ? 'Record income' : mode === 'expense' ? 'Record expense' : mode === 'transfer' ? 'Create transfer' : mode === 'space' ? 'Create Money Space' : 'Add account';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (mode === 'space') {
        if (!spaceName.trim()) throw new Error('Money Space name is required.');
        const created = addMoneySpace({
          name: spaceName,
          description: spaceDescription || 'New financial workspace',
          kind: spaceKind as MoneySpace['kind'],
          openingBalance: Number(amount || 0)
        });
        onSpaceCreated(created.id);
        setSuccess('Money Space created successfully.');
        setTimeout(onClose, 650);
        return;
      }

      if (mode === 'account') {
        if (!accountName.trim()) throw new Error('Account name is required.');
        const created = addAccount({
          spaceId,
          name: accountName,
          type: accountType as typeof accounts[number]['type'],
          institution: institution || accountType,
          accountRef: accountRef || 'Not provided',
          openingBalance: Number(amount || 0),
          notes: description
        });
        setSuccess(`${created.name} added successfully.`);
        setTimeout(onClose, 650);
        return;
      }

      if (mode === 'transfer') {
        createTransfer({
          sourceAccountId: accountId,
          destinationAccountId,
          amount: Number(amount),
          description: description || 'Internal transfer',
          reference
        });
        setSuccess('Transfer created without inflating income or expenses.');
        setTimeout(onClose, 650);
        return;
      }

      if (!description.trim()) throw new Error('Description is required.');
      addTransaction({
        type: mode,
        amount: Number(amount),
        spaceId,
        accountId,
        category,
        description,
        paymentMethod,
        party,
        reference,
        tags: category ? [category.toLowerCase().replace(/\s+/g, '-')] : []
      } as Parameters<typeof addTransaction>[0]);
      setSuccess(`${title} saved successfully.`);
      setTimeout(onClose, 650);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this record.');
    }
  };

  const renderMoneySpaceFields = mode === 'space';
  const renderAccountFields = mode === 'account';
  const renderTransferFields = mode === 'transfer';
  const renderTransactionFields = mode === 'income' || mode === 'expense';

  return (
    <div className="action-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="overlay-backdrop" onClick={onClose} aria-label="Close panel" />
      <aside className="action-drawer">
        <div className="panel-head">
          <div><p className="eyebrow">Secure workspace action</p><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form className="action-form" onSubmit={handleSubmit}>
          {(renderTransactionFields || renderAccountFields) && (
            <label>Money Space
              <select value={spaceId} onChange={(event) => { setSpaceId(event.target.value); setAccountId(accounts.find((account) => account.spaceId === event.target.value)?.id ?? ''); }}>
                {moneySpaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}
              </select>
            </label>
          )}

          {renderTransactionFields && (
            <>
              <label>Account
                <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                  {accounts.filter((account) => account.spaceId === spaceId).map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" /></label>
              <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" /></label>
              <label>Party<input value={party} onChange={(event) => setParty(event.target.value)} placeholder="Customer, supplier or person" /></label>
            </>
          )}

          {renderTransferFields && (
            <>
              <label>Source account
                <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                  {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label>Destination account
                <select value={destinationAccountId} onChange={(event) => setDestinationAccountId(event.target.value)}>
                  {accounts.filter((account) => account.id !== accountId).map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Transfer purpose" /></label>
            </>
          )}

          {renderMoneySpaceFields && (
            <>
              <label>Money Space name<input value={spaceName} onChange={(event) => setSpaceName(event.target.value)} placeholder="Example: New Project" /></label>
              <label>Description<textarea value={spaceDescription} onChange={(event) => setSpaceDescription(event.target.value)} placeholder="What this money flow manages" /></label>
              <label>Type
                <select value={spaceKind} onChange={(event) => setSpaceKind(event.target.value)}>
                  {['personal', 'business', 'family', 'chama', 'farm', 'rental', 'project', 'organization'].map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </select>
              </label>
            </>
          )}

          {renderAccountFields && (
            <>
              <label>Account name<input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Example: KCB Current Account" /></label>
              <label>Account type
                <select value={accountType} onChange={(event) => setAccountType(event.target.value)}>
                  {['mpesa', 'bank', 'cash', 'petty_cash', 'savings', 'wallet'].map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label>Institution<input value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Safaricom, KCB, Equity, Cash" /></label>
              <label>Reference<input value={accountRef} onChange={(event) => setAccountRef(event.target.value)} placeholder="Account number, till or wallet reference" /></label>
            </>
          )}

          <label>Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Ksh 25,000" />
          </label>

          {(renderTransactionFields || renderTransferFields) && <label>Reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional transaction reference" /></label>}

          {renderTransactionFields && (
            <label>Payment method
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                {['mpesa', 'bank', 'cash', 'card', 'cheque', 'airtel_money', 'wallet'].map((method) => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}
              </select>
            </label>
          )}

          {error && <div className="form-message form-message--error">{error}</div>}
          {success && <div className="form-message form-message--success">{success}</div>}
          <div className="button-row">
            <button className="btn btn--primary" type="submit">Save securely</button>
            <button className="btn btn--secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function FirstRunOnboarding({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <div className="view-stack">
      <article className="panel first-run-panel">
        <div>
          <p className="eyebrow">New secure workspace</p>
          <h2>Start with your own data only.</h2>
          <p>No other user's financial records are loaded into a new workspace. Create your first Money Space, add an account, then record income, expenses, transfers, bills and goals.</p>
        </div>
        <div className="first-run-actions">
          <button type="button" className="btn btn--primary btn--large" onClick={onCreateSpace}><Plus size={18} /> Create first Money Space</button>
        </div>
      </article>
      <div className="setup-grid">
        <FeatureCard icon={Layers3} title="Step 1: Money Space" description="Separate personal, business, chama, family, farm, rental or project money into its own isolated workspace." />
        <FeatureCard icon={WalletCards} title="Step 2: Account" description="Add M-Pesa, bank, cash, savings, wallet or petty cash accounts with opening balances." />
        <FeatureCard icon={ArrowLeftRight} title="Step 3: Transactions" description="Record income, expenses and transfers with categories, references, members and audit history." />
      </div>
    </div>
  );
}

function FirstAccountOnboarding({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="view-stack">
      <article className="panel first-run-panel">
        <div>
          <p className="eyebrow">Account setup</p>
          <h2>Add your first money source.</h2>
          <p>Your Money Space is ready. Add an M-Pesa wallet, bank account, cash wallet or savings account before posting transactions.</p>
        </div>
        <div className="first-run-actions">
          <button type="button" className="btn btn--primary btn--large" onClick={onCreateAccount}><Plus size={18} /> Add first account</button>
        </div>
      </article>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, caption, tone = 'blue', trend }: { icon: LucideIcon; title: string; value: string; caption: string; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'red'; trend?: string }) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-icon"><Icon size={20} /></div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
      {trend && <small>{trend}</small>}
    </article>
  );
}

function DashboardView({ activeSpace, balance, totals, transactions: scopedTransactions }: { activeSpace: string; balance: number; totals: ReturnType<typeof totalsForTransactions>; transactions: Transaction[] }) {
  const { moneySpaces, transactions, accounts, bills, debts, goals, notifications, monthlyCashFlow, categoryDistribution } = useWorkspace();
  const spacePerformance = getSpacePerformance(moneySpaces, transactions, accounts);
  const upcomingBills = bills.filter((bill) => bill.status === 'due' || daysUntil(bill.dueDate) <= 7);
  const receivable = debts.filter((debt) => debt.direction === 'owed_to_me').reduce((total, debt) => total + (debt.amount - debt.paid), 0);
  const payable = debts.filter((debt) => debt.direction === 'i_owe').reduce((total, debt) => total + (debt.amount - debt.paid), 0);
  const savingTotal = goals.reduce((total, goal) => total + goal.currentAmount, 0);
  const [assistantPrompt, setAssistantPrompt] = useState('Which money flow needs attention?');
  const [assistantAnswer, setAssistantAnswer] = useState('Your workspace is ready. As you add transactions, I will highlight budget pressure, unusual spending, pending bills, receivables and cash-flow risks for Money Spaces you are allowed to access.');
  const promptAnswers: Record<string, string> = {
    'How much did I receive through M-Pesa?': `M-Pesa income currently totals ${formatKES(transactions.filter((transaction) => transaction.paymentMethod === 'mpesa' && transaction.type === 'income').reduce((total, transaction) => total + transaction.amount, 0))}.`,
    'What bills are due next week?': upcomingBills.length ? `${upcomingBills.length} bill or approval item needs attention in the next seven days.` : 'No bills are due in the next seven days.',
    'Show biggest expenses': transactions.filter((transaction) => transaction.type === 'expense').length ? 'Your largest expense is visible in the recent transactions table below.' : 'No expenses have been recorded yet.',
    'Which project is profitable?': spacePerformance.length ? 'Profitability is shown in the Money Space performance table below.' : 'Create Money Spaces and transactions to calculate profitability.'
  };

  return (
    <div className="view-stack">
      <div className="kpi-grid">
        <KpiCard icon={WalletCards} title="Total money available" value={formatKES(balance)} caption="Cash, banks, mobile money and wallets" trend="Transfers are excluded from income" />
        <KpiCard icon={Banknote} title="Total income" value={formatKES(totals.income)} caption="Approved receipts for selected view" tone="green" trend="+14.2% vs last month" />
        <KpiCard icon={CreditCard} title="Total expenses" value={formatKES(totals.expenses)} caption="Committed and spent money" tone="orange" trend="Budget utilization 76%" />
        <KpiCard icon={LineChart} title="Net cash flow" value={formatKES(totals.netCashFlow)} caption="Income less expenses" tone={totals.netCashFlow >= 0 ? 'purple' : 'red'} trend="Projected closing balance stable" />
      </div>

      <div className="dashboard-grid">
        <TrendChart data={monthlyCashFlow} />
        <DistributionChart data={categoryDistribution} />
      </div>

      <div className="insight-grid">
        <article className="panel ai-panel">
          <div className="panel-head">
            <div><p className="eyebrow">PesaWeave AI</p><h2>Financial assistant</h2></div>
            <Brain />
          </div>
          <div className="assistant-chat">
            <p><strong>You asked:</strong> {assistantPrompt}</p>
            <p><strong>PesaWeave AI:</strong> {assistantAnswer}</p>
          </div>
          <div className="prompt-chips">
            {Object.keys(promptAnswers).map((prompt) => <button type="button" key={prompt} onClick={() => { setAssistantPrompt(prompt); setAssistantAnswer(promptAnswers[prompt]); }}>{prompt}</button>)}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Financial health</p><h2>Snapshot</h2></div><Gauge /></div>
          <div className="health-grid">
            <ProgressRing value={31} label="Savings rate" />
            <ProgressRing value={18} label="Debt ratio" />
            <ProgressRing value={76} label="Budget use" />
          </div>
          <div className="mini-metrics">
            <span>Receivables <b>{formatKES(receivable)}</b></span>
            <span>Payables <b>{formatKES(payable)}</b></span>
            <span>Savings <b>{formatKES(savingTotal)}</b></span>
          </div>
        </article>
      </div>

      <div className="two-column">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Money Space performance</p><h2>{activeSpace === 'all' ? 'All spaces' : 'Selected space'} performance</h2></div><SlidersHorizontal /></div>
          <div className="space-performance-list">
            {spacePerformance.map((space) => (
              <div className="space-performance-row" key={space.id}>
                <span className="space-dot" style={{ background: space.color }} />
                <div>
                  <strong>{space.name}</strong>
                  <small>{space.transactionCount} transactions • {space.period}</small>
                </div>
                <span>{formatKES(space.income)}</span>
                <span>{formatKES(space.expenses)}</span>
                <b className={space.net >= 0 ? 'positive' : 'negative'}>{formatKES(space.net)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Upcoming obligations</p><h2>Bills & approvals</h2></div><Clock /></div>
          <div className="stack-list">
            {upcomingBills.map((bill) => <BillRow bill={bill} key={bill.id} />)}
            {notifications.slice(0, 3).map((notification) => (
              <div className={`notice notice--${notification.severity}`} key={notification.id}>
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-head"><div><p className="eyebrow">Recent activity</p><h2>Latest transactions</h2></div><ReceiptText /></div>
        <TransactionsTable transactions={scopedTransactions.slice(0, 8)} />
      </article>
    </div>
  );
}

function MoneySpacesView({ onCreateSpace }: { onCreateSpace: () => void }) {
  const { moneySpaces, transactions, accounts } = useWorkspace();
  const spacePerformance = getSpacePerformance(moneySpaces, transactions, accounts);
  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Money Spaces</p>
          <h2>Complete separation with consolidated visibility.</h2>
          <p>Each space has independent accounts, categories, members, budgets, reports and rules. The same user can belong to many spaces without creating separate accounts.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onCreateSpace}><Plus size={16} /> New Money Space</button>
      </div>
      <div className="space-card-grid">
        {spacePerformance.map((space) => <MoneySpaceCard space={space} key={space.id} />)}
      </div>
      <OnboardingFlow />
    </div>
  );
}

function MoneySpaceCard({ space }: { space: MoneySpace & { income: number; expenses: number; net: number; balance: number; transactionCount: number } }) {
  const { members } = useWorkspace();
  const spaceMembers = members.filter((member) => space.members.includes(member.id));
  return (
    <article className="money-space-card">
      <div className="space-card-head">
        <span className="space-dot space-dot--large" style={{ background: space.color }} />
        <div>
          <h3>{space.name}</h3>
          <p>{space.description}</p>
        </div>
        <StatusPill status={space.status} />
      </div>
      <div className="space-money-grid">
        <span>Balance <b>{formatKES(space.balance)}</b></span>
        <span>Income <b>{formatKES(space.income)}</b></span>
        <span>Expenses <b>{formatKES(space.expenses)}</b></span>
        <span>Net <b className={space.net >= 0 ? 'positive' : 'negative'}>{formatKES(space.net)}</b></span>
      </div>
      <div className="tag-cloud">
        {space.incomeCategories.slice(0, 3).map((category) => <span key={category}>{category}</span>)}
        {space.expenseCategories.slice(0, 3).map((category) => <span key={category}>{category}</span>)}
      </div>
      <div className="space-footer">
        <span><LockKeyhole size={14} /> {space.privacy}</span>
        <div className="avatar-stack">
          {spaceMembers.map((member) => <i key={member.id}>{member.avatar}</i>)}
        </div>
      </div>
    </article>
  );
}

function TransactionsView({ activeSpace, transactions: scopedTransactions, onAddTransaction, onNotify }: { activeSpace: string; transactions: Transaction[]; onAddTransaction: () => void; onNotify: (title: string, message?: string, tone?: 'success' | 'info' | 'warning') => void }) {
  const { moneySpaces } = useWorkspace();
  const [draft, setDraft] = useState('Naivas 4,850');
  const suggestion = suggestCategorization(draft);
  const suggestedSpace = moneySpaces.find((space) => space.id === suggestion.spaceId);
  const transactionStats = totalsForTransactions(scopedTransactions);
  const exportTransactions = () => {
    const header = ['Date', 'Time', 'Description', 'Type', 'Category', 'Amount', 'Reference', 'Party'];
    const rows = scopedTransactions.map((transaction) => [transaction.date, transaction.time, transaction.description, transaction.type, transaction.category, transaction.amount, transaction.reference, transaction.party]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pesaweave-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('CSV exported', 'Transactions export downloaded.', 'success');
  };

  return (
    <div className="view-stack">
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard icon={Banknote} title="Income" value={formatKES(transactionStats.income)} caption="Selected filter" tone="green" />
        <KpiCard icon={CreditCard} title="Expenses" value={formatKES(transactionStats.expenses)} caption="Selected filter" tone="orange" />
        <KpiCard icon={ArrowLeftRight} title="Transfers" value={formatKES(transactionStats.transfers)} caption="Not counted as income/expense" tone="purple" />
        <KpiCard icon={Clock} title="Pending approvals" value={formatKES(transactionStats.pendingApprovals)} caption="Awaiting manager review" tone="red" />
      </div>

      <div className="two-column two-column--wide-left">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Smart transaction entry</p><h2>AI-assisted categorization</h2></div><Sparkles /></div>
          <label className="smart-input">
            <span>Describe the transaction</span>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="e.g. Rent January – Ksh 35,000" />
          </label>
          <div className="suggestion-card">
            <div><strong>Suggested Money Space</strong><span>{suggestedSpace?.name ?? 'Review required'}</span></div>
            <div><strong>Category</strong><span>{suggestion.category}</span></div>
            <div><strong>Type</strong><span>{suggestion.type}</span></div>
            <div><strong>Confidence</strong><span>{suggestion.confidence}%</span></div>
          </div>
          <p className="helper-text">{suggestion.reason} Users can override every suggestion before approval.</p>
          <div className="button-row">
            <button type="button" className="btn btn--primary" onClick={() => { onNotify('Suggestion accepted', 'Open Add transaction to review and save the categorized record.', 'success'); onAddTransaction(); }}><CheckCircle2 size={16} /> Accept suggestion</button>
            <button type="button" className="btn btn--secondary" onClick={() => onNotify('Override enabled', 'Edit the category, space or account before saving.', 'info')}>Override</button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Import workflow</p><h2>Statements & receipts</h2></div><Upload /></div>
          <div className="workflow-list">
            {['Upload CSV, Excel, bank or M-Pesa statement', 'Map statement columns to system fields', 'Review duplicates and unmatched records', 'Commit approved transactions with audit log'].map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}
          </div>
          <div className="receipt-dropzone">
            <ReceiptText />
            <strong>Scan or upload receipt</strong>
            <small>OCR extracts merchant, date, amount, items, tax and reference for user confirmation.</small>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-head">
          <div><p className="eyebrow">Transactions</p><h2>{activeSpace === 'all' ? 'All transactions' : 'Selected Money Space'}</h2></div>
          <div className="button-row"><button type="button" className="btn btn--secondary" onClick={exportTransactions}><Download size={16} /> Export CSV</button><button type="button" className="btn btn--primary" onClick={onAddTransaction}><Plus size={16} /> Add transaction</button></div>
        </div>
        <TransactionsTable transactions={scopedTransactions} onCreate={onAddTransaction} />
      </article>
    </div>
  );
}

function AccountsPaymentsView({ activeSpace, onCreateAccount, onCreateTransfer }: { activeSpace: string; onCreateAccount: () => void; onCreateTransfer: () => void }) {
  const { accounts, moneySpaces } = useWorkspace();
  const scopedAccounts = activeSpace === 'all' ? accounts : accounts.filter((account) => account.spaceId === activeSpace);
  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Accounts & money sources</p>
          <h2>M-Pesa, bank, cash and wallet balances per Money Space.</h2>
          <p>Transfers affect balances without inflating income or expenses. Provider credentials are stored server-side only.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onCreateAccount}><Plus size={16} /> Add account</button>
      </div>
      <div className="account-grid">
        {scopedAccounts.map((account) => {
          const space = moneySpaces.find((item) => item.id === account.spaceId);
          return (
            <article className="account-card" key={account.id}>
              <div className="account-icon">{account.type === 'mpesa' ? <Smartphone /> : account.type === 'bank' ? <Landmark /> : <WalletCards />}</div>
              <div>
                <span>{space?.name}</span>
                <h3>{account.name}</h3>
                <p>{account.institution} • {account.accountRef}</p>
              </div>
              <strong>{formatKES(account.currentBalance)}</strong>
              <small>{account.status} • {account.currency}</small>
            </article>
          );
        })}
      </div>
      <div className="two-column">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Transfer center</p><h2>Move money safely</h2></div><ArrowLeftRight /></div>
          <div className="transfer-box">
            <label>From<select>{accounts.length ? accounts.map((account) => <option key={account.id}>{account.name}</option>) : <option>Add an account first</option>}</select></label>
            <label>To<select>{accounts.length > 1 ? accounts.map((account) => <option key={account.id}>{account.name}</option>) : <option>Add another account</option>}</select></label>
            <label>Amount<input placeholder="Ksh 45,000" /></label>
            <div className="formula-box">Transfer journals update source and destination balances. They are not income or expenses.</div>
            <button type="button" className="btn btn--primary" onClick={onCreateTransfer}>Create transfer</button>
          </div>
        </article>
        <article className="panel mpesa-panel">
          <div className="panel-head"><div><p className="eyebrow">Kenya-first payments</p><h2>M-Pesa module</h2></div><Smartphone /></div>
          <div className="module-grid">
            {['Record M-Pesa transactions', 'Import statements', 'Match to Money Spaces', 'Search by phone/reference', 'Payment requests', 'Confirmations & status'].map((item) => <span key={item}><CheckCircle2 size={15} /> {item}</span>)}
          </div>
          <div className="secure-note"><KeyRound size={16} /> Daraja credentials are never exposed in frontend code and are enabled per tenant integration.</div>
        </article>
      </div>
    </div>
  );
}

function BudgetsBillsGoalsView({ activeSpace }: { activeSpace: string }) {
  const { budgets, bills, goals } = useWorkspace();
  const scopedBudgets = activeSpace === 'all' ? budgets : budgets.filter((budget) => budget.spaceId === activeSpace);
  const scopedBills = activeSpace === 'all' ? bills : bills.filter((bill) => bill.spaceId === activeSpace);
  const scopedGoals = activeSpace === 'all' ? goals : goals.filter((goal) => goal.spaceId === activeSpace);

  return (
    <div className="view-stack">
      <div className="three-column">
        <article className="panel panel--span-two">
          <div className="panel-head"><div><p className="eyebrow">Budgets</p><h2>Warnings at 70%, 90% and 100%</h2></div><PiggyBank /></div>
          <div className="budget-list">
            {scopedBudgets.map((budget) => <BudgetRow budget={budget} key={budget.id} />)}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Recurring bills</p><h2>Upcoming</h2></div><Clock /></div>
          <div className="stack-list">{scopedBills.map((bill) => <BillRow bill={bill} key={bill.id} />)}</div>
        </article>
      </div>
      <article className="panel">
        <div className="panel-head"><div><p className="eyebrow">Savings goals</p><h2>Target tracking</h2></div><Target /></div>
        <div className="goal-grid">
          {scopedGoals.map((goal) => <GoalCard goal={goal} key={goal.id} />)}
        </div>
      </article>
    </div>
  );
}

function InvoicesBusinessView({ activeSpace, onNotify }: { activeSpace: string; onNotify: (title: string, message?: string, tone?: 'success' | 'info' | 'warning') => void }) {
  const { invoices, moneySpaces } = useWorkspace();
  const scopedInvoices = activeSpace === 'all' ? invoices : invoices.filter((invoice) => invoice.spaceId === activeSpace);
  const businessSpaces = moneySpaces.filter((space) => ['business', 'project', 'rental'].includes(space.kind));
  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Business mode</p>
          <h2>Customers, suppliers, invoices, P&L and cash flow.</h2>
          <p>Convert any Money Space into a richer business workspace with branches, departments and approval workflows.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => onNotify('Invoice builder ready', 'Customer and invoice creation workflow will open here after customer setup is connected.', 'info')}><Plus size={16} /> New invoice</button>
      </div>
      <div className="business-mode-grid">
        {businessSpaces.map((space) => <article className="mode-card" key={space.id}><span className="space-dot" style={{ background: space.color }} /><h3>{space.name}</h3><p>{space.description}</p><div><b>Customers</b><b>Suppliers</b><b>Invoices</b><b>P&L</b></div></article>)}
      </div>
      <article className="panel">
        <div className="panel-head"><div><p className="eyebrow">Invoices</p><h2>Professional invoice system</h2></div><FileText /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Space</th><th>Due</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>{scopedInvoices.map((invoice) => <InvoiceRow invoice={invoice} key={invoice.id} />)}</tbody>
          </table>
        </div>
      </article>
      <div className="two-column">
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">Invoice builder</p><h2>Tax-ready fields</h2></div><PackageCheck /></div><div className="module-grid"><span>Business details</span><span>Customer</span><span>Items & quantities</span><span>Tax and discounts</span><span>Payment instructions</span><span>PDF generation hook</span></div></article>
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">Approval workflow</p><h2>Ksh 35,000 expense</h2></div><UserCheck /></div><div className="approval-flow"><span>Submitted by Staff</span><i /> <span>Manager Review</span><i /> <span>Approved + finalized</span></div><p className="helper-text">Rejected or changed transactions remain in history with an audit trail.</p></article>
      </div>
    </div>
  );
}

function ChamaDebtsView({ activeSpace }: { activeSpace: string }) {
  const { debts, chamaMembers } = useWorkspace();
  const scopedDebts = activeSpace === 'all' ? debts : debts.filter((debt) => debt.spaceId === activeSpace);
  const owedToMe = scopedDebts.filter((debt) => debt.direction === 'owed_to_me').reduce((total, debt) => total + debt.amount - debt.paid, 0);
  const iOwe = scopedDebts.filter((debt) => debt.direction === 'i_owe').reduce((total, debt) => total + debt.amount - debt.paid, 0);
  return (
    <div className="view-stack">
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard icon={HandCoins} title="You are owed" value={formatKES(owedToMe)} caption="Receivables and customer balances" tone="green" />
        <KpiCard icon={CreditCard} title="You owe" value={formatKES(iOwe)} caption="Payables and loan balances" tone="orange" />
        <KpiCard icon={LineChart} title="Net position" value={formatKES(owedToMe - iOwe)} caption="Receivables less payables" tone="purple" />
        <KpiCard icon={Users} title="Chama members" value={`${chamaMembers.length}`} caption="Member statements available" />
      </div>
      <div className="two-column two-column--wide-left">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Chama mode</p><h2>Chama member statements</h2></div><Users /></div>
          <div className="table-wrap">
            <table><thead><tr><th>Member</th><th>Phone</th><th>Contributions</th><th>Loans</th><th>Fines</th><th>Attendance</th></tr></thead><tbody>{chamaMembers.map((member) => <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.phone}</td><td>{formatKES(member.contributions)}</td><td>{formatKES(member.loans)}</td><td>{formatKES(member.fines)}</td><td>{member.attendance}%</td></tr>)}</tbody></table>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Debt & receivables</p><h2>Balances</h2></div><HandCoins /></div>
          <div className="stack-list">
            {scopedDebts.map((debt) => <div className="debt-row" key={debt.id}><strong>{debt.person}</strong><span>{debt.purpose}</span><b>{formatKES(debt.amount - debt.paid)}</b><StatusBadge label={debt.status} /></div>)}
          </div>
        </article>
      </div>
      <article className="panel">
        <div className="panel-head"><div><p className="eyebrow">Chama workflows</p><h2>Contributions, loans, welfare and meetings</h2></div><ReceiptText /></div>
        <div className="workflow-grid">
          {['Registration', 'Contribution schedules', 'Welfare contributions', 'Fines', 'Loans & interest', 'Meeting minutes', 'Attendance', 'Member statements'].map((item) => <span key={item}>{item}</span>)}
        </div>
      </article>
    </div>
  );
}

function ReportsAnalyticsView({ activeSpace, onNotify }: { activeSpace: string; onNotify: (title: string, message?: string, tone?: 'success' | 'info' | 'warning') => void }) {
  const { monthlyCashFlow } = useWorkspace();
  const reportNames = ['Income statement', 'Expense report', 'Cash-flow report', 'Profit & loss', 'Budget report', 'Account statement', 'Money Space statement', 'Customer statement', 'Supplier statement', 'Debt report', 'Receivables', 'Payables', 'Tax summary', 'Transaction report', 'Chama contribution report', 'Project profitability'];
  return (
    <div className="view-stack">
      <div className="page-intro">
        <div><p className="eyebrow">Reports center</p><h2>Premium reporting with filters and exports.</h2><p>Date, Money Space, category, account, user and status filters are designed for server-side querying at scale.</p></div>
        <div className="button-row"><button type="button" className="btn btn--secondary" onClick={() => onNotify('PDF export queued', 'Production exports should run as authenticated backend jobs.', 'info')}><Download size={16} /> PDF</button><button type="button" className="btn btn--secondary" onClick={() => onNotify('Excel export queued', 'Production exports should run as authenticated backend jobs.', 'info')}><Download size={16} /> Excel</button><button type="button" className="btn btn--primary" onClick={() => onNotify('CSV export queued', 'Production exports should run as authenticated backend jobs.', 'success')}><Download size={16} /> CSV</button></div>
      </div>
      <div className="report-grid">{reportNames.map((name) => <article className="report-card" key={name}><FileText size={18} /><strong>{name}</strong><span>{activeSpace === 'all' ? 'All spaces' : 'Filtered'}</span></article>)}</div>
      <div className="dashboard-grid">
        <TrendChart data={monthlyCashFlow} />
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Reconciliation</p><h2>System vs actual balance</h2></div><BadgeCheck /></div>
          <div className="reconciliation-list">
            <span><CheckCircle2 /> Matched transactions <b>238</b></span>
            <span><AlertTriangle /> Missing transactions <b>12</b></span>
            <span><AlertTriangle /> Duplicate candidates <b>4</b></span>
            <span><Clock /> Unmatched M-Pesa items <b>9</b></span>
          </div>
          <div className="formula-box">Opening Balance + Credits − Debits = Closing Balance. Reversals create counter-transactions.</div>
        </article>
      </div>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">Financial analytics</p><h2>Simple explanations, not accounting overload</h2></div><Gauge /></div><div className="analytics-grid">{['Income growth 14.2%', 'Expense growth 8.5%', 'Savings rate 31%', 'Debt ratio 18%', 'Cash runway 4.6 months', 'Budget utilization 76%', 'Receivables healthy', 'Payables manageable'].map((item) => <span key={item}>{item}</span>)}</div></article>
    </div>
  );
}

function TeamAdminSecurityView() {
  const { members, adminMetrics, auditLogs, subscriptionPlans } = useWorkspace();
  const permissions = [
    ['Owner', 'Full tenant and platform data control'],
    ['Administrator', 'Manage Money Space settings and members'],
    ['Accountant', 'Transactions, reconciliation and reports'],
    ['Manager', 'Reports and approvals'],
    ['Staff', 'Create transactions only'],
    ['Viewer', 'Read-only access'],
    ['Auditor', 'Transactions and audit logs']
  ];
  return (
    <div className="view-stack">
      <div className="two-column two-column--wide-left">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Team & permissions</p><h2>Granular role-based access</h2></div><Users /></div>
          <div className="member-list">{members.map((member) => <div className="member-row" key={member.id}><i>{member.avatar}</i><div><strong>{member.name}</strong><span>{member.email}</span></div><StatusBadge label={member.role} /><small>{member.spaces.length} spaces • 2FA {member.twoFactorEnabled ? 'on' : 'off'}</small></div>)}</div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Security controls</p><h2>Core protection</h2></div><Shield /></div>
          <div className="security-checklist">{['Email verification', 'Password reset', 'Optional 2FA', 'Secure cookies', 'Rate limiting', 'CSRF where applicable', 'Input sanitization', 'Encrypted sensitive data', 'Row-level security', 'Audit logging'].map((item) => <span key={item}><CheckCircle2 size={15} /> {item}</span>)}</div>
        </article>
      </div>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">Permission model</p><h2>Configurable roles</h2></div><KeyRound /></div><div className="permission-grid">{permissions.map(([role, text]) => <div key={role}><strong>{role}</strong><span>{text}</span></div>)}</div></article>
      <div className="two-column">
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">SaaS admin panel</p><h2>Platform metrics</h2></div><Building2 /></div><div className="admin-metrics">{Object.entries(adminMetrics).map(([key, value]) => <span key={key}>{key.replace(/([A-Z])/g, ' $1')}<b>{typeof value === 'number' && value > 1000 ? value.toLocaleString('en-KE') : value}</b></span>)}</div></article>
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">Audit trail</p><h2>Immutable history</h2></div><Database /></div><div className="stack-list">{auditLogs.map((log) => <div className="audit-row" key={log.id}><strong>{log.actor}</strong><span>{log.action} • {log.entityId}</span><small>{log.timestamp} • {log.ip}</small></div>)}</div></article>
      </div>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">Plan management</p><h2>Configurable SaaS subscriptions</h2></div><CreditCard /></div><div className="plan-row-grid">{subscriptionPlans.map((plan) => <div key={plan.id}><strong>{plan.name}</strong><span>{typeof plan.priceMonthly === 'number' ? formatKES(plan.priceMonthly) : 'Custom'}</span><small>{plan.features.join(' • ')}</small></div>)}</div></article>
    </div>
  );
}

function SettingsArchitectureView({ onNotify }: { onNotify: (title: string, message?: string, tone?: 'success' | 'info' | 'warning') => void }) {
  return (
    <div className="view-stack">
      <div className="page-intro"><div><p className="eyebrow">Settings & architecture</p><h2>API-first, secure and future-ready.</h2><p>Configuration panels model how production tenants enable payments, taxes, currencies, categories, privacy and integrations.</p></div><button type="button" className="btn btn--primary" onClick={() => onNotify('Settings saved', 'Production settings are persisted through secured tenant APIs.', 'success')}><Settings size={16} /> Save settings</button></div>
      <div className="settings-grid">
        <SettingsCard icon={Smartphone} title="Payment integrations" items={['M-Pesa/Daraja per tenant', 'Airtel Money-ready adapter', 'Bank gateway adapter', 'Secrets stored server-side']} />
        <SettingsCard icon={Globe2} title="Currencies" items={['KES default', 'USD', 'EUR', 'GBP', 'UGX', 'TZS']} />
        <SettingsCard icon={ReceiptText} title="Tax readiness" items={['Configurable tax rates', 'Tax-inclusive/exclusive', 'PIN details', 'KRA integration-ready — no false filing claims']} />
        <SettingsCard icon={LockKeyhole} title="Privacy controls" items={['Lock sensitive spaces', 'Hide balances', 'Restrict reports', 'Export or delete account request']} />
      </div>
      <div className="two-column">
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">Database architecture</p><h2>Tenant-isolated relational model</h2></div><Database /></div><div className="module-grid module-grid--dense">{['users', 'tenants', 'memberships', 'money_spaces', 'accounts', 'transactions', 'categories', 'budgets', 'goals', 'bills', 'invoices', 'customers', 'suppliers', 'loans', 'payments', 'subscriptions', 'audit_logs', 'notifications', 'attachments'].map((item) => <span key={item}>{item}</span>)}</div></article>
        <article className="panel"><div className="panel-head"><div><p className="eyebrow">API-first modules</p><h2>Future mobile, USSD & partner integrations</h2></div><ServerCog /></div><div className="module-grid module-grid--dense">{['Authentication', 'Users', 'Tenants', 'Money Spaces', 'Accounts', 'Transactions', 'Payments', 'Invoices', 'Reports', 'Notifications', 'Subscriptions', 'AI Assistant'].map((item) => <span key={item}>{item}</span>)}</div></article>
      </div>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">Production notes</p><h2>Important financial rules</h2></div><AlertTriangle /></div><div className="rule-list"><span>Financial data is never fetched by raw frontend IDs without tenant membership verification.</span><span>Transfers are paired ledger movements and are excluded from income/expense charts.</span><span>Void, archive or reverse important records instead of hard deletion.</span><span>All imports pass through preview, duplicate detection, reconciliation and audit logging.</span></div></article>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return <article className="settings-card"><Icon /><h3>{title}</h3>{items.map((item) => <span key={item}>{item}</span>)}</article>;
}

function OnboardingFlow({ compact = false }: { compact?: boolean }) {
  const steps = [
    ['Welcome', 'What do you want to manage?', 'Personal, business, chama, rental property, farm, project, organization or multiple activities.'],
    ['Create Money Space', 'Set name, currency and period', 'Choose KES by default and configure categories or use Kenyan templates.'],
    ['Add accounts', 'M-Pesa, bank, cash and other', 'Opening balances create audit-safe opening balance transactions.'],
    ['Set goals', 'School fees, emergency fund or business equipment', 'The system calculates remaining amount and required monthly contribution.'],
    ['Start tracking', 'Quick-add income, expense, transfer or receipt upload', 'Smart categorization suggests space, category, project and tags.']
  ];
  return <article className={`panel onboarding ${compact ? 'onboarding--compact' : ''}`}><div className="panel-head"><div><p className="eyebrow">Onboarding flow</p><h2>Beautiful guided setup</h2></div><Sparkles /></div><div className="onboarding-steps">{steps.map(([title, heading, text], index) => <div key={title}><b>{index + 1}</b><strong>{title}</strong><span>{heading}</span><p>{text}</p></div>)}</div></article>;
}

function TransactionsTable({ transactions: rows, onCreate }: { transactions: Transaction[]; onCreate?: () => void }) {
  const { moneySpaces } = useWorkspace();
  if (!rows.length) return <EmptyState title="No transactions yet" text="Add income, expenses, transfers or import a statement to begin." onAction={onCreate} actionLabel="Add transaction" />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Space</th><th>Method</th><th>Category</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          {rows.map((transaction) => {
            const space = moneySpaces.find((item) => item.id === transaction.spaceId);
            return (
              <tr key={transaction.id}>
                <td><strong>{transaction.date}</strong><small>{transaction.time}</small></td>
                <td><strong>{transaction.description}</strong><small>{transaction.reference} • {transaction.party}</small></td>
                <td><span className="inline-space"><i style={{ background: space?.color }} />{space?.name}</span></td>
                <td>{transaction.paymentMethod.replace('_', ' ')}</td>
                <td>{transaction.category}</td>
                <td><StatusBadge label={`${transaction.approvalStatus} / ${transaction.reconciliationStatus}`} /></td>
                <td className={`text-right ${transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : ''}`}><strong>{transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}{formatKES(transaction.amount)}</strong><small>{transaction.type}</small></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BudgetRow({ budget }: { budget: Budget }) {
  const utilization = budgetUtilization(budget);
  const status = budgetStatus(budget);
  return (
    <div className={`budget-row budget-row--${status}`}>
      <div><strong>{budget.name}</strong><span>{budget.category} • {budget.period}</span></div>
      <div className="progress-track"><i style={{ width: `${Math.min(100, utilization)}%` }} /></div>
      <b>{utilization}%</b>
      <span>{formatKES(budget.limit - budget.spent)} remaining</span>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  return (
    <article className="goal-card">
      <div><Target /><strong>{goal.name}</strong></div>
      <ProgressRing value={percent} label="funded" />
      <span>{formatKES(goal.currentAmount)} of {formatKES(goal.targetAmount)}</span>
      <small>Need {formatKES(getMonthlyContribution(goal.targetAmount, goal.currentAmount, goal.targetDate))}/month until {goal.targetDate}</small>
    </article>
  );
}

function BillRow({ bill }: { bill: Bill }) {
  const { markBillPaid } = useWorkspace();
  const dueIn = daysUntil(bill.dueDate);
  const label = bill.status === 'paid' ? 'paid' : dueIn < 0 ? 'overdue' : dueIn === 0 ? 'due today' : `${dueIn} days`;
  return <div className="bill-row"><div><strong>{bill.name}</strong><span>{bill.payee} • {bill.schedule}</span></div><b>{formatKES(bill.amount)}</b><StatusBadge label={label} />{bill.status !== 'paid' && <button type="button" onClick={() => markBillPaid(bill.id)}>Mark paid</button>}</div>;
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const { moneySpaces } = useWorkspace();
  const space = moneySpaces.find((item) => item.id === invoice.spaceId);
  return <tr><td><strong>{invoice.number}</strong><small>Issued {invoice.issuedDate}</small></td><td>{invoice.customer}</td><td><span className="inline-space"><i style={{ background: space?.color }} />{space?.name}</span></td><td>{invoice.dueDate}</td><td><StatusBadge label={invoice.status.replace('_', ' ')} /></td><td className="text-right"><strong>{formatKES(invoice.amount)}</strong><small>Tax {formatKES(invoice.tax)}</small></td></tr>;
}

function StatusPill({ status }: { status: 'healthy' | 'watch' | 'attention' }) {
  return <span className={`status-pill status-pill--${status}`}>{status}</span>;
}

function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const tone = normalized.includes('approved') || normalized.includes('paid') || normalized.includes('healthy') || normalized.includes('matched') || normalized.includes('current') ? 'success' : normalized.includes('overdue') || normalized.includes('rejected') || normalized.includes('critical') ? 'danger' : normalized.includes('pending') || normalized.includes('due') || normalized.includes('review') ? 'warning' : 'neutral';
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}

function EmptyState({ title, text, onAction, actionLabel = 'Create first record' }: { title: string; text: string; onAction?: () => void; actionLabel?: string }) {
  return <div className="empty-state"><ReceiptText /><strong>{title}</strong><span>{text}</span>{onAction && <button type="button" className="btn btn--secondary" onClick={onAction}>{actionLabel}</button>}</div>;
}

export default App;
