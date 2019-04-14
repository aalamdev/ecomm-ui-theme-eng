import {Injectable} from "@angular/core";

@Injectable()
export class PayService {
    checkPaymentsAvailable() {
        return new Promise<boolean>(resolve=>
            jQuery.ajax({method: "GET",
                         url: "/aalam/base/service/pay",
                         data: {'amount': 10, 'ack_url': '/aalam/ecomm/r/'},
                         headers: {
                             Accept: "application/json; charset=utf-8",
                         },
                         success: function(data) {
                             resolve(true);
                         },
                         error: function(data) {resolve(false);}
                         }));
    }
}
