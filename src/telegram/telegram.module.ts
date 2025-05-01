import { Module, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserModule } from 'src/user/user.module';
import { AddressModule } from 'src/address/address.module';
import { ConfigService } from 'src/config/config.service';
import { RentRequestService } from 'src/request/rent-request.service';
import { RentRequest } from 'src/entities/rent-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { ParkingSpot } from 'src/entities/parking-spot.entity';

@Module({
  imports: [
    UserModule,
    AddressModule,
    TypeOrmModule.forFeature([RentRequest, User, ParkingSpot]),
  ],
  providers: [TelegramService, ConfigService, RentRequestService],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(private readonly botService: TelegramService) { }

  async onModuleInit() {
    await this.botService.launch();
  }
}
