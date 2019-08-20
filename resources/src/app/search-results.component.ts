import {Component, OnInit, Input, ElementRef, NgZone, DoCheck,
        AfterContentInit, Output, EventEmitter, OnChanges,
        ViewChild, AfterViewInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

import {SlashService} from "./slash.service";
import {StockService} from "./stock.service";
import {ECommService} from "./ecomm.service";
import {ModelGetItems, ModelItemType} from "./models/item";
import {SearchResultsUnFiltered} from "./search-results-unfiltered.component";

@Component({
    templateUrl: "html/search-results-filtered.html",
    selector: "search-results-filtered"
})
export class SearchResultsFiltered {
    private items:ModelGetItems[];
    public params:Object;
    private sorter:string;
    private show_load_more:boolean;
    private version = 0;
    private LIMIT:number = 40;

    constructor(private _stocks: StockService, private _ecomm: ECommService, private _zone:NgZone) {
    }
    load(params:Object, sorter:string) {
        this.version++;
        this.params = {}
        this.sorter = sorter;

        this.params = this._stocks.revampFilterParams(params)
        if (sorter) {
            this.params['sort'] += ",id.desc"
        } else {
            this.params['sort'] = "id.desc"
        }

        this.params['max'] = this.LIMIT;
        this._stocks.getItems("id,sale_price,sale_discount,name_unique,stock,type_id",
                              this.params).then((ret) => {
            if (typeof ret == "string") {
            } else {
                this.show_load_more = ret.length >= this.LIMIT;
                this.items = ret;
                this._zone.run(() => {});
            }
        })
    }
    loadMore() {
        let last_item = this.items[this.items.length - 1];
        this.params['id_l'] = last_item['id']
        switch (this.sorter) {
            case "sale_discount.desc":
                this.params['sale_discount_le'] = last_item['sale_discount']
                this.params['id_l'] += "|sale_discount_l=" + last_item['sale_discount']
                break;
            case "sale_price.desc":
                this.params['sale_price_le'] = last_item['sale_price'];
                this.params['id_l'] += "|sale_price_l=" + last_item['sale_price']
                break;
            case "sale_price.asc":
                this.params['sale_price_ge'] = last_item['sale_price'];
                this.params['id_l'] += "|sale_price_g=" + last_item['sale_price'];
                break;
        }
        this._stocks.getItems("id,sale_price,sale_discount,name_unique,stock,type_id",
                              this.params).then((ret) => {
            if (typeof ret == "string") {
            } else {
                this.show_load_more = ret.length >= this.LIMIT;
                this.items = this.items.concat(ret);
                this._zone.run(() => {});
            }
        })
    }
    unload() {
        this.params = undefined;
        this.items = undefined;
    }
    ngOnInit() {
    }
}

@Component({
    templateUrl: "html/search-results.html",
    selector: "search-results",
    styleUrls: ['css/search-results.css']
})
export class SearchResultsComponent {
    private allow_preorders;
    private params = {};
    private item_types:ModelItemType[];
    private show_sort:boolean;
    public params_keys:string[];
    @ViewChild(SearchResultsFiltered) search_res_filtered_comp:SearchResultsFiltered;
    @ViewChild(SearchResultsUnFiltered) search_res_unfiltered_comp: SearchResultsUnFiltered;

    constructor(private _stocks: StockService, private _ecomm: ECommService,
                private _router:Router, private zone:NgZone, private _ss:SlashService) {
        this.params_keys = [];
    }

    ngOnInit() {
        this._stocks.getItemTypes().then(ret => {
            this.item_types = [];
            let obj = {}
            for (let r of ret) {
                if (this._ecomm.invalid_item_types_obj[r.id] != undefined)
                    continue;
                obj[r.id] = r;
            }
            for (let i of this._ecomm.item_types_order) {
                if (obj[i])
                    this.item_types.push(obj[i])
                delete obj[i]
            }
            for (let i of Object.keys(obj))
                this.item_types.push(obj[i])
        })
        this._ss.notify.subscribe((params) => {
            this.routerParamsChanged(params);
        });
    }
    routerParamsChanged(params:Object) {
        if (this.allow_preorders == null) {
            this._ecomm.isPreorderAllowed().then(ret => {
                this.allow_preorders = ret;
                this._routerParamsChanged(params);
            })
        } else {
            this._routerParamsChanged(params);
        }
    }
    _routerParamsChanged(params:Object) {
        let pkeys = new Array();
        let pbkp = new Object;
        let show_oos = false;
        let sorter;
        for (let k of Object.keys(params)) {
            if (k != 'show_oos') {
                if (k == 'sort') {
                    sorter = params['sort'];
                } else 
                    pkeys.push(k);
            } else
                show_oos = params[k] == '1' || params[k].toLowerCase() == 'true';

            pbkp[k] = params[k];
        }
        this.params_keys = pkeys;
        this.params = pbkp;
        if (pkeys.length || sorter) {
            this.search_res_unfiltered_comp.unload()
            if (!this.allow_preorders)
                this.params['show_oos'] = show_oos?"1":"0";
            this.search_res_filtered_comp.load(this.params, sorter);
        } else {
            this.search_res_filtered_comp.unload();
            this.search_res_unfiltered_comp.load(this.allow_preorders || show_oos);
        }
    }
    stringify() {
        return JSON.stringify(this._ecomm.invalid_item_types_obj);
    }
    sortSelected(val) {
        if (val == '')
            delete this.params['sort'];
        else
            this.params['sort'] = val;
        this._router.navigate(['/'], {queryParams: this.params})
    }
    hideFilterSort() {
        this.show_sort = false;
        this.zone.run(()=>{});
    }
    deleteFilter(key:string) {
        delete this.params[key];
        this._router.navigate(['/'], {queryParams: this.params})
        if (Object.keys(this.params).length == 0)
            this._ss.route_sub.next({});
    }
}
