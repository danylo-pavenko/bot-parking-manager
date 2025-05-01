import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { WithdrawRequest } from 'src/entities/withdraw-request.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, WithdrawRequest])],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule { }
