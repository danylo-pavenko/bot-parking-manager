import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class WithdrawRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.withdrawRequests, { eager: true, onDelete: 'CASCADE' })
    user: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'PENDING' })
    status: 'PENDING' | 'APPROVED' | 'REJECTED';

    @CreateDateColumn()
    createdAt: Date;
}
