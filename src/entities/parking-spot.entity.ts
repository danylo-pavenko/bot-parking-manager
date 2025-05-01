import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Address } from './address.entity';
import { RentRequest } from './rent-request.entity';
import { User } from './user.entity';

@Entity()
export class ParkingSpot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    spotNumber: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'enum', enum: ['UAH', 'USD', 'EUR'] })
    currency: 'UAH' | 'USD' | 'EUR';

    @ManyToOne(() => Address, (address) => address.spots, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'addressId' })
    address: Address;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @ManyToOne(() => User, { nullable: true, eager: true })
    @JoinColumn({ name: 'renterId' })
    renter?: User;

    @Column({ nullable: true })
    carPlate?: string;

    @OneToMany(() => RentRequest, (r) => r.spot, { cascade: true })
    rentRequests: RentRequest[];
}
