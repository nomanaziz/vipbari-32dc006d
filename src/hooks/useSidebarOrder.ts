import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "sidebar-menu-order";

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: any;
  permission?: string | null;
}

interface SavedOrder {
  groupOrder: string[];
  itemOrder: Record<string, string[]>;
}

function loadOrder(): SavedOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveOrder(order: SavedOrder) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

function applyOrder(groups: MenuGroup[], saved: SavedOrder | null): MenuGroup[] {
  if (!saved) return groups;

  const groupMap = new Map(groups.map((g) => [g.id, g]));

  // Sort groups by saved order
  const ordered: MenuGroup[] = [];
  for (const gid of saved.groupOrder) {
    const g = groupMap.get(gid);
    if (g) {
      ordered.push(g);
      groupMap.delete(gid);
    }
  }
  // Append any groups not in saved order
  groupMap.forEach((g) => ordered.push(g));

  // Sort items within each group
  return ordered.map((group) => {
    const savedItems = saved.itemOrder[group.id];
    if (!savedItems) return group;

    const itemMap = new Map(group.items.map((i) => [i.id, i]));
    const sortedItems: MenuItem[] = [];
    for (const iid of savedItems) {
      const item = itemMap.get(iid);
      if (item) {
        sortedItems.push(item);
        itemMap.delete(iid);
      }
    }
    itemMap.forEach((i) => sortedItems.push(i));
    return { ...group, items: sortedItems };
  });
}

export function useSidebarOrder(defaultGroups: MenuGroup[]) {
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(() => loadOrder());
  const [editMode, setEditMode] = useState(false);

  const orderedGroups = applyOrder(defaultGroups, savedOrder);

  const persistOrder = useCallback((groups: MenuGroup[]) => {
    const order: SavedOrder = {
      groupOrder: groups.map((g) => g.id),
      itemOrder: {},
    };
    groups.forEach((g) => {
      order.itemOrder[g.id] = g.items.map((i) => i.id);
    });
    saveOrder(order);
    setSavedOrder(order);
  }, []);

  const reorderGroups = useCallback((fromIndex: number, toIndex: number) => {
    const newGroups = [...orderedGroups];
    const [moved] = newGroups.splice(fromIndex, 1);
    newGroups.splice(toIndex, 0, moved);
    persistOrder(newGroups);
  }, [orderedGroups, persistOrder]);

  const reorderItems = useCallback((groupId: string, fromIndex: number, toIndex: number) => {
    const newGroups = orderedGroups.map((g) => {
      if (g.id !== groupId) return g;
      const newItems = [...g.items];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);
      return { ...g, items: newItems };
    });
    persistOrder(newGroups);
  }, [orderedGroups, persistOrder]);

  const resetOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedOrder(null);
  }, []);

  return {
    orderedGroups,
    editMode,
    setEditMode,
    reorderGroups,
    reorderItems,
    resetOrder,
  };
}
