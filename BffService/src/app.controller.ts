import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('product')
  getProductsList() {
    try {
      return this.appService.getProductsList();
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('product/:productId')
  getProductById(@Param("productId") productId: string) {
    try {
      return this.appService.getProductById(productId);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('product')
  createProduct(@Body() body) {
    try {
      return this.appService.createProduct(body);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('cart')
  getCart() {
    try {
      return this.appService.getCart();
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('cart')
  updateUserCart(@Body() body) {
    try {
      return this.appService.updateUserCart(body)
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('cart')
  clearUserCart() {
    try {
      return this.appService.clearUserCart()
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
