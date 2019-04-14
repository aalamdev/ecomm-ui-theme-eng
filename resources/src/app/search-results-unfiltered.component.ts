import {Component, Input, OnInit, ViewChildren, QueryList} from "@angular/core";
import {StockService} from "./stock.service";
import {ModelGetItems} from "./models/item";
import {ECommService} from "./ecomm.service";

@Component({
    templateUrl: "html/search-results-unfiltered-type.html",
    styleUrls: ['css/search-results-unfiltered-type.css'],
    selector: "search-results-unfiltered-type"
})
export class SearchResultsUnFilteredType implements OnInit {
    @Input('type') type:string;
    @Input('show_oos') show_oos:boolean;
    public items:ModelGetItems[];

    constructor (private _stocks:StockService, private _ecomm:ECommService) {
    }

    ngOnInit() {
        let filter = {"type": this.type, "max": 4, "sort": "id.desc"};
        if (!this.show_oos)
            filter['stock_g'] = 0;
        this._stocks.getItems("id,name_unique,sale_price,sale_discount,stock,type_id",
                              filter).then((ret) => {
            if (typeof ret == "string") {
            } else {
                this.items = ret;
            }
        })
    }
    refresh(oos:boolean) {
        if (oos == this.show_oos)
            return

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
    private item_types:string[];
    public show:boolean;
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
                obj[r.id] = r.type;
            }
            for (let i of this._ecomms.item_types_order) {
                if (obj[i])
                    this.item_types.push(obj[i])
                delete obj[i]
            }
            for (let i of Object.keys(obj))
                this.item_types.push(obj[i])

            if (oos_changed) {
                for (let obj of this.type_comps.toArray())
                    obj.refresh(this.show_oos)
            }
        });
    }
    unload() {
        this.show = false;
    }
}
