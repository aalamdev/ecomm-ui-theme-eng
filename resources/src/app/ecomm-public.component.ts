import {Component, Input, Output, OnInit, OnDestroy,
        EventEmitter, AfterContentInit, ViewChild} from "@angular/core";
import {Location} from '@angular/common';

import {Router, NavigationEnd, ActivatedRoute, RoutesRecognized} from "@angular/router";

import {SearchResultsComponent} from "./search-results.component";
import {CartService} from "./cart.service";
import {ECommService} from "./ecomm.service";
import {StockService} from "./stock.service";
import {BreadCrumbsService} from "./bread-crumbs.service";
import {ModelItemType} from "./models/item";
import {ModelECommContact} from "./models/auth";
import {SlashService} from "./slash.service";

declare var ga: Function;


@Component({
    templateUrl: "html/header-nav-category.html",
    styleUrls: ["css/group-category.css"],
    selector: "ul[category-group]"
})
export class HeaderNavCategory {
    @Input('group') group:Object;
    @Input('group_name') group_name:string;
    @Input('item_types_map') item_types_map:Object;
    @Output('notify') notify = new EventEmitter();
    public ObjectCls = Object;
    private is_root:boolean;
    ngOnInit() {
        this.is_root = this.group_name == "____";
    }
    menuItemClicked(event) {
        var element = event.target || event.srcElement || event.currentTarget;
        while (element.tagName.toLowerCase() != 'li') {
            element = element.parentElement;
        }
        if (element.classList.contains("category"))
            return;

        event.stopPropagation();
        event.preventDefault();
        if ( element.classList.contains('open') ) {
            element.classList.remove('open')
        } else {
            element.classList.add('open');
        }
        return false;
    }
    navigate(type:string) {
        this.notify.next(type);
    }
}

@Component({
    selector: "header-nav-categories",
    templateUrl: "html/header-nav-categories.html",
    styleUrls: ['css/header-nav-categories.css']
})
export class HeaderNavCategories {
    @Input('is_root') is_root:boolean;
    private item_types:ModelItemType[] = [];
    private show_oos:boolean;
    public category_group:Object;
    private queryParams = new Object;
    public item_types_map = new Object;
    constructor(private _ecomms:ECommService, private _stocks:StockService,
                private _router:Router, private _ss:SlashService) {}
    ngOnInit() {
        this._stocks.getItemTypes().then((ret) => {
            for (let r of ret) {
                this.item_types_map[r.id] = r.type;
                this.item_types.push(r);
            }
        })
        this._ss.notify.subscribe((params) => {
            let tmp = false
            for (let k of Object.keys(params)) {
                if (k == 'show_oos') {
                    tmp = (params[k] == '1' || params[k].toLowerCase() == 'true');
                    break;
                }
            }
            if (this.show_oos && !tmp)
                this.show_oos = tmp;
            if (tmp)
                this.show_oos = tmp;
        })
        this._ecomms.getCategoryGroups().then(ret => {
            this.category_group = ret;
        })
    }
    navigateType(type:string) {
        let qp = {type: type}
        if (this.show_oos)
            qp['show_oos'] = this.show_oos?"1":"0";
        this._router.navigate(['/'], {queryParams: qp})
    }
}


@Component({
    selector: "header-nav",
    templateUrl: "html/header-nav.html",
    styleUrls: ['css/header-nav.css']
})
export class HeaderNav {
    @Input('is_root') is_root:boolean;
    public num_cart_items:number;
    public show_searchbox:boolean;
    public show_sidebar:boolean;
    public show_filters:boolean;
    private item_types:ModelItemType[] = [];
    public search_value:string;
    private xhr:any;
    private cart_sub:any;
    public contact_details:ModelECommContact;
    private params = new Object;
    public rand = Math.round(Math.random() * 1000);
    constructor(private _cs:CartService, private _stocks:StockService,
                private _router:Router, private _ecomms:ECommService,
                private _ss:SlashService) {
    }

