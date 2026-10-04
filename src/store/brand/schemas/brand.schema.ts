import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { excludeDeletedPlugin } from '../../../common/plugins/exclude-deleted.plugin';

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type BrandDocument = HydratedDocument<Brand>;

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.plugin(excludeDeletedPlugin);

BrandSchema.pre('save', async function () {
  if (this.isNew || !this.isModified('isDeleted') || !this.isDeleted) return;

  await this.$model('Product').updateMany(
    { brand: this._id },
    { isDeleted: true },
  );
});

BrandSchema.pre('updateMany', async function () {
  const update = this.getUpdate() as any;
  const isSoftDelete =
    update?.isDeleted === true || update?.$set?.isDeleted === true;
  if (!isSoftDelete) return;

  const brands = await this.model.find(this.getFilter()).select('_id').lean();
  if (!brands.length) return;

  await this.model.db
    .model('Product')
    .updateMany(
      { brand: { $in: brands.map((brand) => brand._id) } },
      { isDeleted: true },
    );
});
