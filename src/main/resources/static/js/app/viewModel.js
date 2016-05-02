define('viewModel', [
    'jquery',
    'knockout',
    'leaflet',
    'bdomap',
    'helperFunctions',
    'loginViewModel',
    'registerViewModel',
    'createViewModel',
    'editViewModel',
    'layerViewerViewModel'
], function($, ko, L, bdomap, helper, LoginForm, RegisterForm, CreateViewModel, EditViewModel, LayerViewer) {

    var viewModel = function() {
        var self = this;

        self.mode               = ko.observable('view');
        self.authenticated      = ko.observable(false);

        self.types              = ko.observableArray([]);
        self.typeDict           = ko.observable();
        self.groups             = ko.observableArray([]);

        self.selectedLayer      = ko.observable();

        self.createdLayer       = ko.observable();
        self.drawControlVisible = ko.observable(false);

        self.loginForm          = ko.observable();
        self.registerForm       = ko.observable();
        self.createViewModel    = ko.observable();
        self.editViewModel      = ko.observable();
        self.layerViewer        = ko.observable();
        
        self.popupViewer        = ko.observable();
        self.pupup = null;

        self.login = function(){
            self.loginForm(new LoginForm(function(authOk){
                self.authenticated(authOk);
                if(authOk)
                    location.reload();
                self.mode('view');
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
            self.layerViewer(new LayerViewer(self, layer));
        };

        self.clearSelection = function(){
            self.selectedLayer(null);
            self.layerViewer(null);
        };

        self.hoverLayer = function(layer){
            //self.layerViewer(new LayerViewer(self, layer));
            self.showPopup(layer);
        };

        self.stopHoverLayer = function(){
            //if(self.selectedLayer())
            //    self.layerViewer(new LayerViewer(self, self.selectedLayer()));
            self.hidePopup();
        };

        self.showPopup = function(layer){
            self.popupViewer();
            self.popupViewer(new LayerViewer(self, layer));

            if(self.popupViewer().popupFields().length > 0) {
                var latLng = [];
                if (layer.constructor == L.Marker) {
                    latLng = layer.getLatLng();
                } else {
                    latLng = layer.getLatLngs()[0];
                }

                if(!self.popup){
                    self.popup = L.popup({
                        offset: [0, -23],
                        minWidth: 150,
                        maxHeight: 400,
                        closeButton: false,
                        autoPan: false
                    });
                }
                self.popup.setLatLng(latLng)
                    .setContent($("#popupContent").html())
                    .openOn(bdomap.map);
            } else {
                self.hidePopup();
            }
        };

        self.hidePopup = function(){
            if(self.popup){
                bdomap.map.closePopup(self.popup);
                self.popupViewer();
            }
        };


        self.changeToCreate = function(){
            self.createViewModel(new CreateViewModel(self));
            self.showDrawControl();
            self.createdLayer(null);
            self.mode('create');
        };

        //Editing
        self.editLayer = function(){
            self.createdLayer(null);
            self.editViewModel(new EditViewModel(self, self.selectedLayer()));
            self.mode('edit');
            self.editViewModel().enable();
        };


        bdomap.map.on('click', function (e) {
            self.clearSelection();
        });

        bdomap.map.on('draw:created', function (e) {
            if(self.createdLayer()){
                helper.removeLayer(self.createdLayer());
                self.createdLayer(null);
            }
            var layer = e.layer;
            self.createdLayer(layer);
            //self.hideDrawControl();
            bdomap.drawnItems.addLayer(layer);
            layer.editing.enable();
        });

        bdomap.map.on('zoomend', function() {
            $("#mapcontainer").removeClass (function (index, css) {
                return (css.match (/(^|\s)zoom\S+/g) || []).join(' ');
            }).addClass("zoom" + bdomap.map.getZoom());
        });
    };

    return new viewModel();
});



