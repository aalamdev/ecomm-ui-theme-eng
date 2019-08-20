import {Component, Input, OnInit, ViewChildren, QueryList} from "@angular/core";
import {StockService} from "./stock.service";
import {ModelItemType, ModelGetItems} from "./models/item";
import {ECommService} from "./ecomm.service";

var g_items_instock_cache = {}
var g_items_oos_cache = {}

@Component({
    templateUrl: "html/search-results-unfiltered-type.html",
    styleUrls: ['css/search-results-unfiltered-type.css'],
    selector: "search-results-unfiltered-type"
})
export class SearchResultsUnFilteredType implements OnInit {
    @Input('type') type:string;
    @Input('show_oos') show_oos:boolean;
    @Input("type_id") type_id:number;
    @Input('items') items:ModelGetItems[];

    constructor (private _stocks:StockService, private _ecomm:ECommService) {
    }

    ngOnInit() {
        if (!this.items) {
            let cache = (this.show_oos)?g_items_oos_cache:g_items_instock_cache;

            if (cache[this.type_id]) {
                this.items = cache[this.type_id]
                return;
            }

            let filter = {"type": this.type, "max": 4, "sort": "id.desc"};
            if (!this.show_oos)
                filter['stock_g'] = 0;
            this._stocks.getItems("id,name_unique,sale_price,sale_discount,stock,type_id",
                                  filter).then((ret) => {
                if (typeof ret == "string") {
                } else {
                    this.items = ret;
                    cache[this.type_id] = ret;
                }
            })
        }
    }
    refresh(oos:boolean, items:ModelGetItems[]) {
        if (oos == this.show_oos)
            return

        this.items = items;
        this.show_oos = oos;
        this.ngOnInit();
    }
}

@Component({
    templateUrl: "html/search-results-unfiltered.html",
    selector: "search-results-unfiltered"
})
export class SearchResultsUnFiltered {
    @Input('params') params:Object;
    private show_oos:boolean;
    private item_types:ModelItemType[];
    public show:boolean;
    private type_ids = [];
    public collections_loaded:number;
    public collections:Object;
    private collections_oos:Object;
    private collections_instock:Object;

    @ViewChildren(SearchResultsUnFilteredType) type_comps:QueryList<SearchResultsUnFilteredType>;

    constructor(private _stocks: StockService, private _ecomms:ECommService) {
    }

    load(show_oos:boolean) {
        let oos_changed = this.show_oos != show_oos;
        this.show = true;
        this.show_oos = show_oos;
        this._stocks.getItemTypes().then((ret) => {
            this.item_types = [];
            let obj = {}
            for (let r of ret) {
                if (this._ecomms.invalid_item_types_obj[r.id] != undefined)
                    continue;
                obj[r.id] = r;
            }
            for (let i of this._ecomms.item_types_order) {
                if (obj[i]) {
                    this.item_types.push(obj[i])
                    this.type_ids.push(i)
                }
                delete obj[i]
            }
            for (let i of Object.keys(obj)) {
                this.item_types.push(<ModelItemType>obj[i])
                this.type_ids.push(i)
            }

            if (!show_oos)
                this.collections = this.collections_instock;
            else
                this.collections = this.collections_oos;

            if (this.collections_loaded != 2 && !this.collections) {
                let params = {'max': 4, 'sort': 'id.desc'}
                if (!show_oos)
                    params['stock_g'] = 0

                this._stocks.getItemCollections(this.type_ids, params).then(ret => {
                    if (show_oos)
                        this.collections = this.collections_oos = ret;
                    else
                        this.collections = this.collections_instock = ret
                    this.collections_loaded = (ret == null)?2:1;
                    if (oos_changed) {
                        for (let obj of this.type_comps.toArray())
                            obj.refresh(this.show_oos, this.collections?this.collections[obj.type_id]:null);
                    }
                })
            } 
            if ((this.collections_loaded == 2) || (this.collections_loaded == 1 && this.collections)) {
                if (oos_changed) {
                    for (let obj of this.type_comps.toArray())
                        obj.refresh(this.show_oos, this.collections?this.collections[obj.type_id]:null);
                }
            }
        });
    }
    unload() {
        this.show = false;
    }
}
