import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import {
  buildUploadUrl,
  createImageMulterOptions,
} from '../../common/multer/image-upload.multer';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_FOLDER = 'categories';
const categoryMulterOptions = createImageMulterOptions(CATEGORY_FOLDER);

@Controller('category')
@UsePipes(new ValidationPipe({ transform: true }))
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo', categoryMulterOptions))
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logo = file && buildUploadUrl(CATEGORY_FOLDER, file.filename);
    return this.categoryService.create(dto, req.user._id, logo);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo', categoryMulterOptions))
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logo = file && buildUploadUrl(CATEGORY_FOLDER, file.filename);
    return this.categoryService.update(id, dto, logo);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
