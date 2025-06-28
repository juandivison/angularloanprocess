import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Loan, Payment, PaymentBreakdown } from '../models/loan.model';
import { PaymentCalculatorService } from './payment-calculator.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private supabase: SupabaseClient;
  private loans = new BehaviorSubject<Loan[]>([]);

  constructor(private paymentCalculator: PaymentCalculatorService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  async createLoan(loan: Omit<Loan, 'id' | 'createdAt'>): Promise<Loan | null> {
    // Calculate installment amount for multi-installment loans
    let installmentAmount = 0;
    if (loan.installments > 1) {
      const monthlyInterestRate = loan.interestRate / 100 / 12;
      const frequencyMultiplier = this.getFrequencyMultiplier(loan.paymentFrequency);
      const periodInterestRate = monthlyInterestRate / frequencyMultiplier;

      if (periodInterestRate === 0) {
        installmentAmount = loan.amount / loan.installments;
      } else {
        installmentAmount = loan.amount * 
          (periodInterestRate * Math.pow(1 + periodInterestRate, loan.installments)) /
          (Math.pow(1 + periodInterestRate, loan.installments) - 1);
      }
    }

    const loanData = {
      ...loan,
      installmentAmount,
      nextPaymentDate: this.calculateFirstPaymentDate(loan.startDate, loan.paymentFrequency),
      capitalAdvance: 0,
      applyAdvanceToCapital: false,
      createdAt: new Date()
    };

    const { data, error } = await this.supabase
      .from('loans')
      .insert([loanData])
      .select()
      .single();

    if (error) {
      console.error('Error creating loan:', error);
      return null;
    }

    return data;
  }

  async getLoanById(id: string): Promise<Loan | null> {
    const { data, error } = await this.supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching loan:', error);
      return null;
    }

    return data;
  }

  async getLoans(): Promise<Loan[]> {
    const { data, error } = await this.supabase
      .from('loans')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
      return [];
    }

    this.loans.next(data);
    return data;
  }

  async getTodayLoans(): Promise<Loan[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('loans')
      .select('*')
      .gte('createdAt', today.toISOString())
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching today\'s loans:', error);
      return [];
    }

    return data;
  }

  async getLoanPayments(loanId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('loanId', loanId)
      .order('paymentDate', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data;
  }

  async recordPayment(loanId: string, paymentAmount: number, applyAdvanceToCapital: boolean = false): Promise<Payment | null> {
    const loan = await this.getLoanById(loanId);
    if (!loan) return null;

    // Calculate payment breakdown
    const breakdown = this.paymentCalculator.calculatePaymentBreakdown(loan, paymentAmount);

    // Create payment record
    const payment: Omit<Payment, 'id'> = {
      loanId,
      amount: paymentAmount,
      paymentDate: new Date(),
      isLate: breakdown.lateFee > 0,
      lateFee: breakdown.lateFee,
      lateFeeAmount: breakdown.lateFee,
      interestAmount: breakdown.interest,
      capitalAmount: breakdown.capital,
      advanceAmount: breakdown.advance
    };

    const { data: paymentData, error: paymentError } = await this.supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      return null;
    }

    // Update loan based on payment
    await this.updateLoanAfterPayment(loan, breakdown, applyAdvanceToCapital);

    return paymentData;
  }

  private async updateLoanAfterPayment(loan: Loan, breakdown: PaymentBreakdown, applyAdvanceToCapital: boolean) {
    let newRemainingBalance = loan.remainingBalance - breakdown.capital;
    let newInstallmentAmount = loan.installmentAmount;
    let newCapitalAdvance = (loan.capitalAdvance || 0) + breakdown.advance;
    let newNextPaymentDate = loan.nextPaymentDate;

    // Handle advance payment
    if (breakdown.advance > 0) {
      if (applyAdvanceToCapital && loan.installments > 1) {
        // Recalculate installments
        const recalculation = this.paymentCalculator.recalculateInstallments(loan, breakdown.advance);
        newRemainingBalance = recalculation.newRemainingBalance;
        newInstallmentAmount = recalculation.newInstallmentAmount;
        newCapitalAdvance = 0; // Reset advance since it's applied to capital
      }
    }

    // Update next payment date if payment covers current installment
    if (breakdown.capital > 0 || breakdown.advance > 0) {
      newNextPaymentDate = this.paymentCalculator.calculateNextPaymentDate(loan, new Date());
    }

    // Check if loan is completed
    const newStatus = newRemainingBalance <= 0 ? 'completed' : loan.status;

    // Update loan in database
    await this.supabase
      .from('loans')
      .update({
        remainingBalance: newRemainingBalance,
        installmentAmount: newInstallmentAmount,
        capitalAdvance: newCapitalAdvance,
        nextPaymentDate: newNextPaymentDate,
        status: newStatus,
        applyAdvanceToCapital: applyAdvanceToCapital
      })
      .eq('id', loan.id);
  }

  private calculateFirstPaymentDate(startDate: Date, frequency: string): Date {
    const firstPayment = new Date(startDate);
    switch (frequency) {
      case 'daily':
        firstPayment.setDate(firstPayment.getDate() + 1);
        break;
      case 'weekly':
        firstPayment.setDate(firstPayment.getDate() + 7);
        break;
      case 'biweekly':
        firstPayment.setDate(firstPayment.getDate() + 15);
        break;
      case 'monthly':
        firstPayment.setMonth(firstPayment.getMonth() + 1);
        break;
    }
    return firstPayment;
  }

  private getFrequencyMultiplier(frequency: string): number {
    switch (frequency) {
      case 'daily': return 30;
      case 'weekly': return 4;
      case 'biweekly': return 2;
      case 'monthly': return 1;
      default: return 1;
    }
  }

  getLoansObservable(): Observable<Loan[]> {
    return this.loans.asObservable();
  }
}