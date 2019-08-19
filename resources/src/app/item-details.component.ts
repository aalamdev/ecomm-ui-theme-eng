import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {DomSanitizer} from '@angular/platform-browser';

import {StockService} from "./stock.service";
import {ECommService} from "./ecomm.service";
import {SettingsService} from "./settings.service";
import {CartService} from "./cart.service";
import {BreadCrumbsService} from "./bread-crumbs.service";
import {ModelGetItems} from "./models/item";
import {ItemImagesComponent} from "./item-images.component";

@Component({
    templateUrl: "html/item-details.html",
    styleUrls: ['css/item-details.css']
})

export class ItemDetailsComponent implements OnInit, OnDestroy {
    public item:ModelGetItems;
    private item_id:number;
    private rparams_sub:any;
    private cart_sub:any;
    private num_cart_items:number;
    private description:string;
    private cart_added_success:number;
    private preorder_is_allowed:boolean;

    private item_map:Object;
    private propChanged:boolean;
    private prop_map:Object;
    private prop_layout = {};
    private ObjectCls = Object;
    private this_url:string;
    private whatsapp_url:any;
    @ViewChild(ItemImagesComponent) itemImages:ItemImagesComponent;

    constructor(private _cs:CartService, private _stocks:StockService,
                private _router:Router, private _settings:SettingsService,
                private _route:ActivatedRoute, private _bcs: BreadCrumbsService,
                private _ecomms:ECommService, private sanitizer:DomSanitizer) {
        this.num_cart_items = this._cs.getNumCartItems();
        this.cart_sub = this._cs.cartUpdated.subscribe((num) => {
            this.num_cart_items = num;
        })
    }

    ngOnInit() {
        this.this_url = window.location.href;
        this.whatsapp_url = this.sanitizer.bypassSecurityTrustUrl('whatsapp://send?text=' + this.this_url)
        this._ecomms.isPreorderAllowed().then(ret => {
            this.preorder_is_allowed = ret;
        })
        this.rparams_sub = this._route.params.subscribe((params) => {
            this.item_id = parseInt(params['item_id']);

            this._stocks.getItemDescription(this.item_id).then((ret) => {
                this.description = ret;
            })

            this._stocks.getItemsDetails(this.item_id).then((ret) => {
                this.item = ret;
                let last_crumb = this._bcs.crumbs[this._bcs.crumbs.length -1];
                if (last_crumb['name'].startsWith("Item"))
                    last_crumb['name'] = "Item - " + this.item.name;
            })

            let last = this._bcs.crumbs[this._bcs.crumbs.length - 1];
            let first = this._bcs.crumbs[0];
            let this_crumb = {name: "Item - " + this.item_id, link: ['/item', this.item_id]}
            if (last['name'].startsWith("Order")) {
                let tmp = []
                for (let c of this._bcs.crumbs) {
                    tmp.push(c)
                }
                tmp.push(this_crumb)
                this._bcs.putCrumbs(tmp)
            } else if (last['name'].startsWith('Cart')) {
                this._bcs.putCrumbs([
                    first,
                    {name: "Cart", link: ['/cart']},
                    this_crumb]);
            } else {
                this._bcs.putCrumbs([
                    first, this_crumb])
            }
            this.checkGrouping();
        })

    }

    addToCart() {
        this._cs.addToCart(this.item_id).then((ret) => {
            if (ret == "401") {
                this._router.navigate(['/auth'])
            } else if ( ret == 0) {
                this.cart_added_success = 1;
            }
        })
    }

    ngOnDestroy() {
        this.rparams_sub.unsubscribe();
        if (this.cart_sub)
            this.cart_sub.unsubscribe();
    }

    getMin(ids:number[]) {
        let min = ids[0];
        for (let i of ids) {
            if (i < min)
                min = i;
        }
        return min
    }

    _propSelected(pname:string, pvalue:string, index:number, selectMin:boolean) {
        let keys = Object.keys(this.prop_layout);
        this.prop_layout[pname]['selected'] = pvalue;
        let common_ids = this.prop_layout[pname]['map'][pvalue];
        let scommon_ids = common_ids.sort(function(a, b) { return +a - +b;})
        if (selectMin) {
            this.item_id = scommon_ids[0]
            this.item = this.item_map[this.item_id]['details'];
            this.itemImages.refresh(this.item_id);
            this.description = this.item_map[this.item_id]['description'];
        }

        for (let i = index + 1; i < keys.length; i++) {
            let _tmp_pmap = {};
            let _common_ids = [];
            pname = keys[i];
            for (let item of common_ids.sort(function(a, b) { return +a - +b;})) {
                if (pname in this.item_map[item]['props']) {
                    let pv = this.item_map[item]['props'][pname];
                    if (pv in _tmp_pmap) {
                        _tmp_pmap[pv].push(item);
                    } else {
                        _tmp_pmap[pv] = [item];
                    }
                    _common_ids.push(item);
                }
            }
            this.prop_layout[keys[i]] = {
                    'map': _tmp_pmap,
                    'selected': this.item_map[this.item_id]['props'][pname]};
            common_ids = _common_ids;
        }
    }

    propSelected(event:Event, pname:string, pvalue:string, index:number) {
        event.stopPropagation();
        event.preventDefault();
        this._propSelected(pname, pvalue, index, true);
    }

    checkGrouping() {
        this._ecomms.getItemGroup(this.item_id).then(gret => {
            this.item_map = {};
            this.prop_map = {};
            this.prop_layout = {};
            let anchor_prop = undefined;

            if (!gret.properties)
                return;

            for (let prop of gret.properties)
                this.prop_map[prop] = {};

            let keys = Object.keys(this.prop_map)
            for ( let k of keys) {
                let _k = k.toLowerCase();
                if (_k === 'color' || _k === 'colour') {
                    anchor_prop = k;
                    break
                }
            }
            if (!anchor_prop)
                anchor_prop = keys[0];

            let finished_items_ids = [];
            let sitem_ids = gret.item_ids.sort(function(a, b) {return +a - +b;})
            for (let item_id of sitem_ids) {
                this._stocks.getItemsDetails(item_id).then(ret => {
                    let item_props = {}
                    for (let prop of ret.properties) {
                        let v = prop.values.join();
                        item_props[prop.name] = v;
                        if (prop.name in this.prop_map) {
                            if (v in this.prop_map[prop.name])
                                this.prop_map[prop.name][v].push(item_id);
                            else
                                this.prop_map[prop.name][v] = [item_id];
                        }
                    }
                    this.item_map[item_id] = {'props': item_props,
                                              'details': ret
                                              };
                    this._stocks.getItemDescription(item_id).then((ret) => {
                        this.item_map[item_id]['description'] = ret;
                    });

                    finished_items_ids.push(item_id);
                    if (finished_items_ids.length == gret.item_ids.length) {
                        this.prop_layout[anchor_prop] = {'map': this.prop_map[anchor_prop]}
                        for (let k of keys) {
                            if (k == anchor_prop)
                                continue;

                            this.prop_layout[k] = {}
                        }
                        this._propSelected(anchor_prop, this.item_map[this.item_id]['props'][anchor_prop], 0, false);
                    }
                })
            }
        })
    }
    goBack() {
        window.history.back();
    }
}
