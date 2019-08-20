import {Injectable} from "@angular/core";

import {ECommService} from "./ecomm.service";
import {ModelGetItems, ModelItemType, ModelItemNameQuery,
        ModelItemImagesSpec} from "./models/item"

@Injectable()
export class StockService {
    private item_types:ModelItemType[];
    private item_types_cbs = [];

    constructor(private _ecomms:ECommService) { 
        this._getItemTypes()
    }

    getItems(fields:string, params:Object) {
        let data = {'fields': fields}
        for (let k of Object.keys(params))
            data[k] = params[k]

        if (this._ecomms.invalid_item_types.length > 0)
            data['type_id_ne'] = this._ecomms.invalid_item_types.join();
        data['prop-__duplicateof___nexists'] = 1;

        return new Promise<ModelGetItems[]>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/stock/items",
                         data: data,
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {resolve(data.responseText);}
            }));
    }

    searchItemName(term:string, suggestions:Object[], response) {
        let data = {"name_like": "%" + term + "%", "fields": "name_unique,type", "max": 10};

        data['type_id_ne'] = this._ecomms.invalid_item_types.join();
        return jQuery.ajax({url: "/aalam/stock/items",
                           method: 'GET',
                           data: data,
                           success: function(data) {
                               if (suggestions.length > 0) {
                                response(suggestions.concat(data))
                               } else {
                                response(data);
                               }
                           }
        });
    }

    _getItemTypes() {
        return new Promise<ModelItemType[]>(resolve=>
            jQuery.getJSON("/aalam/stock/types",
                           (ret)=>{
                               this.item_types = ret;
                               resolve(ret)
                               for (let c of this.item_types_cbs) {
                                    c(ret);
                               }
                           }));
    }
    getItemTypes() {
        if (this.item_types) {
            return new Promise<ModelItemType[]>(resolve => resolve(this.item_types))
        } else {
            return new Promise<ModelItemType[]>(resolve =>
                this.item_types_cbs.push((r) => {resolve(r)}));
        }
    }

    getItemCollections(type_ids, params) {
        params['type_ids'] = type_ids.join(",");
        return new Promise<Object>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/stock/item_collections",
                         data: params,
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {resolve(null);}
            }));

    }
    revampFilterParams(params:Object) {
        let tmp = {}
        for (let k of Object.keys(params)) {
            if (k != 'sort'
                && !k.startsWith('sale_price')
                && !k.startsWith('sale_discount')
                && k != 'show_oos'
                && k != 'name_like'
                && k != 'type')
                tmp["prop-" + k] = params[k]
            else {
                if (k === 'show_oos') {
                    if (params[k] == '0' || params[k] == 0)
                        tmp['stock_g'] = 0;
                } else
                    tmp[k] = params[k]
            }
        }
        return tmp
    }

    getItemsDetails(item_id:number) {
        return new Promise<ModelGetItems>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/stock/item/" + item_id,
                         success: function(data) {
                             resolve(data)
                         }
                         }));
    }

    getItemProperties(filter_params:Object) {
        filter_params = this.revampFilterParams(filter_params)
        delete filter_params['sort']

        return new Promise<Object>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/stock/items_properties",
                         data: filter_params,
                         success: function(data) {
                            resolve(data);
                         },
                         error: function(data) {resolve(data.responseText);}
            }));
    }

    getItemImageSpec(item_id:number) {
        return new Promise<ModelItemImagesSpec[]>(resolve=>
        jQuery.getJSON("/aalam/stock/item/" + item_id + "/images",
                       (ret)=>{
                           resolve(ret)
                       }));
    }

    getItemDescription(item_id:number) {
        return new Promise<string>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/stock/item/" + item_id + "/description",
                         success: function(data) {
                            resolve(data);
                         },
                         error: function(data) {resolve(undefined);}
            }));
    }
}
