import { IsOptional, IsString, IsArray, ValidateNested, IsNumber, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryUpdateDTO {
  @IsString()
  warehouseId: string;

  @IsString()
  @IsOptional()
  quantity?: string;

  @IsString()
  @IsOptional()
  minThreshold?: string;

  @IsString()
  @IsOptional()
  maxThreshold?: string;

  @IsString()
  @IsOptional()
  reorderPoint?: string;

  @IsString()
  @IsOptional()
  reorderQuantity?: string;
}

export class ProductUpdateWithInventoryDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  base_price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'out_of_stock', 'discontinued'])
  status?: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  supplier_id?: string;

  @IsOptional()
  @IsObject()
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };

  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryUpdateDTO)
  inventoryUpdates?: InventoryUpdateDTO[];
}
