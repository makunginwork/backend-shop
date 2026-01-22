// src/products/products.service.ts
import { Injectable, NotFoundException,InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { safeUnlinkByRelativePath } from '../common/utils/file.utils'; 

@Injectable()
export class ProductsService {
  // Inject Product Model เข้ามาใช้งาน โดยเก็บไว้ในตัวแปรชื่อ productModel
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  private toPublicImagePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/'); // กัน Windows path
    // ตัด 'uploads/' หรือ './uploads/' ออกให้หมด
    return normalized
      .replace(/^\.?\/?uploads\//, '')
      .replace(/^uploads\//, '');
  }

  // --- สร้างสินค้า (Create) ---
  // async = ฟังก์ชันแบบอะซิงโครนัส เพื่อไม่ต้องรอการทำงานของ Database
  async create(dto: CreateProductDto, file?: Express.Multer.File): Promise<Product> {
    const diskPath = file?.path?.replace(/\\/g, '/'); // เช่น uploads/products/uuid.jpg
    const imageUrl = diskPath ? this.toPublicImagePath(diskPath) : undefined; // products/uuid.jpg

    try {
      return await this.productModel.create({
        ...dto,
        ...(imageUrl ? { imageUrl } : {}),
      });
    } catch (err) {
      if (diskPath) await safeUnlinkByRelativePath(diskPath); // ลบ "disk path" เท่านั้น
      throw new InternalServerErrorException('Create product failed');
    }
  }

  // --- ดึงข้อมูลทั้งหมด (Read All) ---
  // Promise = สัญญาว่าจะคืนค่าในอนาคต (หลังจากรอการทำงานของ Database เสร็จ)
  async findAll(
    keyword?: string,
    minPrice?: number,
    maxPrice?: number,
    sort?: string,
  ): Promise<Product[]> {
    // สร้าง query object ตามเงื่อนไขที่รับมา
    const query: any = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' }; // ค้นหาไม่คำนึงถึงตัวพิมพ์
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    let queryBuilder = this.productModel.find(query);

    // ตรวจสอบการจัดเรียง
    if (sort) {
      if (sort === 'price_asc') {
        queryBuilder = queryBuilder.sort({ price: 1 }); // ราคาน้อยไปมาก
      } else if (sort === 'price_desc') {
        queryBuilder = queryBuilder.sort({ price: -1 }); // ราคามากไปน้อย
      }
    }

    return queryBuilder.exec();
  }

  // --- ดึงข้อมูลรายตัว (Read One) ---
  async findOne(id: string): Promise<Product> {
    // await รอผลลัพธ์จากการค้นหาใน Database เพื่อเก็บลงตัวแปร product ไปตรวจสอบต่อ
    const product = await this.productModel.findById(id).exec();

    // ดัก Error: ถ้าหาไม่เจอ ให้โยน Error 404 ออกไป
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  // --- แก้ไขข้อมูล (Update) ---
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        updateProductDto,
        { new: true } // สำคัญ: Option นี้บอกให้คืนค่าข้อมูล "ใหม่" หลังแก้แล้วกลับมา (ถ้าไม่ใส่จะได้ค่าเก่า)
      )
      .exec();

    // ดัก Error: ถ้าหาไม่เจอ
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  // --- ลบข้อมูล (Delete) ---
  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    // ดัก Error: ถ้าหาไม่เจอ
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return deletedProduct;
  }
}