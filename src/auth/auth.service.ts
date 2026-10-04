import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Model } from 'mongoose';
import { PROFILE_PIC_URL_PREFIX } from '../common/multer/profile-pic.multer';
import { TokenService } from '../common/token/token.service';
import { MailService } from '../mail/mail.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SignupDto } from './dto/signup.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private get otpExpiresInMinutes(): number {
    return Number(this.configService.get('OTP_EXPIRES_MINUTES') ?? 10);
  }

  private async generateOtp() {
    const otp = randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + this.otpExpiresInMinutes * 60 * 1000);
    return { otp, hashedOtp, otpExpiresAt };
  }

  async signup(dto: SignupDto) {
    const exists = await this.userModel.exists({ email: dto.email });
    if (exists) throw new ConflictException('Email already exists');

    const { otp, hashedOtp, otpExpiresAt } = await this.generateOtp();

    const user = await this.userModel.create({
      ...dto,
      otp: hashedOtp,
      otpExpiresAt,
    });

    await this.mailService.sendConfirmationEmail(
      user.email,
      user.fullName,
      otp,
      this.otpExpiresInMinutes,
    );

    return {
      message: 'Account created successfully, check your email for the OTP',
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+otp +otpExpiresAt');
    if (!user) throw new NotFoundException('User not found');
    if (user.confirmed) throw new BadRequestException('Email is already confirmed');
    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found, please request a new one');
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired, please request a new one');
    }

    const isValid = await bcrypt.compare(dto.otp, user.otp);
    if (!isValid) throw new BadRequestException('Invalid OTP');

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { confirmed: true }, $unset: { otp: 1, otpExpiresAt: 1 } },
    );

    return { message: 'Email confirmed successfully' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new NotFoundException('User not found');
    if (user.confirmed) throw new BadRequestException('Email is already confirmed');

    const { otp, hashedOtp, otpExpiresAt } = await this.generateOtp();

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { otp: hashedOtp, otpExpiresAt } },
    );

    await this.mailService.sendConfirmationEmail(
      user.email,
      user.fullName,
      otp,
      this.otpExpiresInMinutes,
    );

    return { message: 'A new OTP has been sent to your email' };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.confirmed) {
      throw new ForbiddenException('Please confirm your email first');
    }

    const accessToken = this.tokenService.sign({ id: user.id });
    return { message: 'Logged in successfully', accessToken };
  }

  async updateProfilePic(user: UserDocument, filename: string) {
    const profilePic = `${PROFILE_PIC_URL_PREFIX}/${filename}`;
    await this.userModel.updateOne({ _id: user._id }, { $set: { profilePic } });
    return { message: 'Profile picture updated successfully', profilePic };
  }
}
