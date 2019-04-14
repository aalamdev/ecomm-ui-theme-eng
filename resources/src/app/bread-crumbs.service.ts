import {Injectable} from "@angular/core";

@Injectable()
export class BreadCrumbsService {
    public crumbs:Object[];

    putCrumbs(crumbs:Object[]) {
        this.crumbs = crumbs;
    }
}
