export interface ErrorResponse {
  timestamp: string;
  status: number;
  errorCode: string;
  message: string;
  path: string;
  details?: string | string[] | null;
}
