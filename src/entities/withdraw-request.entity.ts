import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class WithdrawRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    owner: User;

    @Column()
    amount: number;

    @Column()
    details: string;

    @Column({ default: false })
    processed: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
