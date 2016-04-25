/**
 * Created by Benni on 24.04.2016.
 */
define('viewModel', [
    'jquery',
    'knockout',
    'bdomap',
    'helperFunctions',
    'loginViewModel',
    'registerViewModel',
    'createViewModel',
    'formField'
], function($, ko, bdomap, helper, LoginForm, RegisterForm, CreateViewModel, FormField) {

    var viewModel = function() {
        var self = this;

        self.mode               = ko.observable('view');
        self.authenticated      = ko.observable(false);

        self.types              = ko.observableArray([]);
        self.typeDict           = ko.observable();
        self.groups             = ko.observableArray([]);

        self.selectedLayer      = ko.observable();
        self.selectedMapObj     = ko.observable();
        self.selectedType       = ko.observable();

        self.editingLayer       = ko.observable();
        self.editingType        = ko.observable();
        self.editingMapObj      = ko.observable();

        self.newObjTypeName     = ko.observable();
        self.createdLayer       = ko.observable();
        self.drawControlVisible = ko.observable(false);

        self.formFields         = ko.observableArray();
        self.loginForm          = ko.observable();
        self.registerForm       = ko.observable();
        self.createViewModel    = ko.observable();

        self.login = function(){
            self.loginForm(new LoginForm(function(authOk){
                self.authenticated(true);
                location.reload(); //TODO make this not necessary
            }));
            self.mode('login');
        };
        self.logout = function(){
            $.post("/auth/logout");
            self.authenticated(false);
        };
        self.register = function(){
            self.registerForm(new RegisterForm(self));
            self.mode('register');
        };
        self.getType = function(typeName){
            return self.typeDict()[typeName];
        };

        self.toggleLayer = function(layerName){
            var layerGroup = bdomap.layerGroups[layerName];
            if(bdomap.map.hasLayer(layerGroup)){
                bdomap.map.removeLayer(layerGroup);
            } else {
                bdomap.map.addLayer(layerGroup);
            }
            return true;
        };
        self.setLayerVisibility = function(layerName, visible){
            var layerGroup = bdomap.layerGroups[layerName];
            var hasLayer = bdomap.map.hasLayer(layerGroup);

            if (hasLayer && !visible){
                bdomap.map.removeLayer(layerGroup);
            } else if (!hasLayer && visible) {
                bdomap.map.addLayer(layerGroup);
            }
        };

        self.showDrawControl = function(){
            if(!self.drawControlVisible()){
                bdomap.map.addControl(bdomap.drawControl);
                self.drawControlVisible(true);
            }
        };
        self.hideDrawControl = function(){
            if(self.drawControlVisible()){
                bdomap.map.removeControl(bdomap.drawControl);
                self.drawControlVisible(false);
            }
        };

        //Viewing
        self.selectLayer = function(layer){
            self.selectedLayer (layer);
            self.selectedType(types[layer.bdoMapObj.type]);
            self.selectedMapObj (layer.bdoMapObj);
        };
        self.clearSelection = function(){
            self.selectedMapObj(null);
            self.selectedLayer(null);
            self.selectedType(null);
        };



        self.createFormViewModel = function(type, mapObj){
            self.formFields(ko.utils.arrayMap(type.dataFields, function(item) {

                var formField = new FormField(item);
                if(mapObj != undefined){
                    if(item.name in mapObj.params){
                        formField.value(mapObj.params[item.name]);
                    }
                }

                return formField;
            }));
        };

        self.changeToCreate = function(){
            self.createViewModel(new CreateViewModel(self));
            self.showDrawControl();
            self.createdLayer(null);
            self.mode('create');
        };
        self.cancelCreate = function(){
            self.mode('view');
            self.hideDrawControl();
            if (self.createdLayer() != null)
                bdomap.map.removeLayer(self.createdLayer());
            self.createdLayer(null);
        };
        self.saveCreate = function(){
            var typeName = self.newObjTypeName();
            if (typeName == '' || typeName == null){
                alert('Vor dem Speichern muss ein Typ ausgewählt sein.');
                return;
            }
            var layer = self.createdLayer();
            if (layer == null){
                alert('Vor dem Speichern muss eine Markierung mit einem der Tools (linker Rand der Karte) erstellt werden.');
                return;
            }

            var type = types[typeName];

            helper.saveLayerToDatabase(self, layer, type, function(data){
                bdomap.drawnItems.removeLayer(layer);
                var mapObj = JSON.parse(data);
                helper.addDatabaseObject(self, mapObj);
            });

            self.createdLayer(null);
            self.mode('view');
            self.hideDrawControl();
        };


        //Editing
        self.editLayer = function(){
            self.createdLayer(null);
            var targetLayer = self.selectedLayer();
            var mapObj = self.selectedMapObj();
            var type = self.selectedType();
            self.editingLayer(targetLayer);
            self.editingMapObj(mapObj);
            self.editingType(type);
            self.mode('edit');

            self.createFormViewModel(type, mapObj);
            targetLayer.editing.enable();
        };
        self.cancelEdit = function(){
            self.mode('view');
            var layer = self.editingLayer();
            layer.editing.disable();
            self.clearSelection();
            helper.reloadLayer(layer, function(layer){
                self.selectLayer(layer);
            });
            self.hideDrawControl();
        };
        self.saveEdit = function () {
            self.mode('view');

            var layer = self.editingLayer();
            self.removeLayer(layer);

            if(self.createdLayer()){
                var mapObj = layer.bdoMapObj;
                layer = self.createdLayer();
                layer.bdoMapObj = mapObj;
                self.removeLayer(layer);
            }

            var type = self.editingType();
            layer.editing.disable();
            self.clearSelection();
            self.hideDrawControl();            
            helper.saveLayerToDatabase(layer, type.name, function(){
                self.reloadLayer(layer, function(layer){
                    self.selectLayer(layer);
                });
            });
        };
        self.deleteEdit = function () {
            var confirmed = confirm("Diese Markierung löschen?");
            if(!confirmed)
                return;
            if(self.createdLayer()){
                self.removeLayer(self.createdLayer());
            }

            var layer = self.editingLayer();
            var mapObj = self.editingMapObj();
            var type = self.editingType();
            helper.removeLayer(layer);
            self.clearSelection();
            self.hideDrawControl();
            self.mode("view");
            $.ajax({
                type: "DELETE",
                url: "/mapobj/" + type.name,
                contentType: "application/json",
                data: JSON.stringify(mapObj)
            });
        };
        self.redrawEdit = function(){
            if(self.createdLayer()){
                self.removeLayer(self.createdLayer());
            }
            self.createdLayer(null);
            self.showDrawControl();
            //removeLayer(self.editingLayer());
        }

    };

    return new viewModel();
});



