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
    'editViewModel',
    'layerViewerViewModel'
], function($, ko, bdomap, helper, LoginForm, RegisterForm, CreateViewModel, EditViewModel, LayerViewer) {

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

        self.newObjTypeName     = ko.observable();
        self.createdLayer       = ko.observable();
        self.drawControlVisible = ko.observable(false);

        self.loginForm          = ko.observable();
        self.registerForm       = ko.observable();
        self.createViewModel    = ko.observable();
        self.editViewModel      = ko.observable();
        self.layerViewer        = ko.observable();

        self.fixDB              = function(){
            $.each(bdomap.drawnItems.getLayers(), function(i, item){
                console.log(item);
                var params = item.bdoMapObj.params;
                var newParams = [];

                for (var key in params) {
                    if (p.hasOwnProperty(key)) {
                        alert(key + " -> " + params[key]);
                        var name = key;
                        var value = params[key];
                        var dataObj = {};
                        
                        if(name == 'authRequired'){
                            dataObj = {
                                "name" : "authRequired",
                                "label" : "Benötigt login",
                                "element" : "input",
                                "type" : "checkbox",
                                "value" : "",
                                "placeholder": "",
                                "options": ["authRequired"],
                                "defaultValue": "",
                                "optional": false
                            }
                        } else if(name == 'description') {
                            dataObj = {
                                "name" : "description",
                                "label" : "Beschreibung",
                                "element" : "input",
                                "type" : "text",
                                "value" : "",
                                "placeholder": "",
                                "options": [],
                                "defaultValue": "",
                                "optional": true
                            }
                        } else if(name == 'hints') {
                            dataObj = {
                                "name" : "hints",
                                "label" : "Hinweise",
                                "element" : "input",
                                "type" : "text",
                                "value" : "",
                                "placeholder": "",
                                "options": [],
                                "defaultValue": "",
                                "optional": true
                            }
                        } else if(name == 'hints') {
                            dataObj = {
                                "name" : "image",
                                "label" : "Screenshot",
                                "element" : "input",
                                "type" : "text",
                                "value" : "",
                                "placeholder": "",
                                "options": [],
                                "defaultValue": "",
                                "optional": true,
                                "internalType": "screenshot"
                            }
                        }

                        dataObj.value = value;

                        newParams.add(dataObj);
                    }
                }

                item.bdoMapObj.params = newParams;
                helper.updateGeoJsonOfLayer(item);
                helper.saveMapObjToDatabase(item.bdoMapObj, false, function(){});
            });
        };

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

            self.layerViewer(new LayerViewer(self, layer));
        };
        self.clearSelection = function(){
            self.selectedMapObj(null);
            self.selectedLayer(null);
            self.selectedType(null);


            self.layerViewer(null);
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


        //Editing
        self.editLayer = function(){
            self.createdLayer(null);
            self.editViewModel(new EditViewModel(self, self.selectedLayer()));
            self.mode('edit');
            self.editViewModel().enable();
        };        

        bdomap.map.on('draw:created', function (e) {
            if(self.createdLayer()){
                helper.removeLayer(self.createdLayer());
                self.createdLayer(null);
            }
            var layer = e.layer;
            self.createdLayer(layer);
            //viewModel.hideDrawControl();
            bdomap.drawnItems.addLayer(layer);
            layer.editing.enable();
        });

        bdomap.map.on('zoomend', function(event) {
            $("#mapcontainer").removeClass (function (index, css) {
                return (css.match (/(^|\s)zoom\S+/g) || []).join(' ');
            }).addClass("zoom" + bdomap.map.getZoom());
        });

    };







    return new viewModel();
});



