import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Address } from './address.entity';

@Entity()
export class GuardAccess {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    guard: User;

    @ManyToOne(() => Address)
    address: Address;
}
