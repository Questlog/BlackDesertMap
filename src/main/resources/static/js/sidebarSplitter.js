var min = 180;
var max = 3600;
var mainmin = 200;
$( document ).ready( function() {
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
});