#!/bin/bash

# Create the traffic accounting rules

# flush
iptables -F TRAFFIC_ACCT_IN
iptables -F TRAFFIC_ACCT_OUT
iptables -F FORWARD

# remove
iptables -X TRAFFIC_ACCT_IN
iptables -X TRAFFIC_ACCT_OUT

# create
iptables -N TRAFFIC_ACCT_IN
iptables -N TRAFFIC_ACCT_OUT

iptables -I FORWARD -i br0 -j TRAFFIC_ACCT_OUT
iptables -I FORWARD -o br0 -j TRAFFIC_ACCT_IN

for suffix in {1..254}; do
    iptables -A TRAFFIC_ACCT_IN --dst 192.168.2.$suffix
    iptables -A TRAFFIC_ACCT_OUT --src 192.168.2.$suffix
done

