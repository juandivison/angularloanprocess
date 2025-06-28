import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/database.service';
import { Loan } from '../../models/loan.model';
import { RouterExtensions } from '@nativescript/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  activeLoans: Loan[] = [];

  constructor(
    private databaseService: DatabaseService,
    private router: RouterExtensions
  ) {}

  ngOnInit() {
    this.loadLoans();
  }

  async loadLoans() {
    this.activeLoans = await this.databaseService.getLoans();
  }

  onNewLoan() {
    this.router.navigate(['/new-loan']);
  }

  onViewReports() {
    this.router.navigate(['/reports']);
  }

  onLoanTap(loanId: string) {
    this.router.navigate(['/loan', loanId]);
  }
}