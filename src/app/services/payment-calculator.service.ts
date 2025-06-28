import { Injectable } from '@angular/core';
import { Loan, PaymentBreakdown } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentCalculatorService {

  constructor() {}

  /**
   * Calculate payment breakdown for single or multi-installment loans
   */
  calculatePaymentBreakdown(loan: Loan, paymentAmount: number): PaymentBreakdown {
    if (loan.installments === 1) {
      return this.calculateSingleInstallmentBreakdown(loan, paymentAmount);
    } else {
      return this.calculateMultiInstallmentBreakdown(loan, paymentAmount);
    }
  }

  /**
   * Calculate payment breakdown for single installment loans
   */
  private calculateSingleInstallmentBreakdown(loan: Loan, paymentAmount: number): PaymentBreakdown {
    const today = new Date();
    const nextPaymentDate = new Date(loan.nextPaymentDate);
    const periodsOverdue = this.calculatePeriodsOverdue(loan, today);
    
    let lateFee = 0;
    let interest = 0;
    let capital = 0;
    let advance = 0;

    // Calculate late fee if overdue
    if (periodsOverdue > 0) {
      lateFee = this.calculateLateFee(loan, periodsOverdue);
    }

    // Calculate interest based on overdue periods
    if (periodsOverdue >= 0.5) {
      const interestPeriods = Math.ceil(periodsOverdue);
      interest = loan.remainingBalance * (loan.interestRate / 100) * interestPeriods;
    }

    let remainingPayment = paymentAmount;

    // Apply payment in order: late fee, interest, capital
    if (remainingPayment >= lateFee) {
      remainingPayment -= lateFee;
    } else {
      lateFee = remainingPayment;
      remainingPayment = 0;
    }

    if (remainingPayment >= interest) {
      remainingPayment -= interest;
    } else {
      interest = remainingPayment;
      remainingPayment = 0;
    }

    capital = Math.min(remainingPayment, loan.remainingBalance);
    advance = remainingPayment - capital;

    return {
      lateFee,
      interest,
      capital,
      advance,
      total: paymentAmount
    };
  }

  /**
   * Calculate payment breakdown for multi-installment loans
   */
  private calculateMultiInstallmentBreakdown(loan: Loan, paymentAmount: number): PaymentBreakdown {
    const today = new Date();
    const periodsOverdue = this.calculatePeriodsOverdue(loan, today);
    
    let lateFee = 0;
    let interest = 0;
    let capital = 0;
    let advance = 0;

    // Calculate late fee if overdue
    if (periodsOverdue > 0) {
      lateFee = this.calculateLateFee(loan, periodsOverdue);
    }

    // Calculate current installment interest
    const monthlyInterest = loan.remainingBalance * (loan.interestRate / 100) / 12;
    interest = this.getInterestForFrequency(monthlyInterest, loan.paymentFrequency);

    // Calculate installment capital
    const installmentCapital = (loan.installmentAmount || 0) - interest;

    let remainingPayment = paymentAmount;

    // Apply payment in order: late fee, interest, installment capital, advance
    if (remainingPayment >= lateFee) {
      remainingPayment -= lateFee;
    } else {
      lateFee = remainingPayment;
      remainingPayment = 0;
    }

    if (remainingPayment >= interest) {
      remainingPayment -= interest;
    } else {
      interest = remainingPayment;
      remainingPayment = 0;
    }

    if (remainingPayment >= installmentCapital) {
      capital = installmentCapital;
      remainingPayment -= installmentCapital;
    } else {
      capital = remainingPayment;
      remainingPayment = 0;
    }

    // Remaining amount goes to advance
    advance = remainingPayment;

    return {
      lateFee,
      interest,
      capital,
      advance,
      total: paymentAmount
    };
  }

  /**
   * Calculate periods overdue based on payment frequency
   */
  private calculatePeriodsOverdue(loan: Loan, currentDate: Date): number {
    const nextPaymentDate = new Date(loan.nextPaymentDate);
    const daysDifference = Math.floor((currentDate.getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference <= 0) return 0;

    const periodDays = this.getPeriodDays(loan.paymentFrequency);
    return daysDifference / periodDays;
  }

  /**
   * Calculate late fee based on overdue periods
   */
  private calculateLateFee(loan: Loan, periodsOverdue: number): number {
    if (periodsOverdue <= 0) return 0;
    
    // Apply late fee after grace period
    const overdueAfterGrace = Math.max(0, Math.ceil(periodsOverdue) - (loan.gracePeriod / this.getPeriodDays(loan.paymentFrequency)));
    
    if (overdueAfterGrace <= 0) return 0;
    
    // Late fee: 1% of remaining balance per overdue period
    return loan.remainingBalance * 0.01 * overdueAfterGrace;
  }

  /**
   * Get number of days for payment frequency
   */
  private getPeriodDays(frequency: string): number {
    switch (frequency) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'biweekly': return 15;
      case 'monthly': return 30;
      default: return 30;
    }
  }

  /**
   * Get interest amount based on payment frequency
   */
  private getInterestForFrequency(monthlyInterest: number, frequency: string): number {
    switch (frequency) {
      case 'daily': return monthlyInterest / 30;
      case 'weekly': return monthlyInterest / 4;
      case 'biweekly': return monthlyInterest / 2;
      case 'monthly': return monthlyInterest;
      default: return monthlyInterest;
    }
  }

  /**
   * Calculate next payment date after a payment
   */
  calculateNextPaymentDate(loan: Loan, paymentDate: Date): Date {
    const nextDate = new Date(paymentDate);
    const periodDays = this.getPeriodDays(loan.paymentFrequency);
    nextDate.setDate(nextDate.getDate() + periodDays);
    return nextDate;
  }

  /**
   * Recalculate installments when advance is applied to capital
   */
  recalculateInstallments(loan: Loan, advanceAmount: number): { newInstallmentAmount: number, newRemainingBalance: number } {
    const newRemainingBalance = loan.remainingBalance - advanceAmount;
    const remainingInstallments = this.calculateRemainingInstallments(loan);
    
    if (remainingInstallments <= 0) {
      return { newInstallmentAmount: 0, newRemainingBalance: 0 };
    }

    // Recalculate installment amount with remaining balance
    const monthlyInterestRate = loan.interestRate / 100 / 12;
    const frequencyMultiplier = this.getFrequencyMultiplier(loan.paymentFrequency);
    const periodInterestRate = monthlyInterestRate / frequencyMultiplier;

    let newInstallmentAmount: number;
    
    if (periodInterestRate === 0) {
      newInstallmentAmount = newRemainingBalance / remainingInstallments;
    } else {
      newInstallmentAmount = newRemainingBalance * 
        (periodInterestRate * Math.pow(1 + periodInterestRate, remainingInstallments)) /
        (Math.pow(1 + periodInterestRate, remainingInstallments) - 1);
    }

    return { newInstallmentAmount, newRemainingBalance };
  }

  /**
   * Calculate remaining installments
   */
  private calculateRemainingInstallments(loan: Loan): number {
    const today = new Date();
    const endDate = new Date(loan.endDate);
    const remainingDays = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const periodDays = this.getPeriodDays(loan.paymentFrequency);
    return Math.ceil(remainingDays / periodDays);
  }

  /**
   * Get frequency multiplier for interest calculation
   */
  private getFrequencyMultiplier(frequency: string): number {
    switch (frequency) {
      case 'daily': return 30;
      case 'weekly': return 4;
      case 'biweekly': return 2;
      case 'monthly': return 1;
      default: return 1;
    }
  }
}