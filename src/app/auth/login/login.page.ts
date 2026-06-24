import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  ToastController,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, personOutline, logInOutline, personAddOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    IonSpinner,
    IonBackButton,
    IonButtons
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);

  public isLogin = signal(true); // Toggle between Login and Register
  public isLoading = signal(false);

  public authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombre: [''] // Solo necesario para registro
  });

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      personOutline,
      logInOutline,
      personAddOutline
    });
  }

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    if (this.isLogin()) {
      this.authForm.get('nombre')?.clearValidators();
    } else {
      this.authForm.get('nombre')?.setValidators([Validators.required]);
    }
    this.authForm.get('nombre')?.updateValueAndValidity();
    this.authForm.reset();
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.isLoading.set(true);
    const { email, password, nombre } = this.authForm.value;

    try {
      if (this.isLogin()) {
        await this.authService.signIn(email, password);
        this.mostrarToast('Inicio de sesión exitoso', 'success');
        this.router.navigate(['/tabs/home']);
      } else {
        await this.authService.signUp(email, password, nombre);
        this.mostrarToast('Registro exitoso. ¡Bienvenido!', 'success');
        this.router.navigate(['/tabs/home']);
      }
    } catch (error: any) {
      this.mostrarToast(error.message || 'Ocurrió un error. Verifica tus datos.', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: color
    });
    await toast.present();
  }
}
