---
created: 2026-06-02
status: active
tags: [ui, components, shadcn, tailwind]
---

# UI Component Library — shadcn/ui + Tailwind

The UI layer uses **shadcn/ui** (React components built on Radix UI primitives) styled with **Tailwind CSS**.

---

## Component Inventory (`src/components/ui/`)

### Layout & Structure
| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| `container` | — | Tailwind container utility |
| `card.jsx` | — | Content cards, dashboard widgets |
| `sheet.jsx` | Dialog | Slide-in panels on mobile |
| `sidebar.jsx` | — | Admin sidebar navigation |
| `resizable.jsx` | Resizable | Resizable panels |
| `scroll-area.jsx` | ScrollArea | Custom scrollable containers |
| `aspect-ratio.jsx` | AspectRatio | Image aspect ratio containers |

### Navigation
| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| `tabs.jsx` | Tabs | Tabbed content (dashboard, profile) |
| `menubar.jsx` | Menubar | Top navigation menus |
| `breadcrumb.jsx` | — | Page breadcrumb trails |
| `pagination.jsx` | — | Paginated lists |
| `navigation-menu.jsx` | NavigationMenu | Main nav links |
| `dropdown-menu.jsx` | DropdownMenu | User menu, actions |
| `context-menu.jsx` | ContextMenu | Right-click actions |

### Forms & Input
| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| `button.jsx` | — | All button variants |
| `input.jsx` | — | Text inputs |
| `textarea.jsx` | — | Multi-line text |
| `select.jsx` | Select | Dropdown selects |
| `checkbox.jsx` | Checkbox | Checkboxes |
| `radio-group.jsx` | RadioGroup | Radio button groups |
| `switch.jsx` | Switch | Toggle switches |
| `slider.jsx` | Slider | Range sliders |
| `input-otp.jsx` | — | OTP code input |
| `form.jsx` | — | Form validation wrapper |
| `label.jsx` | Label | Form labels |

### Feedback & Overlays
| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| `dialog.jsx` | Dialog | Modal dialogs |
| `alert-dialog.jsx` | AlertDialog | Confirmation dialogs |
| `drawer.jsx` | Dialog | Bottom drawer on mobile |
| `popover.jsx` | Popover | Tooltip-like popups |
| `hover-card.jsx` | HoverCard | Preview on hover |
| `tooltip.jsx` | Tooltip | Hover tooltips |
| `toast.jsx` | Toast | Notification toasts |
| `toaster.jsx` | — | Toast container |
| `sonner.jsx` | — | Sonner toast integration |
| `alert.jsx` | — | Inline alerts |
| `progress.jsx` | Progress | Progress bars |
| `skeleton.jsx` | — | Loading skeletons |

### Data Display
| Component | Radix Primitive | Usage |
|-----------|----------------|-------|
| `table.jsx` | — | Data tables |
| `badge.jsx` | — | Status badges, tags |
| `avatar.jsx` | Avatar | User/barber avatars |
| `carousel.jsx` | — | Image carousels |
| `accordion.jsx` | Accordion | Expandable sections |
| `collapsible.jsx` | Collapsible | Collapsible panels |
| `separator.jsx` | Separator | Visual dividers |
| `chart.jsx` | — | Recharts integration |
| `command.jsx` | Command | Command palette / search |
| `calendar.jsx` | — | Date picker calendar |
| `toggle.jsx` | Toggle | Toggle buttons |
| `toggle-group.jsx` | ToggleGroup | Toggle button groups |

---

## Tailwind Config (`tailwind.config.js`)

Custom theme extending default Tailwind:
- **Colors:** Brand palette (primary, accent for gold/barbershop vibe)
- **Border radius:** shadcn defaults
- **Animations:** Custom keyframes for modals, toasts, transitions
- **Dark mode:** Class-based toggle (via `useDarkMode.js`)

## Styling Patterns

```jsx
// Consistent component pattern
import { cn } from '@/lib/utils'
// cn() merges Tailwind classes, handles conflicts

// shadcn variant pattern
<Button variant="default" size="sm" />
<Button variant="outline" size="lg" />
<Button variant="ghost" size="icon" />

// Dark mode class
<div className="bg-white dark:bg-gray-900">
```
