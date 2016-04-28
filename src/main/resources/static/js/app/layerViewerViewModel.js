define('layerViewerViewModel', [
    'jquery',
    'knockout'
], function($, ko) {
    return function(viewModel, layer) {
        var self = this;
        self.type = ko.observable(viewModel.getType(layer.bdoMapObj.type));        
        self.maoObj = ko.observable(layer.bdoMapObj);
        self.typeName = ko.observable(layer.bdoMapObj.type);
        self.fields = ko.observableArray(layer.bdoMapObj.params);

        self.getFieldTemplate = function (data) {
            var type = data.type;
            if(data.internalType) {
                type = data.internalType;
            }
            console.log(data);
            if(data.name === 'authRequired' && type === 'checkbox')
                return "";
            if(type === 'screenshot')
                return "screenshotFieldTmpl";
            if(type === 'checkbox')
                return "checkboxFieldTmpl";
            return "defaultFieldTmpl";
        };
    };
});