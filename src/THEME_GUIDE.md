# Coachwise App - Theme Guide

## 🎨 Color System

### Primary Colors
- **Navy Blue**: `#0E0E55` - Headers, navigation, primary UI elements
- **Navy Light**: `#1A1A6E` - Hover states, secondary elements
- **Yellow**: `#eab308` - Buttons, highlights, active states, accents
- **Yellow Dark**: `#ca8a04` - Yellow hover states

### Background Colors
- **Page Background**: `bg-gray-100` (#F5F5F5)
- **Card Background**: `bg-white` (#FFFFFF)
- **Input Background**: `bg-white` (#FFFFFF)

### Text Colors
- **Primary Text**: `text-[#0E0E55]` - Headings
- **Secondary Text**: `text-gray-600` - Body text
- **Tertiary Text**: `text-gray-500` - Helper text
- **White Text**: `text-white` - On navy backgrounds

### Border Colors
- **Default Border**: `border-gray-200`
- **Active Border**: `border-yellow-500`

---

## 📐 Component Patterns

### Headers (All Pages)
```tsx
<div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
  <div className="flex items-center justify-between">
    <button className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg">
      <ArrowLeft className="w-6 h-6 text-white" />
    </button>
    <h2 className="text-white">Page Title</h2>
    <button className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400">
      Save
    </button>
  </div>
</div>
```

### Primary Buttons
```tsx
<button className="bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 px-4 py-2">
  Button Text
</button>
```

### Secondary Buttons
```tsx
<button className="bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] px-4 py-2">
  Button Text
</button>
```

### Cards
```tsx
<div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
  {/* Card Content */}
</div>
```

### Accent Cards (Yellow)
```tsx
<div className="bg-yellow-500 rounded-lg p-6 shadow-lg">
  <h2 className="text-[#0E0E55]">Title</h2>
  <p className="text-[#0E0E55]/80">Description</p>
</div>
```

### Navigation Bar
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-[#0E0E55] max-w-md mx-auto">
  <div className="flex items-center justify-around px-4 py-3">
    {/* Active item */}
    <button className="flex flex-col items-center gap-1 py-2 px-4 text-yellow-500">
      <Icon className="w-6 h-6" />
      <span className="text-xs">Label</span>
    </button>
    {/* Inactive item */}
    <button className="flex flex-col items-center gap-1 py-2 px-4 text-gray-300">
      <Icon className="w-6 h-6" />
      <span className="text-xs">Label</span>
    </button>
  </div>
</nav>
```

### Input Fields
```tsx
<input
  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#0E0E55]"
  placeholder="Enter text"
/>
```

### Tabs
```tsx
<div className="flex gap-3">
  <button className="flex-1 py-3 rounded-lg bg-yellow-500 text-[#0E0E55]">
    Active Tab
  </button>
  <button className="flex-1 py-3 rounded-lg bg-[#1A1A6E] text-gray-300 hover:bg-[#1A1A6E]/80">
    Inactive Tab
  </button>
</div>
```

---

## 🚫 DON'T USE

### Avoid These Colors
- ❌ Blue (`bg-blue-*`, `text-blue-*`)
- ❌ Green (`bg-green-*`, `text-green-*`) - except for success states
- ❌ Purple (`bg-purple-*`, `text-purple-*`)
- ❌ Pink (`bg-pink-*`, `text-pink-*`)
- ❌ Orange (`bg-orange-*`, `text-orange-*`)
- ❌ Cyan (`bg-cyan-*`, `text-cyan-*`)

### Exception: System Colors
- ✅ Red for errors/destructive actions: `bg-red-600`
- ✅ Green for success: `bg-green-600` (sparingly)

---

## 📱 Page Structure Template

```tsx
export function PageName() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Navy */}
      <div className="bg-[#0E0E55] px-4 py-6 sticky top-0 z-10">
        <h1 className="text-white">Page Title</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Yellow Accent Card */}
        <div className="bg-yellow-500 rounded-lg p-6 shadow-lg">
          <h2 className="text-[#0E0E55]">Highlight</h2>
        </div>

        {/* White Cards */}
        <div className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
          <h3 className="text-[#0E0E55] mb-3">Section</h3>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Usage Rules

1. **Headers**: Always `bg-[#0E0E55]` with `text-white`
2. **Primary Actions**: Always yellow buttons `bg-yellow-500 text-[#0E0E55]`
3. **Navigation**: Always navy `bg-[#0E0E55]` with yellow active state
4. **Page Background**: Always `bg-gray-100`
5. **Cards**: Always white `bg-white` with gray border
6. **Headings**: Use `text-[#0E0E55]` on white/gray backgrounds
7. **Icons**: Yellow `text-yellow-600` for accents, `text-gray-600` for neutral

---

## 🖼️ Figma Mockup Reference

### Color Tokens
```
Navy Primary: #0E0E55
Navy Secondary: #1A1A6E  
Yellow Primary: #eab308
Yellow Secondary: #ca8a04
Gray Background: #F5F5F5
White: #FFFFFF
Gray Border: #E5E5E5
Text Primary: #0E0E55
Text Secondary: #6B7280
Text Tertiary: #9CA3AF
```

### Typography
- Headings: Default font, use text-[#0E0E55]
- Body: Default font, use text-gray-600
- Small: text-sm for helper text

### Spacing
- Page padding: `p-4`
- Card padding: `p-5`
- Section gaps: `space-y-4`
- Element gaps: `gap-3`

### Border Radius
- Cards: `rounded-lg` (0.5rem)
- Buttons: `rounded-lg` (0.5rem)
- Inputs: `rounded-lg` (0.5rem)

### Shadows
- Cards: `shadow-md`
- Headers: No shadow (sticky)
- Floating buttons: `shadow-xl`
