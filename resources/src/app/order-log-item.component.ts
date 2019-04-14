import {Component, OnInit, Input} from "@angular/core";

import {ECommService} from "./ecomm.service";
import {ModelECommOrderLog, ModelECommOrderDetails} from "./models/orders";

import {OrderLogItemSupport} from "./order-log-item-support";

@Component({
    templateUrl: "html/order-log-item.html",
    selector: "order-log-item",
    styleUrls: ['css/order-log-item.css'],
})
export class OrderLogItemComponent implements OnInit {
    @Input('log') log: ModelECommOrderLog;
    @Input('order_id') order_id:number;
    @Input('suggestions') suggestions: string[];
    public orig_details:Object[];
    private new_details:Object[];
    private disable_update:boolean;
    public show_details:boolean;
    private mandatory_inputs:string[];
    public err_msg:string;
    public ok_msg:string;

    constructor(private _ecomms:ECommService) {
    }

    ngOnInit() {
        this.new_details = [];
        this.orig_details = [];
        if (this.log.details) {
            for (let key of Object.keys(this.log.details)) {
                this.orig_details.push({'key': key, 'value': this.log.details[key], 'orig': this.log.details[key]})
            }
        }
        if (!this.orig_details.length) {
            let tmp = new OrderLogItemSupport(this._ecomms, this.log);
            tmp.getNewDetails((ret) => {
                this.new_details = ret;
            });
        }
    }

    addNew() {
        this.new_details.push({"key": undefined, "value": undefined})
    }

    isLink(value:string) {
        return value.startsWith("http://") || value.startsWith("https://");
    }

    updateDetails() {
        if (!this.suggestions || this.disable_update)
            return;

        this.disable_update = true;
        let params = {};
        let poppable_indexes = [];
        let index = 0;

        for (let d of this.orig_details) {
            if (d['orig'] != d['value']) {
                params[d['key']] = d['value']
            }

            if (!d['value'])
                poppable_indexes.push(index)
            index++;
        }

        for (let d of this.new_details) {
            if (!d['value'] && d['is_mandatory']) {
                this.disable_update = false;
                this.err_msg = "You have to fill in the mandatory inputs, as these parameters are used in notification templates";
                return;
            }
            if (d['key'] && d['value'])
                params[d['key']] = d['value']
        }

        if (!Object.keys(params).length && !this.log['title']) {
            this.new_details = [];
            this.disable_update = false;
            this.ok_msg = "Nothing to update";
            return;
        }

        params['status'] = this.log.status;

        this._ecomms.updateOrder(this.order_id, params).then((ret) => {
            if (ret == 0) {
                if (!this.log.details)
                    this.log.details = {}

                for (let d of this.new_details) {
                    if (d['key'] && d['value']) {
                        this.orig_details.push({'key': d['key'], 'value': d['value'], 'orig': d['value']})
                        this.log.details[d['key']] = d['value'];
                    }
                }
                this.new_details = [];
                this.log['title'] = undefined;

                for (let i of poppable_indexes) {
                    this.orig_details.splice(i, 1);
                }

                for (let d of this.orig_details) {
                    if (d['orig'] != d['value']) {
                        d['orig'] = d['value']
                        this.log.details[d['key']] = d['value']
                    }
                }
                this.ok_msg = "Update successfully";
            } else {
                this.err_msg = "Unable to update";
            }
            this.disable_update = false;
        })
    }
}
