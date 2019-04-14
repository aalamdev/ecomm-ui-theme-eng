export class ModelECommOrderLog {
    status: string;
    updated_date: string;
    details: Object; /*Key-value parameters*/
};

export class ModelBillAddon {
    title: string;
    value: number;
};

class ModelBillItemDetail {
    public id:number;
    public name:string;
    public code:string;
    public type:string;
    public quantity:number;
    public price_per_item:number;
    public discount_per_item:number;
};

export class ModelBillItem {
    public row_id;
    public item: ModelBillItemDetail;
};

export class ModelECommInvoice {
    public total_logic: string;
    public contact_name:string;
    public contact_id:number;
    public contact_addr_id:number;
    public settled:number;
    public total: number;
    public payment_mode:string;
    public addons: ModelBillAddon[];
    public created: string;
    public create_by: string;
    public last_updated: string;
    public last_updated_by:string;
    public bill_type:string;
    public items: ModelBillItem[];
};

export class ModelECommOrderDetails {
    contact_id: number;
    logs: ModelECommOrderLog[];
    invoice: ModelECommInvoice;
    price:number;
};

export class ModelECommOrders {
    id:number;
    name:string;
    status:string;
    created_date:string;
    price:number;
    settled: number;
    num_items:number;
    total_quantity:number;
}
