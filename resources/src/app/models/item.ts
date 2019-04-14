export class ModelItemProperty {
    name:string;
    values:string[];
}

export class ModelGetItems {
    id:number;
    name:string;
    code:string;
    sale_price:number;
    purchase_price:number;
    sale_discount: number;
    purchase_discount:number;
    stock:number;
    type:string;
    properties: ModelItemProperty[];
}

export class ModelItemType {
    id: number;
    type: string;
    description: string;
}

export class ModelItemNameQuery {
    name: string;
    type: string;
}

export class ModelItemImagesSpec {
    src: string;
    description: string;
    index: number;
    name: string;
}
