define('editViewModel', [
    'jquery',
    'knockout',
    'formField',
    'helperFunctions',
    'formFieldsEditorViewModel'
], function($, ko, FormField, helper, FormFieldsEditor) {
    
    return function(viewModel, layer){
        var self = this;
        
        self.layer = ko.observable(layer);
        self.formFieldsEditor = ko.observable(new FormFieldsEditor(viewModel, layer.bdoMapObj));
        
        self.enable = function(){
            self.layer().editing.enable();
        };
        self.cancel = function(){
            var layer = self.layer();
            layer.editing.disable();
            viewModel.clearSelection();
            helper.reloadLayer(viewModel, layer, function(layer){
                viewModel.selectLayer(layer);
            });
            viewModel.hideDrawControl();
            viewModel.mode("view");
        };
        self.redraw = function(){
            if(viewModel.createdLayer()){
                helper.removeLayer(viewModel.createdLayer());
            }
            viewModel.createdLayer(null);
            viewModel.showDrawControl();
        };
        self.delete = function(){
            var confirmed = confirm("Diese Markierung löschen?");
            if(!confirmed)
                return;
            if(viewModel.createdLayer()){
                helper.removeLayer(viewModel.createdLayer());
            }

            var layer = self.layer();
            var mapObj = layer.bdoMapObj;
            var typeName = mapObj.type; //TODO rename bdoMapObj.type to typeName
            helper.removeLayer(layer);
            viewModel.clearSelection();
            viewModel.hideDrawControl();
            viewModel.mode("view");
            $.ajax({
                type: "DELETE",
                url: "/mapobj/" + typeName,
                contentType: "application/json",
                data: JSON.stringify(mapObj)
            });
        };

        self.save = function () {
            viewModel.mode('view');

            var layer = self.layer();
            helper.removeLayer(layer);

            if(viewModel.createdLayer()){
                var mapObj = layer.bdoMapObj;
                layer = viewModel.createdLayer();
                layer.bdoMapObj = mapObj;
                helper.removeLayer(layer);
            }

            layer.editing.disable();
            viewModel.clearSelection();
            viewModel.hideDrawControl();

            helper.updateGeoJsonOfLayer(layer);
            var formData = self.formFieldsEditor().getFormData();
            helper.insertFormData(layer.bdoMapObj, formData);
            
            helper.saveMapObjToDatabase(layer.bdoMapObj, false, function(){
                helper.reloadLayer(viewModel, layer, function(layer){
                    viewModel.selectLayer(layer);
                });
            });
        };
    }
    
});