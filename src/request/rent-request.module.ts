import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentRequest } from 'src/entities/rent-request.entity';
import { RentRequestService } from './rent-request.service';

@Module({
    imports: [TypeOrmModule.forFeature([RentRequest])],
    providers: [RentRequestService],
    exports: [RentRequestService],
})
export class RentRequestModule { }
