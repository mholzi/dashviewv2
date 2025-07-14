# Create Release

## Purpose
Automate the creation of GitHub releases for the Dashview V2 project with proper versioning, tagging, and release notes.

## Arguments
The command expects a version number as an argument (e.g., "0.2.0", "1.0.0")

## Process

### 1. Validate Version
- Check that version follows semantic versioning (X.Y.Z)
- Ensure version is greater than the latest release
- Verify no uncommitted changes exist

### 2. Update Version Files
- Update `custom_components/dashview_v2/manifest.json` with new version
- Update `hacs.json` if needed
- Update any version references in documentation

### 3. Prepare Release Notes
- Ask user for release type: major, minor, or patch
- Ask for key features/changes/fixes
- Generate release notes with:
  - Version header
  - What's New section
  - Bug Fixes (if any)
  - Breaking Changes (if any)
  - Installation instructions
  - Requirements

### 4. Create Git Tag and Release
- Commit version updates
- Create annotated git tag
- Push commits and tag
- Create GitHub release with generated notes

## Implementation

```bash
# Get version from arguments
VERSION=$ARGUMENTS

# Validate version format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z (e.g., 0.2.0)"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "Error: Uncommitted changes found. Please commit or stash them first."
    exit 1
fi

# Get latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
LATEST_VERSION=${LATEST_TAG#v}

# Compare versions
if [[ "$VERSION" == "$LATEST_VERSION" ]]; then
    echo "Error: Version $VERSION already exists"
    exit 1
fi
```

### Update manifest.json
```python
import json

# Update manifest version
with open('custom_components/dashview_v2/manifest.json', 'r') as f:
    manifest = json.load(f)

manifest['version'] = VERSION

with open('custom_components/dashview_v2/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
```

### Generate Release Notes Template
```markdown
# Release Notes - v{VERSION}

## 🚀 What's New in v{VERSION}

### ✨ Features
- [Add new features here]

### 🐛 Bug Fixes
- [Add bug fixes here]

### 📝 Documentation
- [Add documentation updates here]

### ⚠️ Breaking Changes
- [Add breaking changes here, if any]

## 📦 Installation

### HACS (Recommended)
1. Update to the latest version in HACS
2. Restart Home Assistant

### Manual
1. Download the source code
2. Extract `custom_components/dashview_v2` to your config directory
3. Restart Home Assistant

## 🔧 Requirements
- Home Assistant 2024.4.1 or newer
- Previous version compatibility notes

## 🙏 Thanks
Thanks to all contributors and users for their feedback!
```

### Create Release
```bash
# Commit version updates
git add custom_components/dashview_v2/manifest.json
git commit -m "chore: bump version to $VERSION"

# Create and push tag
git tag -a "v$VERSION" -m "Release version $VERSION"
git push origin main
git push origin "v$VERSION"

# Create GitHub release
gh release create "v$VERSION" \
    --repo mholzi/dashviewv2 \
    --title "v$VERSION - {RELEASE_TITLE}" \
    --notes-file RELEASE_NOTES.md
```

## Usage Examples

```bash
# Create a patch release
/create-release 0.1.1

# Create a minor release
/create-release 0.2.0

# Create a major release
/create-release 1.0.0
```

## Success Output
- Updated version in manifest.json
- Created git tag v{VERSION}
- Published GitHub release
- Release URL: https://github.com/mholzi/dashviewv2/releases/tag/v{VERSION}