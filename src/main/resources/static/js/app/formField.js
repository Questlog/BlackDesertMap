define('formField', [
    'knockout'
], function(ko) {
    return function (data) {
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
        self.showInPopup    =   ko.observable(data.showInPopup);
        
        self.editing = ko.observable(false);
        self.edit = function () {
            if(self.optional())
                self.editing(true);
        };
    };
});