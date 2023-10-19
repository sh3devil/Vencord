/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { debounce } from "@utils/debounce";
import { proxyLazy } from "@utils/lazy";
import { FluxDispatcher, UserStore } from "@webpack/common";

import { getUsersDecorations } from "../api";
import { SKU_ID } from "../constants";
import { create } from "../zustand";

interface UsersDecorationsState {
    usersDecorations: Map<string, string | null>;
    fetchQueue: Set<string>;
    bulkFetch: () => Promise<void>;
    fetch: (userId: string, force?: boolean) => Promise<void>;
    fetchMany: (userIds: string[]) => Promise<void>;
    get: (userId: string) => string | null | undefined;
    has: (userId: string) => boolean;
    set: (userId: string, decoration: string | null) => void;
}

export const useUsersDecorationsStore = proxyLazy(() => create<UsersDecorationsState>((set, get) => ({
    usersDecorations: new Map(),
    fetchQueue: new Set(),
    bulkFetch: debounce(async () => {
        const { fetchQueue, usersDecorations } = get();

        set({ fetchQueue: new Set() });

        const fetchIds = Array.from(fetchQueue);
        const fetchedUsersDecorations = await getUsersDecorations(fetchIds);

        const newUsersDecorations = new Map(usersDecorations);

        for (const [userId, decoration] of Object.entries(fetchedUsersDecorations)) {
            newUsersDecorations.set(userId, decoration);

            const user = UserStore.getUser(userId) as any;
            if (user) {
                user.avatarDecoration = decoration ? { asset: decoration, skuId: SKU_ID } : null;
                user.avatarDecorationData = user.avatarDecoration;

                FluxDispatcher.dispatch({ type: "USER_UPDATE", user });
            }
        }

        for (const fetchedId of fetchIds) {
            if (!newUsersDecorations.has(fetchedId)) newUsersDecorations.set(fetchedId, null);
        }

        set({ usersDecorations: newUsersDecorations });
    }),
    async fetch(userId: string, force: boolean = false) {
        const { usersDecorations, fetchQueue, bulkFetch } = get();

        if (!force && usersDecorations.has(userId)) return;

        set({ fetchQueue: new Set(fetchQueue).add(userId) });
        bulkFetch();
    },
    async fetchMany(userIds) {
        if (!userIds.length) return;
        const { usersDecorations, fetchQueue, bulkFetch } = get();

        const newFetchQueue = new Set(fetchQueue);
        for (const userId of userIds) {
            if (!usersDecorations.has(userId)) newFetchQueue.add(userId);
        }

        set({ fetchQueue: newFetchQueue });
        bulkFetch();
    },
    get(userId: string) { return get().usersDecorations.get(userId); },
    has(userId: string) { return get().usersDecorations.has(userId); },
    set(userId: string, decoration: string | null) {
        const { usersDecorations } = get();
        const newUsersDecorations = new Map(usersDecorations);

        newUsersDecorations.set(userId, decoration);
        set({ usersDecorations: newUsersDecorations });
    }
})));
