import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0, type: Number, default: 0 })
  price: number;

  @Prop()
  description: string;

  // --- [ส่วนที่เพิ่ม] ---
  // บอกว่าเป็น Array ของ String ([String])
  @Prop({ type: [String] }) 
  colors: string[]; 

  @Prop()// เก็บเป็น String (Path ของไฟล์) เช่น 'uploads/xxx-xxx.jpg' 
  imageUrl: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);