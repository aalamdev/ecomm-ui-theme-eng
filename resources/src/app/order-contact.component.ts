import {Component, OnInit, OnDestroy, Input, Output, EventEmitter} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

import {ECommService} from "./ecomm.service";
import {ModelECommContact, ModelContactAddressValue} from "./models/auth";


@Component({
    templateUrl: "html/order-contact-name-edit.html",
    selector: "order-contact-name-edit"
})
export class OrderContactNameComponent implements OnInit {
    @Input('contact') contact:ModelECommContact;
    @Output('nameEditedCb') editedCb = new EventEmitter();
    public first_name:string;
    public last_name:string;

    constructor (private _ecomms:ECommService) {

    }

    ngOnInit() {
        this.first_name = this.contact.first_name;
        this.last_name = this.contact.last_name;
    }

    updateName() {
        let params = {}
        if (this.first_name != this.contact.first_name)
            params['first_name'] = this.first_name;
        if (this.last_name != this.contact.last_name)
            params['last_name'] = this.last_name;

        if (!Object.keys(params).length) {
            this.editedCb.next({})
            return;
        }

        this._ecomms.updateContact("_", params).then((ret) => {
            this.contact.first_name = this.first_name;
            this.contact.last_name = this.last_name;
            this.editedCb.next({})
        })
    }
}

@Component({
    templateUrl: "html/order-contact-address.html",
    selector: "order-contact-address"
})
export class OrderContactAddressComponent {
    @Input('address') address:ModelContactAddressValue;

    constructor() {}
}

@Component ({
    template: '{{address_str}}',
    selector: 'order-contact-address-condensed'
})
export class OrderContactAddressCondensedComponent {
    @Input('address') address:ModelContactAddressValue;
    public address_str:string;
    constructor() {}

    ngOnInit() {
        let tmp = [];
        if (this.address.line1)
            tmp.push(this.address.line1)
        if (this.address.line2)
            tmp.push(this.address.line2)
        if (this.address.line3)
            tmp.push(this.address.line3)
        if (this.address.line4)
            tmp.push(this.address.line4)
        if (this.address.city)
            tmp.push(this.address.city)
        if (this.address.state)
            tmp.push(this.address.state)
        if (this.address.country)
            tmp.push(this.address.country)
        if (this.address.postal_code)
            tmp.push(this.address.postal_code)

        this.address_str = tmp.join(", ");
    }
}


@Component({
    templateUrl: "html/order-contact-address-edit.html",
    selector: "order-contact-address-edit"
})
export class OrderContactAddressEditComponent implements OnInit {
    @Input('edit_address_id') address_id: number;
    @Input('contact') contact:ModelECommContact;
    @Output('addressEditedCb') addressEditedCb = new EventEmitter();
    private address:ModelContactAddressValue;
    private line1: string;
    private line2: string;
    private line3: string;
    private line4: string;
    private city: string;
    private state: string;
    private country: string;
    private postal_code: string;
    private alert_msg:string;
    private button_text:string;

    constructor(private _ecomms:ECommService) {}

    ngOnInit() {
        this.button_text = (this.address_id)?"Update":"Add";
        if (!this.address_id)
            return

        for (let addr of this.contact.addresses) {
            if (addr.id == this.address_id) {
                this.address = addr.value;
                break;
            }
        }

        if (!this.address)
            return;

        this.line1 = this.address.line1;
        this.line2 = this.address.line2;
        this.line3 = this.address.line3;
        this.line4 = this.address.line4;
        this.city = this.address.city;
        this.state = this.address.state;
        this.country = this.address.country;
        this.postal_code = this.address.postal_code;
    }

    updateAddress() {
        let params = {};

        if (this.line1 != this.address.line1)
            params['line1'] = this.line1
        if (this.line2 != this.address.line2)
            params['line2'] = this.line2
        if (this.line3 != this.address.line3)
            params['line3'] = this.line3
        if (this.line4 != this.address.line4)
            params['line4'] = this.line4
        if (this.city != this.address.city)
            params['city'] = this.city
        if (this.state != this.address.state)
            params['state'] = this.state
        if (this.country != this.address.country)
            params['country'] = this.country
        if (this.postal_code != this.address.postal_code)
            params['postal_code'] = this.postal_code

        if (!Object.keys(params).length) {
            this.addressEditedCb.next(this.address)
            return;
        }

        this._ecomms.updateContact("Address-" + this.address_id, params).then((ret) => {
            if (ret == 0) {
                this.address.line1 = this.line1;
                this.address.line2 = this.line2;
                this.address.line3 = this.line3;
                this.address.line4 = this.line4;
                this.address.city = this.city;
                this.address.state = this.state;
                this.address.country = this.country;
                this.address.postal_code = this.postal_code;
                this.addressEditedCb.next(this.address)
            }
        })
    }

