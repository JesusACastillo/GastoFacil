import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircle, folderOpenOutline } from 'ionicons/icons';
import { Categoria } from '../../services/gastos.service';

@Component({
  selector: 'app-categoria-selector',
  templateUrl: './categoria-selector.component.html',
  styleUrls: ['./categoria-selector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon
  ]
})
export class CategoriaSelectorComponent implements OnInit {
  @Input() categorias: Categoria[] = [];
  @Input() selectedCategoryId: number | null = null;
  @Input() showClearOption: boolean = false;

  public currentSelection: number | null = null;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline, checkmarkCircle, folderOpenOutline });
  }

  ngOnInit() {
    this.currentSelection = this.selectedCategoryId;
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  seleccionar(id: number | null) {
    this.currentSelection = id;
    this.modalCtrl.dismiss(id, 'confirm');
  }

  getCategoryDetails(categoria: Categoria) {
    if (categoria && categoria.color && categoria.icono) {
      return {
        icon: categoria.icono,
        bgColor: `${categoria.color}20`,
        iconColor: categoria.color
      };
    }
    return {
      icon: 'layers-outline',
      bgColor: '#f3f4f6',
      iconColor: '#9ca3af'
    };
  }
}
