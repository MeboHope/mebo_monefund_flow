import type { SubscriptionPlan } from '../types';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    audience: 'Individuals starting out',
    limits: ['2 Money Spaces', 'Basic reports', '90 days history'],
    features: ['Income and expense tracking', 'Basic budgets', 'Manual M-Pesa records']
  },
  {
    id: 'personal_pro',
    name: 'Personal Pro',
    priceMonthly: 950,
    audience: 'Serious personal users',
    limits: ['Unlimited spaces', 'Unlimited history'],
    features: ['Advanced reports', 'Goals', 'Recurring bills', 'Exports', 'PesaWeave AI']
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 2900,
    audience: 'SMEs and professionals',
    limits: ['10 users included', 'Invoices', 'Approvals'],
    features: ['Customers and suppliers', 'P&L', 'Cash flow', 'Roles', 'Audit logs']
  },
  {
    id: 'chama',
    name: 'Chama',
    priceMonthly: 1900,
    audience: 'Groups and welfare funds',
    limits: ['100 members', 'Contribution schedules'],
    features: ['Member statements', 'Loans', 'Fines', 'Attendance', 'Chama reports']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 'custom',
    audience: 'Organizations and institutions',
    limits: ['Unlimited users', 'Advanced API access'],
    features: ['Branches', 'Custom roles', 'Dedicated support', 'Advanced audit', 'SSO-ready']
  }
];
