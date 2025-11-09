import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { GlobalAssetException } from '../exceptions/global-asset.exceptions';
import { AssetPriceException } from '../exceptions/asset-price.exceptions';
import { ValidationException } from '../exceptions/validation.exceptions';

/**
 * Error handling interceptor for Global Assets System
 */
@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body } = request;

    // Log the request
    this.logger.log(`Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        // Log successful response
        this.logger.log(`Outgoing response: ${response.statusCode} ${method} ${url}`);
      }),
      catchError((error) => {
        // Log the error
        this.logger.error(`Error in ${method} ${url}:`, error);

        // Handle specific exception types
        if (error instanceof GlobalAssetException) {
          return throwError(() => error);
        } else if (error instanceof AssetPriceException) {
          return throwError(() => error);
        } else if (error instanceof ValidationException) {
          return throwError(() => error);
        } else if (error instanceof HttpException) {
          return throwError(() => error);
        } else if (error instanceof Error) {
          // Handle generic errors
          if (error.name === 'ValidationError') {
            const validationError = new ValidationException('Validation failed');
            return throwError(() => validationError);
          } else if (error.name === 'CastError') {
            const castError = new ValidationException('Invalid data format', 'id');
            return throwError(() => castError);
          } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
            this.logger.error('Database error:', error);
            const dbError = new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
            return throwError(() => dbError);
          } else if (error.name === 'TypeError') {
            this.logger.error('Type error:', error);
            const typeError = new HttpException('Type error', HttpStatus.INTERNAL_SERVER_ERROR);
            return throwError(() => typeError);
          } else if (error.name === 'ReferenceError') {
            this.logger.error('Reference error:', error);
            const refError = new HttpException('Reference error', HttpStatus.INTERNAL_SERVER_ERROR);
            return throwError(() => refError);
          } else {
            this.logger.error('Unknown error:', error);
            const unknownError = new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            return throwError(() => unknownError);
          }
        } else {
          this.logger.error('Unhandled exception:', error);
          const unhandledError = new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
          return throwError(() => unhandledError);
        }
      }),
    );
  }
}