    newAddress() {
        let params = {};
        this.alert_msg = undefined;

        if (this.line1)
            params['line1'] = this.line1
        if (this.line2)
            params['line2'] = this.line2
        if (this.line3)
            params['line3'] = this.line3
        if (this.line4)
            params['line4'] = this.line4
        if (this.city)
            params['city'] = this.city
        if (this.state)
            params['state'] = this.state
        if (this.country)
            params['country'] = this.country
        if (this.postal_code)
            params['postal_code'] = this.postal_code

        if (! params['postal_code'] || ! params['city'] ||
            ! params['country'] || ! params['state']) {
            this.alert_msg = "You missed some mandatory(*) fields";
            return;
        }

        this._ecomms.newAddress(params).then((ret) => {
            if (ret == 0) {
                let ex_addr_ids = []

                for (let addr of this.contact.addresses) {
                    ex_addr_ids.push(addr.id);
                }

                this._ecomms.getSelfDetails().then((ret) => {
                    for (let addr of ret.addresses) {
                        if (ex_addr_ids.indexOf(addr.id) < 0) {
                            this.contact.addresses.push(addr);
                            this.addressEditedCb.next(addr);
                        }
                    }
                })
            }
        })
    }

    buttonClicked(event:Event) {
        if (this.address_id)
            this.updateAddress();
        else
            this.newAddress();
    }

    cancelClicked() {
        this.addressEditedCb.next({})
    }
}


@Component({
    templateUrl: "html/order-contact-info.html",
    selector: "order-contact-info",
    styleUrls: ['css/order-contact-info.css']
})
export class OrderContactInfoComponent {
    @Input('contact_id') contact_id:number;
    @Input('status') status:string;
    @Input('shipping_address_id') shipping_address_id:number;
    @Input('orig_shipping_address_id') orig_shipping_address_id:number;
    @Output('shippingAddressChanged') addrChangedCb = new EventEmitter();
    private edit_name:boolean;
    private edit_address_id:number;
    public contact: ModelECommContact;
    private contact_address:ModelContactAddressValue;

    constructor(private _ecomms:ECommService) {}

    ngOnInit() {
        this._ecomms.getSelfDetails().then((ret) => {
            this.contact = ret;
            if (this.contact.addresses.length == 0)
                this.edit_address_id = 0;

            if (this.shipping_address_id) {
                for (let addr of this.contact.addresses) {
                    if (this.shipping_address_id == addr.id) {
                        this.contact_address = addr.value;
                    }
                }
            } else {
                if (this.status == 'New' && this.contact.addresses.length > 0) {
                    this.addressChosen(0)
                }
            }
        })
    }

    addressChosen(index:number) {
        this.contact_address = this.contact.addresses[index].value;
        this.shipping_address_id = this.contact.addresses[index].id;
        if (this.shipping_address_id != this.orig_shipping_address_id) {
            this.orig_shipping_address_id = this.contact.addresses[index].id;
            this.addrChangedCb.next({"address_id": this.shipping_address_id})
        }
    }

    addressEdited(event:Event) {
        this.edit_address_id = undefined;
        if (this.contact.addresses.length == 1) {
            this.shipping_address_id = this.contact.addresses[0].id;
            this.orig_shipping_address_id = this.shipping_address_id;
            this.addrChangedCb.next({"address_id": this.shipping_address_id})
            this.contact_address = this.contact.addresses[0].value;
        }
    }

    deleteAddress(index:number) {
        if (this.contact.addresses[index].id == this.orig_shipping_address_id) {
            return;
        }

        this._ecomms.deleteAddress(this.contact.addresses[index].id).then((ret) => {
            this.contact.addresses.splice(index, 1);
        })
    }
}


