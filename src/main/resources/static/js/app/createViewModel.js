define('createViewModel', [
    'jquery',
    'knockout',
    'newFormFieldViewModel',
    'formField',
    'helperFunctions',
    'formFieldsEditorViewModel',
    'typePickerViewModel'
], function($, ko, NewFormFieldViewModel, FormField, helper, FormFieldsEditor, TypePicker) {

    return function (viewModel) {
        var self = this;

        self.formFieldsEditor = ko.observable(new FormFieldsEditor(viewModel));
        self.typePicker = ko.observable(new TypePicker(self.formFieldsEditor().changeType, viewModel.types()[0].name));
        
        self.cancel = function () {
            viewModel.hideDrawControl();
            if(viewModel.createdLayer())
                helper.removeLayer(viewModel.createdLayer());
            viewModel.mode("view");
        };

        self.save = function () {
            var typeName = self.typePicker().selectedTypeName();
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
                var newLayer = helper.addDatabaseObject(viewModel, mapObj);
                viewModel.selectLayer(newLayer);
            });

            viewModel.createdLayer(null);
            viewModel.hideDrawControl();
            viewModel.mode('view');
        };
    };

});