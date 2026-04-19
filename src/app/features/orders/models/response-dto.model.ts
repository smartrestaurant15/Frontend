/** Wrapper de respuesta del módulo Orders — { data: T, hasError: boolean } */
export interface ResponseDTO<T> {
  data: T;
  hasError: boolean;
}
