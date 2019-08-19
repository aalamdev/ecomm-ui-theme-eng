import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {SlashService} from "./slash.service";
import {ECommService} from "./ecomm.service";
import {StockService} from "./stock.service";

@Component({
    templateUrl: "html/search-sort.html",
    selector: "search-sort",
})
export class SearchSortComponent {
    @Output('notify') notify = new EventEmitter();
    public index:number;
    public sorter_map = [
                          {'value': '', 'name': 'No Sort'},
                          {'value': 'id.desc', 'name': 'New Arrivals'},
                          {'value': 'sale_price.asc', 'name': 'Price: Low to High'},
                          {'value': "sale_price.desc", 'name': 'Price: High to Low'},
                          {'value': 'sale_discount.desc', 'name': 'Discount: High to Low'},
                          ]
    constructor(private _ss:SlashService) {
        this.index = 0;
        this._ss.notify.subscribe((p) => {
            for (let k of Object.keys(p)) {
                if (k == 'sort') {
                    let x = 0;
                    for (let i of this.sorter_map) {
                        if (p[k] == i['value']) {
                            this.index = x;
                            break;
                        }
                        x += 1;
                    }
                }
            }
        })
    }
    selected(x:number) {
        this.index = x;
        this.notify.next(this.sorter_map[x]['value']);
    }
}

@Component({
    templateUrl: "html/search-filter.html",
    selector: "search-filter",
    styleUrls: ['css/search-filter.css']
})
export class SearchFilterComponent {
    @Input('name') filter_name:string;
    @Input('values') values:Object;
    @Input('selected') selected:string;
    @Output('changedCallback') callback = new EventEmitter();
    private filter_values:string[];
    public show_dropdown:boolean;
    private content_changed:boolean;
    private selected_values_map:Object;
    private search_text:string;
    private filtered_filter_values:string[];

    constructor(private _router:Router) {

    }

    ngOnInit() {
        this.show_dropdown = true;
    }

    ngAfterContentInit() {
    }

    ngOnChanges() {
        if(!this.values)
            return

        let selected_arr = [];

        if (this.selected)
            selected_arr = this.selected.split(",");

        this.filter_values = Object.keys(this.values);
        this.selected_values_map = new Object();
        for (let v of this.filter_values) {
            let is_present = (selected_arr.indexOf(v) >= 0);
            this.selected_values_map[v] = {"original": is_present,
                                           "actual": is_present}
        }
    }
    contentChanged() {
        let selected_arr = []
        for (let v of this.filter_values) {
            if (this.selected_values_map[v].actual)
                selected_arr.push(v);
        }

        this.callback.next({'name': this.filter_name, 'value': selected_arr.join()});
    }

    dropdownHiding() {
        if (!this.content_changed)
            return;

        for (let v of this.filter_values) {
            if (this.selected_values_map[v].original != this.selected_values_map[v].actual) {
                this.contentChanged();
                break;
            }
        }
    }

    valueChanged(value:string) {
        this.content_changed = true;
        this.selected_values_map[value].actual = !this.selected_values_map[value].actual;
        this.dropdownHiding();
    }

    labelClicked(event:Event, value:string) {
        event.stopPropagation();
        event.preventDefault();
        this.selected_values_map[value].actual = !this.selected_values_map[value].actual;
        this.content_changed = true;
    }

    InputKeyEvent(event:Event) {
        if (this.search_text && this.search_text.length) {
            this.filtered_filter_values = this.filter_values.filter((value:string) => {
                return value.indexOf((<HTMLInputElement>event.target).value) != -1
            })
        } else {
            this.filtered_filter_values = undefined;
        }
    }
}

@Component({
    templateUrl: "html/search-filters.html",
    styleUrls: ['css/search-results.css'],
    selector: 'search-filters'
})
export class SearchFiltersComponent {
    @Output('close') close = new EventEmitter();
    private params:Object;
    public properties:Object;
    public properties_names: string[];
    private show_filter:boolean;
    private params_bkp:Object;
    private sorter_index:number;
    private sorter_map = [
                          {'value': 'id.desc', 'name': 'New Arrivals'},
                          {'value': 'sale_price.asc', 'name': 'Price: Low to High'},
                          {'value': "sale_price.desc", 'name': 'Price: High to Low'},
                          {'value': 'sale_discount.desc', 'name': 'Discount: High to Low'},
                          ]

    constructor(private _ecomms:ECommService, private _stocks:StockService, private _router:Router, private _ss:SlashService) {
        this.properties = {};
        this.properties_names = [];
        this.params_bkp = new Object;
        this.params = new Object;
    }
    ngOnInit() {
        this._ss.notify.subscribe((params) => {
            this.params = params;
            this.routerParamsChanged(this.params);
        });
    }
    paramChanged(data:Object) {
        if (data['value'])
            this.params_bkp[data['name']] = data['value'];
        else if (data['name'] in this.params_bkp)
            delete this.params_bkp[data['name']]

        this.show_filter = false;
        this._router.navigate(['/'], {queryParams: this.params_bkp})
        if (Object.keys(this.params_bkp).length == 0)
            this._ss.route_sub.next({});
    }
    routerParamsChanged(p) {
        this._routerParamsChanged(p)
    }
    _routerParamsChanged(params:Object) {
        this.params = params;

        let pbkp = new Object();
        this.sorter_index == undefined;

        for (let k of Object.keys(this.params)) {
            pbkp[k] = this.params[k];
            if (k == 'sort') {
                let index = 0;
                for (let m of this.sorter_map) {
                    if (this.params[k] == m['value']) {
                        this.sorter_index = index;
                        break;
                    }
                    index++;
                }
            } else {
            }
        }
        this.params_bkp = pbkp;

        this._stocks.getItemProperties(this.params_bkp).then((ret) => {
            if (typeof ret == "string") {
            } else {
                this.properties = ret;
                let tmp = [];
                for (let n of Object.keys(ret)) {
                    if (n.startsWith("__"))
                        continue

                    tmp.push(n)
                }
                this.properties_names = tmp;
            }
        })
    }
}
