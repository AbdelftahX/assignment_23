import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

const CREATOR_FIELDS = 'firstName lastName email';
const ANY_DELETE_STATE = { $in: [true, false] };

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private async assertNameAvailable(name: string) {
    const exists = await this.categoryModel.exists({
      name,
      isDeleted: ANY_DELETE_STATE,
    });
    if (exists) throw new ConflictException('Category name already exists');
  }

  async create(dto: CreateCategoryDto, userId: Types.ObjectId, logo?: string) {
    await this.assertNameAvailable(dto.name);
    return this.categoryModel.create({ ...dto, logo, createdBy: userId });
  }

  findAll() {
    return this.categoryModel
      .find()
      .populate('createdBy', CREATOR_FIELDS)
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('createdBy', CREATOR_FIELDS);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, logo?: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      await this.assertNameAvailable(dto.name);
      category.name = dto.name;
    }
    if (logo) category.logo = logo;

    return category.save();
  }

  async remove(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    category.isDeleted = true;
    await category.save();

    return { message: 'Category and its related brands and products were deleted' };
  }
}
