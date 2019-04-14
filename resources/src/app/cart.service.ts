import {Injectable, EventEmitter} from "@angular/core";
import {ModelECommCart, ModelCouponStatus} from "./models/cart";

/*Unauthorized Cart Cookie Format - <item_id>:<quantity>,<item_id>:<quantity>*/

@Injectable()
export class CartService {
    private CART_COOKIE_NAME = "cart";
    private num_cart_items:number[];
    private logged_out:boolean;
    public coupon_code:string;
    public coupon_status:ModelCouponStatus;
    cartUpdated: EventEmitter<number>;

    constructor() {
        this.logged_out = true;
        this.num_cart_items = [];
        let tmp = this._cookieToCartObj();
        for (let t of tmp)
            this.num_cart_items.push(t.item_id);

        this.cartUpdated = new EventEmitter<number>();
    }

    getNumCartItems() {
        return this.num_cart_items.length;
    }

    _getCartCookie() {
        var name = this.CART_COOKIE_NAME + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }
    _cookieToCartObj() {
        let val = this._getCartCookie();
        let ret = []
        if (!val)
            return ret;

        val = val.replace(/"/g, "")
        console.log("Cart val " + val)
        let items = val.split(",")
        for (let item of items) {
            let ispl = item.split(":");
            let obj = new ModelECommCart();
            obj.item_id = +ispl[0];
            obj.quantity = +ispl[1];
            ret.push(obj);
        }

        return ret;
    }

    _cartObjToCookie(obj:ModelECommCart[]) {
        let res = [];
        for (let o of obj) {
            res.push(o.item_id + ":" + o.quantity);
        }
        document.cookie = this.CART_COOKIE_NAME + '="' + res.join(",") + '"; Path=/;';
    }

    logout() {
        this.logged_out = true;
        this.num_cart_items = [];
        this.cartUpdated.next(0);
    }

    login() {
        this.logged_out = false;
        this.getCart().then(ret => {
            this.cartUpdated.next(this.num_cart_items.length);
            })
    }

    addToCart(item_id:number) {
        if (this.logged_out) {
            return new Promise<any>(resolve => {
                let cart_items = this._cookieToCartObj();
                if (this.num_cart_items.indexOf(item_id) < 0) {
                    this.num_cart_items.push(item_id);

                    let tmp = new ModelECommCart();
                    tmp.item_id = item_id
                    tmp.quantity = 1;
                    cart_items.push(tmp);

                    this._cartObjToCookie(cart_items);
                    this.cartUpdated.next(this.num_cart_items.length);
                } else {
                    for (let item of cart_items) {
                        if (item.item_id == item_id) {
                            item.quantity += 1;
                            break;
                        }
                    }
                    this._cartObjToCookie(cart_items);
                }
                resolve(0);
            });
        } else {
            return new Promise<any>(resolve=>
                jQuery.ajax({method: "PUT",
                             url: "/aalam/ecomm/cart",
                             data: JSON.stringify({"item_id": item_id}),
                             contentType: "application/json; charset=utf-8",
                             success: (data) => {
                                 if (this.num_cart_items.indexOf(item_id) < 0) {
                                     this.num_cart_items.push(item_id);
                                     this.cartUpdated.next(this.num_cart_items.length);
                                 }
                                 resolve(0);
                             },
                             error: function(data) {resolve(data.status);}
                })
            );
        }
    }

    updateCartItem(item_id:number, new_quantity:number) {
        if (this.logged_out) {
            return new Promise<any>(resolve => {
                let cart_items = this._cookieToCartObj();
                for (let i of cart_items) {
                    if (i.item_id == item_id) {
                        i.quantity = new_quantity;
                        this._cartObjToCookie(cart_items);
                        resolve(0);
                        return;
                    }
                }
                /*Item not found*/
                resolve(-1);
            })
        } else {
            return new Promise<any>(resolve=>
                jQuery.ajax({method: "POST",
                             url: "/aalam/ecomm/cart/item/" + item_id,
                             data: {"quantity": new_quantity},
                             success: function(data) {
                                 resolve(0);
                             },
                             error: function(data) {resolve(data.responseText);}
                })
            );
        }
    }

    deleteCartItem(item_id:number) {
        if (this.logged_out) {
            return new Promise<any>(resolve => {
                let cart_items = this._cookieToCartObj();
                let i:number;
                for (i =0; i < cart_items.length; i++) {
                    if (cart_items[i].item_id == item_id) {
                        cart_items.splice(i, 1);
                        this._cartObjToCookie(cart_items);
                        i = this.num_cart_items.indexOf(item_id)
                        if (i > -1) {
                             this.num_cart_items.splice(i, 1)
                             this.cartUpdated.next(this.num_cart_items.length);
                        }
                        resolve(0);
                        return;
                    }
                }
                /*Item not found*/
                resolve(-1);
            });
        } else {
            return new Promise<any>(resolve=>
                jQuery.ajax({method: "DELETE",
                             url: "/aalam/ecomm/cart/item/" + item_id,
                             success: (data) => {
                                 let i = this.num_cart_items.indexOf(item_id)
                                 if (i > -1) {
                                     this.num_cart_items.splice(i, 1)
                                     this.cartUpdated.next(this.num_cart_items.length);
                                 }
                                 resolve(0);
                             },
                             error: function(data) {resolve(data.responseText);}
                })
            );
        }
    }

    EmptyCart() {
        if (this.logged_out) {
            return new Promise<any>(resolve => {
                document.cookie = this.CART_COOKIE_NAME + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                this.num_cart_items = [];
                this.cartUpdated.next(this.num_cart_items.length);
                resolve(0);
            });
        } else {
            return new Promise<any>(resolve=>
                jQuery.ajax({method: "DELETE",
                             url: "/aalam/ecomm/cart",
                             success: (data) => {
                                 this.num_cart_items = [];
                                 this.cartUpdated.next(this.num_cart_items.length);
                                 resolve(0);
                             },
                             error: function(data) {resolve(data.responseText);}
                })
            );
        }
    }

    getCart() {
        if (this.logged_out) {
            return new Promise<ModelECommCart[]>(resolve => {
                let ret = this._cookieToCartObj();
                this.num_cart_items = [];
                for (let t of ret)
                    this.num_cart_items.push(t.item_id);

                this.cartUpdated.next(this.num_cart_items.length);
                resolve(ret);
            })
        } else {
            return new Promise<ModelECommCart[]>(resolve=>
                jQuery.getJSON("/aalam/ecomm/cart",
                               (ret)=> {
                                   let tmp = this.num_cart_items;
                                   this.num_cart_items = [];
                                   for (let r of ret)
                                       this.num_cart_items.push(r.item_id)
                                   if (ret.length != tmp.length) {
                                        this.cartUpdated.next(this.num_cart_items.length);
                                   }
                                   resolve(ret)
                               }));
        }
    }
    checkCoupon(code:string) {
        return new Promise<ModelCouponStatus>(resolve =>
                jQuery.ajax({method: "POST",
                             url: "/aalam/ecomm/cart/coupon/" + code,
                             success: (data) => {
                                 this.coupon_code = code;
                                 this.coupon_status = data;
                                 resolve(data);
                             },
                             error: (data) => {
                                 this.coupon_status = undefined;
                                 this.coupon_code = undefined;
                                 resolve(null);
                             }
                })
            );
    }
    resetCoupon() {
        this.coupon_code = undefined;
        this.coupon_status = undefined;
    }
}
