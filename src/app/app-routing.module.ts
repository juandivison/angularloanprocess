import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from '@nativescript/angular';

import { HomeComponent } from './components/home/home.component';
import { NewLoanComponent } from './components/new-loan/new-loan.component';
import { LoanDetailsComponent } from './components/loan-details/loan-details.component';
import { ReportsComponent } from './components/reports/reports.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'new-loan', component: NewLoanComponent },
  { path: 'loan/:id', component: LoanDetailsComponent },
  { path: 'reports', component: ReportsComponent }
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}