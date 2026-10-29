#!/bin/sh
H=/home/user/xyphre1314/hookworthy
curl -s -o /dev/null http://127.0.0.1:8765/ || (cd $H && setsid nohup python3 -m http.server 8765 > /dev/null 2>&1 &)
sleep 1.5
curl -s -o /dev/null http://127.0.0.1:8766/ || (cd /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/snap/hookworthy && setsid nohup python3 -m http.server 8766 > /dev/null 2>&1 &)
sleep 1
