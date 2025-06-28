import { Component } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { RouterExtensions } from '@nativescript/angular';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-new-loan',
  templateUrl: './new-loan.component.html'
})
export class NewLoanComponent {
  loan: Partial<Loan> = {
    clientName: '',
    amount: 0,
    interestRate: 0,
    installments: 1,
    paymentFrequency: 'monthly',
    gracePeriod: 3,
    status: 'active',
    applyAdvanceToCapital: false
  };

  frequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' }
  ];

  frequencyLabels = this.frequencies.map(f => f.label);
  selectedFrequencyIndex = 3; // Default to monthly

  isLoading = false;
  errorMessage = '';

  constructor(
    private databaseService: DatabaseService,
    private router: RouterExtensions
  ) {}

  onFrequencyChange(index: number) {
    this.selectedFrequencyIndex = index;
    this.loan.paymentFrequency = this.frequencies[index].value as any;
  }

  async onCreateLoan() {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      if (!this.loan.clientName || !this.loan.amount || !this.loan.interestRate) {
        this.errorMessage = 'Por favor complete todos los campos requeridos';
        return;
      }

      const startDate = new Date();
      let endDate = new Date();
      
      // Calculate end date based on frequency and installments
      const periodDays = this.getPeriodDays(this.loan.paymentFrequency!);
      endDate.setDate(endDate.getDate() + (periodDays * (this.loan.installments || 1)));

      const newLoan = {
        ...this.loan,
        startDate,
        endDate,
        remainingBalance: this.loan.amount || 0,
        nextPaymentDate: startDate
      } as Omit<Loan, 'id' | 'createdAt'>;

      const result = await this.databaseService.createLoan(newLoan);
      if (result) {
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = 'Error al crear el préstamo';
      }
    } catch (error) {
      this.errorMessage = 'Error al crear el préstamo';
    } finally {
      this.isLoading = false;
    }
  }

  private getPeriodDays(frequency: string): number {
    switch (frequency) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'biweekly': return 15;
      case 'monthly': return 30;
      default: return 30;
    }
  }
}