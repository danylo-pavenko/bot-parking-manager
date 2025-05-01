import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Address } from './address.entity';
import { RentRequest } from './rent-request.entity';
import { User } from './user.entity';

@Entity()
export class ParkingSpot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    spotNumber: string;

    @Column()
    price: number;

    @Column({ type: 'enum', enum: ['UAH', 'USD', 'EUR'] })
    currency: 'UAH' | 'USD' | 'EUR';

    @ManyToOne(() => Address, (address) => address.spots, { eager: true })
    address: Address;

    @ManyToOne(() => User, { eager: true })
    owner: User;

    @OneToMany(() => RentRequest, (r) => r.spot)
    rentRequests: RentRequest[];
}
