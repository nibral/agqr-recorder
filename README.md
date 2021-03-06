agqr-recorder
====

Require
----

* [Node.js](https://nodejs.org/)
* [rtmpdump](https://rtmpdump.mplayerhq.hu/)
* [ffmpeg](https://www.ffmpeg.org/)

Web brower access
----

Use nginx as a reverse proxy.

```
server {
  listen      80;
  server_name agqr.example.com;
  charset     UTF-8;

  location / {
    proxy_redirect                      off;
    proxy_set_header Host               $host;
    proxy_set_header X-Real-IP          $remote_addr;
    proxy_set_header X-Forwarded-Host   $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_pass                          http://localhost:3000/;
  }
}
```

Run as service with systemd
----

Replace `project-dir`, `username` and `group`.

```
[Unit]
Description=AGQR Recorder API service
After=network.target

[Service]
Type=simple
ExecStart=/bin/node /<project-dir>/app.js
WorkingDirectory=<project-dir>
KillMode=process
Restart=always
User=<username>
Group=<group>

[Install]
WantedBy=multi-user.target
```

License
----

(c) 2016 nibral

Released under MIT License.

[http://opensource.org/licenses/mit-license.php](http://opensource.org/licenses/mit-license.php)
