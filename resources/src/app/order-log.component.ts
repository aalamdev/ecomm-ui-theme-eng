import {Component, OnInit, Input, NgZone} from "@angular/core";

import {ECommService} from "./ecomm.service";
import {ModelECommOrderDetails} from "./models/orders";


@Component({
    templateUrl: "html/order-logs.html",
    selector: "order-logs",
    styleUrls: ['css/order-logs.css']
})
export class OrderLogsComponent {
    @Input('order') order:ModelECommOrderDetails;
    @Input('order_id') order_id:number;
    @Input('latest_status') latest_status:string;
    public new_status:string;
    public show_more:boolean;
    private cod:boolean;
    private user_perms = {
        'orders_manage': true
    };
    private next_status_map = {
        "New": "Paid",
        "Delivered": "Return-Initiated",
        "Return-Initiated": "Return-Shipped",
        "Refunded": undefined}

    private status_info_map = {
        "Paid": {
            'title': "Enter payment details",
            "suggestions": ['Paid through', 'Bank name', 'Amount', 'Reference #'],
        },
        "Return-Initiated": {
            'title': 'Return?',
            'suggestions': ['Reason']
        },
        "Return-Shipped": {
            'title': 'Enter return details',
            'suggestions': ['Cargo company', 'Booking #', 'Expected DOD']
        }
    }

    constructor(private _ecomms:ECommService, private _zone:NgZone) {}

    ngOnInit() {
        let paid = false;
        let cancelled = false;
        for (let log of this.order.logs) {
            if (log.status == 'New') {
                if (log.details['COD']) {
                    this.cod = true;
                    delete log.details['COD'];
                    log.details['Cash On Delivery'] = 'Yes'
                }
            }
            else if (log.status == 'Paid' || log.status == 'Paid-Payservice') {
                paid = true;
            }
            else if (log.status == 'Returned') 
                delete log.details['invoice_id'];
            else if (log.status == 'Cancelled')
                cancelled = true;
        }

        if (!paid && !this.cod && !cancelled) {
            this.new_status = 'Paid';
        } else if (this.latest_status == 'New' && this.cod) {
            this.new_status = undefined;
        } else {
            this.new_status = this.next_status_map[this.latest_status];
        }

    }
    codNotify() {
        this.cod = true;
        this.new_status = undefined;
        for (let log of this.order.logs) {
            if (log.status == 'New') {
                log.details['Cash On Delivery'] = 'Yes';
                break;
            }
        }
        let tmp = this.order.logs
        this.order.logs = undefined;
        setTimeout(() => {this.order.logs = tmp}, 100);
        this._zone.run(() => {});
    }
}
