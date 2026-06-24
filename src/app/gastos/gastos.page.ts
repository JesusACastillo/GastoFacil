import { Component, inject, signal, ViewChild } from '@angular/core';
import { GastosService, Categoria } from '../services/gastos.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { GastoModalComponent } from '../components/gasto-modal/gasto-modal.component';
import { CategoriaSelectorComponent } from '../components/categoria-selector/categoria-selector.component';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  AlertController,
  ActionSheetController,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
  IonFab,
  IonFabButton,
  ModalController,
  ToastController,
  IonButtons,
  IonMenuButton,
  IonBackButton,
  IonRouterLink
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cashOutline,
  wifiOutline,
  medkitOutline,
  carOutline,
  cafeOutline,
  pencilOutline,
  trashOutline,
  addOutline,
  arrowUpOutline
} from 'ionicons/icons';
import { Gasto } from '../models/gasto.model';

@Component({
  selector: 'app-gastos',
  templateUrl: 'gastos.page.html',
  styleUrls: ['gastos.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonButtons,
    IonMenuButton,
  ],
})
export class GastosPage {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  public mostrarBotonScroll = signal<boolean>(false);

  scrollToTop() {
    this.content?.scrollToTop(500);
  }

  onScroll(event: any) {
    const scrollTop = event.detail?.scrollTop || 0;
    this.mostrarBotonScroll.set(scrollTop > 200);
  }

  private gastosService = inject(GastosService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);
  private router = inject(Router);

  async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  private gastos = signal<Gasto[]>([]);
  public results = signal<Gasto[]>([]);
  public selectedGastoId = signal<number | null>(null);
  // Cache de categorias id -> Categoria para uso en templates sincrónicas
  private categoriasMap: Record<number, Categoria> = {};

  // Filtros reactivos
  public ordenFecha = signal<'asc' | 'desc'>('desc');
  public categoriaFiltro = signal<number | null>(null);
  public fechaFiltro = signal<string | null>(null);
  public queryBusqueda = signal<string>('');

  constructor(private modalCtrl: ModalController) {
    addIcons({
      calendarOutline,
      cashOutline,
      wifiOutline,
      medkitOutline,
      carOutline,
      cafeOutline,
      pencilOutline,
      trashOutline,
      addOutline,
      arrowUpOutline
    });
    this.cargarGastos();
  }

  ionViewWillEnter() {
    this.content?.scrollToTop(0);
  }

