import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ParkingSpot } from './parking-spot.entity';
import { User } from './user.entity';

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'creatorId' })
    creator: User;

    @OneToMany(() => ParkingSpot, (spot) => spot.address, { cascade: true })
    spots: ParkingSpot[];
}
