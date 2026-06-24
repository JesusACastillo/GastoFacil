import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  receiptOutline,
  restaurantOutline,
  trendingUpOutline,
  trendingDownOutline,
  wifiOutline,
  medkitOutline,
  carOutline,
  cafeOutline,
  cashOutline,
  arrowUpOutline,
  arrowDownOutline,
  chevronBackOutline,
  chevronForwardOutline,
  personCircleOutline,
  logOutOutline
} from 'ionicons/icons';
import { GastosService, Categoria } from '../services/gastos.service';
import { AuthService } from '../services/auth.service';
import { Gasto } from '../models/gasto.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class HomePage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  private gastosService = inject(GastosService);
  public authService = inject(AuthService);

  // States
  public totalMes = signal<number>(0);
  public gastoHoy = signal<number>(0);
  public numGastos = signal<number>(0);
  public topCategoria = signal<string>('Ninguna');
  public recentGastos = signal<Gasto[]>([]);
  public trendPercent = signal<number>(0);
  public desgloseCategorias = signal<any[]>([]);
  public selectedDate = signal<Date>(new Date());

  private categoriasMap: Record<number, Categoria> = {};
  private allGastosCache: Gasto[] = [];

  constructor() {
    addIcons({
      calendarOutline,
      receiptOutline,
      restaurantOutline,
      trendingUpOutline,
      trendingDownOutline,
      wifiOutline,
      medkitOutline,
      carOutline,
      cafeOutline,
      cashOutline,
      arrowUpOutline,
      arrowDownOutline,
      chevronBackOutline,
      chevronForwardOutline,
      personCircleOutline,
      logOutOutline
    });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.cargarDatos();
    this.content?.scrollToTop(0);
  }

  async handleRefresh(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  async cargarDatos() {
    try {
      this.allGastosCache = await this.gastosService.getGastos();

      try {
        const cats = await this.gastosService.getCategorias();
        this.categoriasMap = {};
        cats.forEach(c => {
          if (c.id) this.categoriasMap[c.id] = c;
        });
      } catch (e) {
        console.warn('Error loading categories:', e);
      }

      this.calcularEstadisticas();

    } catch (error) {
      console.error('Error al cargar datos de inicio:', error);
    }
  }

  cambiarMes(delta: number) {
    const current = this.selectedDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    this.selectedDate.set(newDate);
    this.calcularEstadisticas();
  }

  getNombreMes(date: Date): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[date.getMonth()]} ${date.getFullYear()}`;
  }

  calcularEstadisticas() {
    const selected = this.selectedDate();
    const selectedYear = selected.getFullYear();
    const selectedMonth = selected.getMonth();

    const gastosMesSeleccionado = this.allGastosCache.filter(g => {
      const d = new Date(g.fecha);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const lastMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lastMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const gastosMesAnterior = this.allGastosCache.filter(g => {
      const d = new Date(g.fecha);
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    });

    const totalActual = gastosMesSeleccionado.reduce((sum, g) => sum + g.monto, 0);
    this.totalMes.set(totalActual);

    const totalAnterior = gastosMesAnterior.reduce((sum, g) => sum + g.monto, 0);
    if (totalAnterior > 0) {
      const diff = ((totalActual - totalAnterior) / totalAnterior) * 100;
      this.trendPercent.set(Math.round(diff));
    } else {
      this.trendPercent.set(0);
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const gastosHoy = this.allGastosCache.filter(g => {
      const fechaVal = g.fecha as any;
      const dStr = typeof fechaVal === 'string'
        ? fechaVal.substring(0, 10)
        : new Date(fechaVal).toISOString().split('T')[0];
      return dStr === todayStr;
    });
    const totalHoy = gastosHoy.reduce((sum, g) => sum + g.monto, 0);
    this.gastoHoy.set(totalHoy);

    this.numGastos.set(gastosMesSeleccionado.length);

    const catTotals: { [key: number]: number } = {};
    gastosMesSeleccionado.forEach(g => {
      const catId = g.categoria;
      catTotals[catId] = (catTotals[catId] || 0) + g.monto;
    });

    let topCat = 'Ninguna';
    let maxAmount = 0;
    const desglose = Object.entries(catTotals).map(([idStr, total]) => {
      const id = Number(idStr);
      const catObj = this.categoriasMap[id];
      const rawName = catObj ? catObj.nombre : 'Otro';
      const nombre = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      
      if (total > maxAmount) {
        maxAmount = total;
        topCat = nombre;
      }

      return {
        id,
        nombre,
        total,
        porcentaje: totalActual > 0 ? Math.round((total / totalActual) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);

    this.topCategoria.set(topCat);
    this.desgloseCategorias.set(desglose);

    const sorted = [...this.allGastosCache].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.recentGastos.set(sorted.slice(0, 5));
  }

  formatMonto(monto: number): string {
    if (monto === undefined || monto === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(monto);
  }

  formatFechaHora(fechaVal: any): string {
    if (!fechaVal) return '';
    const dateObj = fechaVal instanceof Date ? fechaVal : new Date(fechaVal + "T00:00:00");
    if (isNaN(dateObj.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const dateCompare = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());



    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    if (dateCompare.getTime() === today.getTime()) {
      return `Hoy`;
    } else if (dateCompare.getTime() === yesterday.getTime()) {
      return `Ayer`;
    } else {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    }
  }

  getCategoryDetails(categoria: number | string | null | undefined) {
    let catObj: Categoria | undefined = undefined;

    if (categoria != null && typeof categoria === 'number') {
      catObj = this.categoriasMap[categoria];
    } else if (typeof categoria === 'string') {
      catObj = Object.values(this.categoriasMap).find(c => c.nombre.toLowerCase() === categoria.toLowerCase());
    }

    if (catObj && catObj.color && catObj.icono) {
      return {
        icon: catObj.icono,
        bgColor: `${catObj.color}20`,
        iconColor: catObj.color
      };
    }

    return {
      icon: 'layers-outline',
      bgColor: '#f3f4f6',
      iconColor: '#9ca3af'
    };
  }

  async confirmarCerrarSesion() {
    // Si queremos confirmar antes de cerrar
    await this.authService.signOut();
    // Después de cerrar, el AuthService se queda sin sesión, 
    // pero si recargan la app se loguean anónimo. Lo forzamos aquí:
    await this.authService.signInAnonymously();
  }
}
