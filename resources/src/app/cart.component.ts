import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";

import {CartService} from "./cart.service";
import {StockService} from "./stock.service";
import {ECommService} from "./ecomm.service";
import {ModelECommCart} from "./models/cart";
import {ModelECommContact} from "./models/auth";
import {BreadCrumbsService} from "./bread-crumbs.service";
import {SettingsService} from "./settings.service";

declare var ga:any;

@Component({
    templateUrl: "html/cart.html",
    styleUrls: ['css/cart.css']
})
export class CartComponent implements OnInit {
    public cart_items:ModelECommCart[];
    public total_price:number;
    public order_alert_msg:string;
    private disable_checkout:boolean;
    private group_prop_map:Object;
    private preorder_is_allowed:boolean;
    public show_open_order_confirmation:boolean;
    private low_stock_items:number[];
    public open_order:Object;
    private update_qty_visible:number;
    public contact_details:ModelECommContact;
    private coupon_code:string;
    private disable_apply_coupon:boolean;
    private coupon_alert_msg:string;

    constructor(private _cs:CartService, private _stocks:StockService,
                private _ecomms:ECommService, private _router: Router,
                public _bcs: BreadCrumbsService, private _settings:SettingsService) {
        this.total_price = 0;
        this.group_prop_map = {};
        this.low_stock_items = [];
    }

    calculate_total_price() {
        let tp:number = 0;
        for (let item of this.cart_items) {
            let p = (item['sale_discount'] > 0)?(item['sale_price']*(1 - item['sale_discount']/100)):item['sale_price'];
            tp += (p * item.quantity);
        }
        this.total_price = tp;
    }

    ngOnInit() {
        if (this._cs.coupon_code)
            this.coupon_code = this._cs.coupon_code;
        this._ecomms.isPreorderAllowed().then(ret => {
            this.preorder_is_allowed = ret;
        })
        this._ecomms.getSelfDetails().then(ret => {
            if (ret) {
                this.contact_details = ret;
                this._ecomms.getOrders({'sort': "created_date.desc", "limit": 1, "status": "New"}).then(ret => {
                    if (ret.length == 0)
                        return

                    this.open_order = ret[0];
                    this.open_order['created_date'] = this.open_order['created_date'].split('T').join(" ")
                })
            }

            this._cs.getCart().then((ret) => {
                this.cart_items = ret;
                if (ret.length == 0)return;
                let index = 0;

                let item_ids = [];
                for (let c of this.cart_items)
                    item_ids.push(c.item_id);

                this._ecomms.getItemGroupItemProps(item_ids).then(ret => {
                    for (let r of ret) {
                        this.group_prop_map[r.item_id] = r.properties.split(",");
                    }
                })

                for (let c of this.cart_items) {
                    c['old_quantity'] = c.quantity;
                    this._stocks.getItemsDetails(c.item_id).then((ret) => {
                        index++;
                        let item = ret;
                        c['name'] = item.name;
                        c['code'] = item.code;
                        c['sale_price'] = item.sale_price;
                        c['sale_discount'] = item.sale_discount;
                        if (item.stock - c.quantity < 0) {
                            this.low_stock_items.push(c.item_id);
                            c['low_stock'] = true;
                        }
                        let tmp = {}
                        for (let prop of item.properties) {
                            tmp[prop.name] = prop.values.join();
                        }
                        c['properties'] = tmp;
                        if (index == this.cart_items.length)
                            this.calculate_total_price();
                    })
                }
            })
        });

        if (this._bcs.crumbs.length > 2) {
            let last = this._bcs.crumbs[this._bcs.crumbs.length - 1]
            let first = this._bcs.crumbs[0];
            this._bcs.putCrumbs([first, last, {name:"Cart", link: ['/cart']}])
        } else {
            this._bcs.putCrumbs([this._bcs.crumbs[0],
                                 {name: 'Cart', link: ['/cart']}])
        }
    }

    removeCartItem(index:number) {
        this._cs.deleteCartItem(this.cart_items[index].item_id).then((ret) => {
            if (ret == 0) {
                this.cart_items.splice(index, 1);
                this.calculate_total_price();
            }
        })
    }

    updateCart(index:number) {
        let item = this.cart_items[index];
        if (item.quantity == item['old_quantity']) {
            this.update_qty_visible = undefined;
            return;
        }

        this._cs.updateCartItem(item.item_id, item.quantity).then((ret) => {
            if (ret == 0) {
                item['old_quantity'] = item.quantity;
                this.calculate_total_price();
            } else {
                item.quantity = item['old_quantity'];
            }
            this.update_qty_visible = undefined;
        })
    }

    checkOut() {
        if (!this.preorder_is_allowed && this.low_stock_items.length)
            return

        if (this.open_order) {
            this.show_open_order_confirmation = true;
            return;
        }

        if (!this.contact_details || !this.contact_details.addresses || this.contact_details.addresses.length == 0) {
            this._router.navigate(['/checkout'])
        } else {
            this.checkoutForce();
        }
    }

