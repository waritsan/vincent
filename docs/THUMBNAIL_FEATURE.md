# Thumbnail Image Feature

**Added:** October 22, 2025  
**Feature:** Posts can now have thumbnail images displayed alongside or instead of video thumbnails

---

## Overview

Posts now support an optional `thumbnail_url` field that allows custom thumbnail images to be displayed. This is particularly useful for posts without videos.

### Display Priority:
1. **If video_url exists**: Show video thumbnail (YouTube preview)
2. **If thumbnail_url exists**: Show custom thumbnail image
3. **If neither**: Show default placeholder with play icon

---

## Usage

### Creating a Post with Thumbnail

In the **Admin Dashboard**, you'll see a new field:

```
Thumbnail Image URL (Optional)
https://example.com/image.jpg
```

**Example:**
- Thumbnail URL: `https://images.unsplash.com/photo-1234567890`
- The image will be displayed with hover effects and proper aspect ratio

---

## Technical Details

### Database Schema

**Post Object:**
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "author": "string",
  "video_url": "string (optional)",
  "thumbnail_url": "string (optional)",
  "tags": ["array"],
  "created_at": "ISO-8601 datetime",
  "updated_at": "ISO-8601 datetime"
}
```

### Frontend Implementation

**TypeScript Interface:**
```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  video_url?: string;
  thumbnail_url?: string;  // NEW FIELD
  created_at: string;
  tags?: string[];
}
```

**Display Logic (`BlogPosts.tsx`):**
```tsx
{videoId ? (
  // Show video thumbnail with play button
  <VideoThumbnail />
) : post.thumbnail_url ? (
  // Show custom thumbnail image
  <img src={post.thumbnail_url} alt={post.title} />
) : (
  // Show default placeholder
  <DefaultPlaceholder />
)}
```

### Backend API

**POST /api/posts** - Create post with thumbnail:
```json
{
  "title": "New Benefits Available",
  "content": "Details about...",
  "author": "Admin",
  "thumbnail_url": "https://example.com/image.jpg",
  "tags": ["healthcare", "benefits"]
}
```

**PUT /api/posts/{id}** - Update post thumbnail:
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "author": "Admin",
  "thumbnail_url": "https://example.com/new-image.jpg",
  "tags": ["healthcare"]
}
```

---

## Features

### Visual Design

1. **Custom Thumbnail Display:**
   - Aspect ratio: 16:9
   - Hover effect: Subtle zoom (scale-105)
   - Gradient overlay: From bottom (black/60)
   - Rounded corners for consistency

2. **Fallback Behavior:**
   - If thumbnail fails to load, shows default placeholder
   - No broken image icons
   - Graceful degradation

3. **Responsive:**
   - Works on all screen sizes
   - Maintains aspect ratio
   - Smooth transitions

---

## Examples

### Use Cases

1. **News Article:**
   ```
   Title: "New Housing Support Program"
   Thumbnail: Government building image
   No video needed
   ```

2. **Announcement:**
   ```
   Title: "Important Update"
   Thumbnail: Infographic or illustration
   Quick visual reference
   ```

3. **Mixed Content:**
   ```
   Post 1: Video (video_url) → Shows YouTube thumbnail
   Post 2: Image (thumbnail_url) → Shows custom image
   Post 3: Neither → Shows default placeholder
   ```

---

## Admin Dashboard

### Form Fields (in order):

1. **Author** - Who wrote the post
2. **Title** - Post headline
3. **Content** - Main text (with character counter)
4. **Video URL** (Optional) - YouTube link
5. **Thumbnail Image URL** (Optional) - Custom image ← NEW!
6. **Tags** (Optional) - Comma-separated

### Validation:

- ✅ Title: Required
- ✅ Content: Required
- ✅ Author: Required
- ✅ Video URL: Optional (validates URL format)
- ✅ Thumbnail URL: Optional (validates URL format) ← NEW!
- ✅ Tags: Optional

---

## Image Guidelines

