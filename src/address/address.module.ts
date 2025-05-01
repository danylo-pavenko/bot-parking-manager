import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../entities/address.entity';
import { ParkingSpot } from '../entities/parking-spot.entity';
import { AddressService } from './address.service';
import { GuardAccess } from 'src/entities/guard-access.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, ParkingSpot, GuardAccess])],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule { }
