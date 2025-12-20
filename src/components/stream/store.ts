import { create } from 'zustand';
import { StreamStore, StreamItem, ActiveFocus, VoiceState, VoiceResult } from '@/types/stream';

export const useStreamStore = create<StreamStore>((set) => ({
    streamItems: [],
    selectedSid: null,
    activeFocus: null,
    voiceState: "locked",
    voiceResult: null,

    setStreamItems: (items: StreamItem[]) => set({ streamItems: items }),

    addStreamItem: (item: StreamItem) => set((state) => ({
        streamItems: [...state.streamItems, item]
    })),

    toggleSelection: (sid: string) => set((state) => {
        const newSid = state.selectedSid === sid ? null : sid;
        return {
            selectedSid: newSid,
            voiceState: newSid ? "idle" : "locked",
            voiceResult: newSid ? null : state.voiceResult
        };
    }),

    setFocus: (focus: ActiveFocus | null) => set({ activeFocus: focus }),

    setVoiceState: (vState: VoiceState) => set({ voiceState: vState }),

    setVoiceResult: (result: VoiceResult | null) => set({ voiceResult: result }),
}));
