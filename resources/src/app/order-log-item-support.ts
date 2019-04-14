import {ECommService} from "./ecomm.service";
import {ModelECommOrderLog, ModelECommOrderDetails} from "./models/orders";

export class OrderLogItemSupport {
    constructor(private _ecomms:ECommService, private log: ModelECommOrderLog) {}

    getNewDetails(callback) {
    }
}
