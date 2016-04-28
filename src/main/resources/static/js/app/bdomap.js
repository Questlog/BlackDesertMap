/**
 * Created by Benni on 20.03.2016.
 */
define('bdomap', [
    'jquery',
    'leaflet',
    'leafletDraw',    
    'domReady!'
], function($, L, leafletDraw, domReady) {

    var bdomap;
    var drawnItems;
    var drawControl;
    
    var editControl;
    var editFeatureGroup = new L.FeatureGroup();
    var layerGroups = {};

    // Map Projections to pixels
    L.Projection.NoWrap = {
        project: function (latlng) {
            return new L.Point(latlng.lng, latlng.lat);
        },

        unproject: function (point) {
            return new L.LatLng(point.y, point.x, true);
        }
    };

    L.CRS.Direct = L.Util.extend({}, L.CRS, {
        code: 'Direct',

        projection: L.Projection.NoWrap,
        transformation: new L.Transformation(1/256, 0, 1/256, 0)
    });

    bdomap = L.map('mapid', {
        zoom: 5,
        center : [29.625, 27.59375],
        crs : L.CRS.Direct,
        continuousWorld : false,
        nowrap: true
//                maxBounds : new L.LatLngBounds(
//                        new L.LatLng(87, 0),
//                        new L.LatLng(0, 87)
//                )
    });


    // $.each(layerGroups, function(e){
    //     bdomap.addLayer(layerGroups[e]);
    // });

    // var overlayMaps = {
    //     "Schatztruhen": layerGroups["treasureChest"]
    // };
    //L.control.layers(null, overlayMaps).addTo(bdomap);


    //Setting the bounds
    // var southWest = bdomap.unproject([256, 256*10], 5);
    // var northEast = bdomap.unproject([256*5, 256], 5);
    //bdomap.setMaxBounds(new L.LatLngBounds(southWest, northEast));


    //The BDO map tiles
    L.tileLayer('http://fusion.worfox.net/bdotiles/{z}/{x}_{y}.jpg', {
        attribution: false,
        continuousWorld : true,
        maxZoom: 9,
        minZoom: 5
    }).addTo(bdomap);


    //Displaying the tile numbers
    var canvasTiles = L.tileLayer.canvas({
        minZoom: 5,
        maxZoom: 9,
        attribution: 'Map data &copy; FooBar',
        continuousWorld: true,
        tms: true
    });

    canvasTiles.drawTile = function(canvas, point, zoom) {
        var context = canvas.getContext('2d');

        context.beginPath();
        context.rect(0, 0, 256, 256);
        context.lineWidth = 2;
        context.strokeStyle = 'white';
        context.stroke();

        context.font="20px Arial";
        context.fillStyle = 'white';
        context.fillText(point.x + " / " + point.y + " / " + zoom, 80, 140);
    };
    //canvasTiles.addTo(bdomap);

    // var popup = L.popup();
    //
    // function onMapClick(e) {
    //     popup.setLatLng(e.latlng)
    //         .setContent("You clicked the map at " + bdomap.project(e.latlng).toString() + " " + e.latlng.toString())
    //         .openOn(bdomap);
    // }
    //
    // bdomap.on('click', onMapClick);


    // Drawstuff
    drawnItems = new L.FeatureGroup();
    bdomap.addLayer(drawnItems);

// Initialise the draw control and pass it the FeatureGroup of editable layers
    drawControl = new L.Control.Draw({
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#f357a1',
                    weight: 10
                }
            },
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#bada55'
                }
            },
            circle: false, // Because they are not supported by geoJSON
            rectangle: {
                shapeOptions: {
                    clickable: false
                }
            }
        }
    });
    editControl = new L.Control.Draw({
        draw: {
            polyline: false,
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false
        },
        edit: {
            featureGroup: editFeatureGroup,//drawnItems
            remove: false
        }
    });
    //bdomap.addControl(new L.Control.Draw(editControl(drawnItems)));
    //bdomap.addControl(drawControl);

    
    
    return {
        map: bdomap,
        drawnItems: drawnItems,
        drawControl: drawControl,
        layerGroups: layerGroups
    }
});


