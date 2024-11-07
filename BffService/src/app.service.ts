import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { urlMap } from './constants';
import { catchError, firstValueFrom } from 'rxjs';
import { handleFetchErrors } from 'utils';

@Injectable()
export class AppService {
  private productBaseUrl: string;
  private cartBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.cartBaseUrl = this.configService.get(`${urlMap.cart}`);
    this.productBaseUrl = this.configService.get(`${urlMap.product}`);
  }

  async getProductById(productId: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.productBaseUrl}/products/${productId}`).pipe(
        catchError(handleFetchErrors),
      ),
    );

    return data;
  }

  async getProductsList() {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.productBaseUrl}/products`).pipe(
        catchError(handleFetchErrors),
      ),
    );

    return data;
  }

  async createProduct(body) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.productBaseUrl}/products`, body).pipe(
        catchError(handleFetchErrors),
      ),
    );

    return data;
  }

  async getCart() {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.cartBaseUrl}/profile/cart`).pipe(
        catchError(handleFetchErrors),
      ),
    );

    const cart = data.data;
    const {items} = cart;

    const productsPromises = items.map((el) => this.getProductById(el.productId));
    const productsWithFullData = await Promise.all(productsPromises);

    const itemsWithProducts = items.map(el => ({
      ...el,
      product: productsWithFullData.find(i => i.id === el.productId)
    }))

    return {
      ...data,
      data: {
        ...cart,
        items: itemsWithProducts
      }
    };
  }

  async updateUserCart(body) {    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.cartBaseUrl}/profile/cart`, body).pipe(
        catchError(handleFetchErrors),
      ),
    );

    return data;
  }

  async clearUserCart() {    
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.cartBaseUrl}/profile/cart`).pipe(
        catchError(handleFetchErrors),
      ),
    );

    return data;
  }
}
