#!/bin/bash
FILE=bandwidth.rrd

if [ -e $FILE ]; then
  echo "rrd db already exists. Remove $FILE per hand, if you want to recreate the db."
  exit 1
fi

rrdtool create $FILE \
        --step 10 \
        DS:upload:GAUGE:20:0:50000000 \
        DS:download:GAUGE:20:0:50000000 \
        RRA:AVERAGE:0.5:1:60480 \
        RRA:AVERAGE:0.5:30:315360

echo "rrd db created."