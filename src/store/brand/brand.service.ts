import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../category/schemas/category.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand, BrandDocument } from './schemas/brand.schema';

const CREATOR_FIELDS = 'firstName lastName email';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private async assertCategoriesExist(categoryIds: string[]) {
    const count = await this.categoryModel.countDocuments({
      _id: { $in: categoryIds },
    });
    if (count !== categoryIds.length) {
      throw new NotFoundException('One or more categories do not exist');
    }
  }

  async create(dto: CreateBrandDto, userId: Types.ObjectId, logo?: string) {
    await this.assertCategoriesExist(dto.categories);
    return this.brandModel.create({ ...dto, logo, createdBy: userId });
  }

  findAll() {
    return this.brandModel
      .find()
      .populate('categories', 'name logo')
      .populate('createdBy', CREATOR_FIELDS)
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const brand = await this.brandModel
      .findById(id)
      .populate('categories', 'name logo')
      .populate('createdBy', CREATOR_FIELDS);
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, logo?: string) {
    const brand = await this.brandModel.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');

    if (dto.categories) {
      await this.assertCategoriesExist(dto.categories);
      brand.categories = dto.categories.map((categoryId) => new Types.ObjectId(categoryId));
    }
    if (dto.name) brand.name = dto.name;
    if (logo) brand.logo = logo;

    return brand.save();
  }

  async remove(id: string) {
    const brand = await this.brandModel.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');

    brand.isDeleted = true;
    await brand.save();

    return { message: 'Brand and its related products were deleted' };
  }
}
