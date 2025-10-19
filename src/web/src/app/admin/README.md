# Admin Dashboard

## Overview
The Admin Dashboard provides a comprehensive interface for managing blog content on The Globe website.

## Features

### ✨ Content Management
- **Create Posts** - Add new updates and announcements for citizens
- **Edit Posts** - Update existing content
- **Delete Posts** - Remove outdated or incorrect information
- **View All Posts** - See all published content at a glance

### 🎨 User Interface
- Clean, modern design matching The Globe branding
- Responsive layout that works on all devices
- Real-time form validation
- Success/error notifications
- Sticky form sidebar for easy access

### 📝 Post Creation
Required fields:
- **Author** - Name of the content creator
- **Title** - Clear, descriptive headline
- **Content** - Full post content with character counter

## Accessing the Admin Dashboard

### From the Website
1. Visit the homepage at `http://localhost:3000`
2. Click "Admin" in the top navigation bar
3. You'll be taken to `/admin`

### Direct Access
Navigate to: `http://localhost:3000/admin`

## Usage Guide

### Creating a New Post

1. Fill in the form on the left side:
   - Enter your name in **Author**
   - Add a compelling **Title**
   - Write the **Content** (character count shown)
2. Click **Create Post**
3. Success message will appear
4. New post will appear in the list on the right

### Editing a Post

1. Find the post you want to edit in the list
2. Click the **Edit** button
3. The form will populate with the post's current data
4. Make your changes
5. Click **Update Post**
6. Post will be updated (Note: Full update functionality requires backend support)

### Deleting a Post

1. Find the post you want to remove
2. Click the **Delete** button
3. Confirm the deletion
4. Post will be removed (Note: Delete functionality requires backend implementation)

### Refreshing the Post List

Click the **Refresh** button in the top right of the posts list to reload all posts from the server.

## Technical Details

### API Integration
The admin dashboard connects to your Azure Functions backend at the endpoint specified in `NEXT_PUBLIC_API_URL`.

**Endpoints Used:**
- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create new posts
- `PUT /api/posts/{id}` - Update posts (to be implemented)
- `DELETE /api/posts/{id}` - Delete posts (to be implemented)

### State Management
- React hooks for form state and post management
- Real-time validation
- Error handling with user-friendly messages
- Loading states for better UX

### Styling
- Tailwind CSS for responsive design
- Blue color scheme (#0066CC) matching The Globe brand
- Dark mode support
- Smooth transitions and hover effects

## Future Enhancements

### Planned Features
- [ ] **Authentication** - Login system for admin access
- [ ] **Role-based Access** - Different permission levels
- [ ] **Image Upload** - Add images to posts
- [ ] **Rich Text Editor** - Markdown or WYSIWYG editor
- [ ] **Post Categories** - Organize content by topic
- [ ] **Draft System** - Save drafts before publishing
- [ ] **Search & Filter** - Find posts quickly
- [ ] **Bulk Actions** - Manage multiple posts at once
- [ ] **Analytics** - View post performance
- [ ] **Preview** - See how posts will look before publishing

### Backend Requirements
To enable full functionality, implement these backend endpoints:

```typescript
// Update post
PUT /api/posts/{id}
Body: { title, content, author }

// Delete post
DELETE /api/posts/{id}

// Authentication
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/verify
```

## Security Considerations

⚠️ **Important:** The current admin page has no authentication. For production:

1. **Add Authentication**
   - Implement login system
   - Use JWT or session tokens
   - Protect admin routes

2. **Authorization**
   - Verify user roles/permissions
   - Log admin actions
   - Rate limiting

3. **Input Validation**
   - Sanitize all inputs
   - Validate on frontend and backend
   - Prevent XSS attacks

4. **HTTPS Only**
   - Force HTTPS in production
   - Secure cookies
   - CORS configuration

## Development

### Local Development
```bash
cd src/web
npm run dev
```

Visit `http://localhost:3000/admin`

### Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:7071
```

### Building for Production
```bash
npm run build
npm start
```

## Troubleshooting

### "API URL not configured"
- Check that `NEXT_PUBLIC_API_URL` is set in `.env.local`
- Restart the dev server after changing environment variables

### "Failed to fetch posts"
- Ensure the Azure Functions backend is running
- Check CORS configuration allows your frontend origin
- Verify the API endpoint is correct

### Posts not updating
- Refresh the page
- Check browser console for errors
- Verify backend is responding correctly

### Form validation errors
- All fields are required
- Check for empty spaces in inputs
- Ensure character limits aren't exceeded

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the backend logs
3. Verify environment configuration
4. Test API endpoints directly

## Version History

- **v1.0.0** (2025-10-19)
  - Initial admin dashboard release
  - Create and view posts
  - Edit functionality (UI only)
  - Delete confirmation (UI only)
  - Responsive design
  - Success/error notifications
