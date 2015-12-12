var application         = require("application");
var applicationSettings = require("application-settings");

application.mainModule = "main-page";
application.cssFile = "./app.css";

if (application.android) {
    application.android.on(application.AndroidApplication.activityCreatedEvent, function (args) {
        if (args.activity.getIntent) {
            var intent = args.activity.getIntent();
            var url = intent.getData();
            if (url) {
                // Using application setting to send data to main-page... (surely overkill but haven’t found a better way yet...)
                applicationSettings.setString("startUrl", url.toString());
            }
        }
    });
};

application.start();
