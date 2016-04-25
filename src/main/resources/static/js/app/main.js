/**
 * Created by Benni on 23.04.2016.
 */
require.config({
    shim : {
        "bootstrap" :       { "deps" :['jquery'] },
        "leaflet" :         { "deps" :['jquery'] },
        "leafletDraw" :     { "deps" :['leaflet'] },
        "bootstrapSelect" : { "deps" :['bootstrap'] }
    },
    baseUrl: '../js',
    paths: {
        jquery: [
            '//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min',
            'lib/jquery-2.2.2.min.js'
        ],
        domReady: [
            '//cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady'
        ],
        knockout: [
            'lib/knockout-debug.js'
        ],
        leaflet: [
            'lib/leaflet'
        ],
        leafletDraw: [
            'lib/leaflet.draw'
        ],
        bootstrap: [
            'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
            'lib/bootstrap.min',
            'lib/bootstrap'
        ],
        bootstrapSelect: [
            'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
            'lib/bootstrap.min',
            'lib/bootstrap'
        ]
    }
});



<script src="js/bootstrap.min.js"></script>
    <script src="js/leaflet.js"></script>
    <script src="js/leaflet.draw.js"></script>
    <script src="js/viewmodel.js"></script>
    <script src="js/bdomap.js"></script>
    <script src="js/bootstrap-select.js"></script>
    <script src="js/sidebarSplitter.js"></script>

require([
    'jquery',
    'knockout',
    'app/viewmodel',
    'domReady!'
], function($, ko, viewModel, dom) {

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