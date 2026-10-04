import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 20 })
  firstName: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 20 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  confirmed: boolean;

  @Prop({ select: false })
  otp?: string;

  @Prop({ select: false })
  otpExpiresAt?: Date;

  @Prop({ default: null })
  profilePic?: string;
}

export type UserDocument = HydratedDocument<User, { fullName: string }>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function (this: User) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});
