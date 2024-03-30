//create web server
var http = require("http");
var url = require("url");
var fs = require("fs");
var querystring = require("querystring");
var path = require("path");
var comment = require("./comment");
var session = require("./session");
var user = require("./user");
var util = require("./util");
var cookie = require("./cookie");
var log = require("./log");
var config = require("./config");
var server = http.createServer();
var port = 8080;
var host = "127.0.0.1";
var root = path.resolve(__dirname, "../");

server.on("request", function(req, res) {
	var pathname = url.parse(req.url).pathname;
	var query = url.parse(req.url).query;
	var method = req.method;
	var body = "";
	var session_id = cookie.get(req.headers.cookie, "session_id");
	var user_id = session.get(session_id);
	var user_info = user.get(user_id);
	var log_text = "Request from " + req.connection.remoteAddress + " URL: " + pathname + " Method: " + method;
	log.info(log_text);
	switch (pathname) {
		case "/":
			fs.readFile(root + "/index.html", "utf8", function(err, data) {
				if (err) {
					res.writeHead(404, {
						"Content-Type": "text/html"
					});
					res.end("404 Not Found");
				} else {
					res.writeHead(200, {
						"Content-Type": "text/html"
					});
					res.end(data);
				}
			});
			break;
		case "/login":
			if (method === "POST") {
				req.on("data", function(chunk) {
					body += chunk;
				});
				req.on("end", function() {
					var data = querystring.parse(body);
					var username = data.username;
					var password = data.password;
					if (user.authenticate(username, password)) {
						var session_id = session.create();
						cookie.set(res, "session_id", session_id);
						res.writeHead(302, {
							"Location": "/",
							"Set-Cookie": cookie.serialize("session_id", session_id)
						});
						res.end();
					} else {
						res.writeHead(401, {
							"Content-Type": "text/html"
						});
						res.end("401 Unauthorized");
					}
				});
			} else {
				res.writeHead(405, {
					"Content-Type": "text/html"
				});
				res.end("405 Method Not Allowed");
			}
			break;
		case "/logout":
			if (method === "POST") {
				var session_id = cookie.get(req.headers.cookie, "session_id");
				session.remove(session_id);
				cookie.set(res, "session_id", "");
				res.writeHead(302, {
					"Location": "/",
					"Set-Cookie": cookie.serialize("session_id", "")
                });
                res.end();
            }
            else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
        case "/comment":
            if (method === "POST") {
                req.on("data", function(chunk) {
                    body += chunk;
                });
                req.on("end", function() {
                    var data = querystring.parse(body);
                    var text = data.text;
                    comment.create(user_id, text);
                    res.writeHead(302, {
                        "Location": "/",
                        "Set-Cookie": cookie.serialize("session_id", session_id)
                    });
                    res.end();
                });
            } else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
        case "/comment/delete":
            if (method === "POST") {
                req.on("data", function(chunk) {
                    body += chunk;
                });
                req.on("end", function() {
                    var data = querystring.parse(body);
                    var comment_id = data.comment_id;
                    comment.remove(user_id, comment_id);
                    res.writeHead(302, {
                        "Location": "/",
                        "Set-Cookie": cookie.serialize("session_id", session_id)
                    });
                    res.end();
                });
            } else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
        case "/comment/update":
            if (method === "POST") {
                req.on("data", function(chunk) {
                    body += chunk;
                });
                req.on("end", function() {
                    var data = querystring.parse(body);
                    var comment_id = data.comment_id;
                    var text = data.text;
                    comment.update(user_id, comment_id, text);
                    res.writeHead(302, {
                        "Location": "/",
                        "Set-Cookie": cookie.serialize("session_id", session_id)
                    });
                    res.end();
                });
            } else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
        case "/comment/list":
            if (method === "GET") {
                var comments = comment.list();
                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify(comments));
            } else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
        case "/user/list":
            if (method === "GET") {
                var users = user.list();
                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify(users));
            } else {
                res.writeHead(405, {
                    "Content-Type": "text/html"
                });
                res.end("405 Method Not Allowed");
            }
            break;
                    default:
            if (util.startsWith(pathname, "/public/")) {
                var filename = path.basename(pathname);
                var extname = path.extname(filename);
                var type = config.types[extname];
                fs.readFile(root + pathname, function(err, data) {
                    if (err) {
                        res.writeHead(404, {
                            "Content-Type": "text/html"
                        });
                        res.end("404 Not Found");
                    } else {
                        res.writeHead(200, {
                            "Content-Type": type
                        });
                        res.end(data);
                    }
                });
            } else {
                res.writeHead(404, {
                    "Content-Type": "text/html"
                });
                res.end("404 Not Found");
            }
            break;
    }
}
);
server.listen(port, host, function() {
    console.log("Server is running at http://" + host + ":" + port + "/");
}
);