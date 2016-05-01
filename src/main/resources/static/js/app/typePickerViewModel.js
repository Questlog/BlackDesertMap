/**
 * Created by Benni on 01.05.2016.
 */
define('typePickerViewModel', [
    'jquery',
    'knockout'
], function ($, ko) {
    return function(onChange, selectedTypeName){
        var self = this;
        self.selectedTypeName = ko.observable(selectedTypeName);
        self.selectedOptions = ko.observableArray([selectedTypeName]);

        self.onChangeType = function (event) {
            var option = event.target.selectedOptions[0];
            var type = ko.dataFor(option);
            var typeName = type.name;
            self.selectedTypeName(typeName);
            self.selectedOptions([typeName]);
            if(onChange)
                onChange(typeName);            
        };
    }
});