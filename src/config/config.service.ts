import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {
    get botToken(): string {
        return process.env.TELEGRAM_BOT_TOKEN!;
    }

    get dbHost(): string {
        return process.env.DB_HOST!;
    }

    get dbPort(): number {
        return +process.env.DB_PORT!;
    }

    get dbUsername(): string {
        return process.env.DB_USERNAME!;
    }

    get dbPassword(): string {
        return process.env.DB_PASSWORD!;
    }

    get dbName(): string {
        return process.env.DB_NAME!;
    }

    get paymentProviderToken(): string {
        return process.env.TELEGRAM_PROVIDER_TOKEN!;
    }
}
