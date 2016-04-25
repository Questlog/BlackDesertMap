/**
 * Created by Benni on 25.03.2016.
 */

var viewModel;
var types;
var groups;
var layerGroups = {};


var FormField = function (data) {
    var self            =   this;
    self.name           =   ko.observable(data.name).extend({required:true});
    self.element        =   ko.observable(data.element);                        // Can be: input, textarea, button, select
    self.type           =   ko.observable(data.type);                           // Can be: text, radio, checkbox, hidden, password, submit
    self.label          =   ko.observable(data.label);
    self.options        =   ko.observableArray(data.options);                   // Array: Used by select, radio, checkbox
    self.placeholder    =   ko.observable(data.placeholder);
    self.value          =   ko.observable(data.value);
    self.internalType   =   ko.observable(data.internalType);
    self.required       =   ko.observable(data.required);
};

var LoginForm = function(){
    var self = this;
    self.name   = ko.observable();
    self.password = ko.observable();
    self.message = ko.observable();

    self.cancel = function(){
        viewModel.mode('view');
    };
    self.login = function(){
        self.message("");
        $.ajax({
            url: "/auth/login",
            type: "POST",
            cache: false,
            data: {"name" : self.name(), "password": self.password()}
        }).done(function( data ) {
            if(data.status === "ok"){
                viewModel.authenticated(true);
                viewModel.mode('view');
                location.reload();
                return;
            }
            switch (data.status) {
                case 'userNotFound': self.message("Name oder Passwort ist inkorrekt."); break;
            }
        });
    };
};

var RegisterForm = function(){
    var self = this;

    self.mode = ko.observable("check");
    self.messages = ko.observableArray([]);
    
    self.ts3id = ko.observable();
    self.token = ko.observable();
    self.name = ko.observable();
    self.password = ko.observable();
    self.passwordconfirm = ko.observable();
    
    self.check = function(){
        self.messages([]);
        $.ajax({
            url: "/auth/checkid",
            type: "GET",
            cache: false,
            data: {"id" : self.ts3id()}
        }).done(function( data ) {
            console.log(data);
            if(data.status === "ok"){
                self.mode('sendToken');
                return;
            }
            switch (data.status) {
                case 'TooManyTokenRequests':    self.messages.push("Zu viele Anfragen, versuche es später wieder."); break;
                case 'ClientIsBanned':          self.messages.push("Banned."); break;
                case 'DidNotPassRequirements':  self.messages.push("Nur für Mitglieder von SC oder SL."); break;
                case 'ClientNotFound':          self.messages.push("Kein Client unter dieser ID gefunden."); break;
                case 'MissingParameter':        self.messages.push("Bitte deine ID eingeben."); break;
            }
        });
    };
    self.sendToken = function(){
        self.messages([]);
        $.ajax({
            url: "/auth/validate",
            type: "GET",
            cache: false,
            data: {"id" : self.ts3id()}
        }).done(function( data ) {
            console.log(data);
            if(data.status === "TokenIsSent"){
                self.mode('validate');
                return;
            }
            switch (data.status) {
                case 'TooManyTokenRequests':    self.messages.push("Zu viele Anfragen, versuche es später wieder."); break;
                case 'ClientIsBanned':          self.messages.push("Banned."); break;
                case 'ClientNotFound':          self.messages.push("Kein Client unter dieser ID gefunden."); break;
                case 'NotYetChecked':           self.messages.push("Deine ID muss erst überprüft werden."); break;
            }
        });
    };
    self.validate = function(){
        self.messages([]);
        $.ajax({
            url: "/auth/validate",
            type: "GET",
            cache: false,
            data: {"id" : self.ts3id(), "token": self.token()}
        }).done(function( data ) {
            console.log(data);
            if(data.status === "ok"){
                self.mode('register');
                return;
            }
            switch (data.status) {
                case 'TooManyTokenRequests':    self.messages.push("Zu viele Anfragen, versuche es später wieder."); break;
                case 'ClientIsBanned':          self.messages.push("Banned."); break;
                case 'ClientNotFound':          self.messages.push("Kein Client unter dieser ID gefunden."); break;
                case 'MissingParameter':        self.messages.push("Bitte den Token eingeben."); break;
                case 'WrongToken':              self.messages.push("Keine Übereinstimmung."); break;
                case 'NotYetChecked':           self.messages.push("Deine ID muss erst überprüft werden."); break;
            }
        });
    };
    self.register = function(){
        self.messages([]);
        $.ajax({
            url: "/auth/register",
            type: "POST",
            cache: false,
            data: {"name" : self.name(), "password": self.password(), "passwordconfirm": self.passwordconfirm()}
        }).done(function( data ) {
            console.log(data);
            for (var i = 0; i < data.length; i++) {
                switch (data[i]) {
                    case 'NoName':             self.messages.push("Bitte einen Namen angeben."); break;
                    case 'NoPassword':         self.messages.push("Bitte ein Passwort angeben."); break;
                    case 'NoPasswordConfirm':  self.messages.push("Bitte das Passwort wiederholen."); break;
                    case 'InvalidConfirmation':self.messages.push("Die Wiederholung stimmt nicht mit dem Passwort überein."); break;
                    case 'NameInUse':          self.messages.push("Der angegebene Name wird bereits verwendet."); break;
                    case 'ValidateFirst':      self.messages.push("Validiere dich zunächst."); break;
                    case 'ok':
                        self.mode('done');
                        break;
                }
            }
        });
    };
    self.cancel = function(){
        viewModel.mode('view');
    };
};

