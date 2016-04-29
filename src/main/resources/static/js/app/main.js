/**
 * Created by Benni on 23.04.2016.
 */
require.config({
    shim : {
        "leaflet" :               { "deps" :['jquery'] },

        "leaflet-draw" :          { "deps" :['leaflet'] },
        "leaflet-hash" :          { "deps" :['leaflet'] },
        "leaflet-locationShare" : { "deps" :['leaflet'] },

        "bootstrapSelect" :       { "deps" :['bootstrap'] }
    },
    baseUrl: '../js/app',
    paths: {
        jquery: [
            '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
            '../lib/jquery-2.2.2.min'
        ],
        "jquery-ui": [
            '../lib/jquery-ui.min',
            '../lib/jquery-ui'
        ],
        domReady: [
            '//cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady'
        ],
        knockout: [
            '//cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min',
            '../lib/knockout-debug'
        ],
        leaflet: [
            '//cdn.leafletjs.com/leaflet/v0.7.7/leaflet',
            '../lib/leaflet'
        ],
        "leaflet-draw": [
            '../lib/leaflet.draw'
        ],
        "leaflet-hash": [
            '../lib/leaflet-hash'
        ],
        "leaflet-locationShare": [
            '../lib/Leaflet.LocationShare'
        ],
        bootstrap: [
            '//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
            '../lib/bootstrap.min',
            '../lib/bootstrap'
        ],
        bootstrapSelect: [
            '../lib/bootstrap-select'
        ]
    }
});

require([
    'jquery',
    'jquery-ui',
    'knockout',
    'viewModel',
    'domReady!',
    'helperFunctions'
], function($, ui, ko, viewModel, dom, helper) {

    if(window.location.port === "4567"){
        alert("Die Adresse worfox.net:4567 ist alt, du wirst jetzt auf bdomap.worfox.net weitergeleitet.");
        window.location = "http://bdomap.worfox.net";
    }
        


    ko.bindingHandlers.sortableList = {
        init: function(element, valueAccessor) {
            var list = valueAccessor();
            $(element).sortable({
                update: function(event, ui) {
                    //retrieve our actual data item
                    console.log(ui.item);
                    var item = ko.dataFor(ui.item[0]);
                    //figure out its new position
                    var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    console.log(item);
                    //remove the item and add it back in the right spot
                    if (position >= 0) {
                        list.remove(item);
                        list.splice(position, 0, item);
                    }
                    ui.item.remove();
                }
            });
        }
    };

    ko.bindingHandlers.selectpicker = {
        init: function(element, valueAccessor) {
            var data = valueAccessor();
            var onChange = data.onChange;
            $(element).selectpicker().on('changed.bs.select', onChange);
        }
    };


    ko.applyBindings(viewModel);


    $.ajax({
        url: "/types.json",
        cache: false
    }).done(function( data ) {
        types = data["types"];
        viewModel.typeDict(types);
        groups = data["groups"];
        $.each( types, function( i, type ) {
            helper.setUpType(viewModel, type);
        });
        $.each( data["groups"], function( i, group ) {
            viewModel.groups.push(group);
        });
    }).error(function(jqXHR, textStatus, errorThrown){
        alert("Error retrieving types: " + errorThrown);
    }).then(
        $.getJSON("/mapobj", function (data) {
            $.each( data, function( i, item ) {
                helper.addDatabaseObject(viewModel, item);
            });
        })
    ).then(
        function() {
            helper.bindHandlers(viewModel);
        }
    );

    $.get("/auth/loggedIn", function (data) {
        if(data == true){
            viewModel.authenticated(true);
        }
    });

    
});