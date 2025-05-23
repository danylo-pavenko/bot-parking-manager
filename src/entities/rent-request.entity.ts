import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ParkingSpot } from './parking-spot.entity';
import { User } from './user.entity';

@Entity()
export class RentRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    renter: User;

    @ManyToOne(() => ParkingSpot, { eager: true })
    spot: ParkingSpot;

    @Column({ type: 'enum', enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

    @Column({ type: 'enum', enum: ['CARD', 'CASH'] })
    paymentMethod: 'CARD' | 'CASH';

    @Column({ nullable: true })
    ipn?: string;

    @Column({ nullable: true })
    fullName?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ type: 'timestamp', nullable: true })
    confirmedAt?: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelledAt?: Date;
}