var NewFormFieldViewModel = function(internalType, callback){
    var self = this;
    var formFieldData = {};

    formFieldData.internalType =  internalType.name;
    formFieldData.name = internalType.name;
    formFieldData.label = internalType.displayName;
    formFieldData.placeholder = internalType.displayName;

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


    console.log(formFieldData);

    self.type = ko.observable(internalType);
    self.formField = ko.observable(new FormField(formFieldData));
    
    self.save = function(){
        callback(self.formField());
    };
    self.cancel = function(){
        callback(null);
    };
};

var CreateViewModel = function(){
    var self = this;

    var defaultFormFields = [new FormField({
        "name" : "authRequired",
        "label" : "Benötigt login",
        "element" : "input",
        "type" : "checkbox",
        "value" : "",
        "placeholder": "",
        "options": ["authRequired"],
        "defaultValue": "",
        "required": 1
    })];

    self.internalTypes      = ko.observableArray([
        {"name" : "text", "displayName" : "Text"},
        {"name" : "checkbox", "displayName" : "Checkbox"},
        {"name" : "screenshot", "displayName" : "Screenshot"}
    ]);

    self.requiredFormFields = ko.observableArray();
    self.formFields         = ko.observableArray();
    self.newObjTypeName     = ko.observable();
    self.newFormField       = ko.observable(null);

    self.buildFormFields = function(type) {
        return ko.utils.arrayMap(type.dataFields, function(item) {
            return new FormField(item);
        });
    };
    self.changeNewObjType = function(data, event){
        self.requiredFormFields(self.buildFormFields(types[self.newObjTypeName()]));
    };
    
    self.addFormField = function(internalType){
        console.log(internalType);
        self.newFormField(new NewFormFieldViewModel(internalType, function(formField){
            if(formField != null){
                formField.name(formField.name() + self.formFields().length);
                self.formFields.push(formField);
            }
            self.newFormField(null);
        }));
    };

    self.removeFormField = function(formField){
        self.formFields.remove(formField);
    };

    self.cancel = function(){
        viewModel.mode("view");
    };

    self.save = function(){

    };
};

