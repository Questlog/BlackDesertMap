define('createViewModel', [
    'jquery',
    'knockout',
    'newFormFieldViewModel',
    'formField',
    'helperFunctions',
    'formFieldsEditorViewModel'
], function($, ko, NewFormFieldViewModel, FormField, helper, FormFieldsEditor) {

    return function (viewModel) {
        var self = this;

        self.newObjTypeName = ko.observable(viewModel.types()[0].name);
        self.formFieldsEditor = ko.observable(new FormFieldsEditor(viewModel));
        
        self.changeNewObjType = function (event) {
            var option = event.target.selectedOptions[0];
            var type = ko.dataFor(option);
            var typeName = type.name;
            self.newObjTypeName(typeName);
            self.formFieldsEditor().changeType(typeName);
        };

        self.cancel = function () {
            viewModel.mode("view");
        };

        self.save = function () {
            var typeName = self.newObjTypeName();
            if (typeName == '' || typeName == null){
                alert('Vor dem Speichern muss ein Typ ausgewählt sein.');
                return;
            }
            var layer = viewModel.createdLayer();
            if (layer == null){
                alert('Vor dem Speichern muss eine Markierung mit einem der Tools (linker Rand der Karte) erstellt werden.');
                return;
            }

            var mapObj = helper.createMapObjectFromLayer(layer, typeName);

            var formData = self.formFieldsEditor().getFormData();

            helper.insertFormData(mapObj, formData);

            helper.saveMapObjToDatabase(mapObj, true, function(data){
                helper.removeLayer(layer);
                var mapObj = JSON.parse(data);
                helper.addDatabaseObject(viewModel, mapObj);
            });

            viewModel.createdLayer(null);
            viewModel.hideDrawControl();
            viewModel.mode('view');
        };
    };

});