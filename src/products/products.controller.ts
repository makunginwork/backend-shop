// src/products/products.controller.ts
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, 
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator 
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { PRODUCT_IMAGE } from './products.constants';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PRODUCT_IMAGE.MAX_SIZE })
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.productsService.create(dto, file);
  }

  @Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ... (เมธอด create เหมือนเดิม)

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
  ) {
    // แก้ไข: ตรวจสอบค่าว่างจาก Frontend (เช่น "" หรือ "null") ก่อนส่งเข้า Service
    const cleanKeyword = keyword?.trim() || undefined;
    const cleanMinPrice = (minPrice && minPrice !== '') ? Number(minPrice) : undefined;
    const cleanMaxPrice = (maxPrice && maxPrice !== '') ? Number(maxPrice) : undefined;
    const cleanSort = sort || undefined;

    return this.productsService.findAll(
      cleanKeyword, 
      cleanMinPrice, 
      cleanMaxPrice, 
      cleanSort
    );
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // --- [ส่วนที่แก้ไข] เพิ่มการรับไฟล์รูปภาพตอน Update ---
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image')) // 1. ต้องมี Interceptor
  update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    // 2. รับไฟล์และตรวจสอบขนาดเหมือนตอน Create
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false, 
        validators: [
          new MaxFileSizeValidator({ maxSize: PRODUCT_IMAGE.MAX_SIZE })
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    // 3. ส่ง file ไปที่ Service ด้วย
    return this.productsService.update(id, updateProductDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}