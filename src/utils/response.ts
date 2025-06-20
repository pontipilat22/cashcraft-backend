import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const successResponse = <T>(res: Response, data: T, statusCode: number = 200): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, message: string, statusCode: number = 500): Response => {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  
  return res.status(statusCode).json(response);
}; 

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