    addItemsToOrder() {
        let items = []
        for (let c of this.cart_items) {
            items.push({'id': c.item_id, 'quantity': c.quantity})
        }
        if (items.length == 0)
            return

        this.disable_checkout = true;
        this._ecomms.addItemsToOrder(this.open_order['id'], items).then(ret => {
            if (ret == 0) {
                this._cs.resetCoupon();
                this._cs.EmptyCart().then(ret => {});
                this._router.navigate(['/order', this.open_order['id']])
            } else {
                this.order_alert_msg = ret;
            }
            this.disable_checkout = false;
        })
    }
    applyCoupon() {
        this.disable_apply_coupon = true;
        this._cs.checkCoupon(this.coupon_code).then(ret => {
            this.calculate_total_price();
            this.disable_apply_coupon = false;
            if (ret == null) {
                this.coupon_alert_msg = "Coupon seems to be invalid";
                setTimeout(() => {this.coupon_alert_msg = undefined;}, 2000);
            } else {
                let found = false;
                if (ret.items && ret.items.length > 0) {
                    for (let i of this.cart_items) {
                        if (ret.items.indexOf(i.item_id) >= 0) {
                            found = true;
                            break
                        }
                    }
                } else {
                    found = true;
                }
                if (!found) {
                    if (ret.items)
                        this.coupon_alert_msg = "Sorry, this coupon is restricted for selected items only!";
                    else
                        this.coupon_alert_msg = "Sorry, this coupon cannot be applied!"

                    setTimeout(() => {this.coupon_alert_msg = undefined;}, 3000);
                    return;
                } else {
                    if (!this._cs.coupon_status.description) {
                        let rule = ret.rule;
                        if (rule == 1)
                            this._cs.coupon_status.description = "Flat " + ret.rate + "% off";
                        else if (rule == 2)
                            this._cs.coupon_status.description = "Flat " + this._settings.currency_format + ret.price + " off";
                        if (ret.items)
                            this._cs.coupon_status.description += " on selected items";
                    }
                }

                if (ret.rule == 1) {
                    this.total_price *= (1 - ret.rate/100);
                } else {
                    this.total_price -= ret.price;
                }
            }
        });
    }
    checkoutForce() {
        let cc:string;
        if (this._cs.coupon_status)
            cc = this._cs.coupon_code;
        this.disable_checkout = true;

        this._ecomms.createOrder(cc).then((ret) => {
            this._cs.resetCoupon();
            if (isNaN(ret)) {
                this.order_alert_msg = ret;
            } else {
                this._cs.getCart().then(ret => {
                    this.cart_items = ret;
                    let index = 0;
                })
                this._router.navigate(['/order', ret])
            }
            this.disable_checkout = false;
        })
        try {
            ga('send', 'event', {
                eventAction: 'conversion',
                eventCategory: 'Cart',
                eventValue: this.total_price
            });
        } catch(err) {
        }
    }
}

@Component({
    templateUrl: 'html/checkout-flow.html'
})
export class CheckoutComponent {
    private first_name:string;
    private email_id:string;
    private last_name:string;
    private mobile_number:string;

    public contact_details:ModelECommContact;
    private alert_msg:string;
    private disable_button:boolean;

    constructor(private _ecomms:ECommService, private _router:Router, private _cs:CartService) {}

    ngOnInit() {
        this._ecomms.getSelfDetails().then(ret => {
            if (!ret)
                return;

            this.contact_details = ret;
            if (this.contact_details.addresses && this.contact_details.addresses.length > 0) {
                this.reviewCart();
            }
        })
    }

    reviewCart() {
        this._router.navigate(['/cart'], {queryParams: {'review': 1}})
    }

    mobileNumberEntered() {
        let inp = {}
        if (!this.mobile_number || this.mobile_number.length < 6) {
            this.alert_msg = "You have to input a valid mobile number";
            return
        }

        inp['value'] = this.mobile_number;
        this.disable_button = true;
        this._ecomms.login(inp).then((ret) => {
            this.alert_msg = undefined;
            if (ret == 0) {
                this._ecomms.getSelfDetails(true).then(ret => {
                    this.contact_details = ret;
                    if (this.contact_details.addresses.length > 0) {
                        this.reviewCart();
                    }
                    this.disable_button = false;
                })
            } else {
                this.contact_details = new ModelECommContact();
                this.disable_button = false;
            }
        })
    }

    nameDetailsEntered() {
        if (!this.first_name && !this.last_name) {
            this.alert_msg = "Input atleast your first name.";
            return;
        }
        this.alert_msg = undefined;
        this.disable_button = true;
        this._ecomms.register(
            this.first_name, this.last_name, this.mobile_number, this.email_id).then(ret => {
                this.contact_details.first_name = this.first_name;
                this.contact_details.last_name = this.last_name;
                this.contact_details.addresses = [];
                this.disable_button = false;
                //this.reviewCart();
            });
    }

    addressEditedCb() {
        this.reviewCart();
    }
}
