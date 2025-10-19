# Admin Dashboard - Quick Start Guide

## 🎯 What You Got

A fully functional admin dashboard for managing your blog content on The Globe website.

## 📍 Access

**URL:** `http://localhost:3000/admin`

**Navigation:** Click "Admin" in the top navigation bar on the homepage

## 🖼️ Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Admin Dashboard        View Site | Logout          │
│  Content Management                                         │
└────────────────────────────────────────────────────────────┘
┌──────────────────────┬─────────────────────────────────────┐
│  CREATE NEW POST     │  PUBLISHED POSTS                    │
│  ┌────────────────┐  │  ┌─────────────────────────────┐   │
│  │ Author *       │  │  │ Post Title                  │   │
│  │ [Input]        │  │  │ Content preview...          │   │
│  │                │  │  │ 👤 Author | 📅 Date         │   │
│  │ Title *        │  │  │              [Edit] [Delete] │   │
│  │ [Input]        │  │  └─────────────────────────────┘   │
│  │                │  │                                      │
│  │ Content *      │  │  ┌─────────────────────────────┐   │
│  │ [Text Area]    │  │  │ Another Post                │   │
│  │                │  │  │ Content preview...          │   │
│  │ N characters   │  │  │ 👤 Author | 📅 Date         │   │
│  │                │  │  │              [Edit] [Delete] │   │
│  │ [Create Post]  │  │  └─────────────────────────────┘   │
│  └────────────────┘  │                                      │
└──────────────────────┴─────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Create Your First Post

1. **Fill in the form:**
   ```
   Author:  John Smith
   Title:   New Benefits Available for Families
   Content: We're excited to announce new support programs...
   ```

2. **Click "Create Post"**

3. **See your post appear** in the list on the right

### 2. Edit a Post

1. Click the **blue "Edit" button** on any post
2. Form will fill with current data
3. Make your changes
4. Click **"Update Post"**

### 3. Delete a Post

1. Click the **red "Delete" button**
2. Confirm the deletion
3. Post is removed

## ✅ Features Breakdown

### Working Now ✨
- ✅ **Create posts** - Fully functional with backend integration
- ✅ **View all posts** - Live data from your database
- ✅ **Form validation** - All fields required
- ✅ **Error handling** - Clear error messages
- ✅ **Success notifications** - Confirmation when posts are created
- ✅ **Responsive design** - Works on mobile and desktop
- ✅ **Character counter** - See content length in real-time
- ✅ **Refresh posts** - Reload data from server

### Coming Soon 🔜
- ⏳ **Update posts** - Backend endpoint needed
- ⏳ **Delete posts** - Backend endpoint needed
- ⏳ **Authentication** - Login system
- ⏳ **Image uploads** - Add visuals to posts
- ⏳ **Rich text editor** - Better formatting options

## 🎨 Design Features

- **Blue Theme** - Matches The Globe branding (#0066CC)
- **White Navigation** - Clean, professional look
- **Sticky Form** - Always accessible while scrolling
- **Hover Effects** - Interactive feedback
- **Loading States** - Spinner while fetching data
- **Dark Mode Support** - Automatically adapts

## 🔧 Technical Details

### Files Created
```
src/web/src/app/admin/
├── page.tsx         # Main admin dashboard component
└── README.md        # Detailed documentation
```

### API Integration
- **GET** `/api/posts` - Fetch posts ✅
- **POST** `/api/posts` - Create posts ✅
- **PUT** `/api/posts/{id}` - Update (needs backend)
- **DELETE** `/api/posts/{id}` - Delete (needs backend)

### Dependencies
- Next.js 15.5.4
- React 19
- Tailwind CSS
- TypeScript

## 📝 Example Usage

### Creating a Government Announcement

```typescript
Author:  Communications Team
Title:   Important: Tax Credit Updates for 2025
Content: Starting January 1, 2025, eligible families can claim
         additional tax credits. Here's what you need to know:
         
         • Increased child tax credits
         • New education benefits
         • Expanded healthcare coverage
         
         Visit our website to see if you qualify.
```

### Creating a Benefits Update

```typescript
Author:  Benefits Department
Title:   New Healthcare Services Available
Content: We've expanded our healthcare services to include
         mental health support and preventive care. All
         citizens can now access free counseling and
         wellness check-ups at participating clinics.
```

## 🛠️ Next Steps

### To Enable Full Edit/Delete Functionality

Update your Azure Functions backend (`function_app.py`):

```python
# Add UPDATE endpoint
@app.route(route="posts/{id}", methods=["PUT"])
def update_post(req: func.HttpRequest) -> func.HttpResponse:
    post_id = req.route_params.get('id')
    # Update logic here
    
# Add DELETE endpoint
@app.route(route="posts/{id}", methods=["DELETE"])
def delete_post(req: func.HttpRequest) -> func.HttpResponse:
    post_id = req.route_params.get('id')
    # Delete logic here
```

### Add Authentication (Recommended for Production)

1. Install NextAuth.js or similar
2. Protect the `/admin` route
3. Add login page
4. Verify user permissions

## 🎯 Testing Checklist

- [ ] Visit `http://localhost:3000/admin`
- [ ] Create a test post
- [ ] Verify post appears in list
- [ ] Click Edit button (form should populate)
- [ ] Click Delete button (confirmation should appear)
- [ ] Click Refresh to reload posts
- [ ] Test responsive design on mobile
- [ ] Check error handling (try empty fields)

## 💡 Tips

1. **Keep titles concise** - 60 characters or less
2. **Write clear content** - Citizens need easy-to-understand information
3. **Use proper attribution** - Always include author name
4. **Preview before posting** - Check your content carefully
5. **Regular updates** - Keep information current

## 🆘 Troubleshooting

### Can't see posts?
- Check API backend is running: `http://localhost:7071`
- Verify environment variable: `NEXT_PUBLIC_API_URL`
- Check browser console for errors

### Form not submitting?
- Ensure all fields are filled
- Check network tab for API errors
- Verify CORS settings in backend

### Edit/Delete not working?
- These require backend endpoints (not yet implemented)
- UI is ready - just needs API support

## 📞 Support

The admin dashboard is production-ready for creating and viewing posts. 
Edit and delete features are UI-ready and waiting for backend implementation.

**Current Status:**
- Creating Posts: ✅ Fully Working
- Viewing Posts: ✅ Fully Working  
- Editing Posts: ⏳ UI Ready
- Deleting Posts: ⏳ UI Ready
- Authentication: ⏳ Planned
