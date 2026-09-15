import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { XacThucController } from './xac-thuc.controller';
import { XacThucService } from './xac-thuc.service';
import { XacThucPhienService } from './xac-thuc-phien.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [XacThucController],
  providers: [XacThucService, XacThucPhienService, JwtStrategy],
  exports: [XacThucService, XacThucPhienService, JwtStrategy, PassportModule],
})
export class XacThucModule {}
