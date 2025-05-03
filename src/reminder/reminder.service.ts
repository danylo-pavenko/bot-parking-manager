import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentRequestService } from '../request/rent-request.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class ReminderService {
    constructor(
        private rentRequestService: RentRequestService,
        private telegramService: TelegramService,
    ) { }

    @Cron('0 10 * * *') // щодня о 10:00 ранку
    async handleReminders() {
        const inFiveDays = new Date();
        inFiveDays.setDate(inFiveDays.getDate() + 5);

        const expiringRequests = await this.rentRequestService.findEndingSoon(inFiveDays);

        for (const req of expiringRequests) {
            if (req.renter?.telegramId) {
                await this.telegramService.sendReminder(
                    req.renter.telegramId,
                    req.spot.address.name,
                    req.spot.spotNumber,
                    req.endDate
                );
            }
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpiredRents() {
        console.log('[CRON] Checking for expired rents...');
        const now = new Date();
        await this.rentRequestService.closeExpiredRents(now);
    }
}
