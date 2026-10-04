import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { excludeDeletedPlugin } from '../../../common/plugins/exclude-deleted.plugin';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true, minlength: 2, maxlength: 20 })
  name: string;

  @Prop()
  logo?: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type CategoryDocument = HydratedDocument<Category>;

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.plugin(excludeDeletedPlugin);

CategorySchema.pre('save', async function () {
  if (this.isNew || !this.isModified('isDeleted') || !this.isDeleted) return;

  const Brand = this.$model('Brand');
  const Product = this.$model('Product');

  const brands = await Brand.find({ categories: this._id }).select('_id').lean();
  if (brands.length) {
    await Brand.updateMany(
      { _id: { $in: brands.map((brand) => brand._id) } },
      { isDeleted: true },
    );
  }

  await Product.updateMany({ category: this._id }, { isDeleted: true });
});
