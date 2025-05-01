import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { telegramId } });
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
}
