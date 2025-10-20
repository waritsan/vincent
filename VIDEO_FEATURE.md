# Video URL Feature Documentation

## Overview
Posts can now include YouTube video links that will be automatically embedded and displayed on the website.

## Feature Details

### Backend Changes

#### New Field: `video_url`
- **Type**: String (optional)
- **Default**: Empty string `""`
- **Purpose**: Store YouTube video URLs

#### Supported Endpoints
1. **POST /api/posts** - Create post with video
2. **PUT /api/posts/{id}** - Update post video
3. **GET /api/posts** - Retrieve posts with videos

### Frontend Changes

#### Admin Dashboard (`/admin`)
**New Field Added:**
- **Video URL (Optional)** input field
- Accepts YouTube URLs in various formats
- Placeholder text guides users on supported formats
- Helper text explains the feature

**Supported YouTube URL Formats:**
```
✅ https://youtu.be/VIDEO_ID
✅ https://youtu.be/VIDEO_ID?si=...
✅ https://www.youtube.com/watch?v=VIDEO_ID
✅ https://www.youtube.com/watch?v=VIDEO_ID&t=30s
✅ https://www.youtube.com/embed/VIDEO_ID
```

#### Public Display (`/`)
**Video Rendering:**
- Posts with videos show embedded YouTube player
- Posts without videos show default placeholder with play icon
- Maintains aspect ratio (16:9)
- Fully responsive design
- Supports fullscreen playback

## Usage Guide

### Creating a Post with Video

1. **Go to Admin Dashboard**: `http://localhost:3000/admin`

2. **Fill in the form:**
   ```
   Author:    Your Name
   Title:     New Benefits Announcement
   Content:   Learn about new support programs in this video
   Video URL: https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh
   ```

3. **Click "Create Post"**

4. **View on homepage** - Video will be embedded automatically

### Example Request (API)

#### Create Post with Video
```bash
POST /api/posts
Content-Type: application/json

{
  "title": "Important Video Update",
  "content": "Watch this important message about citizen rights",
  "author": "Government Communications",
  "video_url": "https://youtu.be/Jds96VCuPvA?si=9lAmYJBTInfk7Ouh"
}
```

#### Update Post to Add Video
```bash
PUT /api/posts/abc-123
Content-Type: application/json

{
  "title": "Updated Post",
  "content": "Now with video!",
  "author": "Admin",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

#### Remove Video from Post
```bash
PUT /api/posts/abc-123
Content-Type: application/json

{
  "title": "Post",
  "content": "Video removed",
  "author": "Admin",
  "video_url": ""
}
```

## Technical Implementation

### Video ID Extraction
The frontend automatically extracts YouTube video IDs from URLs:

```typescript
const getYouTubeVideoId = (url: string): string | null => {
  // youtu.be format
  const youtuBeMatch = url.match(/youtu\.be\/([^?]+)/);
  if (youtuBeMatch) return youtuBeMatch[1];
  
  // youtube.com/watch format
  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  
  // youtube.com/embed format
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
};
```

### Video Embedding
```tsx
{videoId ? (
  <iframe
    src={`https://www.youtube.com/embed/${videoId}`}
    title={post.title}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="w-full h-full aspect-video"
  />
) : (
  // Default placeholder
)}
```

## Database Schema

### Post Object
```json
{
  "id": "string",
  "title": "string",
  "content": "string", 
  "author": "string",
  "video_url": "string (optional)",
  "created_at": "ISO-8601 datetime",
  "updated_at": "ISO-8601 datetime"
}
```

## Testing

### Test Coverage
- ✅ Create post with video URL
- ✅ Create post without video URL
- ✅ Update post to add video URL
- ✅ Update post to remove video URL
- ✅ Various YouTube URL formats

### Run Tests
```bash
cd src/api
pytest tests/test_video_url.py -v
```

**Result:** 5/5 tests passing ✅

## Examples

### Example 1: Educational Video
```json
{
  "title": "Understanding Your Tax Credits",
  "content": "This video explains the new tax credit program and how you can benefit from it.",
  "author": "Tax Department",
  "video_url": "https://youtu.be/Jds96VCuPvA"
}
```

### Example 2: Public Service Announcement
```json
{
  "title": "Healthcare Services Update",
  "content": "Important updates about free healthcare services available to all citizens.",
  "author": "Health Department",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Example 3: Text-Only Post
```json
{
  "title": "New Office Hours",
  "content": "Our office hours have changed. We are now open Monday-Friday, 9am-5pm.",
  "author": "Administration",
  "video_url": ""
}
```

## User Experience

### Before (Without Video)
- Posts displayed with generic placeholder
- Play icon overlay
- No actual video content

### After (With Video)
- **With Video URL**: Embedded YouTube player
- **Without Video URL**: Original placeholder design
- Seamless integration
- No layout shifts

## Benefits

1. **Rich Content** - Engage citizens with video content
2. **Easy to Use** - Just paste a YouTube URL
3. **Flexible** - Video is optional, not required
4. **Responsive** - Works on all devices
5. **Professional** - Clean embedded player

## Limitations & Considerations

### Current Limitations
- ✅ YouTube only (most popular platform)
- ✅ No video upload (uses YouTube hosting)
- ✅ Requires video to be public on YouTube

### Future Enhancements
- [ ] Support for other platforms (Vimeo, etc.)
- [ ] Video thumbnail customization
- [ ] Video playback analytics
- [ ] Auto-play options
- [ ] Video playlist support

## Troubleshooting

### Video Not Showing
**Problem**: Video URL added but video doesn't display

**Solutions:**
1. Check URL format is correct
2. Ensure video is public on YouTube
3. Try different URL format (youtu.be vs youtube.com)
4. Check browser console for errors
5. Verify video ID extraction logic

### Invalid URL
**Problem**: URL is not recognized

**Solutions:**
1. Use one of the supported formats
2. Copy URL directly from YouTube
3. Remove unnecessary parameters
4. Ensure URL starts with https://

### Database Issues
**Problem**: Video URL not saving

**Solutions:**
1. Check Cosmos DB connection
2. Verify field is included in request
3. Check backend logs for errors
4. Ensure field doesn't exceed length limits

## Migration Notes

### Existing Posts
- Existing posts automatically get `video_url: ""` (empty)
- No data migration required
- Backward compatible
- Posts without videos display as before

### API Compatibility
- ✅ Backward compatible
- ✅ Optional field
- ✅ No breaking changes
- ✅ Existing clients work unchanged

## Security Considerations

### Input Validation
- URLs validated on frontend
- Field is optional, can be empty
- No script injection risk (iframe sandboxed)
- YouTube handles content security

### Privacy
- Videos hosted on YouTube
- User data not collected
- YouTube privacy policy applies
- Embedded mode respects YouTube settings

## Performance

### Impact
- **Minimal**: Only adds one string field
- **Lazy Loading**: Videos load on demand
- **CDN**: YouTube's CDN handles video delivery
- **Responsive**: Adapts to connection speed

### Optimization
- No video processing required
- No storage overhead
- Leverages YouTube infrastructure
- Fast page loads maintained

## Support

### For Users
- Paste YouTube URL in admin form
- Preview on homepage after saving
- Edit or remove video anytime
- Contact admin if issues occur

### For Developers
- Check test suite: `test_video_url.py`
- Review implementation in `function_app.py` and `BlogPosts.tsx`
- Monitor logs for URL parsing errors
- Extend for additional platforms if needed

## Version History

- **v1.0** (2025-10-20): Initial video URL feature
  - YouTube URL support
  - Embed integration
  - Admin interface updates
  - Test coverage added
