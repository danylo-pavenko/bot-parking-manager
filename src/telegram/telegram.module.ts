import { Module, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ConfigService } from 'src/config/config.service';
import { AddressService } from 'src/address/address.service';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    ConfigService,
    UserService,
    AddressService,
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(private readonly botService: TelegramService) { }

  async onModuleInit() {
    await this.botService.launch();
  }
}
