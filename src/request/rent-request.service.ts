import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { RentRequest } from 'src/entities/rent-request.entity';
import { ParkingSpot } from 'src/entities/parking-spot.entity';
import { addDays } from 'date-fns';

@Injectable()
export class RentRequestService {
    constructor(
        @InjectRepository(RentRequest)
        private readonly repo: Repository<RentRequest>,
        @InjectRepository(ParkingSpot)
        private readonly spotRepo: Repository<ParkingSpot>,
    ) { }

    async create(data: {
        renterId: number;
        spotId: number;
        fullName: string;
        phone: string;
        ipn: string;
        paymentMethod: 'CARD' | 'CASH';
    }): Promise<RentRequest> {
        const existing = await this.repo.findOne({
            where: {
                spot: { id: data.spotId },
                ipn: data.ipn,
                status: In(['PENDING', 'APPROVED']),
            },
        });

        if (existing) {
            throw new Error('RENT_DUPLICATE_IPN');
        }

        const now = new Date();
        const endDate = addDays(now, 30);

        const request = this.repo.create({
            renter: { id: data.renterId },
            spot: { id: data.spotId },
            fullName: data.fullName,
            phone: data.phone,
            ipn: data.ipn,
            paymentMethod: data.paymentMethod,
            status: 'PENDING',
            startDate: now,
            endDate,
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

    async findPendingByOwner(ownerId: number): Promise<RentRequest[]> {
        return this.repo
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.spot', 'spot')
            .leftJoinAndSelect('spot.address', 'address')
            .leftJoinAndSelect('request.renter', 'renter')
            .where('spot.ownerId = :ownerId', { ownerId })
            .andWhere('request.status = :status', { status: 'PENDING' })
            .getMany();
    }

    async markConfirmed(requestId: number): Promise<void> {
        await this.repo.update(requestId, {
            confirmedAt: new Date(),
        });
    }

    async countAll(): Promise<number> {
        return this.repo.count();
    }

    async findCompletedCash(): Promise<RentRequest[]> {
        return this.repo.find({
            where: {
                status: 'COMPLETED',
                paymentMethod: 'CASH',
            },
            relations: ['renter', 'spot', 'spot.address'],
        });
    }

    async findEndingSoon(date: Date): Promise<RentRequest[]> {
        return this.repo.find({
            where: {
                endDate: date,
                status: 'APPROVED',
            },
            relations: ['renter', 'spot', 'spot.address'],
        });
    }

    async deleteById(requestId: number): Promise<void> {
        await this.repo.delete({ id: requestId });
    }

    async findActiveByRenter(renterId: number): Promise<RentRequest[]> {
        return this.repo.find({
            where: {
                renter: { id: renterId },
                status: In(['APPROVED', 'PENDING']),
            },
            relations: ['spot', 'spot.address'],
        });
    }

    async findApprovedByRenter(renterId: number): Promise<RentRequest[]> {
        return this.repo.find({
            where: {
                renter: { id: renterId },
                status: 'APPROVED',
            },
            relations: ['spot', 'spot.address'],
            order: { endDate: 'ASC' },
        });
    }

    async cancelAfterEndDate(requestId: number): Promise<void> {
        const request = await this.repo.findOne({
            where: { id: requestId },
            relations: ['spot'],
        });

        if (!request) return;

        request.status = 'CANCELLED';
        request.endDate = new Date(); // завершення одразу
        await this.repo.save(request);

        // очистити місце
        if (request.spot) {
            request.spot.renter = null;
            request.spot.carPlate = null;
            await this.spotRepo.save(request.spot);
        }
    }

    async cancelApprovedAfterNow(requestId: number): Promise<void> {
        const request = await this.repo.findOne({
            where: { id: requestId, status: 'APPROVED' },
            relations: ['spot'],
        });

        if (!request) return;

        request.status = 'CANCELLED';
        await this.repo.save(request);
    }

    async closeExpiredRents(now: Date): Promise<void> {
        const expired = await this.repo.find({
            where: [
                { status: 'APPROVED', endDate: LessThanOrEqual(now) },
            ],
            relations: ['spot'],
        });

        for (const r of expired) {
            r.status = 'COMPLETED';
            await this.repo.save(r);

            if (r.spot) {
                r.spot.renter = null;
                r.spot.carPlate = null;
                await this.spotRepo.save(r.spot);
            }
        }
    }

    async findByIdWithRelations(id: number): Promise<RentRequest | null> {
        return this.repo.findOne({
            where: { id },
            relations: ['renter', 'spot', 'spot.address'],
        });
    }
}
