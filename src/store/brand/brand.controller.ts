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
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

const BRAND_FOLDER = 'brands';
const brandMulterOptions = createImageMulterOptions(BRAND_FOLDER);

@Controller('brand')
@UsePipes(new ValidationPipe({ transform: true }))
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo', brandMulterOptions))
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logo = file && buildUploadUrl(BRAND_FOLDER, file.filename);
    return this.brandService.create(dto, req.user._id, logo);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo', brandMulterOptions))
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const logo = file && buildUploadUrl(BRAND_FOLDER, file.filename);
    return this.brandService.update(id, dto, logo);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.brandService.remove(id);
  }
}
