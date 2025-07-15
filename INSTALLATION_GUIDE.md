# Dashview V2 Installation Guide

## 🚀 Quick Installation (Recommended)

### Method 1: UI Installation (v0.2.3+)
1. Open Home Assistant
2. Go to **Settings** → **Integrations**
3. Click **+ Add Integration**
4. Search for **"Dashview V2"**
5. Click on **Dashview V2** and follow the setup
6. The dashboard will appear in your sidebar automatically!

### Method 2: HACS Installation
1. Open **HACS** in Home Assistant
2. Go to **Integrations**
3. Click **+ Explore & Download Repositories**
4. Search for **"Dashview V2"**
5. Click **Download** and restart Home Assistant
6. Follow **Method 1** above to add the integration

### Method 3: Manual Installation
1. Download the latest release from [GitHub](https://github.com/mholzi/dashviewv2/releases)
2. Extract the `custom_components/dashview_v2` folder
3. Copy to your Home Assistant `custom_components` directory
4. Restart Home Assistant
5. Follow **Method 1** above to add the integration

## 📋 Requirements
- Home Assistant 2023.1 or later
- Modern browser with ES2017+ support
- WebSocket support enabled

## 🎯 What You Get
- **Intelligent Dashboard**: Analyzes your home's complexity automatically
- **Real-time Updates**: WebSocket-based live data
- **Mobile-First Design**: Touch-friendly with 44px minimum targets
- **Professional Polish**: Smooth animations and visual enhancements
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## 🔧 Troubleshooting

### Integration Not Found
- Ensure you have the latest version (v0.2.3+)
- Restart Home Assistant after installation
- Check logs for any error messages

### Panel Not Appearing
- Verify the integration is enabled in Settings → Integrations
- Check that the files are in the correct directory
- Clear browser cache and refresh

### WebSocket Errors
- Ensure WebSocket support is enabled in your Home Assistant setup
- Check network configuration if using reverse proxy
- Verify Home Assistant is running the minimum required version

## 📝 Version History
- **v0.2.3**: Added UI installation support (config flow)
- **v0.2.2**: Widget enhancement and polish
- **v0.2.1**: Foundation step 2 complete
- **v0.2.0**: Initial intelligent dashboard framework

## 🆘 Support
- [GitHub Issues](https://github.com/mholzi/dashviewv2/issues)
- [Documentation](https://github.com/mholzi/dashviewv2)
- [Release Notes](https://github.com/mholzi/dashviewv2/releases)

---

**Note**: No configuration.yaml changes are required! The integration sets up everything automatically through the UI.