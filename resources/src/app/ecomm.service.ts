import {Injectable} from "@angular/core";
import {ModelECommContact} from "./models/auth";
import {CartService} from "./cart.service";
import {ModelItemGroup, ModelItemProps} from "./models/setting";
import {ModelECommOrderDetails, ModelECommOrders, ModelECommInvoice} from "./models/orders";

@Injectable()
export class ECommService {
    private contact_details:ModelECommContact;
    private preorder_allowed:boolean
    public emergency_msg:string;
    private cod_settings:Object
    private category_group:Object;
    public invalid_item_types:number[] = [];
    public invalid_item_types_obj:Object = {}
    public item_types_order:number[] = [];
    public allSettingsCbs = []
    private random:number;

    constructor(private _cs:CartService) {
        this.getAllSettings();
        this.random = Math.random();
    }

    register(first_name:string, last_name:string, mobile:string, email:string) {
        let data = {}
        if (first_name)
            data['first_name'] = first_name
        if (last_name)
            data['last_name'] = last_name
        if (mobile)
            data['mobile'] = mobile
        if (email)
            data['email'] = email

        return new Promise<any>(resolve=>
            jQuery.ajax({method: "PUT",
                         url: "/aalam/base/cauth/register",
                         data: JSON.stringify(data),
                         contentType: "application/json; charset=utf-8",
                         success: (data, textStatus, xhr) => {
                             this.contact_details = undefined;
                             this._cs.login();
                             if (xhr.status == 200)
                                 resolve(0);
                             else
                                 resolve(xhr.status)
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    login(data:Object) {
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "POST",
                         url: "/aalam/base/cauth/login",
                         data: data,
                         success: (data, textStatus, xhr) => {
                             this.contact_details = undefined;
                             if (xhr.status == 200) {
                                this._cs.login();
                                resolve(0);
                             } else 
                                 resolve({status: xhr.status, auth: data['type']})
                         },
                         error: function(data) {
                             if (data.statusCode().status == 404)
                                 resolve(404)
                             else
                                 resolve(data.responseText);
                         }
            })
        );
    }

    logout() {
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "POST",
                         url: "/aalam/base/cauth/logout",
                         success: (data) => {
                             this.contact_details = undefined;
                             this._cs.logout();
                             resolve(0);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    newAddress(address:Object) {
        let data = {"address": address}
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "PUT",
                         url: "/aalam/base/cauth/address",
                         data: JSON.stringify(data),
                         contentType: "application/json; charset=utf-8",
                         success: (data) => {
                             this.contact_details = undefined;
                             resolve(0);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    deleteAddress(address_id:number) {
        return new Promise<any>(resolve =>
            jQuery.ajax({method: "DELETE",
                         url: "/aalam/base/cauth/address/" + address_id,
                         success: (data) => {
                             this.contact_details = undefined;
                             resolve(0)
                         },
                         error: function(data) {resolve(data.responseText);}
            })
            );
    }

    getSelfDetails(force:boolean = false) {
        if (this.contact_details && !force)
            return new Promise<ModelECommContact>(resolve=>
                resolve(this.contact_details))

        return new Promise<ModelECommContact>(resolve=>
            jQuery.ajax({
                method: "GET",
                url: "/aalam/base/cauth",
                success: (ret) => {
                   this.contact_details = ret;
                   resolve(ret)
                },
                error: () => {resolve(null)}
            }));
    }

    updateContact(key_id:string, data: Object) {
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "POST",
                         url: "/aalam/base/cauth/details/" + key_id,
                         data: data,
                         success: function(data) {
                             resolve(0);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    setAuthType(params) {
        return new Promise<number>(resolve =>
            jQuery.ajax({
                method: "POST",
                url: "/aalam/base/cauth/settings",
                data:params,
                success: function() {
                    resolve(0);
                },
                error: function() {
                    resolve(-1);
                }
            })
        )
    }

    resetpw(params) {
        return new Promise<number>(resolve =>
            jQuery.ajax({
                method: "POST",
                url: "/aalam/base/cauth/resetpw",
                data:params,
                success: function() {
                    resolve(0);
                },
                error:function() {
                    resolve(-1);
                }
            })
        )
    }

    /*Order APIs*/

    createOrder(coupon_code:string) {
        let params = {}
        if (coupon_code)
            params['coupon'] = coupon_code;

        return new Promise<any>(resolve=>
            jQuery.ajax({method: "PUT",
                         url: "/aalam/ecomm/orders",
                         data: params,
                         success: function(data) {
                             resolve(data.id);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    updateOrder(order_id:number, params:Object) {
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "POST",
                         url: "/aalam/ecomm/order/" + order_id,
                         data: params,
                         success: function(data) {
                             resolve(0);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }

    getOrderDetails(order_id:number) {
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/ecomm/order/" + order_id,
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {
                            resolve(data.statusCode().status);
                         }
                         }));
    }

    getOrders(params:Object) {
        return new Promise<ModelECommOrders[]>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/ecomm/orders",
                         data: params,
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {resolve(data.responseText);}
                         }));
    }
    registerAllSettingsCb(func) {
        this.allSettingsCbs.push(func);
    }
    getAllSettings() {
        jQuery.getJSON("/aalam/ecomm/setting/_all_",
                       (ret) => {
                           this.invalid_item_types = ret['item_types']['invalids'];
                           this.item_types_order = ret['item_types']['ordered'];
                           this.emergency_msg = ret['emergency_msg'];
                           for (let r of this.invalid_item_types) {
                               this.invalid_item_types_obj[r] = "";
                           }
                           this.cod_settings = ret['cod'];
                           this.preorder_allowed = ret['preorder']['allow'];
                           this.category_group = ret['category_group'];
                           if (this.allSettingsCbs.length > 0) {
                                for (let cb of this.allSettingsCbs)
                                    cb(ret);
                                this.allSettingsCbs = [];
                           }
                       });
    }
    /*Setting*/
    getItemGroup(item_id:number) {
        return new Promise<ModelItemGroup>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/ecomm/setting/item_group/item/" + item_id,
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {resolve(data.responseText);}
                         }));
    }
    getItemGroupItemProps(item_ids:number[]) {
        return new Promise<ModelItemProps[]>(resolve=>
            jQuery.ajax({method: 'GET',
                         url: "/aalam/ecomm/setting/item_groups/props",
                         data: {'id': item_ids.join()},
                         success: function(data) {
                             resolve(data)
                         },
                         error: function(data) {resolve(data.responseText);}
                         }));
    }
    isPreorderAllowed() {
        if (this.preorder_allowed == undefined)
            return new Promise<boolean>(resolve=>
                this.registerAllSettingsCb(() => {
                    resolve(this.preorder_allowed);
                }))
        else
            return new Promise<boolean>(resolve=>
                resolve(this.preorder_allowed));
    }
    isCODAllowed() {
        if (this.cod_settings == undefined)
            return new Promise<boolean>(resolve => {
                this.codSettings().then(ret => {
                    resolve(ret['enabled']);
                })
            })
        else
            return new Promise<boolean>(resolve=>
                resolve(this.cod_settings['enabled']));
    }
    getCategoryGroups() {
        if (this.category_group == undefined)
            return new Promise<Object>(resolve=>
                this.registerAllSettingsCb((ret) => {
                    resolve(ret['category_group']);
                }))
        else
            return new Promise<Object>(resolve => 
                resolve(this.category_group));
    }
    codSettings() {
        return new Promise<Object>(resolve=>
            this.registerAllSettingsCb((ret) => {
                resolve['cod'];
            }))
    }
    addItemsToOrder(order_id:number, items:Object) {
        let data = {'items': items}
        return new Promise<any>(resolve=>
            jQuery.ajax({method: "PUT",
                         url: "/aalam/ecomm/order/" + order_id + "/items",
                         data: JSON.stringify(data),
                         contentType: "application/json; charset=utf-8",
                         success: function(data) {
                             resolve(0);
                         },
                         error: function(data) {resolve(data.responseText);}
            })
        );
    }
    pruneOrder(order_id) {
        return new Promise<ModelECommInvoice>(resolve=>
            jQuery.ajax({method: "POST",
                         url: "/aalam/ecomm/order/" + order_id + "/prune",
                         success: function(data) {
                             resolve(data);
                         },
                         error: function(data) {resolve(null);}
            })
        );
    }
}