  toggleSeleccion(gasto: Gasto) {
    if (!gasto.id) return;
    if (this.selectedGastoId() === gasto.id) {
      this.selectedGastoId.set(null);
    } else {
      this.selectedGastoId.set(gasto.id);
    }
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      this.cargarGastos();
      event.target.complete();
    }, 2000);
  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value || '';
    this.queryBusqueda.set(query);
    this.aplicarFiltrosYOrden();
  }

  async cargarGastos() {
    try {
      const gastos = await this.gastosService.getGastos();
      this.gastos.set(gastos);
      // Cargar mapa de categorias para uso inmediato
      try {
        const cats = await this.gastosService.getCategorias();
        this.categoriasMap = {};
        cats.forEach(c => {
          if (c.id) this.categoriasMap[c.id] = c;
        });
      } catch (e) {
        console.warn('No se pudieron cargar categorias para map:', e);
      }
      this.aplicarFiltrosYOrden();
      this.selectedGastoId.set(null);
    } catch (error) {
      console.log('Error al cargar los gastos');
    }
  }

  aplicarFiltrosYOrden() {
    let filtrados = [...this.gastos()];

    // 1. Filtrar por búsqueda
    const query = this.queryBusqueda().toLowerCase().trim();
    if (query) {
      filtrados = filtrados.filter((gasto) =>
        gasto.concepto.toLowerCase().includes(query)
      );
    }

    // 2. Filtrar por categoría (comparando IDs)
    const categoria = this.categoriaFiltro();
    if (categoria != null) {
      filtrados = filtrados.filter((gasto) => gasto.categoria === categoria);
    }

    // 3. Filtrar por fecha
    const fecha = this.fechaFiltro();
    if (fecha) {
      filtrados = filtrados.filter((gasto) => {
        const formattedGastoDate = this.getGastoDateString(gasto.fecha);
        return formattedGastoDate === fecha;
      });
    }

    // 4. Ordenar por fecha
    filtrados.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return this.ordenFecha() === 'asc' ? dateA - dateB : dateB - dateA;
    });

    this.results.set(filtrados);
  }

  limpiarFiltros() {
    this.categoriaFiltro.set(null);
    this.fechaFiltro.set(null);
    this.queryBusqueda.set('');
    this.ordenFecha.set('desc');

    const searchbar = document.querySelector('ion-searchbar.custom') as HTMLIonSearchbarElement;
    if (searchbar) {
      searchbar.value = '';
    }

    const dateInput = document.querySelector('.hidden-date-input') as HTMLInputElement;
    if (dateInput) {
      dateInput.value = '';
    }

    this.aplicarFiltrosYOrden();
  }

  onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.fechaFiltro.set(input.value);
    } else {
      this.fechaFiltro.set(null);
    }
    this.aplicarFiltrosYOrden();
  }

  async seleccionarCategoria() {
    // Obtenemos TODAS las categorías disponibles desde el servicio
    const categoriasDisponibles = await this.gastosService.getCategorias();

    const modal = await this.modalCtrl.create({
      component: CategoriaSelectorComponent,
      componentProps: {
        categorias: categoriasDisponibles,
        selectedCategoryId: this.categoriaFiltro(),
        showClearOption: true
      },
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8]
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.categoriaFiltro.set(data);
      this.aplicarFiltrosYOrden();
    }
  }

  mostrarNombreCategoriaFiltro(): string {
    const id = this.categoriaFiltro();
    if (id == null) return 'Categoría';
    return this.categoriasMap[id]?.nombre || String(id);
  }

  formatFechaSimple(fechaStr: string | null): string {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return fechaStr;
  }

  // Obtiene los detalles visuales de la categoría. Acepta `id` (number) o `nombre` (string).
  getCategoryDetails(categoria: number | string | null) {
    let catObj: Categoria | undefined = undefined;

    if (categoria != null && typeof categoria === 'number') {
      catObj = this.categoriasMap[categoria];
    }

    // Si la categoría tiene color e icono configurado en la base de datos, lo usamos
    if (catObj && catObj.color && catObj.icono) {
      return {
        icon: catObj.icono,
        bgColor: `${catObj.color}20`,   // Añadimos opacidad (20 al final de un hex es ~12%)
        iconColor: catObj.color,
        badgeBg: `${catObj.color}20`,
        badgeColor: catObj.color
      };
    }

    return {
      icon: 'layers-outline',
      bgColor: '#f3f4f6',
      iconColor: '#9ca3af',
      badgeBg: '#f3f4f6',
      badgeColor: '#9ca3af'
    };
  }

  formatMonto(monto: number): string {
    if (monto === undefined || monto === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  // Formatea la fecha como dd/MM
  formatFecha(fechaVal: any): string {
    if (!fechaVal) return '';

    if (typeof fechaVal === 'string' && fechaVal.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(fechaVal)) {
      const parts = fechaVal.substring(0, 10).split('-');
      return `${parts[2]}/${parts[1]}`;
    }

    const dateObj = fechaVal instanceof Date ? fechaVal : new Date(fechaVal);
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  getGastoDateString(fechaVal: any): string {
    if (!fechaVal) return '';

    if (typeof fechaVal === 'string' && fechaVal.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(fechaVal)) {
      return fechaVal.substring(0, 10);
    }

    try {
      const dateObj = fechaVal instanceof Date ? fechaVal : new Date(fechaVal);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error(e);
    }
    return '';
  }

  async editGasto(gasto: Gasto, event: Event) {
    event.stopPropagation();
    if (!gasto.id) return;

    const modal = await this.modalCtrl.create({
      component: GastoModalComponent,
      componentProps: { gasto }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      try {
        const payload: any = {
          concepto: data.concepto,
          monto: parseFloat(data.monto),
          categoria_id: Number(data.categoria),
          fecha: new Date(data.fecha)
        };
        await this.gastosService.updateGasto(gasto.id, payload);
        await this.cargarGastos();
        await this.mostrarToast('Gasto actualizado correctamente', 'success');
      } catch (error) {
        console.error('Error al actualizar el gasto:', error);
        await this.mostrarToast('Error al actualizar el gasto', 'danger');
      }
    }
  }

  // Elimina un gasto existente
  async deleteGasto(gasto: Gasto, event: Event) {
    event.stopPropagation();
    if (!gasto.id) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Gasto',
      message: `¿Estás seguro de que deseas eliminar el gasto "${gasto.concepto}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.gastosService.deleteGasto(gasto.id!);
              await this.cargarGastos();
            } catch (error) {
              console.error('Error al eliminar el gasto:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async abrirModalGasto() {
    const modal = await this.modalCtrl.create({
      component: GastoModalComponent
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      try {
        // Normalizamos el payload: aseguramos tipos correctos
        const payload: any = {
          concepto: data.concepto,
          monto: Number(data.monto),
          fecha: new Date(data.fecha),
          categoria_id: Number(data.categoria) // Corregido: usar categoria_id
        };

        await this.gastosService.addGasto(payload);

        // Volvemos a cargar la lista para que el nuevo gasto aparezca en la interfaz
        await this.cargarGastos();

        // Mostramos mensaje de confirmación
        await this.mostrarToast('Gasto guardado correctamente', 'success');

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

      } catch (error) {
        console.error('Error al guardar el nuevo gasto:', error);
        await this.mostrarToast('Error al guardar el gasto', 'danger');
      }
    }
  }
}

