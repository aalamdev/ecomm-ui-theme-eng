import {Component, Input} from "@angular/core";

@Component({
    template: `{{date}} {{time}} {{meridian}}`,
    selector: "date"
})
export class DateComponent {
    @Input('value') value:string;
    public date:string;
    public time:string;
    public meridian:string;

    ngOnInit() {
        let spl = this.value.split("T")
        this.date = spl[0];
        if (!spl[1])
            return
        spl = spl[1].split(":");

        let hr = parseInt(spl[0]);
        if (hr > 12) {
            hr -= 12
            this.meridian = 'PM';
        } else
            this.meridian = 'AM';

        this.time = hr + ":" + spl[1] + ":" + spl[2];
    }
}
