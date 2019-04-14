import {Injectable, EventEmitter} from "@angular/core";
import {RoutesRecognized, Router, ActivatedRoute} from "@angular/router";
import {BreadCrumbsService} from "./bread-crumbs.service";

@Injectable()
export class SlashService {
    public notify = new EventEmitter();
    public slash_params;
    public route_sub;
    private url:string;

    constructor(private _route:ActivatedRoute, private _bcs:BreadCrumbsService, private _router:Router) {
        this._router.events.subscribe((event) => {
            if (event instanceof RoutesRecognized) {
                let tmp = event.url.split('?');
                let old_url = this.url;
                this.url = tmp[0];
                if (this.url == '/' && !this.slash_params && tmp.length == 1)
                    this.notify.next({});
            }

        })
        this.route_sub = this._route.queryParams.subscribe(params => {
            if (this.url != "/")
                return

            if (!this.slash_params || !this._check_params_match(params)) {
                this.slash_params = params;
                this._bcs.putCrumbs([{name: "Home", link: ['/'], queryParams: params}])
                this.notify.next(this.slash_params);
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
}
