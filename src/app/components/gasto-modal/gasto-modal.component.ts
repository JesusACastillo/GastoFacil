import { Component, OnInit, inject, Input } from '@angular/core';
import { GastosService, Categoria } from '../../services/gastos.service';
import { CategoriasService } from '../../services/categorias.service';
import { Gasto } from '../../models/gasto.model';
import { CategoriaSelectorComponent } from '../categoria-selector/categoria-selector.component';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonContent,
  IonLabel,
  IonInput,
  IonRow,
  IonCol,
  ActionSheetController,
  IonTitle,
  AlertController,
  ToastController,
  IonModal,
  IonItem
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  personCircleOutline,
  chevronDownOutline,
  addCircleOutline,
  layersOutline,
  carOutline,
  fastFoodOutline,
  cartOutline,
  homeOutline,
  airplaneOutline,
  medicalOutline,
  schoolOutline,
  briefcaseOutline,
  shirtOutline,
  giftOutline,
  gameControllerOutline,
  fitnessOutline,
  cafeOutline,
  wineOutline,
  basketOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-gasto-modal',
  templateUrl: './gasto-modal.component.html',
  styleUrls: ['./gasto-modal.component.scss'],
  imports: [
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonLabel,
    IonInput,
    IonRow,
    IonCol,
    ReactiveFormsModule,
    IonModal,
  ],
})
export class GastoModalComponent implements OnInit {
  @Input() gasto?: Gasto;
  gastoForm!: FormGroup;
  categoriaForm!: FormGroup;
  categorias: Categoria[] = [];
  isCategoriaModalOpen = false;

  iconosDisponibles = [
    'layers-outline', 'car-outline', 'fast-food-outline', 'cart-outline',
    'home-outline', 'airplane-outline', 'medical-outline', 'school-outline',
    'briefcase-outline', 'shirt-outline', 'gift-outline', 'game-controller-outline',
    'fitness-outline', 'cafe-outline', 'wine-outline', 'basket-outline'
  ];

  private gastosService = inject(GastosService);
  private categoriasService = inject(CategoriasService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({
      arrowBackOutline,
      personCircleOutline,
      chevronDownOutline,
      addCircleOutline,
      layersOutline,
      carOutline,
      fastFoodOutline,
      cartOutline,
      homeOutline,
      airplaneOutline,
      medicalOutline,
      schoolOutline,
      briefcaseOutline,
      shirtOutline,
      giftOutline,
      gameControllerOutline,
      fitnessOutline,
      cafeOutline,
      wineOutline,
      basketOutline
    });
  }

  ngOnInit() {
    // ... (el resto del ngOnInit se mantiene igual)
    const fechaInicial = this.gasto?.fecha
      ? new Date(this.gasto.fecha).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Inicializamos el formulario reactivo
    this.gastoForm = this.fb.group({
      concepto: [this.gasto?.concepto || '', Validators.required],
      monto: [this.gasto?.monto || null, [Validators.required, Validators.min(0.01)]],
      fecha: [fechaInicial, Validators.required],
      categoria: [this.gasto?.categoria ?? null, Validators.required]
    });

    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      color: ['#3b82f6', Validators.required],
      icono: ['layers-outline', Validators.required]
    });

    this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      this.categorias = await this.gastosService.getCategorias();
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async seleccionarCategoria() {
    const categorias = this.categorias;

    const modal = await this.modalCtrl.create({
      component: CategoriaSelectorComponent,
      componentProps: {
        categorias: categorias,
        selectedCategoryId: this.gastoForm.get('categoria')?.value || null,
        showClearOption: false
      },
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8]
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      if (data !== null) {
        this.gastoForm.get('categoria')?.setValue(data);
        this.gastoForm.get('categoria')?.markAsDirty();
        this.gastoForm.get('categoria')?.markAsTouched();
      }
    }
  }

  agregarNuevaCategoria() {
    this.isCategoriaModalOpen = true;
  }

  seleccionarIcono(icono: string) {
    this.categoriaForm.get('icono')?.setValue(icono);
    this.categoriaForm.get('icono')?.markAsDirty();
  }

  cerrarCategoriaModal() {
    this.isCategoriaModalOpen = false;
    this.categoriaForm.reset({ color: '#3b82f6', icono: 'layers-outline' });
  }

  async guardarNuevaCategoria() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const { nombre, color, icono } = this.categoriaForm.value;

    try {
      const nuevaCategoria = await this.categoriasService.addCategoria({
        nombre,
        color,
        icono
      });
      await this.cargarCategorias();
      this.gastoForm.get('categoria')?.setValue(nuevaCategoria.id);

      this.cerrarCategoriaModal();

      const toast = await this.toastController.create({
        message: 'Categoría agregada con éxito.',
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al agregar la categoría.',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }

  guardar() {
    // ... (el resto de guardar se mantiene igual)
    if (this.gastoForm.valid) {
      // Enviamos el valor completo del formulario
      this.modalCtrl.dismiss(this.gastoForm.value, 'confirm');
    } else {
      // Marca todos los campos como tocados para mostrar errores visuales si es necesario
      this.gastoForm.markAllAsTouched();
    }
  }

  getCategoriaNombre(id: number | null | undefined) {
    // ... (el resto de getCategoriaNombre se mantiene igual)
    if (id == null) return '';
    const found = this.categorias.find(c => c.id === id);
    return found ? found.nombre : String(id);
  }
}