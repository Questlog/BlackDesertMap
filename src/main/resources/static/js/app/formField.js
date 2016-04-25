define('formField', [
    'jquery',
    'knockout'
], function($, ko) {
    return function (data) {
        if(data.data) //knockout can't bind the data directly for components
            data = data.data;
        var self            =   this;
        self.name           =   ko.observable(data.name).extend({required:true});
        self.element        =   ko.observable(data.element);                        // Can be: input, textarea, button, select
        self.type           =   ko.observable(data.type);                           // Can be: text, radio, checkbox, hidden, password, submit
        self.label          =   ko.observable(data.label);
        self.options        =   ko.observableArray(data.options);                   // Array: Used by select, radio, checkbox
        self.placeholder    =   ko.observable(data.placeholder);
        self.value          =   ko.observable(data.value);
        self.internalType   =   ko.observable(data.internalType);
        self.optional       =   ko.observable(data.optional);
    };
});