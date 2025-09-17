import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { GlobalAssetException } from '../exceptions/global-asset.exceptions';
import { AssetPriceException } from '../exceptions/asset-price.exceptions';
import { ValidationException } from '../exceptions/validation.exceptions';

/**
 * Error handling middleware for Global Assets System
 */
@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorHandlingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Log the request
    this.logger.log(`Incoming request: ${req.method} ${req.path}`);

    // Override the response.json method to handle errors
    const originalJson = res.json;
    res.json = function (body: any) {
      // Log the response
      this.logger.log(`Outgoing response: ${res.statusCode} ${req.method} ${req.path}`);
      return originalJson.call(this, body);
    }.bind(this);

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception:', error.stack);
      this.handleError(error, req, res);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleError(new Error(reason), req, res);
    });

    next();
  }

  private handleError(error: Error, req: Request, res: Response) {
    let statusCode = 500;
    let message = 'Internal server error';
    let details: any[] = [];

    // Handle specific exception types
    if (error instanceof GlobalAssetException) {
      statusCode = error.getStatus();
      message = error.message;
    } else if (error instanceof AssetPriceException) {
      statusCode = error.getStatus();
      message = error.message;
    } else if (error instanceof ValidationException) {
      statusCode = error.getStatus();
      const errorResponse = error.getResponse() as any;
      message = errorResponse.message;
      details = errorResponse.details || [];
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      details = this.formatValidationError(error);
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid data format';
      details = [{ field: 'id', message: 'Invalid ID format' }];
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      statusCode = 500;
      message = 'Database error';
      this.logger.error('Database error:', error);
    } else if (error.name === 'TypeError') {
      statusCode = 500;
      message = 'Type error';
      this.logger.error('Type error:', error);
    } else if (error.name === 'ReferenceError') {
      statusCode = 500;
      message = 'Reference error';
      this.logger.error('Reference error:', error);
    } else {
      this.logger.error('Unknown error:', error);
    }

    // Send error response
    if (!res.headersSent) {
      res.status(statusCode).json({
        statusCode,
        message,
        error: this.getErrorType(statusCode),
        details,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
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
