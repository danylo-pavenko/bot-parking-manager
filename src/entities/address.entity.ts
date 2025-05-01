import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ParkingSpot } from './parking-spot.entity';

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => ParkingSpot, (spot) => spot.address, { cascade: true })
    spots: ParkingSpot[];
}
