import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { GastosService, Categoria } from '../services/gastos.service';
import { Gasto } from '../models/gasto.model';

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.page.html',
  styleUrls: ['./resumen.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    FormsModule
  ]
})
export class ResumenPage implements OnInit {
  private gastosService = inject(GastosService);

  public totalMes = signal<number>(0);
  public trendPercent = signal<number>(0);
  public desgloseCategorias = signal<any[]>([]);
  public donutSegments = signal<any[]>([]);
  public topCategory = signal<any>(null);
  public selectedDate = signal<Date>(new Date());

  private categoriasMap: Record<number, Categoria> = {};
  private allGastosCache: Gasto[] = [];

  constructor() { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.cargarDatos();
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
      console.error('Error loading resumen data:', error);
    }
  }

  calcularEstadisticas() {
    const selected = this.selectedDate();
    const currentYear = selected.getFullYear();
    const currentMonth = selected.getMonth();

    const gastosMesActual = this.allGastosCache.filter(g => {
      const d = new Date(g.fecha);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const gastosMesAnterior = this.allGastosCache.filter(g => {
      const d = new Date(g.fecha);
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    });

    const totalActual = gastosMesActual.reduce((sum, g) => sum + g.monto, 0);
    this.totalMes.set(totalActual);

    const totalAnterior = gastosMesAnterior.reduce((sum, g) => sum + g.monto, 0);
    if (totalAnterior > 0) {
      const diff = ((totalActual - totalAnterior) / totalAnterior) * 100;
      this.trendPercent.set(Math.round(diff));
    } else {
      this.trendPercent.set(0);
    }

    const catTotals: { [key: number]: number } = {};
    gastosMesActual.forEach(g => {
      const catId = g.categoria;
      catTotals[catId] = (catTotals[catId] || 0) + g.monto;
    });

    const desglose = Object.entries(catTotals).map(([idStr, total]) => {
      const id = Number(idStr);
      const catObj = this.categoriasMap[id];
      const rawName = catObj ? catObj.nombre : 'Otro';
      const nombre = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const color = catObj?.color || '#9ca3af';
      const icon = catObj?.icono || 'layers-outline';

      return {
        id,
        nombre,
        total,
        porcentaje: totalActual > 0 ? (total / totalActual) * 100 : 0,
        color,
        bgColor: `${color}20`,
        icon
      };
    }).sort((a, b) => b.total - a.total);

    this.desgloseCategorias.set(desglose);

    if (desglose.length > 0) {
      this.topCategory.set(desglose[0]);
    } else {
      this.topCategory.set(null);
    }

    this.calculateDonut(desglose);
  }

  calculateDonut(desglose: any[]) {
    let cumulativePercent = 0;
    const segments = desglose.map(item => {
      const dasharray = `${item.porcentaje} ${100 - item.porcentaje}`;
      const dashoffset = 25 - cumulativePercent; // 25 is to start from top
      cumulativePercent += item.porcentaje;
      return {
        ...item,
        dasharray,
        dashoffset
      };
    });
    this.donutSegments.set(segments);
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

  formatMonto(monto: number): string {
    if (monto === undefined || monto === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(monto);
  }
}
