import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import {
  buildUploadUrl,
  createImageMulterOptions,
} from '../../common/multer/image-upload.multer';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

const PRODUCT_FOLDER = 'products';
const MAX_IMAGES = 5;
const productMulterOptions = createImageMulterOptions(PRODUCT_FOLDER);

const toImageUrls = (files: Express.Multer.File[] = []) =>
  files.map((file) => buildUploadUrl(PRODUCT_FOLDER, file.filename));

@Controller('product')
@UsePipes(new ValidationPipe({ transform: true }))
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', MAX_IMAGES, productMulterOptions))
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.create(dto, req.user._id, toImageUrls(files));
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', MAX_IMAGES, productMulterOptions))
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.update(id, dto, toImageUrls(files));
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productService.remove(id);
  }
}
