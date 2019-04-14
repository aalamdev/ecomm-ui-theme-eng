import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {ModelECommOrders} from "./models/orders";
import {ECommService} from "./ecomm.service";
import {BreadCrumbsService} from "./bread-crumbs.service";

@Component({
    templateUrl: "html/orders.html",
    styleUrls: ['css/orders.css']
})
export class OrdersComponent implements OnInit {
    public status_filters = ['New', 'Accepted', 'Delivered', 'Returned', 'Cancelled']
    private status_filter_map = {
        "New": {
            "values": "New",
            "model_value": undefined},
        "Accepted": {
            "values": "Accepted,Shipped",
            "model_value": undefined},
        "Delivered": {
            "values": "Delivered",
            "model_value": undefined},
        "Returned": {
            "values": "Return-Initiated,Return-Shipped,Returned",
            "model_value": undefined},
        "Cancelled": {
            "values": "Cancelled,Refunded,Refund-Initiated",
            "model_value": undefined}
    };
    public from_price:number;
    public upto_price:number;
    private orig_from_price:number;
    private orig_upto_price:number;
    public unpaid_filter:boolean;
    private filters_changed:boolean;
    public orders: ModelECommOrders[];
    private sorter:string;
    public show_load_more:boolean
    private LIMIT:number = 30;

    constructor(private _ecomms:ECommService, private _router:Router,
                public _bcs:BreadCrumbsService) { }

    getOrders() {
        let params = {}
        let status_filters = ""
        let separator = "";
        for (let x of this.status_filters) {
            if (this.status_filter_map[x].model_value) {
                status_filters += (separator + this.status_filter_map[x].values);
                separator = ",";
            }
        }
        if (status_filters)
            params['status'] = status_filters

        if (this.unpaid_filter)
            params['unsettled'] = true

        if (this.from_price)
            params['price_ge'] = this.from_price;

        if (this.upto_price)
            params['price_le'] = this.upto_price;

        if (this.filters_changed)
            this.orders = [];

        this.filters_changed = false;

        if (this.sorter)
            params['sort'] = this.sorter + ",id.desc";
        else
            params['sort'] = 'id.desc'

        params['limit'] = this.LIMIT;
        if (this.orders.length) {
            let l = this.orders[this.orders.length - 1];
            switch(this.sorter) {
                case "created_date.desc":
                    params['created_date_le'] = l.created_date;
                    params['id_l'] = l.id + "|created_date_l=" + l.created_date;
                    break;
                case "created_date.asc":
                    params['created_date_ge'] = l.created_date;
                    params['id_l'] = l.id + "|created_date_g=" + l.created_date;
                    break;
                case "price.desc":
                    params['price_le'] = l.price;
                    params['id_l'] = l.id + "|price_l=" + l.price;
                    break;
                case "price.asc":
                    params['price_ge'] = l.price;
                    params['id_l'] = l.id + "|price_g=" + l.price;
                    break;
                default:
                    params['id_l'] = this.orders[this.orders.length - 1].id;
            }
        }

        this._ecomms.getOrders(params).then((ret) => {
            if (typeof ret == "string") {
                return
            }
            this.show_load_more = (ret.length == this.LIMIT);
            this.orders = this.orders.concat(ret);
        })
    }

    ngOnInit() {
        this.orders = [];
        this.getOrders();
        this._bcs.putCrumbs([
            this._bcs.crumbs[0],
            {name: "Orders", link: ['/orders']}])
    }
    loadMore() {
        this.getOrders();
    }
    statusFilterChanged(status:string) {
        this.filters_changed = true;
        this.getOrders();
    }
    unpaidFilterChanged() {
        this.filters_changed = true;
        this.getOrders();
    }
    fromPriceChanged() {
        if (this.orig_from_price == this.from_price) {
            return
        }
        this.orig_from_price = this.from_price;
        this.filters_changed = true;
        this.getOrders();
    }
    toPriceChanged() {
        if (this.orig_upto_price == this.upto_price) {
            return
        }
        this.orig_upto_price = this.upto_price;
        this.filters_changed = true;
        this.getOrders();
    }
    navigateOrder(order_id:number) {
        this._router.navigate(['/order', order_id])
    }
    headerClicked(item:string) {
        if (!this.sorter) {
            this.sorter = item + ".desc";
        } else {
            let tmp = this.sorter.split(".")
            if (tmp[0] == item) {
                this.sorter = item + "." + (tmp[1] == "asc"?"desc":"asc");
            } else {
                this.sorter = item + ".desc";
            }
        }
        this.filters_changed = true;
        this.getOrders();
    }
}
