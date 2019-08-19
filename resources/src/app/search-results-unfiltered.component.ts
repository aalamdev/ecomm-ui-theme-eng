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
    public items:ModelGetItems[];

    constructor (private _stocks:StockService, private _ecomm:ECommService) {
    }

    ngOnInit() {
        let filter = {"type": this.type, "max": 4, "sort": "id.desc"};
        this._stocks.getItems("id,name_unique,sale_price,sale_discount,stock,type_id",
                              filter).then((ret) => {
            if (typeof ret == "string") {
            } else {
                this.items = ret;
            }
        })
    }
}

@Component({
    templateUrl: "html/search-results-unfiltered.html",
    selector: "search-results-unfiltered"
})
export class SearchResultsUnFiltered {
    @Input('params') params:Object;
    private item_types:string[];
    public show:boolean;
    @ViewChildren(SearchResultsUnFilteredType) type_comps:QueryList<SearchResultsUnFilteredType>;

    constructor(private _stocks: StockService, private _ecomms:ECommService) {
    }

    load() {
        this.show = true;
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
        });
    }
    unload() {
        this.show = false;
    }
}
