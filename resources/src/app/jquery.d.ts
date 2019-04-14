
interface JQuery {
    on(event:string, handler:Function);
    off(event:string);
    offset():any;
    addClass(xls:string);
    removeClass(x:string);
    attr(val:string);
    dropdown(s:string);
    html();
    scrollTop(t:number);
    css(property:string, value:string);
    autoComplete(Object);
    appendTo(target:string);
    blur();
}

interface JQueryStatic {
    getJSON(url: string, success?: (data: any) => any);
    ajax(settings: Object);
    (element: any): JQuery;
}
declare var jQuery: JQueryStatic;
