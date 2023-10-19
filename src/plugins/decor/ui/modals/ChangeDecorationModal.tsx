/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NoneIcon, PlusIcon } from "@components/Icons";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { findByPropsLazy, waitFor } from "@webpack";
import { Button, ContextMenu, Forms, i18n, Text, Tooltip, useEffect, UserStore, useState } from "@webpack/common";
import cl from "plugins/decor/lib/utils/cl";

import { Decoration, getPresets, Preset } from "../../lib/api";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import discordifyDecoration from "../../lib/utils/discordifyDecoration";
import requireAvatarDecorationModal from "../../lib/utils/requireAvatarDecorationModal";
import { AvatarDecorationPreview, DecorationGridDecoration, DecorationGridItem } from "../components";
import DecorationContextMenu from "../components/DecorationContextMenu";
import { openCreateDecorationModal } from "./CreateDecorationModal";

let MasonryList;
waitFor("MasonryList", m => {
    ({ MasonryList } = m);
});
const DecorationModalStyles = findByPropsLazy("modalFooterShopButton");
const DecorationComponentStyles = findByPropsLazy("decorationGridItemChurned");
const ModalStyles = findByPropsLazy("closeWithCircleBackground");

interface Section {
    title: string;
    subtitle?: string;
    itemKeyPrefix: string;
    items: ("none" | "create" | Decoration)[];
}
export default function ChangeDecorationModal(props: any) {
    // undefined = not trying, null = none, Decoration = selected
    const [tryingDecoration, setTryingDecoration] = useState<Decoration | null | undefined>(undefined);
    const isTryingDecoration = typeof tryingDecoration !== "undefined";

    const {
        decorations,
        selectedDecoration,
        fetch: fetchUserDecorations,
        select: selectDecoration
    } = useCurrentUserDecorationsStore();

    useEffect(() => {
        fetchUserDecorations();
    }, []);

    const activeSelectedDecoration = isTryingDecoration ? tryingDecoration : selectedDecoration;

    const [presets, setPresets] = useState<Preset[]>([]);

    useEffect(() => { getPresets().then(setPresets); }, []);

    const presetDecorations = presets.flatMap(preset => preset.decorations);

    const activeDecorationPreset = presets.find(preset => preset.id === activeSelectedDecoration?.presetId);
    const isActiveDecorationPreset = typeof activeDecorationPreset !== "undefined";

    const ownDecorations = decorations.filter(d => !presetDecorations.some(p => p.hash === d.hash));

    const masonryListData = [
        {
            title: "Your Decor Decorations",
            itemKeyPrefix: "ownDecorations",
            items: ["none", ...ownDecorations, "create"]
        },
        ...presets.map(preset => ({
            title: preset.name,
            subtitle: preset.description || undefined,
            itemKeyPrefix: `preset-${preset.id}`,
            items: preset.decorations
        }))
    ] as Section[];

    return <ModalRoot
        {...props}
        size={ModalSize.MEDIUM}
        className={DecorationModalStyles.modal}
    >
        <ModalHeader separator={false} className={cl("modal-header")}>
            <Text
                color="header-primary"
                variant="heading-lg/semibold"
                tag="h1"
                style={{ flexGrow: 1 }}
            >
                Change Decor Decoration
            </Text>
            <ModalCloseButton onClick={props.onClose} />
        </ModalHeader>
        <ModalContent
            className={cl("change-decoration-modal-content")}
            scrollbarType="none"
        >
            <MasonryList
                className={DecorationComponentStyles.list}
                columns={3}
                sectionGutter={16}
                fade
                getItemHeight={() => 80}
                getItemKey={(section, index) => {
                    const sectionData = masonryListData[section];
                    const item = sectionData.items[index];
                    return `${sectionData.itemKeyPrefix}-${typeof item === "string" ? item : item.hash}`;
                }}
                getSectionHeight={section => {
                    const data = masonryListData[section];
                    if (data.subtitle) {
                        return data.subtitle.length > 32 ? 60 : 40;
                    } else return 16;
                }}
                itemGutter={12}
                paddingHorizontal={12}
                paddingVertical={0}
                removeEdgeItemGutters
                renderItem={(section, index, style) => {
                    const item = masonryListData[section].items[index];

                    // TODO: this can probably be way less duplicated
                    if (typeof item === "string") {
                        switch (item) {
                            case "none":
                                return <DecorationGridItem
                                    isSelected={activeSelectedDecoration === null}
                                    onSelect={() => setTryingDecoration(null)}
                                    style={style}
                                >
                                    <NoneIcon />
                                    <Text
                                        variant="text-xs/normal"
                                        color="header-primary"
                                    >
                                        {i18n.Messages.NONE}
                                    </Text>
                                </DecorationGridItem>;
                            case "create":
                                if (decorations.some(d => d.reviewed === false)) {
                                    return <Tooltip text="You already have a decoration pending review">
                                        {tooltipProps => <DecorationGridItem
                                            {...tooltipProps}
                                            style={style}
                                        >
                                            <PlusIcon style={{ padding: "3px" }} />
                                            <Text
                                                variant="text-xs/normal"
                                                color="header-primary"
                                            >
                                                Create
                                            </Text>
                                        </DecorationGridItem>
                                        }
                                    </Tooltip>;
                                } else {
                                    return <DecorationGridItem
                                        onSelect={openCreateDecorationModal}
                                        style={style}
                                    >
                                        <PlusIcon style={{ padding: "3px" }} />
                                        <Text
                                            variant="text-xs/normal"
                                            color="header-primary"
                                        >
                                            Create
                                        </Text>
                                    </DecorationGridItem>;
                                }
                        }
                    } else {
                        if (item.reviewed === false) {
                            return <Tooltip text={"Pending review"}>
                                {tooltipProps => (
                                    <DecorationGridDecoration
                                        {...tooltipProps}
                                        onContextMenu={e => {
                                            ContextMenu.open(e, () => (
                                                <DecorationContextMenu
                                                    decoration={item}
                                                />
                                            ));
                                        }}
                                        style={style}
                                        isSelected={activeSelectedDecoration?.hash === item.hash}
                                        avatarDecoration={discordifyDecoration(item)}
                                    />
                                )}
                            </Tooltip>;
                        } else {
                            return <DecorationGridDecoration
                                onContextMenu={e => {
                                    ContextMenu.open(e, () => (
                                        <DecorationContextMenu
                                            decoration={item}
                                        />
                                    ));
                                }}
                                style={style}
                                onSelect={() => setTryingDecoration(item)}
                                isSelected={activeSelectedDecoration?.hash === item.hash}
                                avatarDecoration={discordifyDecoration(item)}
                            />;
                        }
                    }
                }}
                renderSection={section => <div>
                    <Forms.FormTitle>{masonryListData[section].title}</Forms.FormTitle>
                    {typeof masonryListData[section].subtitle !== "undefined" &&
                        <Forms.FormText type="description">
                            {masonryListData[section].subtitle}
                        </Forms.FormText>
                    }
                </div>}
                sections={masonryListData.map(section => section.items.length)}
            />
            <div className={cl("change-decoration-modal-preview")}>
                <AvatarDecorationPreview
                    avatarDecorationOverride={isTryingDecoration ? tryingDecoration ? discordifyDecoration(tryingDecoration) : null : undefined}
                    user={UserStore.getCurrentUser()}
                />
                {typeof activeSelectedDecoration === "object" &&
                    <Text
                        variant="text-sm/semibold"
                        color="header-primary"
                    >
                        {activeSelectedDecoration?.alt}
                    </Text>
                }
                {isActiveDecorationPreset &&
                    <div>
                        <Forms.FormTitle>Part of the {activeDecorationPreset.name} Preset</Forms.FormTitle>
                        {activeDecorationPreset?.description !== null &&
                            <Forms.FormText type="description">
                                {activeDecorationPreset?.description}
                            </Forms.FormText>
                        }
                    </div>
                }
            </div>
        </ModalContent>
        <ModalFooter className={cl("modal-footer")}>
            <Button
                onClick={() => {
                    selectDecoration(tryingDecoration!).then(props.onClose);
                }}
                disabled={!isTryingDecoration}
            >
                Apply
            </Button>
            <Button
                onClick={props.onClose}
                color={Button.Colors.PRIMARY}
                look={Button.Looks.LINK}
            >
                Cancel
            </Button>
        </ModalFooter>
    </ModalRoot>;
}

export const openChangeDecorationModal = () =>
    requireAvatarDecorationModal().then(() => openModal(props => <ChangeDecorationModal {...props} />));
