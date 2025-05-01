import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentRequest } from 'src/entities/rent-request.entity';
import { User } from 'src/entities/user.entity';
import { ParkingSpot } from 'src/entities/parking-spot.entity';

@Injectable()
export class RentRequestService {
    constructor(
        @InjectRepository(RentRequest)
        private readonly repo: Repository<RentRequest>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ParkingSpot)
        private readonly spotRepo: Repository<ParkingSpot>,
    ) { }

    async create(data: {
        renterId: number;
        spotId: number;
        fullName: string;
        phone: string;
        ipn: string;
        paymentMethod: 'CASH' | 'CARD';
    }): Promise<RentRequest> {
        const renter = await this.userRepo.findOneByOrFail({ id: data.renterId });
        const spot = await this.spotRepo.findOneByOrFail({ id: data.spotId });

        const request = this.repo.create({
            renter,
            spot,
            fullName: data.fullName,
            phone: data.phone,
            ipn: data.ipn,
            paymentMethod: data.paymentMethod,
            status: 'PENDING',
        });

        return this.repo.save(request);
    }


    async findBySpotId(spotId: number): Promise<RentRequest[]> {
        return this.repo.find({
            where: { spot: { id: spotId } },
            relations: ['renter', 'spot'],
        });
    }

    async approve(requestId: number): Promise<void> {
        await this.repo.update(requestId, { status: 'APPROVED' });
    }

    async reject(requestId: number): Promise<void> {
        await this.repo.update(requestId, { status: 'REJECTED' });
    }
}
