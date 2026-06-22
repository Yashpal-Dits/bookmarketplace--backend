import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../common/constants/roles.constant';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role!: Role;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);