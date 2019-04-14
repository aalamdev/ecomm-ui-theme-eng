import {Component, Input, OnInit, OnDestroy} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

import {StockService} from "./stock.service";
import {BreadCrumbsService} from "./bread-crumbs.service";
import {ModelItemImagesSpec} from "./models/item";

@Component({
    templateUrl: "html/item-images.html",
    selector: "item-images",
    styleUrls: ['css/item-images.css']
})
export class ItemImagesComponent implements OnInit {
    @Input('size') size:string;
    @Input('item_id') item_id:number;
    private current_index:number;
    public images_spec:ModelItemImagesSpec[];

    constructor(private _stocks:StockService, private _router:Router) {
    }

    ngOnInit() {
        this.current_index = 0;
        this._stocks.getItemImageSpec(this.item_id).then((ret) => {
            ret.sort(function(a, b) {return a.index - b.index})
            this.images_spec = ret;
        })
    }

    navPrev() {
        this.current_index = (this.current_index == 0)?(this.images_spec.length - 1):(this.current_index - 1);
    }

    navNext() {
        this.current_index = (this.current_index == this.images_spec.length - 1)?0:(this.current_index + 1);
    }

    imageClicked() {
        if (this.size == 'xxxhdpi')
            return

        this._router.navigate(['/item/' + this.item_id + "/images"],
                              {queryParams: {'start': this.current_index}})
    }

    refresh(item_id:number) {
        this.item_id = item_id;
        this._stocks.getItemImageSpec(this.item_id).then((ret) => {
            ret.sort(function(a, b) {return a.index - b.index})
            this.current_index = 0;
            this.images_spec = ret;
        })
    }
}

@Component({
    templateUrl: "html/item-images-zoomed.html",
})
export class ItemImagesZoomedComponent implements OnInit, OnDestroy {
    private route_sub:any;
    public item_id:number;

    constructor(private _route:ActivatedRoute, private _bcs:BreadCrumbsService) {
    }

    ngOnInit() {
        this.route_sub = this._route.params.subscribe((params) => {
            this.item_id = parseInt(params['item_id'])
            let tmp = [];
            for (let x of this._bcs.crumbs) {
                tmp.push(x)
            }
            tmp.push({name: "Images", link: ['/item', this.item_id, "images"]})
            this._bcs.putCrumbs(tmp);
        })
    }

    ngOnDestroy() {
        this.route_sub.unsubscribe();
    }
}
