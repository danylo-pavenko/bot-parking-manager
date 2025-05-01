import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config/config.service';
import { TelegramModule } from './telegram/telegram.module';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { ParkingSpot } from './entities/parking-spot.entity';
import { RentRequest } from './entities/rent-request.entity';
import { GuardAccess } from './entities/guard-access.entity';
import { WithdrawRequest } from './entities/withdraw-request.entity';
import { TelegramAdmin } from './entities/telegram-admin.entity';
import { RentRequestService } from './request/rent-request.service';
import * as dotenv from 'dotenv';

dotenv.config();


@Module({
  imports: [
    TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: true,
        entities: [User, Address, ParkingSpot, RentRequest, GuardAccess, WithdrawRequest, TelegramAdmin],
      }
    ),
    TelegramModule,
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppModule { }
