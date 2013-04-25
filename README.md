I wrote this as part of my algorithms homework last summer, and used it as an excuse to try and write something in JavaScript.

If you want to see it run without downloading the code, I probably still have a copy up on [my website](http://axiixc.com/trominoes).

---

Board resolution defines the resolution used in the backing store for the canvas. If you plan to zoom into your screen, consider setting this to a higher value as it will maintain clarity. Additionally, animation incurs a large overhead simply because it keeps copies of the board state in memory. If you disable it (value of exactly "0") you can render much larger boards with good speed, however with animation stay around 1-6.

The board may become very small at large sizes. This is because it draws squares at integer widths only. If its getting too small double the resolution and use your browser's zoom feature.