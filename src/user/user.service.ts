import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User, UserRole } from '../entities/user.entity';
import { WithdrawRequest } from 'src/entities/withdraw-request.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(WithdrawRequest)
        private readonly withdrawRepo: Repository<WithdrawRequest>,
    ) { }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { telegramId } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }

    async updateLanguage(telegramId: string, language: 'uk' | 'en'): Promise<void> {
        await this.userRepository.update({ telegramId }, { language });
    }

    async updateRole(telegramId: string, role: UserRole): Promise<void> {
        await this.userRepository.update({ telegramId }, { role });
    }

    async updateFullname(telegramId: string, fullName: string): Promise<void> {
        await this.userRepository.update({ telegramId }, { fullName });
    }

    async countAll(): Promise<number> {
        return this.userRepository.count();
    }

    async getBalance(telegramId: string): Promise<number> {
        const user = await this.findByTelegramId(telegramId);
        return user?.balanceUah ?? 0;
    }

    async withdrawBalance(telegramId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { telegramId } });
        if (!user || user.balanceUah <= 0) return false;

        user.balanceUah = 0;

        const withdrawal = this.withdrawRepo.create({
            user,
            amount: user.balanceUah,
            status: 'PENDING',
        });

        await this.withdrawRepo.save(withdrawal);
        await this.userRepository.save(user);

        return true;
    }

    async addToBalanceUah(telegramId: string, amount: number): Promise<void> {
        const user = await this.findByTelegramId(telegramId);
        if (!user) return;
        const newBalance = (user.balanceUah ?? 0) + amount;
        await this.userRepository.update({ telegramId }, { balanceUah: newBalance });
    }

    async convertAndAddToBalance(
        telegramId: string,
        amount: number,
        currency: 'UAH' | 'USD' | 'EUR',
    ): Promise<void> {
        let rate = 1;

        if (currency !== 'UAH') {
            const response = await axios.get(
                'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
            );
            const currencyRate = response.data.find((r: any) => r.cc === currency);
            rate = currencyRate?.rate ?? 1;
        }

        const uahAmount = amount * rate;
        await this.addToBalanceUah(telegramId, uahAmount);
    }

    async createWithdrawRequest(telegramId: string): Promise<void> {
        const user = await this.findByTelegramId(telegramId);
        if (!user || (user.balanceUah ?? 0) <= 0) return;

        const request = this.withdrawRepo.create({
            user,
            amount: user.balanceUah,
            status: 'PENDING',
        });

        await this.withdrawRepo.save(request);
        await this.userRepository.update(user.id, { balanceUah: 0 });
    }

    async getPendingWithdrawals(): Promise<WithdrawRequest[]> {
        return this.withdrawRepo.find({
            where: { status: 'PENDING' },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async approveWithdrawal(id: number): Promise<void> {
        await this.withdrawRepo.update(id, { status: 'APPROVED' });
    }
}
