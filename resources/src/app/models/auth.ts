export class ModelContactDetail {
    id: number;
    key:string;
    value: string;
}

export class ModelContactAddressValue {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
}

export class ModelContactAddress {
    id: number;
    value: ModelContactAddressValue;
}

export class ModelECommContact {
    first_name: string;
    last_name: string;
    other_info: string;
    details: ModelContactDetail[];
    addresses: ModelContactAddress[];
}
