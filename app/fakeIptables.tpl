Chain INPUT (policy ACCEPT 11 packets, 22 bytes)
    pkts      bytes target     prot opt in     out     source               destination
       0        0 ACCEPT     tcp  --  tun0   *       0.0.0.0/0            0.0.0.0/0            state NEW tcp dpt:22222

Chain FORWARD (policy ACCEPT 33 packets, 44 bytes)
    pkts      bytes target     prot opt in     out     source               destination
  55 {{BYTES_IN}} TRAFFIC_ACCT_IN  all  --  *      br0     0.0.0.0/0            0.0.0.0/0
  66 {{BYTES_OUT}} TRAFFIC_ACCT_OUT  all  --  br0    *       0.0.0.0/0            0.0.0.0/0

Chain OUTPUT (policy ACCEPT 77 packets, 88 bytes)
    pkts      bytes target     prot opt in     out     source               destination

Chain TRAFFIC_ACCT_IN (1 references)
    pkts      bytes target     prot opt in     out     source               destination
{{IP_IN}}

Chain TRAFFIC_ACCT_OUT (1 references)
    pkts      bytes target     prot opt in     out     source               destination
{{IP_OUT}}
