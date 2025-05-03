import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentRequest } from 'src/entities/rent-request.entity';
import { RentRequestService } from './rent-request.service';
import { ParkingSpot } from 'src/entities/parking-spot.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RentRequest, ParkingSpot])],
    providers: [RentRequestService],
    exports: [RentRequestService],
})
export class RentRequestModule { }
