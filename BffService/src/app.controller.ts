import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('product')
  getProductsList() {
    return this.appService.getProductsList();
  }

  @Get('product/:productId')
  getProductById(@Param("productId") productId: string) {
    return this.appService.getProductById(productId);
  }

  @Post('product')
  createProduct(@Body() body) {
    return this.appService.createProduct(body);
  }
}
