import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { safeUnlinkByRelativePath } from '../common/utils/file.utils'; 

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  private toPublicImagePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return normalized
      .replace(/^\.?\/?uploads\//, '')
      .replace(/^uploads\//, '');
  }

  async create(dto: CreateProductDto, file?: Express.Multer.File): Promise<Product> {
    const diskPath = file?.path?.replace(/\\/g, '/'); 
    const imageUrl = diskPath ? this.toPublicImagePath(diskPath) : undefined;

    try {
      return await this.productModel.create({
        ...dto,
        ...(imageUrl ? { imageUrl } : {}),
      });
    } catch (err) {
      if (diskPath) await safeUnlinkByRelativePath(diskPath);
      throw new InternalServerErrorException('Create product failed');
    }
  }

  async findAll(keyword?: string, minPrice?: number, maxPrice?: number, sort?: string): Promise<Product[]> {
    const query: any = {};

    // กรองชื่อสินค้า (ไม่สนตัวพิมพ์เล็กใหญ่)
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    // กรองราคา
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    let queryBuilder = this.productModel.find(query);

    // การจัดเรียง
    if (sort === 'price_asc') {
      queryBuilder = queryBuilder.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      queryBuilder = queryBuilder.sort({ price: -1 });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 }); // ล่าสุดขึ้นก่อน
    }

    return queryBuilder.exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, file?: Express.Multer.File): Promise<Product> {
    const existingProduct = await this.productModel.findById(id).exec();
    if (!existingProduct) {
      if (file?.path) await safeUnlinkByRelativePath(file.path);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const diskPath = file?.path?.replace(/\\/g, '/'); 
    const newImageUrl = diskPath ? this.toPublicImagePath(diskPath) : undefined;

    const dataToUpdate = { ...updateProductDto };
    if (newImageUrl) {
      dataToUpdate.imageUrl = newImageUrl;
    }

    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, dataToUpdate, { new: true })
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID ${id} not found during update`);
      }

      // ถ้ามีรูปใหม่ และของเก่าเคยมีรูป ให้ลบรูปเก่าทิ้ง
      if (newImageUrl && existingProduct.imageUrl) {
        await safeUnlinkByRelativePath(`uploads/${existingProduct.imageUrl}`);
      }

      return updatedProduct;

    } catch (err) {
      if (diskPath) await safeUnlinkByRelativePath(diskPath);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Update product failed');
    }
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (deletedProduct.imageUrl) {
      await safeUnlinkByRelativePath(`uploads/${deletedProduct.imageUrl}`);
    }

    return deletedProduct;
  }
}