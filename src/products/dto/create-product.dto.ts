import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Type(() => Number) // แปลงจาก form-data (string) เป็น number
    price: number;

    @IsOptional()
    @IsString()
    description?: string;

    // --- [ส่วนที่เพิ่ม] ---
    @IsOptional()
    @IsArray()                 // ต้องเป็น Array เท่านั้น
    @IsString({ each: true })  // ข้อมูลข้างในแต่ละตัวต้องเป็น String
    colors?: string[];

    @IsOptional()
    @IsString()
    imageUrl?: string;
}