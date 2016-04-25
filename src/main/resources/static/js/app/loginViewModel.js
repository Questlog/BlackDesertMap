
define('loginViewModel', [
    'jquery',
    'knockout'
], function($, ko) {
    return function(callback){
        var self = this;
        self.name   = ko.observable();
        self.password = ko.observable();
        self.message = ko.observable();
        self.authenticated = ko.observable(false);

        self.cancel = function(){
            //TODO callback now
            //viewModel.mode('view');
            callback(false);
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
                    self.authenticated(true);
                    //viewModel.mode('view');
                    callback(true);
                    return;
                }
                switch (data.status) {
                    case 'userNotFound': self.message("Name oder Passwort ist inkorrekt."); break;
                }
            });
        };
    };
});


