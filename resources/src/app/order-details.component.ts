import {Component, OnInit, OnDestroy, Input, Output, EventEmitter} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";

import {ECommService} from "./ecomm.service";
import {StockService} from "./stock.service";
import {SettingsService} from "./settings.service";
import {BreadCrumbsService} from "./bread-crumbs.service";
import {ModelBillAddon, ModelECommOrderDetails, ModelECommOrderLog} from "./models/orders";
import { environment } from '../environments/environment';


@Component({
    templateUrl: "html/invoice-details.html",
    selector: "invoice-details",
    styleUrls: ['css/invoice-details.css']
})
export class OrderInvoiceDetailsComponent {
    @Input('order') order:ModelECommOrderDetails;
    private group_prop_map:Object;

    constructor(public _settings:SettingsService, private _ecomms:ECommService,
                private _stocks:StockService) {
        this.group_prop_map = {};
    }

    ngOnInit() {
        this._ecomms.codSettings().then(ret => {
            let item_ids = [];

            if (!this.order.invoice.items)
                return;

            let cod_index:number;
            let index = 0
            for (let c of this.order.invoice.items) {
                if (c.item.id == ret['item_id']) {
                    cod_index = index++;
                    if (c.item.price_per_item > 0)
                        this.order.invoice.addons.push(<ModelBillAddon>{'title': "COD Charges", 'value': c.item.price_per_item})
                    continue
                }
                index++;
                item_ids.push(c.item.id);
            }
            if (cod_index >= 0)
                this.order.invoice.items.splice(cod_index, 1)

            this._ecomms.getItemGroupItemProps(item_ids).then(ret => {
                for (let r of ret) {
                    this.group_prop_map[r.item_id] = r.properties.split(",");
                }
            })
            for (let i of this.order.invoice.items) {
                this._stocks.getItemsDetails(i.item.id).then((ret) => {
                    let item = ret;
                    let tmp = {}
                    for (let prop of item.properties) {
                        tmp[prop.name] = prop.values.join();
                    }
                    i.item['properties'] = tmp;
                })
            }
        })
    }
}


@Component({
    templateUrl: "html/order-details.html",
    styleUrls: ['css/order-details.css']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
    private route_sub:any;
    private order_id:number;
    private shipping_address_id:number;
    public order_details:ModelECommOrderDetails;
    private logs_map:Object
    private latest_status:string;
    private cod:boolean;
    public is_priv_app:boolean;

    private status_map = {"New": 1,
                "Paid": 2,
                "Cancelled": 3,
                "Accepted": 4,
                "Shipped": 5,
                "Delivered": 6,
                "Return-Initiated": 7,
                "Return-Shipped": 8,
                "Returned": 9,
                "Refund-Initiated": 10,
                "Refunded": 11};

    constructor(private _route:ActivatedRoute, private _ecomms:ECommService, private _router:Router,
                public _bcs: BreadCrumbsService, private _settings:SettingsService) {
        this.is_priv_app = environment['app_name'] == 'priv';
    }

    ngOnInit() {
        this.route_sub = this._route.params.subscribe((params) => {
            this.order_id = +params['order_id'];
            this._ecomms.getOrderDetails(this.order_id).then((ret) => {
                if (ret == 403 || ret == '403') {
                    this._router.navigate(['/auth']);
                    return;
                }
                this.order_details = <ModelECommOrderDetails>ret;
                this.logs_map = {}
                this.shipping_address_id = ret.invoice.contact_addr_id;
                for (let log of this.order_details.logs) {
                    if (log.status == 'New') {
                        if(!this.shipping_address_id)
                            this.shipping_address_id = +log.details['delivery_address']
                        if (log.details['COD'])
                            this.cod = true;
                    }
                    if (!this.latest_status || this.status_map[this.latest_status] < this.status_map[log.status])
                        this.latest_status = log.status;

                    this.logs_map[log.status] = log;
                }

                this.order_details.logs.sort((a, b) => {
                    return this.status_map[b.status] - this.status_map[a.status]
                })
            })

            let first_crumb = this._bcs.crumbs[0];
            let last_crumb = this._bcs.crumbs[this._bcs.crumbs.length - 1];
            let this_crumb = {name: "Order - " + this.order_id, link: ['/order', this.order_id]};
            if (last_crumb['name'] != "Orders") {
                this._bcs.putCrumbs([first_crumb, this_crumb])
            } else {
                this._bcs.putCrumbs([first_crumb, last_crumb, this_crumb])
            }
        })
    }

    ngOnDestroy() {
        this.route_sub.unsubscribe();
    }

    addrChangedCb(data:Object) {
        this._ecomms.updateOrder(
            this.order_id,
            {'status': 'New', 'delivery_address': data['address_id']}).then((ret) => {
            if (ret == 0) {
                this._ecomms.getOrderDetails(this.order_id).then((ret) => {
                    this.order_details = ret;
                })
            }
        })
    }

    cancelOrder() {
        this._ecomms.updateOrder(
            this.order_id, {"status": "Cancelled"}).then((ret) => {
                if (ret == 0) {
                    let tmp:ModelECommOrderLog = new ModelECommOrderLog;
                    tmp.status = "Cancelled";
                    tmp.updated_date = "Now";
                    this.latest_status = "Cancelled";
                    this.order_details.logs.unshift(tmp);
                }
            })

    }

    codNotify() {
        this.cod = true;
        this._router.navigate(['/order', this.order_id, 'payconfirm']);
        for (let log of this.order_details.logs) {
            if (log.status == 'New') {
                log.details['Cash On Delivery'] = 'Yes';
                log.details['COD'] = 'Yes';
                break;
            }
        }
    }
}