### Recommended Specifications:

- **Aspect Ratio:** 16:9 (e.g., 1920x1080, 1280x720)
- **Format:** JPG, PNG, WebP
- **Size:** < 500KB for fast loading
- **Resolution:** Minimum 1280x720px

### Image Hosting Options:

1. **Azure Blob Storage** (recommended for production)
2. **Unsplash** (free stock photos)
3. **Pexels** (free stock photos)
4. **Your own CDN**

### Example URLs:

```
Good:
✅ https://images.unsplash.com/photo-1234567890?w=1280
✅ https://cdn.example.com/images/thumbnail.jpg
✅ https://storage.azure.com/container/image.png

Avoid:
❌ http://insecure-site.com/image.jpg (not HTTPS)
❌ https://site.com/huge-10mb-file.jpg (too large)
❌ https://site.com/small.jpg (too small, will look pixelated)
```

---

## Testing

### Test Checklist:

- ✅ Create post with thumbnail_url
- ✅ Create post with video_url (thumbnail_url ignored)
- ✅ Create post with both (video takes priority)
- ✅ Create post with neither (shows placeholder)
- ✅ Update post to add thumbnail_url
- ✅ Update post to remove thumbnail_url
- ✅ Invalid URL shows fallback
- ✅ Responsive on mobile/tablet/desktop

### Manual Test:

1. Go to `/admin`
2. Create new post
3. Add thumbnail URL: `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280`
4. Create post
5. View on home page - thumbnail displays correctly
6. Hover over thumbnail - smooth zoom effect
7. Click post - opens modal with full content

---

## Migration

### Existing Posts:

- ✅ No database migration needed
- ✅ Field is optional
- ✅ Old posts without thumbnail_url continue to work
- ✅ Can add thumbnails to existing posts via Edit

---

## Files Modified

### Frontend:
- `src/web/src/app/components/BlogPosts.tsx`
  - Added `thumbnail_url?` to Post interface
  - Added thumbnail display logic
  - Added hover effects for thumbnail images

- `src/web/src/app/admin/page.tsx`
  - Added `thumbnail_url` to Post interface
  - Added `thumbnail_url` to form state
  - Added thumbnail URL input field
  - Updated form reset/edit handlers

### Backend:
- `src/api/function_app.py`
  - Added `thumbnail_url` field to POST /api/posts
  - Added `thumbnail_url` field to PUT /api/posts/{id}
  - Saves to Cosmos DB

---

## Performance

### Impact:
- Minimal - only loads image when post is visible
- Images use browser caching
- No additional API calls
- Lazy loading supported by browser

### Optimization:
- Consider using Next.js `<Image>` component for optimization
- Add loading skeleton while image loads
- Implement image CDN for faster delivery

---

## Future Enhancements

### Possible Improvements:

1. **Image Upload** - Direct file upload to Azure Blob Storage
2. **Image Cropping** - Built-in crop/resize tool
3. **Alt Text** - Accessibility improvement
4. **Multiple Images** - Gallery support
5. **Image Validation** - Check dimensions before saving
6. **Lazy Loading** - Explicit lazy loading implementation
7. **Placeholder** - Show blur-up effect while loading

---

## Support

### Troubleshooting:

**Thumbnail not showing:**
- Check URL is valid and accessible
- Ensure URL uses HTTPS
- Check browser console for errors
- Verify image format is supported (JPG/PNG/WebP)

**Image looks stretched:**
- Use 16:9 aspect ratio images
- Minimum 1280x720 resolution recommended
- Image will be cropped to fit if wrong aspect ratio

**Slow loading:**
- Optimize image size (< 500KB)
- Use image compression tools
- Consider using a CDN
- Check network connection

---

## Conclusion

Posts now support custom thumbnail images, providing:
- ✅ Better visual appeal
- ✅ Flexibility for non-video content
- ✅ Professional appearance
- ✅ Easy to use in admin dashboard
- ✅ Backward compatible with existing posts
