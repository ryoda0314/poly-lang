"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supa-client";
import { Upload, User, X } from "lucide-react";
import styles from "./AvatarUpload.module.css";
import ImageCropModal from "./ImageCropModal";

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userId: string;
    onUploadSuccess: (url: string) => void;
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadSuccess }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズは5MB以下にしてください');
            return;
        }

        // Show crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        // Reset file input
        event.target.value = '';
    };

    const handleCropConfirm = async (croppedBlob: Blob) => {
        setShowCropModal(false);
        setUploading(true);

        try {
            // Create a unique filename
            const fileName = `${userId}/avatar.jpg`;

            // Delete old avatar if exists
            if (currentAvatarUrl) {
                const oldPath = currentAvatarUrl.split('/').slice(-2).join('/');
                await supabase.storage.from('avatars').remove([oldPath]);
            }

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedBlob, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = data.publicUrl;

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            setPreviewUrl(publicUrl);
            onUploadSuccess(publicUrl);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('アバターのアップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSelectedImageSrc(null);
    };

    const handleRemove = async () => {
        if (!currentAvatarUrl) return;

        setUploading(true);

        try {
            // Remove from storage
            const path = currentAvatarUrl.split('/').slice(-2).join('/');
            await supabase.storage.from('avatars').remove([path]);

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (error) throw error;

            setPreviewUrl(null);
            onUploadSuccess('');
        } catch (error) {
            console.error('Error removing avatar:', error);
            alert('アバターの削除に失敗しました');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.avatarPreview}>
                    {previewUrl ? (
                        <img src={previewUrl} alt="Avatar" className={styles.avatarImage} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <User size={40} />
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                        disabled={uploading}
                    />
                    <button
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload size={16} />
                        {uploading ? 'アップロード中...' : 'アバターを変更'}
                    </button>
                    {previewUrl && (
                        <button
                            className={styles.removeButton}
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            <X size={16} />
                            削除
                        </button>
                    )}
                </div>
            </div>

            {showCropModal && selectedImageSrc && (
                <ImageCropModal
                    imageSrc={selectedImageSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}
