import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from '../brand/schemas/brand.schema';
import { Category, CategoryDocument } from '../category/schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

const CREATOR_FIELDS = 'firstName lastName email';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private async validateBrandCategoryRelation(brandId: string, categoryId: string) {
    const category = await this.categoryModel.exists({ _id: categoryId });
    if (!category) throw new NotFoundException('Category not found');

    const brand = await this.brandModel.findById(brandId).select('categories');
    if (!brand) throw new NotFoundException('Brand not found');

    const supportsCategory = brand.categories.some(
      (id) => id.toString() === categoryId,
    );
    if (!supportsCategory) {
      throw new BadRequestException(
        'The selected brand does not support the selected category',
      );
    }
  }

  async create(dto: CreateProductDto, userId: Types.ObjectId, images: string[]) {
    await this.validateBrandCategoryRelation(dto.brand, dto.category);
    return this.productModel.create({ ...dto, images, createdBy: userId });
  }

  findAll() {
    return this.productModel
      .find()
      .populate('category', 'name logo')
      .populate('brand', 'name logo')
      .populate('createdBy', CREATOR_FIELDS)
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name logo')
      .populate('brand', 'name logo')
      .populate('createdBy', CREATOR_FIELDS);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, images: string[]) {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    if (dto.brand || dto.category) {
      await this.validateBrandCategoryRelation(
        dto.brand ?? product.brand.toString(),
        dto.category ?? product.category.toString(),
      );
    }

    const { brand, category, ...rest } = dto;
    product.set(rest);
    if (brand) product.brand = new Types.ObjectId(brand);
    if (category) product.category = new Types.ObjectId(category);
    if (images.length) product.images = images;

    return product.save();
  }

  async remove(id: string) {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    product.isDeleted = true;
    await product.save();

    return { message: 'Product deleted successfully' };
  }
}
