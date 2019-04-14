import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {ECommService} from "./ecomm.service";
import {CartService} from "./cart.service";
import {BreadCrumbsService} from "./bread-crumbs.service";

@Component({
    templateUrl: "html/auth-login.html",
    selector: "auth-login",
    styleUrls: ['css/auth.css']
})
export class AuthLoginComponent {
    public value: string;
    public alert_msg:string;

    constructor (private _ecomms: ECommService, private _router: Router,
                 private _cs:CartService, private _bcs:BreadCrumbsService) { }
    register() {
        this.alert_msg = undefined;

        if (!this.value) {
            this.alert_msg = "Either your mobile number or your email id is mandatory";
            return
        }
        let inp = {}
        inp['value'] = this.value;
        this._ecomms.login(inp).then((ret) => {
            if (ret == 0) {
                let lc = this._bcs.crumbs[this._bcs.crumbs.length - 2];
                this._router.navigate(
                    lc['link'], {queryParams: lc['queryParams']})
            } else if (ret == 404) {
                this.alert_msg = "Looks like you have not registered.<br/>Kindly register!"
            } else {
                this.alert_msg = ret;
            }
        })
    }
}

@Component({
    templateUrl: "html/auth-register.html",
    selector: "auth-register",
    styleUrls: ['css/auth.css']
})
export class AuthRegisterComponent {
    public first_name: string;
    public last_name: string;
    public mobile: string;
    public email: string;
    public alert_msg:string;

    constructor (private _ecomms: ECommService, private _router: Router,
                 private _cs:CartService, private _bcs:BreadCrumbsService) { }
    register() {
        this.alert_msg = undefined;

        if (!this.first_name) {
            this.alert_msg = "Your first name is mandatory";
            return;
        }

        if (!this.mobile) {
            this.alert_msg = "Your mobile number is mandatory";
            return;
        }

        this._ecomms.register(this.first_name, this.last_name,
                              this.mobile, this.email).then((ret) => {
            if (ret == 0) {
                let lc = this._bcs.crumbs[this._bcs.crumbs.length - 2];
                this._router.navigate(
                    lc['link'], {queryParams: lc['queryParams']})
            } else {
                this.alert_msg = ret;
            }
        })
    }
}

@Component({
    templateUrl: "html/auth.html",
    styleUrls: ['css/auth.css']
})
export class AuthComponent {
    public auth_display:string;

    constructor(private _bcs:BreadCrumbsService) {
        this.auth_display = 'login';
    }

    ngOnInit() {
        if (this._bcs.crumbs) {
            let tmp = []
            for (let c of this._bcs.crumbs)
                tmp.push(c)
            tmp.push({name: "Login/Register", link: ['/auth']})
            this._bcs.putCrumbs(tmp)
        } else {
            this._bcs.putCrumbs([{name: 'Home', link: ['/']},
                                 {name: 'Login/Register', link: ['/auth']}])
        }
    }
}
