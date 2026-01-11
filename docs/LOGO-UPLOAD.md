# Logo Upload Instructions

## Replacing the Placeholder Logo

Currently, the login page uses a placeholder logo component (`LogoPlaceholder`) that displays "VH" in a circle. To replace it with your actual company logo:

### Option 1: Using an Image File (Recommended)

1. **Save your company logo** to the `/public/` directory:
   - For SVG: `/public/logo.svg`
   - For PNG: `/public/logo.png`
   - For other formats: `/public/logo.{extension}`

2. **Update the login page** at `/src/app/(auth)/login/page.tsx`:

   **Find these lines:**
   ```tsx
   import { LogoPlaceholder } from '@/components/logo-placeholder'
   ```

   **Replace with:**
   ```tsx
   import Image from 'next/image'
   ```

   **Then find:**
   ```tsx
   <div className="mb-8">
     <LogoPlaceholder size={120} />
   </div>
   ```

   **Replace with:**
   ```tsx
   <div className="mb-8">
     <Image
       src="/logo.svg"
       alt="Valour Holdings"
       width={120}
       height={120}
       className="mx-auto"
     />
   </div>
   ```

   **And for mobile view, find:**
   ```tsx
   <div className="flex justify-center mb-4">
     <LogoPlaceholder size={80} />
   </div>
   ```

   **Replace with:**
   ```tsx
   <div className="flex justify-center mb-4">
     <Image
       src="/logo.svg"
       alt="Valour Holdings"
       width={80}
       height={80}
     />
   </div>
   ```

3. **Adjust dimensions if needed** - Change the `width` and `height` values to match your logo's aspect ratio.

### Option 2: Using a Custom Component

If you prefer more control over the logo styling:

1. Create a new file `/src/components/company-logo.tsx`:

```tsx
import Image from 'next/image'

interface CompanyLogoProps {
  size?: number
  className?: string
}

export function CompanyLogo({ size = 120, className }: CompanyLogoProps) {
  return (
    <div className={className}>
      <Image
        src="/logo.svg"
        alt="Valour Holdings"
        width={size}
        height={size}
        className="mx-auto"
        priority
      />
    </div>
  )
}
```

2. Update `/src/app/(auth)/login/page.tsx`:
   - Replace `import { LogoPlaceholder } from '@/components/logo-placeholder'`
   - With `import { CompanyLogo } from '@/components/company-logo'`
   - Replace `<LogoPlaceholder size={120} />` with `<CompanyLogo size={120} />`

## Logo Requirements

### File Specifications
- **Format**: SVG (preferred) or PNG with transparent background
- **Size**: 120x120px to 200x200px recommended
- **Color**: Should work well on dark background (sidebar color)
- **File location**: `/public/` directory
- **Naming**: Use a clear name like `logo.svg`, `company-logo.svg`, or `valour-logo.svg`

### Design Considerations
- Logo should be legible on the dark sidebar background (`bg-sidebar`)
- If your logo is dark, consider providing a light version for dark mode
- Square or circular logos work best for the current layout
- Avoid logos with small text that may not be readable at 120x120px

## Adding Logo to Sidebar

To also add the logo to the dashboard sidebar:

1. Open `/src/components/app-sidebar.tsx`

2. Find the `<SidebarHeader>` section (around line 40)

3. Replace the current icon:
   ```tsx
   <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary">
     <LayoutDashboard className="size-4" />
   </div>
   ```

   With your logo:
   ```tsx
   <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
     <Image
       src="/logo.svg"
       alt="Valour Holdings"
       width={32}
       height={32}
     />
   </div>
   ```

## Testing After Upload

After replacing the logo, verify:

- [ ] Logo displays correctly on login page (desktop view)
- [ ] Logo displays correctly on mobile view (smaller size)
- [ ] Logo has proper contrast against dark sidebar background
- [ ] Logo loads without errors in browser console
- [ ] Logo appears sharp (not pixelated)
- [ ] Logo sizing is appropriate
- [ ] Logo is centered properly

## Troubleshooting

### Logo not appearing
- Check that the file is in `/public/` directory
- Verify the file path in your import matches the actual filename
- Clear browser cache and hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

### Logo appears blurry
- Use SVG format instead of PNG for crisp scaling
- If using PNG, ensure it's at least 2x the display size (240x240px for 120x120 display)

### Logo doesn't fit properly
- Adjust the `width` and `height` props in the Image component
- For non-square logos, calculate proportional dimensions
- Consider adding `objectFit="contain"` to the Image component

### Logo color doesn't work with dark background
- Edit your logo SVG to use lighter colors
- Or create a separate light version for dark mode
- You can conditionally render different logos based on theme if needed

## Need Help?

If you encounter issues replacing the logo, you can:
1. Keep using the placeholder temporarily
2. Adjust the placeholder component colors/text in `/src/components/logo-placeholder.tsx`
3. Consult with your development team for custom logo integration
