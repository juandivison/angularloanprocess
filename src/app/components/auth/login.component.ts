import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterExtensions } from '@nativescript/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: RouterExtensions
  ) {}

  async onLogin() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/home'], { clearHistory: true });
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
    } finally {
      this.isLoading = false;
    }
  }

  onSignUp() {
    this.router.navigate(['/register']);
  }
}