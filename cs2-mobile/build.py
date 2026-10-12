#!/usr/bin/env python3
"""Bundle src/ into a single self-contained index.html.

Usage: python3 build.py [artifact_out.html]
The optional argument also writes a copy without the document wrapper tags.
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

css = (SRC / "style.css").read_text()
body = (SRC / "body.html").read_text()
js = "\n".join(p.read_text() for p in sorted(SRC.glob("*.js")))

head = """<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Clutch Point</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Barlow+Semi+Condensed:wght@400;600&display=swap">
<style>
""" + css + """</style>
"""
inner = body + """<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(()=>{
'use strict';
""" + js + """
})();
</script>
"""

full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        + head + "</head>\n<body>\n" + inner + "</body>\n</html>\n")
(ROOT / "index.html").write_text(full)
if len(sys.argv) > 1:
    pathlib.Path(sys.argv[1]).write_text(head + inner)
print("built index.html", len(full) // 1024, "KB")
