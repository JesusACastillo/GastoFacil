export interface Gasto {
    id?: number;
    concepto: string;
    monto: number;
    fecha: Date;
    categoria: number;
    categoriaNombre?: string;
}