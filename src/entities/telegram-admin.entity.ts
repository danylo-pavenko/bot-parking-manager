import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TelegramAdmin {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('bigint', { unique: true })
    telegramId: string;
}
