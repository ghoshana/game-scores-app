import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../analytics/analytics.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  message = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  onLogin() {
    this.http.post('https://game-scores-app.onrender.com/api/auth/login', {
      username: this.username,
      password: this.password,
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);

        // Tie all future events to this user, then record the login.
        this.analytics.identify(res.username);
        this.analytics.track({ type: 'login', method: 'password' });

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.message = err.error?.message || 'Login failed';
      },
    });
  }
}