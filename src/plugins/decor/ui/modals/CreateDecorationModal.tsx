/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../styles.css";

import { Link } from "@components/Link";
import { Margins } from "@utils/margins";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { Button, Forms, Text, TextInput, UserStore, useState } from "@webpack/common";

import { RAW_SKU_ID } from "../../lib/constants";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import cl from "../../lib/utils/cl";
import requireAvatarDecorationModal from "../../lib/utils/requireAvatarDecorationModal";
import requireCreateStickerModal from "../../lib/utils/requireCreateStickerModal";
import { AvatarDecorationPreview } from "../components";

const DecorationModalStyles = findByPropsLazy("modalFooterShopButton");

const FileUpload = findByCodeLazy("fileUploadInput,");

export default function CreateDecorationModal(props) {
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const { create: createDecoration } = useCurrentUserDecorationsStore();

    const decoration = file ? { asset: URL.createObjectURL(file), skuId: RAW_SKU_ID } : null;

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
                Create Decor Decoration
            </Text>
            <ModalCloseButton onClick={props.onClose} />
        </ModalHeader>
        <ModalContent
            className={cl("create-decoration-modal-content")}
            scrollbarType="none"
        >
            <div className={cl("create-decoration-modal-form")}>
                <Forms.FormSection title="File">
                    <FileUpload
                        filename={file?.name}
                        placeholder="Choose a file"
                        buttonText="Browse"
                        filters={[{ name: "Decoration file", extensions: ["png", "apng"] }]}
                        onFileSelect={setFile}
                    />
                    <Forms.FormText type="description" className={Margins.top8}>
                        File should be APNG or PNG (1MB max)
                    </Forms.FormText>
                </Forms.FormSection>
                <Forms.FormSection title="Name">
                    <TextInput
                        placeholder="Companion Cube"
                        value={name}
                        onChange={setName}
                    />
                    <Forms.FormText type="description" className={Margins.top8}>
                        This name will be used when referring to this decoration.
                    </Forms.FormText>
                </Forms.FormSection>
                <Forms.FormText type="description" className={Margins.bottom16}>
                    Make sure your decoration does not violate the <Link href="https://gist.github.com/FieryFlames/00a618ca0d5f67f40a243e6d297fcadb#file-guidelines-md">guidelines</Link> before creating your decoration.
                </Forms.FormText>
            </div>
            <div>
                <AvatarDecorationPreview
                    avatarDecorationOverride={decoration}
                    user={UserStore.getCurrentUser()}
                />
            </div>
        </ModalContent>
        <ModalFooter className={cl("modal-footer")}>
            <Button
                onClick={() => {
                    setSubmitting(true);
                    createDecoration({ alt: name, file: file! }).then(props.onClose).catch(e => { setSubmitting(false); });
                }}
                disabled={!file || !name}
                submitting={submitting}
            >
                Create
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

export const openCreateDecorationModal = () =>
    Promise.all([requireAvatarDecorationModal(), requireCreateStickerModal()])
        .then(() => openModal(props => <CreateDecorationModal {...props} />));
