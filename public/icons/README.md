# PWA Icons

This directory contains the Progressive Web App icons for KopackaMk.

## Generated Icons

The following icons have been generated as SVG files:

- icon-72x72.svg
- icon-96x96.svg
- icon-128x128.svg
- icon-144x144.svg
- icon-152x152.svg
- icon-192x192.svg
- icon-384x384.svg
- icon-512x512.svg
- view-icon.svg (for notification actions)

## Converting to PNG

To convert these SVG icons to PNG format, you can use one of these tools:

### Using ImageMagick:
```bash
# Convert all icons to PNG
for size in 72 96 128 144 152 192 384 512; do
  convert icons/icon-${size}x${size}.svg icons/icon-${size}x${size}.png
done
convert icons/view-icon.svg icons/view-icon.png
```

### Using Inkscape:
```bash
# Convert all icons to PNG
for size in 72 96 128 144 152 192 384 512; do
  inkscape icons/icon-${size}x${size}.svg -w ${size} -h ${size} -o icons/icon-${size}x${size}.png
done
inkscape icons/view-icon.svg -w 24 -h 24 -o icons/view-icon.png
```

### Using online tools:
1. Visit https://cloudconvert.com/svg-to-png
2. Upload the SVG files
3. Convert to PNG format

## Icon Requirements

- All icons should be square (same width and height)
- Icons should work well on various backgrounds
- The design should be recognizable at small sizes
- Use the brand colors (#2563eb for primary, #ffffff for accents)

## Notes

- The SVG icons are generated programmatically and can be customized
- For production, consider having a professional designer create custom icons
- Test icons on different devices and backgrounds
