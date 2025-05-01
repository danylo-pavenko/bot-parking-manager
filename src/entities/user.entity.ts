import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

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
    phone?: string;

    @Column({ type: 'enum', enum: UserRole, nullable: true })
    role?: UserRole;

    @Column({ default: 'uk' })
    language: 'uk' | 'en';

    @CreateDateColumn()
    createdAt: Date;
}
