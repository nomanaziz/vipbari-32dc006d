

# Reorder Sidebar Menu + Drag & Drop Menu Ordering

## 1. Fixed Menu Reorder

Change the `landlordGroups` array order in `AppSidebar.tsx` from:
```
Home → Property → Tenant → Finance → Communication → Administration
```
to:
```
Home → Tenant Management → Finance → Communication → Property Management → Administration
```

Also reorder the same groups in `MobileBottomNav.tsx` "More" sheet to match.

## 2. Drag & Drop Menu Ordering System

Allow landlords to reorder sidebar menu items within groups and reorder groups themselves.

### Approach
- Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (lightweight, accessible)
- Store custom order in `localStorage` under key `sidebar-menu-order`
- Add a "Customize Menu" button (gear icon) at the bottom of the sidebar that toggles edit mode
- In edit mode, drag handles appear on each menu item and group
- A "Reset to Default" button restores original order

### Files to Create/Modify

1. **Create** `src/hooks/useSidebarOrder.ts` — Hook to manage menu order state
   - Reads saved order from `localStorage`
   - Provides `reorderGroups()`, `reorderItems()`, `resetOrder()` functions
   - Returns sorted groups based on saved order

2. **Modify** `src/components/AppSidebar.tsx`
   - Reorder default `landlordGroups` array (Tenant → Finance → Communication → Property → Admin)
   - Import and use `useSidebarOrder` hook
   - Wrap groups in `DndContext` + `SortableContext` when in edit mode
   - Add edit mode toggle button at sidebar bottom
   - Add drag handle icons (GripVertical) to each item in edit mode

3. **Modify** `src/components/MobileBottomNav.tsx`
   - Match the new default group order
   - Apply saved order from `localStorage` (same key)

4. **Install** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### localStorage Schema
```json
{
  "groupOrder": ["home", "tenants", "finance", "communication", "property", "admin"],
  "itemOrder": {
    "tenants": ["tenants", "guests", "complaints", "notices", "leases"],
    "finance": ["bills", "payments", "accounting"]
  }
}
```

### UX Flow
1. Normal mode: sidebar looks as usual, groups displayed in saved/default order
2. Click gear icon → edit mode: drag handles appear, items become draggable
3. Drag to reorder → auto-saves to localStorage
4. Click "Done" → exit edit mode
5. "Reset" button → clears localStorage, reverts to default order

