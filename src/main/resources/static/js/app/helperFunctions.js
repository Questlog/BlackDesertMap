/**
 * Created by Benni on 24.04.2016.
 */
define('helperFunctions', [
    'jquery',
    'bdomap',
    'knockout',
    'leaflet',
    'bootstrapSelect'
], function($, bdomap, ko, L) {

    function updateGeoJsonOfLayer(layer){
        var shape = layer.toGeoJSON();
        var geojson = shape;
        var mapObj = layer.bdoMapObj;
        mapObj.geojson = geojson;
    }

    function createMapObjectFromLayer(layer, typeName){
        var mapObj;

        if (!layer.bdoMapObj) {
            mapObj = {
                type: typeName
            };
            layer.bdoMapObj = mapObj;
        } else {
            mapObj = layer.bdoMapObj;
        }

        updateGeoJsonOfLayer(layer);
        
        return mapObj;
    }


    function insertFormData(mapObj, formData) {
        mapObj.params = formData;

        $.each(formData, function (i, formObj) {
            if(formObj.name === "authRequired")
                mapObj.authRequired = formObj.value;
        });
    }
    function saveMapObjToDatabase(mapObj, isNew, callback) {        

        var method = "PUT";
        if (isNew)
            method = "POST";

        $.ajax({
            type: method,
            url: "/mapobj/" + mapObj.type,
            contentType: "application/json",
            data: JSON.stringify(mapObj)
        }).done(callback);
    }

    function removeLayer(layer) {

        if (bdomap.drawnItems.hasLayer(layer)) {
            bdomap.drawnItems.removeLayer(layer);
        }
        if (bdomap.map.hasLayer(layer)) {
            bdomap.map.removeLayer(layer);
        }

        var mapObj = layer.bdoMapObj;
        if (mapObj) {
            var typename = mapObj.type;
            if (bdomap.layerGroups[typename].hasLayer(layer)) {
                bdomap.layerGroups[typename].removeLayer(layer);
            }
        }

    }

    function reloadLayer(viewModel, layer, callback) {
        var mapObj = layer.bdoMapObj;
        var typename = mapObj.type;
        var id = mapObj.id;
        removeLayer(layer);

        $.getJSON("/mapobj/" + typename + "/" + id, function (data) {
            $.each(data, function (i, item) {
                var layer = addDatabaseObject(viewModel, item);
                if (callback)
                    callback(layer);
            });
        });
    }

    function addDatabaseObject(viewModel, mapObj) {
        var geoJson = mapObj.geojson;
        var typename = mapObj.type;

        //Add geojson to drawnItems to be editable
        var layer = L.GeoJSON.geometryToLayer(geoJson);
        layer.bdoMapObj = mapObj;

        if (mapObj.jsonParams)
            mapObj.params = JSON.parse(mapObj.jsonParams);

        if (layer.constructor == L.Marker) {
            if (typename in types) {
                if (types[typename]["icon"] != "") {
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

        applyBindingsToLayer(viewModel, layer);
        bdomap.drawnItems.addLayer(layer);
        bdomap.layerGroups[typename].addLayer(layer);

        return layer;
    }

    function applyBindingsToLayer(viewModel, layer) {
        // does this feature have a property named bdomapid?
        if (layer.bdoMapObj) {
            //layer.bindPopup(layer.bdoMapObj.type);
            layer.on('click', function () {
                viewModel.selectLayer(layer);
                console.log(layer);
            });
        }
    }

    function setUpType(viewModel, type) {
        var lg = new L.layerGroup();
        bdomap.layerGroups[type.name] = lg;
        bdomap.map.addLayer(lg);
        viewModel.types.push(type);
    }

    function bindHandlers(viewModel) {
        var min = 180;
        var max = 3600;
        var mainmin = 200;
        $('#split-bar').mousedown(function (e) {
            e.preventDefault();
            $(document).mousemove(function (e) {
                e.preventDefault();
                var x = e.pageX - $('#leftsidebar').offset().left;
                if (x > min && x < max && e.pageX < ($(window).width() - mainmin)) {
                    $('#leftsidebar').css("width", x);
                    //$('#main').css("margin-left", x);
                    $('.leaflet-left').css("left", x);
                }
            })
        });
        $(document).mouseup(function (e) {
            $(document).unbind('mousemove');
        });

        $.each(viewModel.groups(), function(idx, group){

            $("#g" + group.name)
                .selectpicker()
                .on('changed.bs.select', function (event, clickedIndex, newValue, oldValue) {
                    if(clickedIndex){
                        viewModel.setLayerVisibility(event.target[clickedIndex].value, newValue);
                    } else {
                        for(var i = 0; i < event.target.length; i++){
                            var option = event.target[i];
                            viewModel.setLayerVisibility(option.value, option.selected);
                        }
                    }
                });

        });
    }


    return {
        createMapObjectFromLayer: createMapObjectFromLayer,
        updateGeoJsonOfLayer: updateGeoJsonOfLayer,
        insertFormData: insertFormData,
        saveMapObjToDatabase: saveMapObjToDatabase,
        removeLayer: removeLayer,
        reloadLayer: reloadLayer,
        addDatabaseObject: addDatabaseObject,
        applyBindingsToLayer: applyBindingsToLayer,
        setUpType: setUpType,
        bindHandlers: bindHandlers
    };
});