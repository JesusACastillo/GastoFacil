import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
  IonButton,
  IonLabel,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  ToastController,
  AlertController,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  cameraOutline,
  checkmarkCircleOutline,
  refreshOutline,
  receiptOutline,
  closeCircleOutline,
  imageOutline,
  saveOutline,
  trashOutline,
  createOutline,
  calendarOutline,
  cashOutline,
  pricetagOutline,
  sparklesOutline
} from 'ionicons/icons';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GastosService } from '../services/gastos.service';
import { AuthService } from '../services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-scanner',
  templateUrl: 'scanner.page.html',
  styleUrls: ['scanner.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner,
    IonButton,
    IonLabel,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonMenuButton
  ]
})
export class ScannerPage implements OnInit {
  imagenBase64: string | undefined;
  cargando = false;
  ticketProcesado = false;
  mensajeError: string | undefined;
  conceptoDetectado = '';
  montoDetectado: number | null = null;
  fechaDetectada = '';
  categoriaDetectada: number | null = null;
  categorias: { id: number; nombre: string }[] = [];
  private GEMINI_API_KEY = environment.gcpApiKey;

  private gastosService = inject(GastosService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  constructor() {
    addIcons({
      scanOutline,
      cameraOutline,
      checkmarkCircleOutline,
      refreshOutline,
      receiptOutline,
      closeCircleOutline,
      imageOutline,
      saveOutline,
      trashOutline,
      createOutline,
      calendarOutline,
      cashOutline,
      pricetagOutline,
      sparklesOutline
    });
  }

  async ngOnInit() {
    await this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      this.categorias = await this.gastosService.getCategorias();
    } catch (error) {
      console.error('Error al cargar categorías en ScannerPage:', error);
      this.categorias = [{ id: 1, nombre: 'Comida' }, { id: 2, nombre: 'Transporte' }, { id: 3, nombre: 'Servicios' }, { id: 4, nombre: 'Salud' }];
    }
  }

  // Función para abrir la cámara
  async tomarFoto() {
    try {
      this.mensajeError = undefined;
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      this.imagenBase64 = image.base64String;
    } catch (error) {
      console.error('El usuario canceló o hubo un error con la cámara:', error);
    }
  }

  async seleccionarDeGaleria() {
    try {
      this.mensajeError = undefined;
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      this.imagenBase64 = image.base64String;
    } catch (error) {
      console.error('El usuario canceló o hubo un error al seleccionar foto:', error);
    }
  }

  async procesarTicket() {
    if (!this.imagenBase64) return;

    this.cargando = true;
    this.mensajeError = undefined;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${this.GEMINI_API_KEY}`;

      const nombresCategorias = this.categorias.length > 0
        ? this.categorias.map(c => c.nombre).join(', ')
        : 'Comida, Transporte, Servicios, Salud, Otro';

      const hoyStr = new Date().toISOString().split('T')[0];

      const cuerpo = {
        contents: [{
          parts: [
            {
              text: `Analiza esta imagen.
Si la imagen NO parece ser un ticket o recibo de compra válido, devuelve ÚNICAMENTE el siguiente JSON:
{"es_ticket": false}

Si la imagen SÍ es un ticket o recibo de compra, extrae la siguiente información:
1. El concepto (nombre del establecimiento o comercio, por ejemplo 'Starbucks', 'Walmart', o una descripción corta del gasto).
2. El monto total de la compra (como un número decimal sin símbolos de moneda).
3. La fecha de la compra en formato YYYY-MM-DD (si no se encuentra o es ilegible, usa la fecha de hoy: '${hoyStr}').
4. Clasifica el gasto en UNA de estas categorías exactas: [${nombresCategorias}]. Si ninguna encaja perfectamente, clasifícala como 'Otro'.

Devuelve la respuesta ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{"es_ticket": true, "concepto": "Nombre del comercio o concepto", "fecha": "YYYY-MM-DD", "monto": 0.00, "categoria": "nombre de la categoria elegida"}

No agregues código markdown ni explicaciones, solo el JSON puro.`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: this.imagenBase64
              }
            }
          ]
        }]
      };

      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData?.error?.message || `Error del servidor: ${respuesta.status}`);
      }

      const resultado = await respuesta.json();
      const textoJson = resultado.candidates[0].content.parts[0].text;

      const jsonLimpio = textoJson.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const datosDetectados = JSON.parse(jsonLimpio);

      if (datosDetectados.es_ticket === false) {
        this.mensajeError = 'La imagen no parece ser un ticket de compra válido. Por favor, intenta de nuevo.';
        this.ticketProcesado = false;
        return;
      }

      this.conceptoDetectado = datosDetectados.concepto || 'Compra de ticket';
      this.montoDetectado = datosDetectados.monto != null ? Number(datosDetectados.monto) : null;
      this.fechaDetectada = datosDetectados.fecha || hoyStr;
      const catDevuelta = (datosDetectados.categoria || '').trim().toLowerCase();
      const catEncontrada = this.categorias.find(c => (c.nombre || '').toLowerCase() === catDevuelta);
      this.categoriaDetectada = catEncontrada ? catEncontrada.id : (this.categorias[0] ? this.categorias[0].id : null);

      this.ticketProcesado = true;
    } catch (error: any) {
      console.error('Error al procesar el ticket con Gemini:', error);
      this.mensajeError = `Error al procesar: ${error?.message || error || 'Error desconocido'}`;
    } finally {
      this.cargando = false;
    }
  }

  async guardarGasto() {
    if (!this.conceptoDetectado || this.montoDetectado == null || !this.fechaDetectada || !this.categoriaDetectada) {
      this.mostrarToast('Por favor completa todos los campos del gasto', 'warning');
      return;
    }

    try {
      const nuevoGasto: any = {
        concepto: this.conceptoDetectado,
        monto: Number(this.montoDetectado),
        fecha: new Date(this.fechaDetectada + 'T12:00:00'),
        categoria_id: this.categoriaDetectada
      };

      await this.gastosService.addGasto(nuevoGasto);
      this.mostrarToast('¡Gasto guardado correctamente!', 'success');
      this.reiniciar();

      // Lazy Registration Check
      if (this.authService.incrementAndCheckGuestRegistrations()) {
        const alert = await this.alertController.create({
          header: '¡Atención!',
          message: 'Has registrado 5 gastos. Regístrate o inicia sesión para no perder tus datos si cambias de dispositivo.',
          buttons: [
            {
              text: 'Más tarde',
              role: 'cancel'
            },
            {
              text: 'Registrarme',
              handler: () => {
                this.router.navigate(['/login']);
              }
            }
          ]
        });
        await alert.present();
      }

      this.router.navigate(['/tabs/gastos']);
    } catch (error) {
      console.error('Error al guardar el gasto de ticket:', error);
      this.mostrarToast('Error al guardar el gasto en la base de datos.', 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  reiniciar() {
    this.imagenBase64 = undefined;
    this.ticketProcesado = false;
    this.mensajeError = undefined;
    this.cargando = false;
    this.conceptoDetectado = '';
    this.montoDetectado = null;
    this.fechaDetectada = '';
    this.categoriaDetectada = null;
  }
}
