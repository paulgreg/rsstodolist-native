var view  = require("ui/core/view");
var http  = require("http");
var xml   = require("xml");
var utils = require("utils/utils");

const mainServer = 'https://rsstodolist.appspot.com/';
var baseUrl = mainServer;

function pageLoaded(args) {
    var page = args.object;

    var urlField  = view.getViewById(page, "url");
    var feedField = view.getViewById(page, "feed");
    var addButton = view.getViewById(page, "add");
    var delButton = view.getViewById(page, "del");
    var goButton  = view.getViewById(page, "go");
    var msgLabel  = view.getViewById(page, "msg");

    function onXmlNode (event) {
        switch (event.eventType) {
            case xmlModule.ParserEventType.StartElement:
                var message = event.eventType + " " + event.elementName;
                console.log(message);
            break;
            case xmlModule.ParserEventType.EndElement:
                console.log(event.eventType + " " + event.elementName);
            break;
            case xmlModule.ParserEventType.Text:
                var significantText = event.data.trim();
            if (significantText !== "") {
            }
            break;
        }
    };

    var xmlParser = new xml.XmlParser(onXmlNode, function(err) {
        msgLabel.text = "error:" + err;
        console.log(err);
    });

    function cleanupMessage () {
        msgLabel.text = "";
    };

    function doStuff (action, feed, url) {
        if (url.length === 0) {
            msgLabel.text = "url should not be empty";
            msgLabel.className = "error";
            return;
        }
        if (feed.length === 0) {
            msgLabel.text = "feed should not be empty";
            msgLabel.className = "error";
            return;
        }

        msgLabel.className = "";
        msgLabel.text = "updating feed...";

        http.getString(
            [
                baseUrl,
                action,
                '?name=',
                feed,
                '&url=',
                encodeURIComponent(url)
            ].join('')
        )
        .then(function (response) {
            msgLabel.text = "feed updated";
            setTimeout(cleanupMessage.bind(this), 3000);
        }.bind(this), function (e) {
            msgLabel.text = "error:" + e;
        }.bind(this));
    };

    addButton.on("tap", function () {
        doStuff.call(this, 'add', feedField.text, urlField.text);
    });

    delButton.on("tap", function () {
        doStuff.call(this, 'del', feedField.text, urlField.text);
    });

    goButton.on("tap", function () {
        var feed = feedField.text;
        if (feed.length === 0) {
            msgLabel.text = "feed should not be empty";
            msgLabel.className = "error";
            return;
        }

        msgLabel.className = "";

        http.getString(
            [
                baseUrl,
                '?name=',
                feed
            ].join('')
        )
        .then(function (response) {

            var result = xmlParser.parse(response);
            console.log(result);
            return result;

        }.bind(this), function (e) {
            msgLabel.text = "error:" + e;
        }.bind(this));

        // utils.openUrl()
    });
};

exports.pageLoaded = pageLoaded;
