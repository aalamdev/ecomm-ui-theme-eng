import {Component, Input} from "@angular/core";
import {ECommService} from "./ecomm.service";

import { ModelGetItems } from "./models/item";
import { SettingsService } from "./settings.service";

@Component({
    templateUrl: "html/item-card.html",
    selector: "item-card",
    styleUrls: ['css/item-card.css']
})
export class ItemCardComponent {
    @Input('item') item:ModelGetItems;
    public preorder_is_allowed:boolean;

    constructor(private _settings:SettingsService, private _ecomms:ECommService) { }

    ngOnInit() {
        this._ecomms.isPreorderAllowed().then(ret => {
            this.preorder_is_allowed = ret;
        })
    }
}
