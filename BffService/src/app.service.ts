import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { urlMap } from './constants';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  async getProductById(productId: string) {
    const url = this.configService.get(`${urlMap.product}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${url}/products/${productId}`).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response.data);
          throw error;
        }),
      ),
    );

    return data;
  }

  async getProductsList() {
    const url = this.configService.get(`${urlMap.product}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${url}/products`).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response.data);
          throw error;
        }),
      ),
    );

    return data;
  }

  async createProduct(body) {
    const url = this.configService.get(`${urlMap.product}`);
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${url}/products`, body).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response.data);
          throw error;
        }),
      ),
    );

    return data;
  }
}
