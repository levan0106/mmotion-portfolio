import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalAssetException } from '../exceptions/global-asset.exceptions';
import { AssetPriceException } from '../exceptions/asset-price.exceptions';
import { ValidationException } from '../exceptions/validation.exceptions';

/**
 * Global exception filter for Global Assets System
 */
@Catch()
export class GlobalAssetExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalAssetExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any[] = [];
    let error = 'Internal Server Error';

    // Handle specific exception types
    if (exception instanceof GlobalAssetException) {
      status = exception.getStatus();
      message = exception.message;
      error = this.getErrorType(status);
    } else if (exception instanceof AssetPriceException) {
      status = exception.getStatus();
      message = exception.message;
      error = this.getErrorType(status);
    } else if (exception instanceof ValidationException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;
      message = errorResponse.message;
      details = errorResponse.details || [];
      error = 'Bad Request';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;
      message = errorResponse.message || exception.message;
      details = errorResponse.details || [];
      error = this.getErrorType(status);
    } else if (exception instanceof Error) {
      // Handle generic errors
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        details = this.formatValidationError(exception);
        error = 'Bad Request';
      } else if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid data format';
        details = [{ field: 'id', message: 'Invalid ID format' }];
        error = 'Bad Request';
      } else if (exception.name === 'MongoError' || exception.name === 'MongooseError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error';
        error = 'Internal Server Error';
        this.logger.error('Database error:', exception);
      } else if (exception.name === 'TypeError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Type error';
        error = 'Internal Server Error';
        this.logger.error('Type error:', exception);
      } else if (exception.name === 'ReferenceError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Reference error';
        error = 'Internal Server Error';
        this.logger.error('Reference error:', exception);
      } else {
        this.logger.error('Unknown error:', exception);
      }
    } else {
      this.logger.error('Unhandled exception:', exception);
    }

    // Log the error
    this.logger.error(
      `Exception caught: ${status} ${error} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send error response
    const errorResponse = {
      statusCode: status,
      message,
      error,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationError(error: any): any[] {
    const details: any[] = [];
    
    if (error.errors) {
      for (const field in error.errors) {
        const fieldError = error.errors[field];
        details.push({
          field,
          message: fieldError.message,
          value: fieldError.value,
        });
      }
    }
    
    return details;
  }

  private getErrorType(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Unprocessable Entity';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Internal Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'Unknown Error';
    }
  }
}
