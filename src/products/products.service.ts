import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private nextId = 1;

  create(dto: CreateProductDto): Product {
    const product: Product = { id: this.nextId++, ...dto };
    this.products.push(product);
    return product;
  }

  findAll(minPrice?: number): Product[] {
    if (minPrice !== undefined) {
      return this.products.filter((p) => p.price >= minPrice);
    }
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  update(id: number, dto: UpdateProductDto): Product {
    const product = this.findOne(id);
    Object.assign(product, dto);
    return product;
  }

  remove(id: number): { message: string } {
    const product = this.findOne(id);
    this.products = this.products.filter((p) => p.id !== product.id);
    return { message: `Product ${id} deleted successfully` };
  }
}
