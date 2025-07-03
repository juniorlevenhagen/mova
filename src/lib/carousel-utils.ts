import { PositionType, StyleType } from "@/types/carousel";

export const getPositionClass = (
  position: PositionType | undefined
): string => {
  switch (position) {
    case "top-left":
      return "top-30 left-8";
    case "top-right":
      return "top-8 right-8";
    case "bottom-left":
      return "bottom-40 left-30";
    case "bottom-right":
      return "bottom-8 right-8";
    case "center":
      return "inset-0 flex items-center justify-center";
    default:
      return "top-50 left-220";
  }
};

export const getStyleClass = (style: StyleType | undefined): string => {
  switch (style) {
    case "large":
      return "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-black/40 px-8 py-4 rounded-xl";
    case "medium":
      return "text-base sm:text-lg md:text-xl font-semibold bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl";
    case "small":
      return "text-sm sm:text-base font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full";
    default:
      return "text-base sm:text-lg font-medium bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full";
  }
};
