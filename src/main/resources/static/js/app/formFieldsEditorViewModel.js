define('formFieldsEditorViewModel', [
    'jquery',
    'knockout',
    'formField',
    'newFormFieldViewModel'
], function($, ko, FormField, NewFormFieldViewModel) {

    return function (viewModel, mapObj) {
        var self = this;

        self.internalTypes = ko.observableArray([
            {"name": "text", "displayName": "Text"},
            {"name": "checkbox", "displayName": "Checkbox"},
            {"name": "screenshot", "displayName": "Screenshot"},
            {"name": "link", "displayName": "Link"},
            {"name": "textarea", "displayName": "Fließtext"}
        ]);


        self.requiredFormFields = ko.observableArray([]);
        self.formFields = ko.observableArray([]);
        self.newFormField = ko.observable();

        var dataFields = [];
        if(mapObj) {
            dataFields = mapObj.params;
        } else {
            dataFields = viewModel.types()[0].dataFields;
        }

        $.each(dataFields, function (i, data) {
            if(!data.internalType)
                data.internalType = data.type;

            if(data.optional)
                self.formFields.push(new FormField(data));
            else
                self.requiredFormFields.push(new FormField(data));

            if(data.optional === undefined)
                data.optional = true;
        });


        self.addFormField = function (internalType) {
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

        self.changeType = function (typeName){
            self.requiredFormFields([]);
            var dataFields = viewModel.getType(typeName).dataFields;
            ko.utils.arrayForEach(dataFields, function (item) {
                if(!item.optional){
                    if(item.optional === undefined)
                        item.optional = true;
                    self.requiredFormFields.push(new FormField(item));
                }
            });
        };

        self.getFormData = function(){
            var mapping = {
                'ignore': ['editing']
            };
            var formData = ko.toJS(self.requiredFormFields(), mapping);
            var optionalFormData = ko.toJS(self.formFields(), mapping);
            Array.prototype.push.apply(formData, optionalFormData);

            return formData;
        };
    };



});