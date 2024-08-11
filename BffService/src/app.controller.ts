import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { returnResponseError } from 'utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getUnsupportedPath() {
    throw new HttpException("Cannot process request", HttpStatus.BAD_GATEWAY)
  }

  @Get('product')
  getProductsList() {
    try {
      return this.appService.getProductsList();
    } catch (error) {
      returnResponseError(error);
    }
  }

  @Get('product/:productId')
  getProductById(@Param("productId") productId: string) {
    try {
      return this.appService.getProductById(productId);
    } catch (error) {
      returnResponseError(error);
    }
  }

  @Post('product')
  createProduct(@Body() body) {
    try {
      return this.appService.createProduct(body);
    } catch (error) {
      returnResponseError(error);
    }
  }

  @Get('cart')
  getCart() {
    try {
      return this.appService.getCart();
    } catch (error) {
      returnResponseError(error);
    }
  }

  @Put('cart')
  updateUserCart(@Body() body) {
    try {
      return this.appService.updateUserCart(body)
    } catch (error) {
      returnResponseError(error);
    }
  }

  @Delete('cart')
  clearUserCart() {
    try {
      return this.appService.clearUserCart()
    } catch (error) {
      returnResponseError(error);
    }
  }
}
