import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/entities/address.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepo: Repository<Address>,
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
}
