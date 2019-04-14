import {Component, OnInit, Input} from "@angular/core";
import {ModelECommOrderLog, ModelECommOrderDetails} from "./models/orders";
import {ECommService} from "./ecomm.service";

@Component({
    selector: "order-log-return-initiate-item",
    templateUrl: "html/order-log-return-initiate-item.html",
})
export class OrderLogReturnInitiateItemComponent implements OnInit {
    @Input('log') log: ModelECommOrderLog;
    @Input('order_id') order_id:number;
    @Input('order') order:ModelECommOrderDetails;
    @Input('latest_status') latest_status:string;
    @Input('suggestions') suggestions: string[];

    private returning_items:number[];
    public can_update:boolean;
    public reason:string;
    private returning_items_modified:boolean;
    public success_msg:string;
    public alert_msg:string;

    constructor(private _ecomms:ECommService) {
    }

    ngOnInit() {
        this.returning_items = [];
        if (this.log.details)
            this.reason = this.log.details['reason'];
        this.can_update = (!this.latest_status || this.latest_status == 'Return-Initiated')

        if (this.log.details && this.log.details['returning_items']) {
            for (let i of this.log.details['returning_items'].split(",")) {
                this.returning_items.push(parseInt(i));
            }
        }
    }

    itemClicked(item_id:number) {
        if (!this.can_update)
            return

        this.returning_items_modified = true;
        let i = this.returning_items.indexOf(item_id);
        if (i >= 0) {
            this.returning_items.splice(i, 1);
            return
        }

        this.returning_items.push(item_id);
    }

    updateOrder() {
        this.success_msg = this.alert_msg = undefined;
        if (!this.can_update)
            return

        let params = {};
        if (this.returning_items_modified) {
            params['returning_items'] = this.returning_items.join()
        }

        if (!this.log.details || this.reason != this.log.details['reason'])
            params['reason'] = this.reason;

        if (Object.keys(params).length == 0)
            return;

        params['status'] = 'Return-Initiated';
        this._ecomms.updateOrder(this.order_id, params).then((ret) => {
            if (ret == 0) {
                if ('reason' in params && this.log.details)
                    this.log.details['reason'] = params['reason'];

                if ('returning_items' in params && this.log.details)
                    this.log.details['returning_items'] = params['returning_items'];
                this.success_msg = "Updated Successfully";
            } else {
                this.alert_msg = "Unable to update";
            }
        })
    }
}

