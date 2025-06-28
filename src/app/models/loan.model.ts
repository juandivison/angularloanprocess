export interface Loan {
  id: string;
  clientName: string;
  amount: number;
  interestRate: number;
  paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  gracePeriod: number; // Days before applying late fees
  remainingBalance: number;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: Date;
  // New fields for advanced payment logic
  installments: number; // Number of installments (1 for single payment)
  installmentAmount?: number; // Amount per installment for multi-installment loans
  nextPaymentDate: Date;
  capitalAdvance?: number; // Capital advance for multi-installment loans
  applyAdvanceToCapital?: boolean; // Whether to recalculate installments or keep as advance
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  isLate: boolean;
  lateFee: number;
  // New fields for payment breakdown
  lateFeeAmount: number;
  interestAmount: number;
  capitalAmount: number;
  advanceAmount: number;
}

export interface PaymentBreakdown {
  lateFee: number;
  interest: number;
  capital: number;
  advance: number;
  total: number;
}