var BdoViewModel = function() {
    var self = this;

    self.mode               = ko.observable('view');
    self.authenticated      = ko.observable(false);
    
    self.types              = ko.observableArray();
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
    self.loginForm          = ko.observable(new LoginForm());
    self.registerForm       = ko.observable(new RegisterForm());
    self.createViewModel    = ko.observable(new CreateViewModel());

    self.login = function(){        
        self.mode('login');            
        self.loginForm(new LoginForm());
    };
    self.logout = function(){
        $.post("/auth/logout");
        self.authenticated(false);
    };
    self.register = function(){
        self.mode('register');
        self.registerForm(new RegisterForm());
    };


    self.toggleLayer = function(layerName){
        var layerGroup = layerGroups[layerName];
        if(bdomap.hasLayer(layerGroup)){
            bdomap.removeLayer(layerGroup);
        } else {
            bdomap.addLayer(layerGroup);
        }
        return true;
    };
    self.setLayerVisibility = function(layerName, visible){
        var layerGroup = layerGroups[layerName];
        var hasLayer = bdomap.hasLayer(layerGroup);

        if (hasLayer && !visible){
            bdomap.removeLayer(layerGroup);
        } else if (!hasLayer && visible) {
            bdomap.addLayer(layerGroup);
        }
    };

    self.showDrawControl = function(){
        if(!self.drawControlVisible()){
            bdomap.addControl(drawControl);
            self.drawControlVisible(true);
        }
    };
    self.hideDrawControl = function(){
        if(self.drawControlVisible()){
            bdomap.removeControl(drawControl);
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
    
    //Creating
    self.changeToCreate = function(){
        self.createFormViewModel(self.types()[0]);
        self.mode('create');
        self.showDrawControl();
        self.createdLayer(null);
        self.createFormViewModel(types[self.newObjTypeName()]);
    };
    self.changeToCreate2 = function(){
        self.createViewModel(new CreateViewModel());
        self.mode('create2');
        self.showDrawControl();
        self.createdLayer(null);
    };

    self.changeNewObjType = function(data, event){
        self.createFormViewModel(types[event.target.value]);
    };
    self.cancelCreate = function(){
        self.mode('view');
        self.hideDrawControl();
        if (self.createdLayer() != null)
            bdomap.removeLayer(self.createdLayer());
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

        saveLayerToDatabase(layer, type, function(data){
            drawnItems.removeLayer(layer);
            var mapObj = JSON.parse(data);
            addDatabaseObject(mapObj);
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
        reloadLayer(layer, function(layer){
            self.selectLayer(layer);
        });
        self.hideDrawControl();
    };
    self.saveEdit = function () {
        self.mode('view');

        var layer = self.editingLayer();
        removeLayer(layer);

        if(self.createdLayer()){
            var mapObj = layer.bdoMapObj;
            layer = self.createdLayer();
            layer.bdoMapObj = mapObj;
            removeLayer(layer);
        }

        var type = self.editingType();
        layer.editing.disable();
        self.clearSelection();
        self.hideDrawControl();
        saveLayerToDatabase(layer, type.name, function(){
            reloadLayer(layer, function(layer){
                self.selectLayer(layer);
            });
        });
    };
    self.deleteEdit = function () {
        var confirmed = confirm("Diese Markierung löschen?");
        if(!confirmed)
            return;
        if(self.createdLayer()){
            removeLayer(self.createdLayer());
        }

        var layer = self.editingLayer();
        var mapObj = self.editingMapObj();
        var type = self.editingType();
        removeLayer(layer);
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
            removeLayer(self.createdLayer());
        }
        self.createdLayer(null);
        self.showDrawControl();
        //removeLayer(self.editingLayer());
    }

};

function insertFormData(mapObj){
    var formData = ko.toJS(viewModel.formFields());
    if(!mapObj.params)
        mapObj.params = {};
    $.each(formData, function(i, formObj) {
        mapObj.params[formObj.name] = formObj.value;
    });
    mapObj.jsonParams = JSON.stringify(mapObj.params);
    mapObj.authRequired = mapObj.params["authRequired"];
}

function saveLayerToDatabase(layer, type, callback){
    var shape = layer.toGeoJSON();
    var geojson = JSON.stringify(shape);
    var mapObj;
    var isNew = false;

    if (!layer.bdoMapObj) {
        mapObj = {
            type: type.name
        };
        layer.bdoMapObj = mapObj;
        isNew = true;
    } else {
        mapObj = layer.bdoMapObj;
    }
    mapObj.geojson = geojson;

    insertFormData(mapObj);

    var method = "PUT";
    if(isNew)
        method = "POST";

    $.ajax({
        type: method,
        url: "/mapobj/" + type.name,
        contentType: "application/json",
        data: JSON.stringify(mapObj)
    }).done(callback);
}

function removeLayer(layer){

    if(drawnItems.hasLayer(layer)){
        drawnItems.removeLayer(layer);
    }
    if(bdomap.hasLayer(layer)){
        bdomap.removeLayer(layer);
    }

    var mapObj = layer.bdoMapObj;
    if(mapObj){
        var typename = mapObj.type;
        if(layerGroups[typename].hasLayer(layer)){
            layerGroups[typename].removeLayer(layer);
        }
    }

}

function reloadLayer(layer, callback){
    var mapObj = layer.bdoMapObj;
    var typename = mapObj.type;
    var id = mapObj.id;
    removeLayer(layer);

    $.getJSON("/mapobj/" + typename + "/" + id, function (data) {
        $.each( data, function( i, item ) {
            var layer = addDatabaseObject(item);
            if(callback)
                callback(layer);
        });
    });
}

function addDatabaseObject(mapObj){
    var geoJson = JSON.parse(mapObj.geojson);
    var typename = mapObj.type;

    //Add geojson to drawnItems to be editable
    var layer = L.GeoJSON.geometryToLayer(geoJson);
    layer.bdoMapObj = mapObj;

    if(mapObj.jsonParams)
        mapObj.params = JSON.parse(mapObj.jsonParams);

    if(layer.constructor == L.Marker) {
        if(typename in types){
            if(types[typename]["icon"] != ""){
                //TODO cache icons

                types[typename]["icon"]["className"] = "bdoMapIcon";

                var icon = L.icon(
                    types[typename]["icon"]
                );

                layer.setIcon(icon);
            }
        }
    } else {
        layer.setStyle(types[typename]["style"]);
    }

    applyBindingsToLayer(layer);
    drawnItems.addLayer(layer);
    layerGroups[typename].addLayer(layer);

    return layer;
}

function applyBindingsToLayer(layer) {
    // does this feature have a property named bdomapid?
    if (layer.bdoMapObj) {
        //layer.bindPopup(layer.bdoMapObj.type);
        layer.on('click', function(){
            viewModel.selectLayer(layer);
        });
    }
}

function setUpType(type){
    var lg = new L.layerGroup();
    layerGroups[type.name] = lg;
    bdomap.addLayer(lg);
    console.log("adding layer group " + type.name);
    viewModel.types.push(type);
}


function bindHandler(){

    $.each(groups, function(idx, group){
        /*
        $("#grp" + group.name).multiselect({
            includeSelectAllOption: true,
            buttonText: function(options, select) {
                return group.displayName;
            }, onChange: function(option, checked, select) {
                viewModel.toggleLayer(option[0].value);
            }
        });*/

        $("#g" + group.name)
            .selectpicker()
            .on('changed.bs.select', function (event, clickedIndex, newValue, oldValue) {
                if(clickedIndex){
                    viewModel.setLayerVisibility(event.target[clickedIndex].value, newValue);
                    console.log(event.target[clickedIndex].value + " " + newValue);
                } else {
                    for(var i = 0; i < event.target.length; i++){
                        var option = event.target[i];
                        viewModel.setLayerVisibility(option.value, option.selected);
                    }
                }
        });

    });


}

$( document ).ready( function() {

    ko.components.register('formField', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                return new FormField(params);
            }
        },
        template: { require: 'text!form-field-widget.html' }
    });


    viewModel = new BdoViewModel();
    ko.applyBindings(viewModel);


    $.ajax({
        url: "/types.json",
        cache: false
    }).done(function( data ) {
        types = data["types"];
        groups = data["groups"];
        $.each( types, function( i, type ) {
            setUpType(type);
        });
        $.each( data["groups"], function( i, group ) {
            viewModel.groups.push(group);
        });
    }).error(function(jqXHR, textStatus, errorThrown){
        alert("Error retrieving types: " + errorThrown);
    }).then(
        $.getJSON("/mapobj", function (data) {
            $.each( data, function( i, item ) {
                addDatabaseObject(item);
            });
        })
    ).then(
        bindHandler
    );

    $.get("/auth/loggedIn", function (data) {
        if(data == true){
            viewModel.authenticated(true);
        }
    });
});