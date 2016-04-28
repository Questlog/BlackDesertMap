define('newFormFieldViewModel', [
    'jquery',
    'knockout',
    'formField'
], function($, ko, FormField) {
    return function(internalType, callback){
        var self = this;
        var formFieldData = {};

        formFieldData.internalType =  internalType.name;
        formFieldData.name = internalType.name;
        formFieldData.label = internalType.displayName;
        formFieldData.placeholder = internalType.displayName;
        formFieldData.value = "";

        if(internalType.name === "screenshot") {
            formFieldData.element = "input";
            formFieldData.type = "text";
        } else if (internalType.name === "checkbox") {
            formFieldData.element = "input";
            formFieldData.type = "checkbox";
            formFieldData.options = [internalType.name];
        }  else if (internalType.name === "text") {
            formFieldData.element = "input";
            formFieldData.type = "text";
        }

        self.type = ko.observable(internalType);
        self.formField = ko.observable(new FormField(formFieldData));

        self.save = function(){
            self.formField().optional(true);
            callback(self.formField());
        };
        self.cancel = function(){
            callback(null);
        };
    };
});