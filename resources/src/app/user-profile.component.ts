import {Component} from "@angular/core";

import {ECommService} from "./ecomm.service";
import {BreadCrumbsService} from "./bread-crumbs.service";

@Component({
    templateUrl: "html/user-profile.html"
})
export class UserProfileComponent {
    private orig_first_name:string;
    private orig_last_name:string;
    private orig_mobile:string;
    private orig_email:string;

    public first_name:string;
    public last_name:string;
    public mobile:string;
    public email:string;
    public mobile_key_id:any;
    public email_key_id:any;
    public new_auth_type:string;
    public new_password:string;
    public auth:Object;

    public success_msg:string[];
    public alert_msg:string[];

    constructor(private _ecomms:ECommService, private _bcs:BreadCrumbsService) {}

    ngOnInit() {
        this._ecomms.getSelfDetails(true).then(ret => {
            this.orig_first_name = this.first_name = ret.first_name;
            this.orig_last_name = this.last_name = ret.last_name;
            this.auth = ret['auth'] || {'available_auths': [], 'current': null};
            this.new_auth_type = this.auth['current'];
            for (let det of ret.details) {
                if (det.key.toLowerCase() == 'mobile') {
                    this.orig_mobile = this.mobile = det.value;
                    this.mobile_key_id = det.id
                } else if (det.key.toLowerCase() == 'email') {
                    this.orig_email = this.email = det.value;
                    this.email_key_id = det.id;
                }
            }
        })

        let lc = this._bcs.crumbs[0];
        this._bcs.crumbs = [lc];
        this._bcs.crumbs.push({'link': '/profile', 'name': 'User Profile'});
    }

    update() {
        let u = false;
        this.success_msg = [];
        this.alert_msg = [];
        if (this.new_auth_type != this.auth['current']) {
            if (!this.email) {
                this.alert_msg.push("Kindly set your email id");
                return;
            }
            if (this.new_auth_type == 'password' && (!this.new_password || !this.new_password.length)) {
                this.alert_msg.push("You have to input a password");
                return;
            }

            let params = {'type': this.new_auth_type}
            if (this.new_auth_type == 'password')
                params['password'] = this.new_password;
            this._ecomms.setAuthType(params).then(ret => {
                if (ret != 0) {
                    this.alert_msg.push("Unable to set the chosen authentication method");
                } else {
                    this.auth['current'] = this.new_auth_type;
                    this.success_msg.push("Updated your authentication preference successfully");
                    setTimeout(() => {this.success_msg = undefined}, 2500);
                }
            })
        }
        let p = {}
        if (this.orig_last_name !== this.last_name)
            p['last_name'] = this.last_name
        if (this.orig_first_name !== this.first_name)
            p['first_name'] = this.first_name;
        if (this.mobile != this.orig_mobile) {
            let tmp = this.mobile_key_id?this.mobile_key_id:'_';
            if (tmp !== '_') {
                this._ecomms.updateContact(tmp, {'key': 'Mobile', 'value': this.mobile}).then(ret => {
                    if (ret != 0) {
                        this.alert_msg.push("Cannot update your mobile number");
                        setTimeout(() => {this.alert_msg = undefined}, 2500);
                        this.mobile = this.orig_mobile;
                    } else {
                        this.orig_mobile = this.mobile;
                        if (tmp == '_')
                            this.mobile_key_id = ret.id
                        this.success_msg.push("Updated your mobile number successfully");
                        setTimeout(() => {this.success_msg = undefined}, 2500);
                    }
                })
            } else {
                p['Mobile'] = this.mobile;
            }
        }
        if (this.email !== this.orig_email) {
            let tmp = this.email_key_id?this.email_key_id:'_';
            if (tmp !== '_') {
                this._ecomms.updateContact(tmp, {'key': 'Email', 'value': this.email}).then(ret => {
                    if (ret != 0) {
                        this.alert_msg.push("Cannot update your email address");
                        setTimeout(() => {this.alert_msg = undefined}, 2500);
                        this.email = this.orig_email;
                    } else {
                        if (tmp == '_')
                            this.email_key_id = ret.id
                        this.orig_email = this.email;
                        this.success_msg.push("Updated your email address successfully");
                        setTimeout(() => {this.success_msg = undefined}, 2500);
                    }
                })
            } else 
                p['Email'] = this.email
        }
        if (Object.keys(p).length) {
            this._ecomms.updateContact("_", p).then(ret => {
                if (ret != 0) {
                    this.alert_msg.push("Unable to update");
                    setTimeout(() => {this.alert_msg = undefined}, 2500);
                    this.last_name = this.orig_last_name;
                    this.first_name = this.orig_first_name;
                } else {
                    this.orig_first_name = this.first_name;
                    this.orig_last_name = this.last_name;
                    this.success_msg.push("Updated successfully");
                    setTimeout(() => {this.success_msg = undefined}, 2500);
                }
            })
        }
    }
}
