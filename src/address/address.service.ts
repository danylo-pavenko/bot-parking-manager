import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/entities/address.entity';
import { GuardAccess } from 'src/entities/guard-access.entity';
import { ParkingSpot } from 'src/entities/parking-spot.entity';
import { ILike, IsNull, Repository } from 'typeorm';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepo: Repository<Address>,

        @InjectRepository(ParkingSpot)
        private readonly spotRepo: Repository<ParkingSpot>,

        @InjectRepository(GuardAccess)
        private readonly guardAccessRepo: Repository<GuardAccess>,
    ) { }

    async findByName(name: string): Promise<Address | null> {
        return this.addressRepo.findOne({
            where: {
                name: ILike(name),
            },
        });
    }

    async create(name: string): Promise<Address> {
        const address = this.addressRepo.create({ name });
        return this.addressRepo.save(address);
    }

    async findAll(): Promise<Address[]> {
        return this.addressRepo.find();
    }

    async spotExists(addressId: number, number: string): Promise<boolean> {
        return !!(await this.spotRepo.findOne({
            where: {
                address: { id: addressId },
                spotNumber: number,
            },
            relations: ['address'],
        }));
    }

    async createSpot(input: {
        addressId: number;
        ownerId: number;
        spotNumber: string;
        price: number;
        currency: 'UAH' | 'USD' | 'EUR';
    }): Promise<ParkingSpot> {
        const spot = this.spotRepo.create({
            spotNumber: input.spotNumber,
            price: input.price,
            currency: input.currency,
            owner: { id: input.ownerId },
            address: { id: input.addressId },
        });
        return this.spotRepo.save(spot);
    }

    async assignGuard(addressId: number, guardId: number): Promise<void> {
        await this.guardAccessRepo.save({
            address: { id: addressId },
            guard: { id: guardId },
        });
    }

    async searchAvailableSpotsByStreet(query: string): Promise<ParkingSpot[]> {
        return this.spotRepo.find({
            where: {
                address: {
                    name: ILike(`%${query}%`),
                },
                renter: IsNull(),
            },
            relations: ['address'],
            take: 10,
        });
    }

    async findAvailableSpots(): Promise<ParkingSpot[]> {
        return this.spotRepo.find({
            where: { renter: IsNull() },
            relations: ['address'],
            take: 10,
        });
    }

    async findSpotsByCarPlateAndGuard(guardId: number, plate: string): Promise<ParkingSpot[]> {
        return this.spotRepo
            .createQueryBuilder('spot')
            .leftJoinAndSelect('spot.address', 'address')
            .leftJoinAndSelect('spot.renter', 'renter')
            .innerJoin('guard_access', 'ga', 'ga.addressId = address.id AND ga.guardId = :guardId', { guardId })
            .where('UPPER(spot.carPlate) = :plate', { plate: plate.toUpperCase() })
            .getMany();
    }

    async findAllByOwner(ownerId: number): Promise<Address[]> {
        return this.addressRepo
            .createQueryBuilder('address')
            .innerJoin('address.spots', 'spot')
            .where('spot.ownerId = :ownerId', { ownerId })
            .getMany();
    }

    async countSpots(): Promise<number> {
        return this.spotRepo.count();
    }
}
