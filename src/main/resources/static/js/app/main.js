/**
 * Created by Benni on 23.04.2016.
 */
require.config({
    shim : {
        //"bootstrap" :       { "deps" :['jquery'] },
        "leaflet" :         { "deps" :['jquery'] },
        "leafletDraw" :     { "deps" :['leaflet'] },
        "bootstrapSelect" : { "deps" :['bootstrap'] }
    },
    baseUrl: '../js/app',
    paths: {
        jquery: [
            '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
            '../lib/jquery-2.2.2.min'
        ],
        domReady: [
            '//cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady'
        ],
        knockout: [
            '../lib/knockout-debug'
        ],
        leaflet: [
            '../lib/leaflet'
        ],
        leafletDraw: [
            '../lib/leaflet.draw'
        ],
        bootstrap: [
            'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
            '../lib/bootstrap.min',
            '../lib/bootstrap'
        ],
        bootstrapSelect: [
            '../lib/bootstrap-select'
        ],
        text: [
            '../lib/text'
        ]
    }
});

require([
    'jquery',
    'knockout',
    'viewModel',
    'domReady!',
    'helperFunctions'
], function($, ko, viewModel, dom, helper) {

    ko.components.register('form-field', {
        viewModel: { require: 'formField' },
        template: { require: 'text!widgets/form-field-widget.html' }
    });

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