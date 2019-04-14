import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { StockService } from "./stock.service";
import { ECommService } from "./ecomm.service";
import { SettingsService } from "./settings.service";
import { CartService } from "./cart.service";
import { BreadCrumbsService } from "./bread-crumbs.service";
import { PayService } from "./pay.service";
import { SlashService } from "./slash.service";

import { ECommPublicComponent, HeaderNav,
         HeaderNavCategories, HeaderNavCategory } from "./ecomm-public.component";
import { CartComponent, CheckoutComponent} from "./cart.component";
import { AuthComponent, AuthRegisterComponent,
         AuthLoginComponent } from "./auth.component";
import { SearchSortComponent, SearchFiltersComponent,
         SearchFilterComponent } from "./search-filters.component";
import { SearchResultsComponent,
         SearchResultsFiltered } from "./search-results.component";
import { SearchResultsUnFiltered,
         SearchResultsUnFilteredType } from "./search-results-unfiltered.component";
import { UserProfileComponent } from "./user-profile.component";
import { ItemCardComponent } from "./item-card.component";
import { ItemDetailsComponent } from "./item-details.component";
import { OrderDetailsComponent, OrderInvoiceDetailsComponent } from "./order-details.component";
import { OrderContactInfoComponent, OrderContactAddressCondensedComponent,
         OrderContactNameComponent, OrderContactAddressEditComponent,
         OrderContactAddressComponent} from "./order-contact.component";
import { OrderLogsComponent } from "./order-log.component";
import { OrderLogItemComponent } from "./order-log-item.component";
import { ItemImagesComponent, ItemImagesZoomedComponent } from "./item-images.component";
import { OrdersComponent } from "./orders.component";
import { DateComponent } from "./date.component";
import { OrderLogPaidItemComponent, OrderPaymentConfirmedComponent } from "./order-log-paid-item.component";
import { OrderLogReturnInitiateItemComponent } from "./order-log-return-initiate-item.component";

const routes: Routes = [
    {path: "cart", component: CartComponent, data: {name: "Cart"}},
    {path: "auth", component: AuthComponent, data: {name: "Login/Register"}},
    {path: "item/:item_id", component: ItemDetailsComponent, data: {name: "Item"}},
    {path: 'item/:item_id/images', component: ItemImagesZoomedComponent, data: {name: "Item images"}},
    {path: 'order/:order_id', component: OrderDetailsComponent, data: {name: "Order"}},
    {path: 'order/:order_id/payconfirm', component: OrderPaymentConfirmedComponent},
    {path: 'profile', component: UserProfileComponent},
    {path: 'orders', component: OrdersComponent, data: {name: "Orders"}},
    {path: 'checkout', component: CheckoutComponent}
];

@NgModule({
    imports: [ RouterModule.forRoot(routes),
        FormsModule,
        BrowserModule,
    ],
    declarations: [
        ECommPublicComponent,
        UserProfileComponent,
        CartComponent,
        CheckoutComponent,
        AuthComponent,
        AuthRegisterComponent,
        AuthLoginComponent,
        ItemCardComponent,
        SearchResultsUnFiltered,
        SearchResultsUnFilteredType,
        SearchResultsFiltered,
        SearchResultsComponent,
        SearchFilterComponent,
        ItemDetailsComponent,
        ItemImagesComponent,
        ItemImagesZoomedComponent,
        DateComponent,
        OrderDetailsComponent,
        OrderPaymentConfirmedComponent,
        OrderContactInfoComponent,
        OrderContactNameComponent,
        OrderContactAddressEditComponent,
        OrderContactAddressComponent,
        OrderContactAddressCondensedComponent,
        OrderInvoiceDetailsComponent,
        OrderLogsComponent,
        OrderLogItemComponent,
        OrdersComponent,
        OrderLogPaidItemComponent,
        OrderLogReturnInitiateItemComponent,
        HeaderNav,
        HeaderNavCategories,
        HeaderNavCategory,
        SearchFiltersComponent,
        SearchSortComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    exports: [ RouterModule ],
    providers: [
        StockService,
        ECommService,
        SettingsService,
        CartService,
        BreadCrumbsService,
        PayService,
        SlashService
    ],
    bootstrap: [ ECommPublicComponent ]
})
export class ECommPublicRoutesModule {
}
