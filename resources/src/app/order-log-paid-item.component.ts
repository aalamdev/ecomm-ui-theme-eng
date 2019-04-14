import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {PayService} from "./pay.service";
import {StockService} from "./stock.service";
import {ModelECommOrderLog, ModelECommOrderDetails} from "./models/orders";
import { DomSanitizer} from '@angular/platform-browser';
import {ECommService} from "./ecomm.service";
import {SettingsService} from "./settings.service";
import {BreadCrumbsService} from "./bread-crumbs.service";

@Component({
    selector: "order-log-paid-item",
    templateUrl: "html/order-log-paid-item.html",
    styleUrls: ["css/order-log-paid-item.css"]
})
export class OrderLogPaidItemComponent implements OnInit {
    @Input('log') log: ModelECommOrderLog;
    @Input('order_id') order_id:number;
    @Input('order') order:ModelECommOrderDetails;
    @Input('suggestions') suggestions: string[];
    @Output('codNotify') codNotify = new EventEmitter();
    @Output('cancelOrder') cancelCb = new EventEmitter();
    @Output('invoiceChanged') invoiceChanged = new EventEmitter();
    private _payments_available:boolean;
    private safe_url:any;
    private _cod_enabled:boolean;
    private show_pay_block:boolean;
    private disable_btns:boolean;
    public is_oos:boolean;
    public pruning_done:boolean;
    private is_pruning:boolean;
    private oos_items = [];
    private can_prune = false;

    constructor(private _pays:PayService, private sanitizer: DomSanitizer, private _settings:SettingsService,
                private _ecomms:ECommService, private _stocks:StockService) {
    }

    ngOnInit() {
        this._pays.checkPaymentsAvailable().then(ret => {
            this._payments_available = ret;
        })
        this._ecomms.isCODAllowed().then(ret => {
            this._cod_enabled = ret;
        })
        this.frameUrl(this.order.invoice.total);
    }
    frameUrl(total) {
        this.safe_url = "/aalam/base/service/pay?amount=" + total +
             "&contact_id=" + this.order.invoice.contact_id +
             "&ack_url=" + "/aalam/ecomm/order/" + this.order_id + "/paid" +
             "&ack_meth=POST" +
             "&redirect_to=" + window.location.href + "/payconfirm";
    }
    payNow() {
        window.location.href = this.safe_url;
    }
    codNow() {
        this._ecomms.updateOrder(this.order_id, {'status': 'New', 'COD': 'Yes'}).then((ret) => {
            if (ret == 0) {
                this.codNotify.next({});
            } else {
                this.disable_btns = false;
            }
        })
    }
    payButtonClicked() {
        this.checkAndAct(() => {this.payNow()});
    }
    checkAndAct(cb) {
        if (this.pruning_done) {
            cb();
            return;
        }
        this.disable_btns = true;
        this._ecomms.isPreorderAllowed().then(ret => {
            if (ret) {
                cb();
                return;
            }
            /*Check and see it the stock is available*/
            let imap = {}
            for (let i of this.order.invoice.items)
                imap[i.item.id] = i.item.quantity;
            if (!Object.keys(imap).length) {
                cb();
                return;
            }
            this._stocks.getItems("id,name,stock", {'id': Object.keys(imap).join(",")}).then(ret => {
                for (let i of ret) {
                    if (imap[i['id']] > i['stock']) {
                        this.oos_items.push(i);
                        this.is_oos = true;
                    }
                    if (i['stock'] > 0 && !this.can_prune)
                        this.can_prune = true;
                }
                if (!this.is_oos) {
                    cb();
                }
            })
        })
    }
    pruneOrder() {
        if (this.is_pruning)
            return;

        this.is_pruning = true;
        this._ecomms.pruneOrder(this.order_id).then(ret => {
            this.is_pruning = false;
            if (ret == null) {
                alert("Sorry! Unable to cleanup out-of-stock items");
            } else {
                this.invoiceChanged.next(ret);
                this.frameUrl(ret.total);
                this.pruning_done = true;
            }
        })
    }
    codButtonClicked() {
        this.checkAndAct(() => {this.codNow()});
    }
    cancelOrder() {
        this.cancelCb.next({})
    }
}

@Component({
    templateUrl: "html/order-payconfirm.html"
})
export class OrderPaymentConfirmedComponent {
    private order_id : number;
    private route_sub:any;
    public is_checking:boolean;

    constructor(private _route:ActivatedRoute, private _ecomms:ECommService, private _router:Router,
                public _bcs: BreadCrumbsService, private _settings:SettingsService) {
    }

    ngOnInit() {
        this.is_checking = true;
        this.route_sub = this._route.params.subscribe((params) => {
            this.order_id = +params['order_id'];
            this._ecomms.getOrderDetails(this.order_id).then((ret) => {
                if (ret == 403 || ret == '403') {
                    this._router.navigate(['/auth']);
                    return;
                }
                let paid = false;
                for (let log of ret.logs) {
                    if (log.status == 'New') {
                        if (log.details['COD']) {
                            paid = true;
                        }
                    }
                    if (log.status == 'Paid' || log.status == 'Paid-PayService') {
                        paid = true;
                    }
                }

                if (!paid) {
                    this._router.navigate(['/order', this.order_id])
                    return;
                }
                this.is_checking = false;
            })

            let first_crumb = this._bcs.crumbs[0];
            let last_crumb = this._bcs.crumbs[this._bcs.crumbs.length - 1];
            let order_crumb = {name: "Order - " + this.order_id, link: ['/order', this.order_id]};
            let this_crumb = {name: 'Thank you!', link: ['/order', this.order_id, 'payconfirm']};
            if (last_crumb['name'] != "Orders") {
                this._bcs.putCrumbs([first_crumb, order_crumb, this_crumb])
            } else {
                this._bcs.putCrumbs([first_crumb, last_crumb, order_crumb, this_crumb])
            }
        })
    }
}
