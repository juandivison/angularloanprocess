import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { Loan, Payment } from '../../models/loan.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  todayLoans: Loan[] = [];
  totalLoaned = 0;
  totalPayments = 0;
  totalLateFees = 0;
  isLoading = false;
  errorMessage = '';

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    await this.loadReports();
  }

  async loadReports() {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Get today's loans
      this.todayLoans = await this.databaseService.getTodayLoans();
      
      // Calculate totals
      this.totalLoaned = this.todayLoans.reduce((sum, loan) => sum + loan.amount, 0);
      
      // Get all payments for today's loans
      const payments = await Promise.all(
        this.todayLoans.map(loan => this.databaseService.getLoanPayments(loan.id))
      );
      
      // Calculate payment totals
      this.totalPayments = payments.flat().reduce((sum, payment) => sum + payment.amount, 0);
      this.totalLateFees = payments.flat().reduce((sum, payment) => sum + payment.lateFee, 0);
    } catch (error) {
      this.errorMessage = 'Error al cargar los reportes';
    } finally {
      this.isLoading = false;
    }
  }

  getPaymentStatus(loan: Loan): string {
    const today = new Date();
    const endDate = new Date(loan.endDate);
    return today > endDate ? 'Vencido' : 'Al día';
  }
}