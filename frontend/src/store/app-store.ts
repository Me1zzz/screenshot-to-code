import { defineStore } from "pinia";
import { AppState } from "../types";

export interface AppStoreState {
  appState: AppState;
  updateInstruction: string;
  updateImages: string[];
  inSelectAndEditMode: boolean;
}

export const useAppStore = defineStore("app", {
  state: (): AppStoreState => ({
    appState: AppState.INITIAL,
    updateInstruction: "",
    updateImages: [],
    inSelectAndEditMode: false,
  }),
  actions: {
    setAppState(state: AppState) {
      this.appState = state;
    },
    setUpdateInstruction(instruction: string) {
      this.updateInstruction = instruction;
    },
    setUpdateImages(images: string[]) {
      this.updateImages = images;
    },
    toggleInSelectAndEditMode() {
      this.inSelectAndEditMode = !this.inSelectAndEditMode;
    },
    disableInSelectAndEditMode() {
      this.inSelectAndEditMode = false;
    },
  },
});
