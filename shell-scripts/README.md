# Shell Scripts


## createTrafficRules.sh

This script creates the iptables rules for the traffic accounting.
You must modify the xx to run that script with the required super user permissions.

e.g. ```/etc/sudoers.d/traffic```

```
traffic            ALL=NOPASSWD:/usr/local/sbin/listAndClearStats.sh
```

## listAndClearStats.sh

as the script name says.


## run.sh

...