#!/bin/bash
# list and clears the accounting rules
/sbin/iptables -L -xnv -Z
