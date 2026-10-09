#!/usr/bin/env python3
"""Read-only deployed GitHub Pages owner HTML comparison against pinned main commits.

No browser JavaScript, credentials, cookies, requests to Supabase, owner actions,
or reservation calls. Exactly two bounded public GET requests.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
import sys
import urllib.error
import urllib.parse
import urllib.request

SITES = (
    ("SALY", "https://part-chez-baptiste.digiylyfe.com/gestion.html",
     Path("staging/deployed-saly/gestion.html")),
    ("SARLAT", "https://pro-espace.digiylyfe.com/loc.html",
     Path("staging/deployed-sarlat/loc.html")),
)
MAX_BYTES = 2 * 1024 * 1024

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        src = urllib.parse.urlsplit(request.full_url)
        dst = urllib.parse.urlsplit(newurl)
        if dst.scheme != "https" or dst.hostname != src.hostname:
            raise ValueError("cross-origin or non-HTTPS redirect refused")
        return super().redirect_request(request, fp, code, msg, headers, newurl)


def check_site(label: str, url: str, expected_path: Path) -> bool:
    if not expected_path.is_file():
        print(f"LIVE_{label}_BASELINE_MISSING")
        return False
    expected = expected_path.read_bytes()
    if len(expected) > MAX_BYTES:
        print(f"LIVE_{label}_BASELINE_TOO_LARGE")
        return False
    opener = urllib.request.build_opener(SafeRedirect())
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "DIGIY-V30-readonly-deployment-check/1.0",
                 "Accept": "text/html"},
        method="GET",
    )
    try:
        with opener.open(request, timeout=12) as response:
            if response.status != 200:
                print(f"LIVE_{label}_HTTP_NON_200")
                return False
            payload = response.read(MAX_BYTES + 1)
            if len(payload) > MAX_BYTES:
                print(f"LIVE_{label}_HTML_TOO_LARGE")
                return False
    except (TimeoutError, OSError, urllib.error.URLError, ValueError) as exc:
        # Do not leak URL tokens, headers or any HTML/body content.
        print(f"LIVE_{label}_HTTP_UNAVAILABLE ({type(exc).__name__})")
        return False
    same = hashlib.sha256(expected).digest() == hashlib.sha256(payload).digest()
    if same:
        print(f"LIVE_{label}_MAIN_SHA_PARITY_OK: exact HTML published matches pinned current main")
    else:
        print(f"LIVE_{label}_HTML_DRIFT: production body differs from pinned main; investigate without mutating")
    return same


if __name__ == "__main__":
    good = all(check_site(*site) for site in SITES)
    if good:
        print("LIVE_TWO_OWNER_PUBLIC_HTML_PARITY_OK: no login or owner API calls made")
    else:
        print("LIVE_OWNER_DEPLOYMENT_PARITY_UNPROVEN: no changes performed")
    sys.exit(0 if good else 1)
