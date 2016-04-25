define('createViewModel', [
    'jquery',
    'knockout',
    'newFormFieldViewModel',
    'formField'
], function($, ko, NewFormFieldViewModel, FormField) {

    return function (viewModel) {
        var self = this;

        self.internalTypes = ko.observableArray([
            {"name": "text", "displayName": "Text"},
            {"name": "checkbox", "displayName": "Checkbox"},
            {"name": "screenshot", "displayName": "Screenshot"}
        ]);

        self.requiredFormFields = ko.observableArray();
        self.formFields = ko.observableArray();
        self.newObjTypeName = ko.observable();
        self.newFormField = ko.observable(null);

        self.buildFormFields = function (type) {
            return ko.utils.arrayMap(type.dataFields, function (item) {
                return new FormField(item);
            });
        };
        self.changeNewObjType = function (data, event) {
            console.log(viewModel.getType(self.newObjTypeName()).dataFields);
            self.requiredFormFields(viewModel.getType(self.newObjTypeName()).dataFields);
        };

        self.addFormField = function (internalType) {
            console.log(internalType);
            self.newFormField(new NewFormFieldViewModel(internalType, function (formField) {
                if (formField != null) {
                    formField.name(formField.name() + self.formFields().length);
                    self.formFields.push(formField);
                }
                self.newFormField(null);
            }));
        };

        self.removeFormField = function (formField) {
            self.formFields.remove(formField);
        };

        self.cancel = function () {
            viewModel.mode("view");
        };

        self.save = function () {

        };
    };

});