import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from '@nativescript/angular';
import { NativeScriptFormsModule } from '@nativescript/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NewLoanComponent } from './components/new-loan/new-loan.component';
import { LoanDetailsComponent } from './components/loan-details/loan-details.component';
import { ReportsComponent } from './components/reports/reports.component';
import { LoginComponent } from './components/auth/login.component';

// Services
import { DatabaseService } from './services/database.service';
import { AuthService } from './services/auth.service';
import { PaymentCalculatorService } from './services/payment-calculator.service';

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    NewLoanComponent,
    LoanDetailsComponent,
    ReportsComponent,
    LoginComponent
  ],
  providers: [
    DatabaseService,
    AuthService,
    PaymentCalculatorService
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {}