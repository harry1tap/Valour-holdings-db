# UI/UX Requirements & Component Specifications
## Valour Holdings Solar Lead Management Dashboard

**Version:** 1.0  
**Date:** January 8, 2026  
**Design System:** Custom (based on shadcn/ui + Tailwind CSS)  
**Target Devices:** Desktop (primary), Tablet, Mobile (secondary)

---

## 1. Design Overview

### 1.1 Core Design Principles
- **Data-First:** Metrics are primary, easy to scan
- **Role-Appropriate:** Each user sees relevant data only
- **Real-Time Clarity:** Updates seamless, status always visible
- **Professional:** Clean, business-appropriate aesthetics
- **Accessible:** WCAG 2.1 AA compliant

### 1.2 Visual Style
- Modern, minimalist interface
- Generous white space
- Clear typography hierarchy
- Professional color palette
- Consistent component patterns

---

## 2. Color System

```css
/* Primary Colors */
--primary: #0066CC;
--primary-dark: #004C99;
--primary-light: #3385D6;

/* Semantic Colors */
--success: #10B981;  /* Good surveys, positive trends */
--warning: #F59E0B;  /* Attention needed */
--danger: #EF4444;   /* Bad surveys, errors */
--info: #3B82F6;     /* Informational */

/* Neutral Grays */
--gray-50: #F9FAFB;   /* Page background */
--gray-100: #F3F4F6;  /* Card hover */
--gray-600: #4B5563;  /* Secondary text */
--gray-900: #111827;  /* Primary text */

/* Chart Colors */
--chart-1: #0066CC;
--chart-2: #10B981;
--chart-3: #F59E0B;
--chart-4: #EF4444;
```

**Usage Guidelines:**
- Good Survey = Green badge/text
- Bad Survey = Red badge/text
- Sold Survey = Blue badge/text
- Positive trends = Green with up arrow
- Negative trends = Red with down arrow

---

## 3. Typography

**Font Family:** System UI Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Type Scale:**
- Page Title: 36px, Semibold
- Section Header: 24px, Semibold
- Card Title: 14px, Medium, Uppercase, Gray-600
- Metric Value: 48px, Bold (for main KPIs)
- Body Text: 16px, Regular
- Small Text: 14px, Regular

---

## 4. Layout Structure

```
┌──────────────────────────────────────────────────┐
│ Header (64px) - Logo, Nav, User Menu            │
├────────┬─────────────────────────────────────────┤
│Sidebar │ Main Content                            │
│(240px) │                                         │
│        │ Date Filter (sticky)                    │
│        │ ┌─────────────────────────────────────┐│
│Home    │ │ Dashboard Content                   ││
│Leads   │ │                                     ││
│Team    │ │                                     ││
│Settings│ └─────────────────────────────────────┘│
└────────┴─────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1023px (collapsible sidebar)
- Desktop: ≥ 1024px (full layout)

---

## 5. Key Components

### 5.1 MetricCard Component

**Purpose:** Display single KPI with trend

```
┌───────────────────────────┐
│ TOTAL LEADS               │ ← Label (small, gray)
│ 1,234          ↑ 5.2%    │ ← Value (large) + Trend
│ ___________________       │ ← Sparkline (optional)
└───────────────────────────┘
```

**Variants:**
- Large (primary KPIs)
- Medium (secondary metrics)
- With/without trend indicator
- With/without sparkline

### 5.2 DateRangeFilter Component

**Position:** Sticky at top of content area

```
[This Month ▼] [Custom Range...] [Apply]
```

**Presets:**
- This Month (default)
- Last Month
- Last Quarter
- Last Year  
- Custom Range (date picker)

**Behavior:**
- Persists in URL (?from=X&to=Y)
- Applies to all metrics and charts
- Updates real-time as you select

### 5.3 LeadTable Component

**Features:**
- Sortable columns
- Search (name, postcode, tel)
- Filters (status, survey status, AM, FR)
- Pagination (50 per page)
- Row click opens detail modal

**Columns:**
- Customer Name
- Postcode
- Status
- Survey Status (color-coded badge)
- Account Manager
- Field Rep
- Created Date
- Actions (View button)

**Mobile:** Cards instead of table rows

### 5.4 LeadDetailModal Component

**Layout:**
```
┌─────────────────────────────────┐
│ Lead Details              [✕]  │
│─────────────────────────────────│
│ Customer Information            │
│ Name, Email, Tel, Address       │
│                                 │
│ Lead Details                    │
│ Status, Survey Status, AM, FR   │
│                                 │
│ Timeline                        │
│ Created → Booked → Complete     │
│                                 │
│ ▼ Notes (Expandable)           │
│   Customer notes here...        │
│                                 │
│ ▼ Fall Off Reason (if failed)  │
│   Reason for falling off...     │
│                                 │
│ [Edit (Admin)] [Close]         │
└─────────────────────────────────┘
```

**Sections:**
- Customer info (always visible)
- Lead details (always visible)
- Timeline (always visible)
- Notes (expandable, all roles see)
- Fall_Off_Reason (expandable, Admin/AM only)

### 5.5 Chart Components

**LineChart - Trends Over Time:**
- Shows leads/surveys over selected date range
- Smooth line with fill
- Hover shows exact values
- Responsive sizing

**BarChart - Staff Comparisons:**
- Horizontal bars for staff performance
- Sorted by performance (desc)
- Color-coded by metric type

**DonutChart - Status Breakdown:**
- Survey status distribution
- Color matches badge colors
- Center shows total count
- Legend below

---

## 6. Page Layouts

### 6.1 Dashboard Page (`/dashboard`)

**Layout (Desktop 3-column grid):**
```
[Date Filter - Sticky]

[Total Leads]  [Surveys Booked]  [Good Surveys]
[Bad Surveys]  [Sold Surveys]    [Cost/Lead]

[Lead Trend Line Chart - Full Width]

[Conversion Rates]  [Survey Breakdown]
[Bar Chart]         [Donut Chart]

[Staff Performance Table - Full Width]
```

**Role-Based Views:**
- **Admin:** Sees everything, all staff
- **Account Manager:** Filtered to their leads + their Field Reps
- **Field Rep:** Only their personal metrics

### 6.2 Leads Page (`/leads`)

```
Leads
[Search...] [Status ▼] [Survey ▼] [AM ▼] [FR ▼]

┌─────────────────────────────────────────────┐
│ Lead Table                                  │
│ [Sortable, paginated, clickable rows]      │
└─────────────────────────────────────────────┘
```

### 6.3 Team Performance Page (`/team`)
**Admin & Account Manager only**

```
Team Performance
[Date Filter] [Role: Field Reps ▼]

[Performance Comparison Bar Chart]

┌─────────────────────────────────────────────┐
│ Staff Performance Table                     │
│ Name | Leads | Good | Bad | Sold | Conv %  │
└─────────────────────────────────────────────┘
```

### 6.4 Settings Page (`/settings`)
**Admin only**

- User Management (CRUD users)
- Audit Log
- Profile Settings

---

## 7. Interaction Patterns

### 7.1 Loading States

**Skeleton Loaders:**
- Match final content layout
- Pulsing gray animation
- Use for initial page load

**Spinners:**
- Small, inline for button actions
- Centered for table refreshes

### 7.2 Real-Time Updates

**Indicators:**
- Green dot = "Live"  
- Pulse animation on update
- Smooth value transitions (300ms)

**Update Behavior:**
- New data fades in
- Changed values highlighted briefly (2s)
- Charts re-render smoothly

### 7.3 Error Handling

**Toast Notifications:**
- Success: Green with checkmark (3s)
- Error: Red with X (5s)
- Position: Top-right
- Dismissible

**Inline Errors:**
- Below form field
- Red text with icon
- Clear message

### 7.4 Empty States

**No Data:**
- Icon + "No leads found"
- Suggest action or wait for data

**No Search Results:**
- "No results for 'query'"
- [Clear filters] button

---

## 8. Accessibility

### 8.1 Keyboard Navigation

**Tab Order:**
- Skip to main content
- Header → Sidebar → Main content
- All interactive elements

**Shortcuts:**
- `/` → Focus search
- `Esc` → Close modal
- Arrow keys → Navigate table

### 8.2 Screen Readers

**ARIA Labels:**
- All buttons labeled
- Loading states announced
- Form errors announced
- Live regions for updates

**Semantic HTML:**
- Proper heading hierarchy
- `<nav>` for navigation
- `<main>` for content
- `<table>` for tabular data

### 8.3 Visual

**Contrast:**
- Text: minimum 4.5:1
- Never color-only indicators
- Icons + text for status

**Focus:**
- Visible 2px blue outline
- Never remove without replacement

---

## 9. Mobile Responsive

### 9.1 Mobile Layout

**Header:**
- Hamburger menu (left)
- Logo (center)
- User menu (right)

**Navigation:**
- Slide-in sidebar from left
- Backdrop overlay

**Dashboard:**
- Single column cards
- Simplified charts
- Touch-friendly (44x44px minimum)

**Tables:**
- Card layout instead of table
- Stack information vertically
- Swipe for actions

### 9.2 Touch Interactions

**Gestures:**
- Pull to refresh (dashboard)
- Swipe left for actions (leads)
- Tap anywhere on card to open

---

## 10. Animation Guidelines

**Durations:**
- Fast: 150ms (hover)
- Medium: 300ms (transitions)
- Slow: 500ms (charts, complex)

**Easing:**
- `ease-in-out` (default)
- Use `transform` and `opacity` only
- Avoid width/height animations

**Number Counters:**
- Animate from 0 → value on load
- 500ms duration
- Smooth transition on updates

---

## 11. Component Library

**Base UI (shadcn/ui):**
- Button (5 variants)
- Card
- Table
- Dialog/Modal
- Select/Dropdown
- Input
- DatePicker
- Checkbox
- Badge
- Toast

**Custom Components:**
- MetricCard
- DateRangeFilter
- LeadTable
- LeadDetailModal
- LineChart
- BarChart
- DonutChart
- LoadingSkeleton
- EmptyState

**Icons (Lucide React):**
- TrendingUp/Down
- Users, User
- Search, Filter
- Calendar
- ChevronDown/Right
- X, Check
- AlertCircle, Info
- Download
- Edit, Trash
- LogOut

---

## 12. Performance Targets

- First Paint: < 1.5s
- Time to Interactive: < 3s
- Dashboard load: < 2s
- Bundle size: < 300KB gzipped

**Optimization:**
- Code splitting per route
- Lazy load charts
- Image optimization (if used)
- React Query caching

---

## 13. Browser Support

**Primary:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS Safari 14+
- Chrome Mobile 90+

**Not Supported:**
- Internet Explorer

---

## 14. Design Tokens (Tailwind Config)

```javascript
// Key colors, spacing, typography defined
// Claude Code should implement full Tailwind config
// Based on values in sections 2-3
```

---

## 15. Implementation Checklist for Claude Code

### Components to Build:
- [ ] AppShell (layout)
- [ ] Header
- [ ] Sidebar
- [ ] MetricCard
- [ ] DateRangeFilter
- [ ] LeadTable
- [ ] LeadDetailModal
- [ ] LineChart
- [ ] BarChart
- [ ] DonutChart
- [ ] LoadingSkeleton
- [ ] Toast system
- [ ] ConfirmDialog
- [ ] EmptyState

### Pages to Build:
- [ ] Login page
- [ ] Dashboard page (role-based)
- [ ] Leads page
- [ ] Team performance page
- [ ] Settings page (admin)

### Features:
- [ ] Real-time metric updates
- [ ] Date range filtering
- [ ] Search and filtering
- [ ] Lead detail expansion
- [ ] Responsive design
- [ ] Keyboard navigation
- [ ] Loading states
- [ ] Error handling

---

**Document Status:** ✅ Ready for Implementation  
**Design Tool:** Tailwind CSS + shadcn/ui  
**Next Steps:** Begin component development with Claude Code
