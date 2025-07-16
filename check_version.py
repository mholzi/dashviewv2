#!/usr/bin/env python3
"""
Quick script to check the current version of Dashview V2 installed in Home Assistant.
"""

import json
import os
import sys

# Common Home Assistant paths
possible_paths = [
    "/config/custom_components/dashview_v2/manifest.json",
    "/homeassistant/custom_components/dashview_v2/manifest.json",
    "/usr/share/hassio/homeassistant/custom_components/dashview_v2/manifest.json",
    os.path.expanduser("~/.homeassistant/custom_components/dashview_v2/manifest.json"),
]

print("🔍 Checking Dashview V2 installation...")
print()

found = False
for path in possible_paths:
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                manifest = json.load(f)
            
            version = manifest.get('version', 'unknown')
            print(f"✅ Found Dashview V2 at: {path}")
            print(f"📦 Current version: {version}")
            print(f"🎯 Latest version: 0.2.5")
            
            if version == "0.2.5":
                print("✅ You have the latest version!")
            else:
                print(f"⚠️  Update needed: {version} → 0.2.5")
                print()
                print("📋 To update:")
                print("1. Download v0.2.5 from: https://github.com/mholzi/dashviewv2/releases/tag/v0.2.5")
                print("2. Replace the contents of:", os.path.dirname(path))
                print("3. Restart Home Assistant")
            
            found = True
            break
            
        except Exception as e:
            print(f"❌ Error reading manifest at {path}: {e}")

if not found:
    print("❌ Dashview V2 not found in any common locations")
    print()
    print("📋 To install:")
    print("1. Download v0.2.5 from: https://github.com/mholzi/dashviewv2/releases/tag/v0.2.5")
    print("2. Extract to: /config/custom_components/dashview_v2")
    print("3. Restart Home Assistant")
    print("4. Add integration via Settings → Integrations")

print()
print("🔗 Release URL: https://github.com/mholzi/dashviewv2/releases/tag/v0.2.5")