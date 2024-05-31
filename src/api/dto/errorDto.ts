export interface ErrorResponse {
  error?: string;
  message: string | { field: string; error: string }[];
  path: string;
  statusCode: number;
  timestamp: string;
}
