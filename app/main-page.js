var view                = require("ui/core/view");
var http                = require("http");
var xml                 = require("xml");
var fs                  = require("file-system");
var utils               = require("utils/utils");
var applicationSettings = require("application-settings");

const mainServer = 'https://rsstodolist.appspot.com/';

function pageLoaded(args) {
    var page = args.object;

    var urlField        = view.getViewById(page, "url");
    var feedField       = view.getViewById(page, "feed");
    var addButton       = view.getViewById(page, "add");
    var delButton       = view.getViewById(page, "del");
    var goButton        = view.getViewById(page, "go");
    var msgLabel        = view.getViewById(page, "msg");
    var listView        = view.getViewById(page, "list");
    var serversPicker   = view.getViewById(page, "servers");

    if (applicationSettings.getString("startUrl")) {
        urlField.text = applicationSettings.getString("startUrl");
        applicationSettings.setString("startUrl", "");
    }

    var servers = [ mainServer ];

    var config = fs.File.fromPath(fs.path.join(fs.knownFolders.currentApp().path, "config.json"));
    config.readText()
    .then(function (data) {
        servers = JSON.parse(data);
        serversPicker.items = servers;
    }, function (error) {
        // Fail silently : set default server
        serversPicker.items = servers;
    });

    var xmlParser = new xml.XmlParser(onXmlNode, function(err) {
        msgLabel.text = "error:" + err;
    });

    function cleanupMessage () {
        msgLabel.text = "";
    };

    function doAction(action, feed, url) {
        if (url.length === 0) {
            return Promise.reject("url should not be empty");
        }
        if (feed.length === 0) {
            return Promise.reject("feed should not be empty");
        }

        msgLabel.className = "";
        msgLabel.text = "updating feed...";

        var url = [ servers[serversPicker.selectedIndex], action, '?name=', feed, '&url=', encodeURIComponent(url) ].join('');

        return http.getString(url)
        .then(function (response) {
            msgLabel.text = "feed updated";
            setTimeout(cleanupMessage.bind(this), 3000);
        }.bind(this), function (e) {
            return Promise.reject("error:" + e);
        }.bind(this));
    };

    addButton.on("tap", function () {
        var feed = feedField.text;
        doAction('add', feed, urlField.text)
        .then(listItems.bind(this, feed))
        .then(undefined, function(error) {
            msgLabel.text = error;
            msgLabel.className = "error";
        });
    });

    delButton.on("tap", function () {
        var feed = feedField.text;
        doAction('del', feed, urlField.text)
        .then(listItems.bind(this, feed))
        .then(undefined, function(error) {
            msgLabel.text = error;
            msgLabel.className = "error";
        });
    });

    goButton.on("tap", function () {
        var feed = feedField.text;
        listItems(feed);
    });

    function listItems(feed) {
        if (feed.length === 0) {
            msgLabel.text = "feed should not be empty";
            msgLabel.className = "error";
            return;
        }

        msgLabel.className = "";
        msgLabel.text = "fetching feed...";

        first = true;
        items = [];

        var url = [ servers[serversPicker.selectedIndex], '?name=', feed ].join('');

        http.getString(url)
        .then(function (response) {

            var trimresponse = response.replace(/\n\s*\</g, '<');
            xmlParser.parse(trimresponse);

            msgLabel.text = "Feed entries:"
            listView.items = items;

        }.bind(this), function (e) {
            msgLabel.text = "error:" + e;
            msgLabel.className = "error";
        }.bind(this));

    };

    listView.on("itemTap", function (item) {
        utils.openUrl(items[item.index].link);
    });

    var first;
    var items;
    var currentItem;
    var significantText;

    function onXmlNode (event) {
        if (event.eventType === xml.ParserEventType.StartElement) {
            if (event.elementName === 'title') {
                currentItem = {};
            }
        } else if (event.eventType === xml.ParserEventType.EndElement) {
            if (event.elementName === 'title') {
                currentItem.title = significantText;
            }
            if (event.elementName === 'link') {
                currentItem.link = significantText;
                currentItem.name = currentItem.title + ': ' + currentItem.link;
                if (!first) {
                    items.push(currentItem);
                }
                first = false;
            }
        } else if (event.eventType === xml.ParserEventType.Text) {
            significantText = event.data.trim();
        }
    };


};

exports.pageLoaded = pageLoaded;