    ngOnInit() {
        this.num_cart_items = this._cs.getNumCartItems();
        this._stocks.getItemTypes().then((ret) => {
            for (let r of ret) {
                this.item_types.push(r);
            }
        })
        this.cart_sub = this._cs.cartUpdated.subscribe((num) => {
            this.num_cart_items = num;
            this._ecomms.getSelfDetails().then(ret => {
                this.contact_details = ret;
            })
        })
        this._ecomms.getSelfDetails().then(ret => {
            this.contact_details = ret;
            if (ret)
                this._cs.login();
        });
        this._ss.notify.subscribe(params => {
            this.params = new Object;
            for (let k of Object.keys(params))
                this.params[k] = params[k];
        })
    }
    ngOnDestroy() {
        this.cart_sub.unsubscribe();
    }
    sortSelected(val) {
        if (val == '')
            delete this.params['sort'];
        else
            this.params['sort'] = val;
        this._router.navigate(['/'], {queryParams: this.params})
    }
    ngAfterViewInit() {
        let ret = jQuery('#product-search-box-' + this.rand).autoComplete({
            menuClass: 'autocomplete-suggestions-' + this.rand,
            source: (term, response) => {
                try { this.xhr.abort(); } catch(e){}
                let suggestions = []
                term = term.toLowerCase();
                for (let type of this.item_types) {
                    if (this._ecomms.invalid_item_types_obj[type.id] != undefined)
                        continue;

                    if (type.type.toLowerCase().indexOf(term) >= 0)
                        suggestions.push({'name': null, 'type': type.type})
                }
                this.xhr = this._stocks.searchItemName(term, suggestions, response);
            },
            renderItem: function(item, search) {
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                let ret = '<div class="autocomplete-suggestion" data-type="' +
                       item.type + '"';

                if (item.name) {
                    ret += ' data-name="' + item.name + '" data-val="' + item.name + '">';
                    ret += item.name.replace(re, "<b>$1</b>") + " in " +
                           '<span class="suggestion-item-type">' + item.type + '</span>';
                } else {
                    ret += ' data-val="' + item.type + '">';
                    ret += '<span class="suggestion-item-type">' + item.type.replace(re, "<b>$1</b>") + '</span>';
                }
                ret += "</div>";
                return ret;
            },
            onSelect: (e, term, item) => {
                let tmp = new Object;
                if (item.data('name'))
                    tmp['name_like'] = "%" + item.data('name') + "%";
                this._router.navigate(['/'], {queryParams: tmp})
            }
        })
        jQuery('.autocomplete-suggestions-' + this.rand).appendTo("#nav-searchbox-" + this.rand)
        var sticky = 62;
        var scrollable = window;
        jQuery(scrollable).on('scroll', () => {
            var navbar = jQuery("#sticky-nav-" + this.rand);
            if (window.pageYOffset >= sticky) {
                navbar.addClass("sticky")
            } else {
                navbar.removeClass("sticky");
            }
        })
    }
    searchName() {
        if (this.search_value && this.search_value.length > 0) {
            this._router.navigate(['/'], {queryParams: {'name_like': '%' + this.search_value + '%'}});
        } else {
            return;
        }
    }
    logout() {
        this._ecomms.logout().then((ret) => {
            this.num_cart_items = undefined;
            this.contact_details = undefined;
        })
    }
    navigateRoot() {
        if (window.location.pathname.startsWith("/aalam/ecomm")) {
            window.location.href = "/";
        } else {
            this._router.navigate(['/']);
        }
    }
}

@Component({
    selector: "ecomm-public-app",
    templateUrl: "html/root.html",
    styleUrls: ['css/root.css']
})
export class ECommPublicComponent implements OnInit, OnDestroy, AfterContentInit {
    public url:string;
    public is_item_url:boolean;
    public hide_emergency_msg:boolean;
    private random:number
    private route_sub:any;
    private slash_params:Object;
    private num_cart_items:number;
    private item_types:ModelItemType[] = [];
    private scrollTop:number; /*Fix for IOS overlay input focusing*/
    @ViewChild(SearchResultsComponent) search_comp:SearchResultsComponent;

    constructor(private _cs:CartService, public _ecomms:ECommService,
                private _route: ActivatedRoute, private _location:Location,
                private _stocks: StockService, private _router:Router,
                public _bcs:BreadCrumbsService, private _ss:SlashService) {
        this.random = Math.random()
        let ua = navigator.userAgent,
            iOS = /iPad|iPhone|iPod/.test(ua),
            iOS11 = /OS 11_0_1|OS 11_0_2|OS 11_0_3|OS 11_1|OS 11_1_1|OS 11_1_2|OS 11_2|OS 11_2_1/.test(ua);

        this._router.events.subscribe((event) => {
            if (event instanceof RoutesRecognized) {
                let tmp = event.url.split('?');
                let old_url = this.url;
                this.url = tmp[0];
                tmp = tmp[0].split("/")
                this.is_item_url = (tmp.length == 3 && tmp[0] == '' && tmp[1] == 'item');
                if (this.url == "/") {
                    jQuery("body").css("overflow", "auto")
                    if (iOS && iOS11) {
                        jQuery('body').css('position', "")
                        if (this.scrollTop > 0) {
                            window.scrollTo(0, this.scrollTop)
                        }
                    }
                    if (tmp.length == 1 && !this.slash_params) {
                        this._ss.slash_params = {};
                        //this.search_comp.routerParamsChanged(this.slash_params);
                    }
                    if (this._bcs.crumbs.length > 1) {
                        this._bcs.putCrumbs([this._bcs.crumbs[0]])
                    }
                } else {
                    jQuery("body").css("overflow", "hidden")
                    if (iOS && iOS11) {
                        var doc = document.documentElement;
                        if (old_url == "/")
                            this.scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
                        jQuery("body").css("position", "fixed")
                        jQuery("body").css("width", '100%')
                    }
                }
            }
            if (event instanceof NavigationEnd) {
                try {
                    ga('set', 'page', event.urlAfterRedirects);
                    ga('send', 'pageview');
                } catch(err) {
                }
            }
        })
    }

    _check_params_match(params) {
        let in_keys = Object.keys(params);
        let ex_keys = Object.keys(this.slash_params);

        if (in_keys.length != ex_keys.length) {
            return false;
        }

        for (let k of ex_keys) {
            if (!(k in params)) {
                return false;
            }

            if (params[k] != this.slash_params[k]) {
                return false;
            }
        }

        return true;
    }

    ngOnInit() {
        this.random = Math.random();
        this._stocks.getItemTypes().then((ret) => {
            for (let r of ret) {
                this.item_types.push(r);
            }
        })
        this._bcs.putCrumbs([{name: "Home", link: ['/']}])
    }

    ngAfterContentInit() {
    }

    ngOnDestroy() {
        this.route_sub.unsubscribe();
    }

    navigateBack() {
        this._location.back();
    }
}

