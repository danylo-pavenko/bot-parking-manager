import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { WithdrawRequest } from './withdraw-request.entity';

export enum UserRole {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
    RENTER = 'RENTER',
    GUARD = 'GUARD',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { unique: true })
    telegramId: string;

    @Column({ nullable: true })
    username?: string;

    @Column({ nullable: true })
    fullName?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    portmoneMerchantId?: string;

    @Column({ nullable: true })
    portmoneSecretKey?: string;

    @Column({ type: 'enum', enum: UserRole, nullable: true })
    role?: UserRole;

    @Column({ default: 'uk' })
    language: 'uk' | 'en';

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balanceUah: number;

    @OneToMany(() => WithdrawRequest, (r) => r.user)
    withdrawRequests: WithdrawRequest[];

    @CreateDateColumn()
    createdAt: Date;
}
