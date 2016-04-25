define('registerViewModel', [
    'jquery',
    'knockout'
], function($, ko) {

    return function (viewModel) {
        var self = this;

        self.mode = ko.observable("check");
        self.messages = ko.observableArray([]);

        self.ts3id = ko.observable();
        self.token = ko.observable();
        self.name = ko.observable();
        self.password = ko.observable();
        self.passwordconfirm = ko.observable();

        self.check = function () {
            self.messages([]);
            $.ajax({
                url: "/auth/checkid",
                type: "GET",
                cache: false,
                data: {"id": self.ts3id()}
            }).done(function (data) {
                console.log(data);
                if (data.status === "ok") {
                    self.mode('sendToken');
                    return;
                }
                switch (data.status) {
                    case 'TooManyTokenRequests':
                        self.messages.push("Zu viele Anfragen, versuche es später wieder.");
                        break;
                    case 'ClientIsBanned':
                        self.messages.push("Banned.");
                        break;
                    case 'DidNotPassRequirements':
                        self.messages.push("Nur für Mitglieder von SC oder SL.");
                        break;
                    case 'ClientNotFound':
                        self.messages.push("Kein Client unter dieser ID gefunden.");
                        break;
                    case 'MissingParameter':
                        self.messages.push("Bitte deine ID eingeben.");
                        break;
                }
            });
        };
        self.sendToken = function () {
            self.messages([]);
            $.ajax({
                url: "/auth/validate",
                type: "GET",
                cache: false,
                data: {"id": self.ts3id()}
            }).done(function (data) {
                console.log(data);
                if (data.status === "TokenIsSent") {
                    self.mode('validate');
                    return;
                }
                switch (data.status) {
                    case 'TooManyTokenRequests':
                        self.messages.push("Zu viele Anfragen, versuche es später wieder.");
                        break;
                    case 'ClientIsBanned':
                        self.messages.push("Banned.");
                        break;
                    case 'ClientNotFound':
                        self.messages.push("Kein Client unter dieser ID gefunden.");
                        break;
                    case 'NotYetChecked':
                        self.messages.push("Deine ID muss erst überprüft werden.");
                        break;
                }
            });
        };
        self.validate = function () {
            self.messages([]);
            $.ajax({
                url: "/auth/validate",
                type: "GET",
                cache: false,
                data: {"id": self.ts3id(), "token": self.token()}
            }).done(function (data) {
                console.log(data);
                if (data.status === "ok") {
                    self.mode('register');
                    return;
                }
                switch (data.status) {
                    case 'TooManyTokenRequests':
                        self.messages.push("Zu viele Anfragen, versuche es später wieder.");
                        break;
                    case 'ClientIsBanned':
                        self.messages.push("Banned.");
                        break;
                    case 'ClientNotFound':
                        self.messages.push("Kein Client unter dieser ID gefunden.");
                        break;
                    case 'MissingParameter':
                        self.messages.push("Bitte den Token eingeben.");
                        break;
                    case 'WrongToken':
                        self.messages.push("Keine Übereinstimmung.");
                        break;
                    case 'NotYetChecked':
                        self.messages.push("Deine ID muss erst überprüft werden.");
                        break;
                }
            });
        };
        self.register = function () {
            self.messages([]);
            $.ajax({
                url: "/auth/register",
                type: "POST",
                cache: false,
                data: {"name": self.name(), "password": self.password(), "passwordconfirm": self.passwordconfirm()}
            }).done(function (data) {
                console.log(data);
                for (var i = 0; i < data.length; i++) {
                    switch (data[i]) {
                        case 'NoName':
                            self.messages.push("Bitte einen Namen angeben.");
                            break;
                        case 'NoPassword':
                            self.messages.push("Bitte ein Passwort angeben.");
                            break;
                        case 'NoPasswordConfirm':
                            self.messages.push("Bitte das Passwort wiederholen.");
                            break;
                        case 'InvalidConfirmation':
                            self.messages.push("Die Wiederholung stimmt nicht mit dem Passwort überein.");
                            break;
                        case 'NameInUse':
                            self.messages.push("Der angegebene Name wird bereits verwendet.");
                            break;
                        case 'ValidateFirst':
                            self.messages.push("Validiere dich zunächst.");
                            break;
                        case 'ok':
                            self.mode('done');
                            break;
                    }
                }
            });
        };
        self.cancel = function () {
            viewModel.mode('view');
        };
    };
});