# UI Components

Reusable UI components for the Coachwise application.

## StarRating

A star-based rating component for quality ratings and satisfaction scores.

### Features

- **Interactive Stars**: Click or hover to select rating
- **Visual Feedback**: Stars fill on hover to preview rating
- **Customizable**: Configurable max rating (default 10)
- **Numeric Display**: Shows current rating as "X/10"
- **Accessible**: Proper ARIA labels
- **Smooth Animations**: Scale effects on hover and click

### Usage

```tsx
import { StarRating } from '@/components/ui/StarRating';

function MyComponent() {
  const [quality, setQuality] = useState(5);

  return (
    <StarRating
      value={quality}
      onChange={setQuality}
      label="Session Quality"
      max={10}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current rating value |
| `onChange` | `(value: number) => void` | Required | Callback when rating changes |
| `max` | `number` | `10` | Maximum rating (number of stars) |
| `label` | `string` | `undefined` | Optional label above stars |
| `className` | `string` | `''` | Additional CSS classes |

### Use Cases

- ✅ Session quality ratings
- ✅ Workout satisfaction
- ✅ Coach ratings
- ✅ Exercise difficulty
- ✅ Any star-based feedback

### Example: Session Quality

```tsx
<StarRating
  value={quality}
  onChange={setQuality}
  label="How would you rate this session?"
  max={10}
/>
```

---

## HeatSlider

A volume-style slider with heat map gradient colors, perfect for ratings, intensity levels, or any scale-based inputs.

### Features

- **Heat Map Colors**: Gradient from green (low) → yellow → orange → red (high)
- **Swipeable**: Drag or click anywhere on the bar to set value
- **Visual Feedback**: Color-coded thumb and fill based on current value
- **Tooltip**: Shows numeric value on hover
- **Tick Marks**: Visual indicators for discrete levels
- **Touch Support**: Works on mobile devices
- **Accessible**: Proper ARIA labels and semantic HTML

### Usage

```tsx
import { HeatSlider } from '@/components/ui/HeatSlider';

function MyComponent() {
  const [intensity, setIntensity] = useState(5);

  return (
    <HeatSlider
      value={intensity}
      onChange={setIntensity}
      label="Intensity Level"
      min={1}
      max={10}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current value |
| `onChange` | `(value: number) => void` | Required | Callback when value changes |
| `min` | `number` | `1` | Minimum value |
| `max` | `number` | `10` | Maximum value |
| `label` | `string` | `undefined` | Optional label above slider |
| `className` | `string` | `''` | Additional CSS classes |

### Color Mapping

- **0-30% of range**: Green (#22c55e) - Low
- **30-50% of range**: Yellow (#eab308) - Medium-Low
- **50-70% of range**: Orange (#f97316) - Medium-High
- **70-100% of range**: Red (#ef4444) - High

### Use Cases

- ✅ Exercise intensity (1-10 scale)
- ✅ Session feedback/ratings
- ✅ Difficulty levels
- ✅ RPE (Rate of Perceived Exertion)
- ✅ Pain scales
- ✅ Satisfaction ratings
- ✅ Any scale-based user input

### Example: Session Feedback

```tsx
<HeatSlider
  value={rpe}
  onChange={setRpe}
  label="How hard was this workout?"
  min={1}
  max={10}
/>
```

### Example: Pain Scale

```tsx
<HeatSlider
  value={painLevel}
  onChange={setPainLevel}
  label="Pain Level"
  min={0}
  max={10}
/>
```

### Design Notes

- Follows Coachwise design system color palette
- Mobile-first with touch support
- Smooth transitions for better UX
- Hover tooltip prevents clutter
- Configurable range for different use cases
