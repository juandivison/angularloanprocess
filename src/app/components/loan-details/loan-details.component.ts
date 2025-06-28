import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { PaymentCalculatorService } from '../../services/payment-calculator.service';
import { Loan, Payment, PaymentBreakdown } from '../../models/loan.model';
import { RouterExtensions } from '@nativescript/angular';
import { formatDistance } from 'date-fns';

@Component({
  selector: 'app-loan-details',
  templateUrl: './loan-details.component.html'
})
export class LoanDetailsComponent implements OnInit {
  loan: Loan | null = null;
  newPayment = {
    amount: 0
  };
  payments: Payment[] = [];
  paymentBreakdown: PaymentBreakdown | null = null;
  applyAdvanceToCapital = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private paymentCalculator: PaymentCalculatorService,
    private router: RouterExtensions
  ) {}

  ngOnInit() {
    const loanId = this.route.snapshot.params['id'];
    this.loadLoanDetails(loanId);
    this.loadPayments(loanId);
  }

  async loadLoanDetails(loanId: string) {
    try {
      const loan = await this.databaseService.getLoanById(loanId);
      if (loan) {
        this.loan = loan;
        this.applyAdvanceToCapital = loan.applyAdvanceToCapital || false;
      } else {
        this.errorMessage = 'Préstamo no encontrado';
      }
    } catch (error) {
      this.errorMessage = 'Error al cargar los detalles del préstamo';
    }
  }

  async loadPayments(loanId: string) {
    try {
      const payments = await this.databaseService.getLoanPayments(loanId);
      this.payments = payments;
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }

  onPaymentAmountChange() {
    if (this.loan && this.newPayment.amount > 0) {
      this.paymentBreakdown = this.paymentCalculator.calculatePaymentBreakdown(
        this.loan, 
        this.newPayment.amount
      );
    } else {
      this.paymentBreakdown = null;
    }
  }

  async recordPayment() {
    if (!this.loan) return;

    try {
      this.isLoading = true;
      this.errorMessage = '';

      const result = await this.databaseService.recordPayment(
        this.loan.id, 
        this.newPayment.amount,
        this.applyAdvanceToCapital
      );
      
      if (result) {
        await this.loadLoanDetails(this.loan.id);
        await this.loadPayments(this.loan.id);
        this.newPayment.amount = 0;
        this.paymentBreakdown = null;
      } else {
        this.errorMessage = 'Error al registrar el pago';
      }
    } catch (error) {
      this.errorMessage = 'Error al procesar el pago';
    } finally {
      this.isLoading = false;
    }
  }

  getPaymentStatus(payment: Payment): string {
    return payment.isLate ? 'Tardío' : 'A tiempo';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  }
}