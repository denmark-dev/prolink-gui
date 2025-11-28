# PWA Icon Instructions

## Required Icons

You need to create two icon files for PWA support:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## How to Create Icons

### Option 1: Use Online Tool (Easiest)
1. Go to https://www.favicon-generator.org/ or https://realfavicongenerator.net/
2. Upload your `prolink.png` file
3. Download the generated icons
4. Rename them to `icon-192.png` and `icon-512.png`
5. Place them in the `public` folder

### Option 2: Use Image Editor
1. Open `prolink.png` in an image editor (Paint, Photoshop, GIMP, etc.)
2. Resize to 192x192 pixels, save as `icon-192.png`
3. Resize to 512x512 pixels, save as `icon-512.png`
4. Place both files in the `public` folder

### Option 3: Quick Temporary Solution
For now, you can copy your existing logo:
```bash
copy public\prolink.png public\icon-192.png
copy public\prolink.png public\icon-512.png
```

## After Creating Icons

Once you have the icons in place:
1. Restart your dev server: `npm run dev`
2. Access from your laptop's IP: `http://192.168.1.x:3000`
3. On your phone, open that URL in Chrome/Safari
4. Look for "Add to Home Screen" or "Install App" prompt
5. Install the PWA!

## Testing

The PWA will work when:
- ✅ Accessed via HTTP (your laptop's IP)
- ✅ Accessed via HTTPS (Vercel - but router calls won't work)
- ✅ Installed on your phone
- ✅ Can connect directly to router (192.168.1.1) from phone
