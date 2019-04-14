import {Injectable} from '@angular/core';
/// <reference path="jquery.d.ts" />

@Injectable()
export class SettingsService {
    public date_format : string = "DD-MM-YYYY";
    public currency_format: string = "₹";
    constructor() {
        jQuery.getJSON("/aalam/ecomm/r/j/biz-settings",
            (ret)=>{
                this.date_format = ret['date_format'];
                this.currency_format = ret['currency_format'];
            })
    }
}
