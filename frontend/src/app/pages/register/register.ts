import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  username = '';
  password = '';
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  onRegister() {
    this.http.post('https://game-scores-app.onrender.com/api/auth/register', {
      username: this.username,
      password: this.password,
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.message = err.error?.message || 'Registration failed';
      },
    });
  }
}