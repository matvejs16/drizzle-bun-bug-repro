import Decimal from 'decimal.js';
import { customType } from 'drizzle-orm/pg-core';

export const zeroDecimal = new Decimal(0);

export const bigintDecimalJS = customType<{
    data: Decimal;
    driverData: string;
}>({
    dataType() {
        return 'bigint';
    },
    toDriver(value) {
        return value.toString();
    },
    fromDriver(value): Decimal {
        return new Decimal(value);
    },
});
