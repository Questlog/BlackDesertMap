define('newFormFieldViewModel', [
    'jquery',
    'knockout',
    'formField'
], function($, ko, FormField) {
    return function(internalType, callback){
        var self = this;
        var formFieldData = {};

        self.type = ko.observable();
        self.formField = ko.observable();

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
        } else if (internalType.name === "text") {
            formFieldData.element = "input";
            formFieldData.type = "text";
        } else if (internalType.name === "link") {
            formFieldData.element = "input";
            formFieldData.type = "text";
        } else if (internalType.name === "textarea") {
            formFieldData.element = "textarea";
        }

        self.type(internalType);
        self.formField(new FormField(formFieldData));

        self.save = function(){
            self.formField().optional(true);
            callback(self.formField());
        };
        self.cancel = function(){
            callback(null);
        };
    };
});