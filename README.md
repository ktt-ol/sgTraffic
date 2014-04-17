# sgTraffic

Traffic stats for spacegate

# install

```
npm install
grunt build
```

# running

```
node app/server.js
```

or use the ```run.sh``` script in the ```shell-scripts``` folder.

# rrd

```
rrdtool create bandwidth.rrd \
        --step 10 \
        DS:upload:GAUGE:20:0:50000000 \
        DS:download:GAUGE:20:0:50000000 \
        RRA:AVERAGE:0.5:1:60480 \
        RRA:AVERAGE:0.5:30:315360
```

1 Week every step (= every 10 seconds)
3 Years every 30th step (= every 5 minutes)


# license

MIT
