define('layerViewerViewModel', [
    'jquery',
    'knockout'
], function($, ko) {
    return function(viewModel, layer) {
        var self = this;
        self.type = ko.observable(viewModel.getType(layer.bdoMapObj.type));        
        self.mapObj = ko.observable(layer.bdoMapObj);
        self.typeName = ko.observable(layer.bdoMapObj.type);
        self.fields = ko.observableArray(layer.bdoMapObj.params);
        self.audit = ko.observable(layer.bdoMapObj.audit);

        self.getFieldTemplate = function (data) {
            var type = data.type;
            if(data.internalType) {
                type = data.internalType;
            }
            if(data.name === 'authRequired' && type === 'checkbox')
                return "";
            if(type === 'screenshot')
                return "screenshotFieldTmpl";
            if(type === 'checkbox')
                return "checkboxFieldTmpl";
            if(type === 'link')
                return "linkFieldTmpl";
            if(type === 'textarea')
                return "textareaFieldTmpl";

            return "defaultFieldTmpl";
        };

        self.popupFields = ko.computed(function () {
            return ko.utils.arrayFilter(self.fields(), function(item) {
                return item.showInPopup;
            });
        });

        self.shareUrl = ko.computed(function () {
            return location.origin + location.pathname + '?id=' + self.mapObj().id;
        });

        self.shareLayer = function(){
            window.prompt("Der Link zum Teilen:", location.origin + location.pathname + '?id=' + self.mapObj().id);
        };
    };
});